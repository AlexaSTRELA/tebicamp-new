/* Dynamic page built on the APPROVED Solifer template. No innerHTML from the database. */
(async function(){
 'use strict';
 const $=s=>document.querySelector(s), C=window.TB_CATALOG;
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
 const clear=n=>{if(n)n.replaceChildren();return n};
 const appendText=(root,tag,cls,txt)=>root.appendChild(node(tag,cls,txt));
 function makeSpecCard(group,cls='info-card'){
   const card=node('div',cls);appendText(card,'h3','',group.title||'Характеристики');
   const specs=node('div','specs');
   (group.rows||[]).filter(r=>r.label && r.value).forEach(r=>{
     const line=node('div','spec');appendText(line,'span','',r.label);appendText(line,'span','',r.value);specs.appendChild(line);
   });card.appendChild(specs);return card;
 }
 function makeSpecSection(groups,kind){
   const sec=node('section','section');const wrap=node('div','wrap');const grid=node('div','grid-2'+(kind==='dimensions'?' dimensions-grid-v10':''));
   (groups||[]).filter(g=>(g.rows||[]).some(r=>r.label && r.value)).forEach(g=>grid.appendChild(makeSpecCard(g,'info-card'+(kind==='dimensions'?' dimensions-card':''))));
   if(!grid.children.length)return null;wrap.appendChild(grid);sec.appendChild(wrap);return sec;
 }
 function rutubeId(url){const m=String(url||'').match(/^https:\/\/rutube\.ru\/(?:shorts|video|play\/embed)\/([0-9a-f]{32})(?:\/|$)/i);return m?m[1]:null;}
 function update(item,others){
   document.title=item.name+' — Теория большого кемпинга';
   const description=document.querySelector('meta[name="description"]');if(description)description.content=(item.lead||item.name).slice(0,155);
   const crumb=$('.breadcrumbs span');if(crumb)crumb.textContent=item.name+' · '+item.year;
   const hero=$('#gallery'),track=$('#galleryTrack'),thumbs=$('#gallery .thumbs');
   clear(track);clear(thumbs);
   const photos=(item.photos||[]).map(p=>typeof p==='string'?{url:p,thumb:p}:p).filter(p=>p.url);
   if(!photos.length && item.cover_url)photos.push({url:item.cover_url,thumb:item.cover_url});
   photos.forEach((p,i)=>{
     const slide=node('div','gallery-slide');slide.id=i===0?'gallery-photo-cover':'gallery-photo-'+i;slide.tabIndex=-1;
     const img=node('img');img.src=p.url;img.alt=item.name+' — фото '+(i+1);img.loading=i===0?'eager':'lazy';slide.appendChild(img);track.appendChild(slide);
     const thumb=node('button','thumb'+(i===0?' active':''));thumb.type='button';thumb.setAttribute('aria-label','Показать фото '+(i+1));thumb.setAttribute('aria-selected',i===0?'true':'false');
     const ti=node('img');ti.src=p.thumb||p.url;ti.alt='Миниатюра фото '+(i+1);ti.loading='lazy';thumb.appendChild(ti);thumbs.appendChild(thumb);
   });
   const count=$('#photoCount');if(count)count.textContent='1 / '+photos.length;
   const badges=clear(hero.querySelector('.status-row'));
   const statusLabel={available:'В наличии',in_transit:'В пути',sold:'Продан',archived:'В архиве'}[item.status]||'В наличии';
   appendText(badges,'span','badge',statusLabel);
   if(item.is_winter)appendText(badges,'span','badge secondary','Зимний');
   if(item.no_russia_mileage)appendText(badges,'span','badge secondary','Без пробега по РФ/РБ');
   const h1=hero.querySelector('h1');if(h1)h1.textContent=item.name;
   const y=hero.querySelector('.year');if(y)y.textContent=[item.year+' год',item.max_weight?'макс. масса '+item.max_weight:''].filter(Boolean).join(' · ');
   const price=hero.querySelector('.price');if(price)price.textContent=item.price_rub?C.money(item.price_rub):'Цена по запросу';
   const d=$('#description');d.querySelector('.lead').textContent=item.description_lead||item.lead||'';
   const long=clear(d.querySelector('.longtext'));
   (item.paragraphs||[]).filter(p=>p.title||p.text).forEach(p=>{const e=node('p');if(p.title)e.appendChild(node('strong','',p.title+' '));e.appendChild(document.createTextNode(p.text||''));long.appendChild(e);});
   const sp=$('#specs');sp.querySelector('.lead').textContent='Основные размеры и параметры '+item.name+'.';
   const specsGrid=clear(sp.querySelector('.grid-2'));
   (item.spec_groups||[]).filter(g=>(g.rows||[]).some(r=>r.label&&r.value)).forEach(g=>specsGrid.appendChild(makeSpecCard(g,'info-card dimensions-card')));
   const equip=$('.equipment'),eqSec=equip.closest('section');const eqWrap=equip.closest('.wrap');
   clear(equip);(item.equipment||[]).filter(e=>e.title).forEach(e=>{
     const cell=node('div','equip'),title=node('b');title.appendChild(node('span','dot'));title.appendChild(document.createTextNode(e.title));cell.appendChild(title);appendText(cell,'small','',e.text||'');equip.appendChild(cell);
   });
   eqSec.hidden=!equip.children.length;
   const secTech=makeSpecSection(item.technical_groups||[]);
   if(secTech)sp.insertAdjacentElement('afterend',secTech);
   // Conditions/documents section is the one with those headings.
   const checkCard=[...document.querySelectorAll('.info-card')].find(e=>e.querySelector('h3')?.textContent.trim()==='Состояние и проверка');
   if(checkCard){const section=checkCard.closest('section'),grid=clear(section.querySelector('.grid-2'));
     (item.check_groups||[]).filter(g=>(g.rows||[]).some(r=>r.label&&r.value)).forEach(g=>grid.appendChild(makeSpecCard(g)));
     section.hidden=!grid.children.length;
   }
   const vid=$('#video');const id=rutubeId(item.video_url);vid.hidden=!id;
   if(id){const frame=vid.querySelector('iframe');frame.src='https://rutube.ru/play/embed/'+id;frame.title=item.name+' — видеообзор';
     vid.querySelector('.lead').textContent='Посмотрите видеообзор '+item.name+'.';
     const label=vid.querySelector('.video-label b');if(label)label.textContent=item.name+' — видеообзор';
     const a=vid.querySelector('.tebicamp-rutube-fallback a');if(a)a.href=item.video_url;
   }
   const cta=$('.cta h2');if(cta)cta.textContent='Понравился '+item.name+'?';
   const similar=$('.similar'),other=others.filter(i=>i.slug!==item.slug&&i.status==='available'&&i.is_published!==false).slice(0,3);
   clear(similar);other.forEach(i=>{
     const a=node('a','similar-card');a.href=C.href(i);a.setAttribute('aria-label','Открыть '+i.name);
     const photo=node('div','similar-photo'),img=node('img');img.src=i.cover_url||(i.photos||[])[0]?.url||'';img.alt=i.name;photo.appendChild(img);a.appendChild(photo);
     const body=node('div','similar-body');appendText(body,'div','similar-status','В наличии');appendText(body,'h3','',i.name);appendText(body,'p','',i.year+(i.max_weight?' · '+i.max_weight:''));appendText(body,'strong','',C.money(i.price_rub));a.appendChild(body);similar.appendChild(a);
   });
   const simsec=$('.similar-section');if(simsec)simsec.hidden=!similar.children.length;
   if(typeof window.tebicampInitGallery==='function')window.tebicampInitGallery();
   document.body.classList.add('tb-ready');
 }
 try{
   const params=new URLSearchParams(location.search);const slug=params.get('slug');
   if(!slug){$('#tb-load-message').textContent='Не указан караван. Вернитесь в каталог.';return;}
   let item,all;
   try{[item,all]=await Promise.all([C.get(slug),C.list()]);}
   catch(err){console.warn('Ошибка загрузки каталога',err);item=null;all=[];}
   if(!item && params.get('demo')==='1'){item=C.seed.find(i=>i.slug===slug)||null;all=C.mergePreview(all);}
   if(!item){$('#tb-load-message').textContent='Караван не найден. Вернитесь в каталог.';return;}
   update(item,all.length?all:(item.legacy_page?C.seed:[]));
 }catch(e){console.error(e);$('#tb-load-message').textContent='Не удалось загрузить карточку. Попробуйте обновить страницу.';}
})();
