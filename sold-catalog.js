/* Sold archive: full details for catalog items, photo viewer for historical models. */
(()=>{
 'use strict';
 const C=window.TB_CATALOG;
 const history=window.TEBICAMP_SOLD_HISTORY||[];
 const root=document.getElementById('soldDynamic');
 if(!root||!C)return;
 const n=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
 const normalize=s=>String(s||'').toLocaleLowerCase('ru').replace(/[^a-zа-яё0-9]/g,'');
 const photosOf=item=>(item.photos||[]).map(p=>typeof p==='string'?p:p?.url).filter(Boolean);
 const sold=async()=>{const rows=await C.list();return rows.filter(x=>x.is_published!==false&&x.status==='sold').sort((a,b)=>{const da=Date.parse(a.sold_at||a.updated_at||a.created_at||'')||0,db=Date.parse(b.sold_at||b.updated_at||b.created_at||'')||0;return db-da||String(a.slug).localeCompare(String(b.slug));});};
 let viewer=null, viewerPhotos=[], viewerIndex=0, previousFocus=null, previousOverflow='';
 function ensureViewer(){
   if(viewer)return viewer;
   const style=n('style');style.textContent=".sold-card[data-openable]{cursor:pointer}.sold-card[data-openable]:focus-visible{outline:3px solid #70eff2;outline-offset:3px}.sold-photo-link{border:0;background:none;padding:0;color:#70eff2;font:800 13px Arial,sans-serif;cursor:pointer;white-space:nowrap}.sold-photo-link:hover{text-decoration:underline}.sold-viewer{position:fixed;inset:0;z-index:11000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(1,12,17,.94)}.sold-viewer[hidden]{display:none}.sold-viewer-panel{width:min(100%,1000px);max-height:95vh;display:flex;flex-direction:column;gap:14px;position:relative}.sold-viewer-header{display:flex;align-items:center;justify-content:space-between;gap:16px;color:#fff}.sold-viewer-title{font:700 clamp(18px,3vw,25px) Arial,sans-serif;margin:0}.sold-viewer-close{border:1px solid rgba(255,255,255,.45);background:#123b43;color:#fff;border-radius:10px;padding:10px 14px;cursor:pointer;font-size:15px}.sold-viewer-stage{display:flex;align-items:center;justify-content:center;gap:12px;min-height:0}.sold-viewer-image{display:block;max-width:calc(100% - 110px);max-height:70vh;width:auto;height:auto;object-fit:contain;border-radius:12px}.sold-viewer-nav{flex:0 0 auto;border:1px solid rgba(255,255,255,.35);background:#123b43;color:#fff;border-radius:12px;width:44px;height:56px;cursor:pointer;font-size:30px}.sold-viewer-count{text-align:center;color:#c5e0e2;font:14px Arial,sans-serif}@media(max-width:650px){.sold-viewer{padding:12px}.sold-viewer-stage{gap:5px}.sold-viewer-image{max-width:calc(100% - 80px);max-height:72vh}.sold-viewer-nav{width:35px;height:50px}}";document.head.append(style);
   viewer=n('div','sold-viewer');viewer.hidden=true;viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Фотографии проданного каравана');
   const panel=n('div','sold-viewer-panel');
   const header=n('div','sold-viewer-header');
   const title=n('h2','sold-viewer-title');
   const close=n('button','sold-viewer-close','Закрыть ✕');close.type='button';
   header.append(title,close);
   const stage=n('div','sold-viewer-stage');
   const prev=n('button','sold-viewer-nav','‹');prev.type='button';prev.setAttribute('aria-label','Предыдущее фото');
   const image=n('img','sold-viewer-image');image.alt='';
   const next=n('button','sold-viewer-nav','›');next.type='button';next.setAttribute('aria-label','Следующее фото');
   stage.append(prev,image,next);
   const count=n('div','sold-viewer-count');
   panel.append(header,stage,count);viewer.append(panel);document.body.append(viewer);
   const render=()=>{image.src=viewerPhotos[viewerIndex];image.alt=title.textContent+' — фото '+(viewerIndex+1);count.textContent=(viewerIndex+1)+' / '+viewerPhotos.length;prev.hidden=next.hidden=viewerPhotos.length<2;};
   viewer._open=(item,photos)=>{
     viewerPhotos=photos.filter(Boolean);if(!viewerPhotos.length)return;
     viewerIndex=0;title.textContent=item.name+' · '+(item.year||'');
     previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
     document.body.style.overflow='hidden';viewer.hidden=false;render();close.focus();
   };
   viewer._close=()=>{viewer.hidden=true;document.body.style.overflow=previousOverflow;if(previousFocus&&previousFocus.focus)previousFocus.focus();};
   viewer._step=delta=>{viewerIndex=(viewerIndex+delta+viewerPhotos.length)%viewerPhotos.length;render();};
   close.addEventListener('click',viewer._close);
   prev.addEventListener('click',()=>viewer._step(-1));
   next.addEventListener('click',()=>viewer._step(1));
   viewer.addEventListener('click',e=>{if(e.target===viewer)viewer._close();});
   document.addEventListener('keydown',e=>{
     if(viewer.hidden)return;
     if(e.key==='Escape')viewer._close();
     if(e.key==='ArrowLeft')viewer._step(-1);
     if(e.key==='ArrowRight')viewer._step(1);
     if(e.key==='Tab'){const targets=[close,prev,next].filter(x=>!x.hidden);const idx=targets.indexOf(document.activeElement);if(e.shiftKey&&idx<=0){e.preventDefault();targets[targets.length-1].focus();}else if(!e.shiftKey&&idx===targets.length-1){e.preventDefault();targets[0].focus();}}
   });
   return viewer;
 }
 function card(item,legacy){
   const photos=legacy?item.photos:photosOf(item);
   const first=(legacy?photos[0]:(item.home_cover_url||item.cover_url||photos[0]))||'';
   const second=photos.find(x=>x&&x!==first)||first;
   const article=n('article','sold-card');article.dataset.openable='true';
   article.tabIndex=0;article.setAttribute('role',legacy?'button':'link');
   article.setAttribute('aria-label',(legacy?'Смотреть фотографии ':'Открыть карточку ')+item.name);
   const media=n('div','sold-media');
   const main=n('img','sold-main');main.src=first;main.alt=item.name+' — проданный караван';main.loading='lazy';media.append(main);
   if(second&&second!==first){
     const thumb=n('button','sold-thumb');thumb.type='button';thumb.setAttribute('aria-label','Поменять фотографии местами');
     const img=n('img');img.src=second;img.alt='Другой ракурс '+item.name;img.loading='lazy';thumb.append(img);
     thumb.addEventListener('click',()=>{const src=main.src,alt=main.alt;main.src=img.src;main.alt=img.alt;img.src=src;img.alt=alt;});
     media.append(thumb);
   }
   media.append(n('div','sold-badge','Продан'));article.append(media);
   const info=n('div','sold-info'),label=n('div');
   label.append(n('h3','',item.name),n('div','sold-year',item.year||''));info.append(label);
   if(legacy){
     const button=n('button','sold-photo-link','Смотреть фото');button.type='button';
     button.addEventListener('click',()=>ensureViewer()._open(item,photos));info.append(button);
   }else{
     const link=n('a','sold-details-link','Подробнее');
     link.href=C.href(item);link.setAttribute('aria-label','Открыть карточку '+item.name);info.append(link);
   }
   article.append(info);
   const open=()=>legacy?ensureViewer()._open(item,photos):(location.href=C.href(item));
   article.addEventListener('click',e=>{if(e.target.closest('button,a'))return;open();});
   article.addEventListener('keydown',e=>{if(e.target!==article)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
   return article;
 }
 sold().then(items=>{
   const unique=history.filter(h=>!items.some(i=>normalize(i.name)===normalize(h.name)&&Number(i.year)===Number(h.year)));
   const records=[...items.map(x=>({item:x,legacy:false})),...unique.map(x=>({item:x,legacy:true}))];
   const show=root.dataset.soldView==='all'?records:records.slice(0,3);
   root.replaceChildren(...show.map(x=>card(x.item,x.legacy)));
   const count=document.querySelector('[data-sold-count]');
   if(count)count.textContent=records.length+' проданных караванов';
   if(!records.length)root.append(n('p','sold-empty','Пока нет проданных караванов.'));
 }).catch(err=>{console.warn('Sold catalog unavailable',err);root.replaceChildren(n('p','sold-empty','Не удалось загрузить архив. Попробуйте обновить страницу.'));});
})();
