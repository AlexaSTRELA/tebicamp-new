const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {ReadableStream}=require('node:stream/web');
const source=fs.readFileSync(__dirname+'/../admin.js','utf8');
new vm.Script(source);
const section=source.slice(source.indexOf(' // Auth, protected reads and writes'),source.indexOf(' // Password recovery via Supabase Auth.'));
function harness(fetcher,saved){
 const nodes=new Map(),events={},storage=new Map(saved?[['tb_admin_session',JSON.stringify(saved)]]:[]);
 const $=key=>{if(!nodes.has(key)){const classes=new Set();nodes.set(key,{value:key==='#email'?'admin@example.test':'password',disabled:false,textContent:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,b)=>b?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},addEventListener:(name,fn)=>events[key+':'+name]=fn});}return nodes.get(key);};
 const ctx=vm.createContext({fetch:fetcher,Response,AbortController,TextDecoder,setTimeout:(fn,ms)=>setTimeout(fn,Math.max(1,ms/1000)),clearTimeout,sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null,removeItem:k=>storage.delete(k)},window:{addEventListener:(name,fn)=>events[name]=fn},$,authMessage:(text)=>{$('#authMsg').textContent=text;},showApp:()=>ctx.opened++,opened:0});
 vm.runInContext("let token=null,refreshToken=null,user=null,items=[],mode='demo',recoveryMode=false;const API_URL='https://example.test',API_KEY='public',API_HEADERS={apikey:API_KEY};"+section+"\nthis.api={establish,resumeLogin,request,refresh,loginFailed,clearSession,state:()=>({token,refreshToken,loginPending,authBusy,mode}),seed:(t,r)=>{token=t;refreshToken=r;},recover:()=>{recoveryMode=true;}}",ctx);
 return {ctx,api:ctx.api,$,events,storage};
}
const ok=data=>new Response(JSON.stringify(data),{status:200});
const fail=()=>{throw new TypeError('Failed to fetch');};
const stateOf=h=>JSON.parse(h.storage.get('tb_admin_session')||'null');
async function run(){
 let count=0;
 let h=harness(async url=>{if(url.includes('catalog_admins')){if(++count<3)return fail();return ok([{user_id:'admin'}]);}return ok([]);});
 await h.api.establish('access','refresh');assert.equal(count,3);assert.equal(h.ctx.opened,1);
 console.log('PASS: failed rights requests retry, then open catalog');
 count=0;h=harness(async()=>{count++;return fail();});h.api.seed('access','refresh');
 await h.api.resumeLogin();assert.equal(count,3);assert.equal(stateOf(h).token,'access');assert.equal(h.ctx.opened,0);assert.equal(h.api.state().loginPending,true);assert.equal(h.$('#retryLoginBtn').classList.contains('hidden'),false);
 h.ctx.fetch=async url=>ok(url.includes('catalog_admins')?[{user_id:'admin'}]:[]);
 await h.events['#retryLoginBtn:click']();assert.equal(h.ctx.opened,1);assert.equal(h.api.state().loginPending,false);
 console.log('PASS: exhausted retries preserve session; Continue resumes without password');
 h=harness(async()=>ok([]));h.api.seed('access','refresh');await h.api.resumeLogin();assert.equal(h.ctx.opened,0);assert.equal(stateOf(h),null);assert.equal(h.api.state().token,null);
 console.log('PASS: missing admin rights never opens app and clears session');
 count=0;h=harness(async()=>{count++;return new Response('',{status:403});});h.api.seed('access','refresh');await h.api.resumeLogin();assert.equal(count,1);assert.equal(h.ctx.opened,0);assert.equal(stateOf(h),null);
 console.log('PASS: forbidden response does not retry or grant access');
 let refreshes=0;h=harness(async(url,opts)=>{if(url.includes('grant_type=refresh_token')){refreshes++;return ok({access_token:'new',refresh_token:'rotated'});}if(opts.headers.Authorization==='Bearer old')return new Response('',{status:401});return ok(url.includes('catalog_admins')?[{user_id:'admin'}]:[]);});
 h.api.seed('old','refresh');await h.api.resumeLogin();assert.equal(refreshes,1);assert.equal(stateOf(h).refreshToken,'rotated');assert.equal(h.ctx.opened,1);
 console.log('PASS: expired access token refreshes and rotated token is saved');
 refreshes=0;h=harness(async()=>{refreshes++;await new Promise(r=>setTimeout(r,1));return ok({access_token:'new',refresh_token:'rotated'});});h.api.seed('old','refresh');await Promise.all([h.api.refresh(),h.api.refresh()]);assert.equal(refreshes,1);
 console.log('PASS: concurrent refreshes share one request');
 h=harness(async url=>url.includes('grant_type=refresh_token')?new Response('{}',{status:400}):new Response('',{status:401}));h.api.seed('old','invalid');await h.api.resumeLogin();assert.equal(stateOf(h),null);assert.equal(h.ctx.opened,0);
 console.log('PASS: revoked refresh token requires new sign-in');
 h=harness(async url=>url.includes('grant_type=refresh_token')?fail():new Response('',{status:401}));h.api.seed('old','refresh');await h.api.resumeLogin();assert.equal(stateOf(h).refreshToken,'refresh');assert.equal(h.ctx.opened,0);
 console.log('PASS: network failure during refresh preserves session');
 count=0;h=harness(async(url,opts)=>{count++;return {status:200,headers:new Headers({'content-type':'application/json'}),body:null,text:()=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'}))))};});h.api.seed('access','refresh');await h.api.resumeLogin();assert.equal(count,3);assert.equal(stateOf(h).token,'access');assert.equal(h.ctx.opened,0);
 console.log('PASS: stalled response body times out and retries without losing session');
 count=0;h=harness(async()=>{count++;return fail();});await assert.rejects(h.api.request('/rest/v1/catalog_items',{method:'POST',body:'{}'}));assert.equal(count,1);
 console.log('PASS: writes are not automatically repeated on network errors');
 count=0;h=harness(async url=>{if(url.includes('catalog_admins')&&++count<3)return new Response('',{status:count===1?503:429});return ok(url.includes('catalog_admins')?[{user_id:'admin'}]:[]);});await h.api.establish('access','refresh');assert.equal(count,3);assert.equal(h.ctx.opened,1);
 console.log('PASS: temporary server errors retry');
 count=0;h=harness(async url=>{if(url.includes('grant_type=password')){count++;await new Promise(r=>setTimeout(r,1));return ok({access_token:'access',refresh_token:'refresh',user:{email:'admin@example.test'}});}return ok(url.includes('catalog_admins')?[{user_id:'admin'}]:[]);});await Promise.all([h.events['#loginForm:submit']({preventDefault(){}}),h.events['#loginForm:submit']({preventDefault(){}})]);assert.equal(count,1);assert.equal(h.ctx.opened,1);assert.equal(h.$('#password').value,'');assert.equal(h.$('#loginForm button[type="submit"]').disabled,false);
 console.log('PASS: double click sends one login and password is cleared');
 h=harness(async url=>ok(url.includes('catalog_admins')?[{user_id:'admin'}]:[]),{token:'saved',refreshToken:'refresh',email:'admin@example.test'});
 const startup=source.slice(source.lastIndexOf(' try{const saved='),source.lastIndexOf('})();'));
 vm.runInContext(startup,h.ctx);await new Promise(r=>setTimeout(r,20));assert.equal(h.ctx.opened,1);
 console.log('PASS: page reload resumes saved session through the same protected flow');
 h=harness(async()=>{throw Error('Should not fetch in recovery mode');});h.api.seed('access','refresh');h.api.recover();await h.api.resumeLogin();assert.equal(h.ctx.opened,0);
 console.log('PASS: session retry does not interrupt password recovery');
 // A response may contain complete JSON and never emit its final transport chunk.
 let cancellations=0;
 const stalledJSON=(data,signal)=>{
  const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));signal.addEventListener('abort',()=>{try{controller.error(Object.assign(new Error('aborted'),{name:'AbortError'}));}catch(e){}});},cancel(){cancellations++;}});
  return new Response(stream,{headers:{'content-type':'application/json'}});
 };
 h=harness(async(url,opts)=>stalledJSON(url.includes('catalog_admins')?[{user_id:'admin'}]:[],opts.signal));
 h.api.seed('access','refresh');await h.api.resumeLogin();assert.equal(h.ctx.opened,1);assert.equal(cancellations,2);
 console.log('PASS: complete JSON with a never-ending stream opens the app and closes connections');
 h=harness(async(url,opts)=>url.includes('grant_type=password')?stalledJSON({access_token:'access',refresh_token:'refresh',user:{email:'admin@example.test'}},opts.signal):ok(url.includes('catalog_admins')?[{user_id:'admin'}]:[]));
 await h.events['#loginForm:submit']({preventDefault(){}});assert.equal(h.ctx.opened,1);
 console.log('PASS: login succeeds when password response JSON arrives but stream never ends');
 h=harness(async(url,opts)=>new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('[{"user_id":"admin"'));opts.signal.addEventListener('abort',()=>controller.error(Object.assign(new Error('aborted'),{name:'AbortError'})));}}),{headers:{'content-type':'application/json'}}));
 h.api.seed('access','refresh');await h.api.resumeLogin();assert.equal(h.ctx.opened,0);assert.equal(stateOf(h).token,'access');
 console.log('PASS: incomplete JSON never grants access and remains bounded by timeout');
 h=harness(async(url,opts)=>{const bytes=new TextEncoder().encode(JSON.stringify(url.includes('catalog_admins')?[{user_id:'admin',text:'Привет } ]'}]:[]));return new Response(new ReadableStream({start(controller){for(let i=0;i<bytes.length;i++)controller.enqueue(bytes.slice(i,i+1));controller.close();}}),{headers:{'content-type':'application/json'}});});
 h.api.seed('access','refresh');await h.api.resumeLogin();assert.equal(h.ctx.opened,1);
 console.log('PASS: JSON across UTF-8 chunk boundaries and braces inside strings is read completely');

}
run().catch(e=>{console.error(e);process.exitCode=1;});
