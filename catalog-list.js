/* V48 catalog preview: uses approved V47 catalog classes, dynamic data only. */
(async()=>{
 'use strict';
 const C=window.TB_CATALOG,root=document.getElementById('dynamicCatalog');
 const n=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 try{
  let items;
  items=await C.list();
  const available=items.filter(x=>x.is_published!==false && (x.status==='available'||x.status==='in_transit'));
  root.replaceChildren();
  available.forEach(item=>{
   const a=n('a','caravan-card');a.href=C.href(item);a.setAttribute('aria-label','Открыть '+item.name);
   const media=n('div','card-media');
   const photoUrl=item.cover_url||item.photos?.[0]?.url||'';
   if(photoUrl)media.style.setProperty('--bg','url("'+String(photoUrl).replace(/["\\\n\r]/g,'')+'")');
   const img=n('img');img.src=photoUrl;img.alt=item.name;media.appendChild(img);
   const top=n('div','media-top');const status=n('span','status');status.appendChild(n('i'));status.appendChild(document.createTextNode(item.status==='in_transit'?'В пути':'В наличии'));top.appendChild(status);top.appendChild(n('span','year',String(item.year||'')));media.appendChild(top);media.appendChild(n('div','photo-hint','Открыть карточку'));a.appendChild(media);
   const body=n('div','card-body'),head=n('div','card-head'),namebox=n('div');namebox.appendChild(n('h2','',item.name));namebox.appendChild(n('p','lead',item.lead||''));head.appendChild(namebox);head.appendChild(n('div','price',item.price_rub?C.money(item.price_rub):'Цена по запросу'));body.appendChild(head);
   const facts=n('div','facts');(item.catalog_facts||[]).filter(Boolean).slice(0,8).forEach(x=>facts.appendChild(n('span','fact',x)));body.appendChild(facts);
   const foot=n('div','card-foot');
   let meta=item.catalog_meta||'';
   if(item.status==='in_transit' && item.expected_at){
     const d=new Date(item.expected_at+'T12:00:00');
     if(!Number.isNaN(d.getTime()))meta=[meta,'Ожидаемое прибытие: '+d.toLocaleDateString('ru-RU')].filter(Boolean).join(' · ');
   }
   foot.appendChild(n('span','meta',meta));const more=n('span','more','Подробнее ');more.appendChild(n('b','', '→'));foot.appendChild(more);body.appendChild(foot);a.appendChild(body);root.appendChild(a);
  });
  if(!available.length)root.appendChild(n('p','', 'Сейчас нет опубликованных караванов в наличии. Скоро здесь появятся новые модели.'));
  const count=document.querySelector('.count');if(count)count.textContent=available.length+' '+(available.length===1?'караван':available.length<5?'каравана':'караванов')+' в каталоге';
 }catch(e){console.error(e);root.replaceChildren(n('p','', 'Не удалось обновить наличие караванов. Попробуйте обновить страницу или свяжитесь с нами.'));const count=document.querySelector('.count');if(count)count.textContent='Каталог временно недоступен';}
})();
