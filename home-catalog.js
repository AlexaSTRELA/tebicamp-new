/* TEBICAMP V50. Dynamic data, original approved V47 home-card markup/styles. */
(async()=>{
 'use strict';
 const C=window.TB_CATALOG;
 const root=document.getElementById('caravanCards');
 if(!root)return;
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
 const originals=[...root.querySelectorAll('article.card')];
 const templates=new Map(originals.map(el=>[el.querySelector('a.card-full-link')?.getAttribute('href'),el.cloneNode(true)]));
 const fallback=originals[0]?.cloneNode(true);
 function iconFor(label){
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
   const path=document.createElementNS('http://www.w3.org/2000/svg','path');
   const x=String(label).toLowerCase();
   path.setAttribute('d',/масс|кг/.test(x)?'M4 17h16M6 17l2-10h8l2 10M9 7h6':/солнеч|вт/.test(x)?'M12 3v2M12 19v2M3 12h2M19 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0':/мувер/.test(x)?'M3 16h18M5 16l2-6h10l2 6M8 18h.01M16 18h.01':/маркиз/.test(x)?'M4 7h16M5 7v4h14V7M7 11v8M17 11v8':/палатк/.test(x)?'M3 19L12 5l9 14H3zM12 5v14':'M5 12h14M12 5v14');
   svg.appendChild(path);return svg;
 }
 function badgeRow(item){
   const badges=node('div','badge-row');
   const status=node('span','badge');status.append(node('span','dot'),document.createTextNode(item.status==='in_transit'?'В пути':'В наличии'));badges.append(status);
   if(item.is_winter)badges.append(node('span','badge type-winter','Зимний'));
   return badges;
 }
 function make(item){
   const el=(templates.get(item.legacy_page)||fallback)?.cloneNode(true);
   if(!el)return null;
   for(const attr of [...el.attributes])if(attr.name.startsWith('data-detail-'))el.removeAttribute(attr.name);
   el.dataset.detailKey=item.slug;
   el.dataset.detailTitle=item.name+' · '+(item.year||'');
   el.dataset.detailSummary=item.lead||'';
   el.dataset.detailPrice=item.price_rub?C.money(item.price_rub):'Цена по запросу';
   el.dataset.detailBadges=item.status==='in_transit'?'В пути':'В наличии';
   el.dataset.detailFeatures=(item.home_features||[]).join('||');
   el.dataset.detailQuestion='Здравствуйте! Интересует '+item.name+' · '+item.year+'.';
   const link=C.href(item),full=el.querySelector('.card-full-link');
   if(full){full.href=link;full.setAttribute('aria-label','Открыть страницу каравана '+item.name);}
   const image=el.querySelector('.photo img');if(image){image.src=item.home_cover_url||item.cover_url||(item.photos?.[0]?.url)||'';image.alt=item.name;}
   const photo=el.querySelector('.photo');if(photo){photo.querySelector('.badge-row')?.remove();photo.appendChild(badgeRow(item));}
   const model=el.querySelector('.model');if(model)model.textContent=item.name+' · '+(item.year||'');
   const price=el.querySelector('.price');if(price)price.textContent=item.price_rub?C.money(item.price_rub):'Цена по запросу';
   const summary=el.querySelector('.template-text');if(summary)summary.textContent=item.home_text||item.lead||'';
   const strip=el.querySelector('.feature-strip');
   const seed=(C.seed||[]).find(x=>x.slug===item.slug);
   const sameFeatures=seed&&JSON.stringify(seed.home_features||[])===JSON.stringify(item.home_features||[]);
   if(strip&&!sameFeatures){strip.replaceChildren();for(const label of (item.home_features||[]).slice(0,4)){const sp=node('span','feature');sp.append(iconFor(label),document.createTextNode(label));strip.appendChild(sp);}}
   const primary=el.querySelector('.actions a.primary');if(primary)primary.href=link;
   const contact=el.querySelector('.actions .open-contact-modal');if(contact)contact.dataset.caravan=item.name;
   return el;
 }
 try{
   let items=await C.list();
   items=items.filter(x=>x.is_published!==false&&(x.status==='available'||x.status==='in_transit'));
   const nodes=items.map(make).filter(Boolean);
   if(nodes.length)root.replaceChildren(...nodes);
   else root.replaceChildren(node('p','', 'Сейчас нет опубликованных караванов в наличии. Следите за обновлениями.'));
   // Keep desktop carousel dots in sync when the number of caravans changes.
   const pager=document.querySelector('#caravans .pager');
   if(pager){
     const updatePager=()=>{
       const first=root.querySelector('.card');
       if(!first)return;
       const cardWidth=first.getBoundingClientRect().width;
       const gap=parseFloat(getComputedStyle(root).columnGap)||18;
       const visible=Math.max(1,Math.floor((root.clientWidth+gap)/(cardWidth+gap)));
       const pages=Math.max(1,nodes.length-visible+1);
       pager.replaceChildren(...Array.from({length:pages},(_,i)=>node('span',i===0?'active':'')));
       root.dispatchEvent(new Event('scroll'));
     };
     updatePager();window.addEventListener('resize',updatePager);
   } else root.dispatchEvent(new Event('scroll'));
 }catch(err){
   console.warn('TEBICAMP: ошибка загрузки караванов',err);
   root.replaceChildren(node('p','', 'Не удалось обновить наличие караванов. Попробуйте обновить страницу или свяжитесь с нами.'));
 }
})();
