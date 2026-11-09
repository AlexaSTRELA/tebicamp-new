/* Dynamic sold caravan cards. Existing detailed listings remain available by slug. */
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
 function card(item,legacy){
   const photos=legacy?item.photos:photosOf(item);
   const first=(legacy?photos[0]:(item.home_cover_url||item.cover_url||photos[0]))||'';
   const second=photos.find(x=>x&&x!==first)||first;
   const article=n('article','sold-card');
   const media=n('div','sold-media');
   const main=n('img','sold-main');main.src=first;main.alt=item.name+' — проданный караван';main.loading='lazy';media.append(main);
   if(second&&second!==first){
     const thumb=n('button','sold-thumb');thumb.type='button';thumb.setAttribute('aria-label','Поменять фотографии местами');
     const img=n('img');img.src=second;img.alt='Другой ракурс '+item.name;img.loading='lazy';thumb.append(img);
     thumb.addEventListener('click',()=>{const src=main.src,alt=main.alt;main.src=img.src;main.alt=img.alt;img.src=src;img.alt=alt;});
     media.append(thumb);
   }
   media.append(n('div','sold-badge','Продан'));
   article.append(media);
   const info=n('div','sold-info');
   const label=n('div');label.append(n('h3','',item.name),n('div','sold-year',item.year||''));
   info.append(label);
   if(!legacy){
     const link=n('a','sold-details-link','Подробнее');
     link.href=C.href(item);link.setAttribute('aria-label','Открыть карточку '+item.name);info.append(link);
     main.style.cursor='pointer';
     main.addEventListener('click',()=>{location.href=link.href;});
   }
   article.append(info);
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
