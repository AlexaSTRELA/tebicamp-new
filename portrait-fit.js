/* Keep landscape layouts; fit portrait originals inside square frames. */
(()=>{
 'use strict';
 const selector='#caravanCards .photo img,.card-media img,.gallery-slide img,.thumb img,.similar-photo img,.gallery-lightbox-image',bound=new WeakSet();
 function portrait(img){return img.naturalWidth>0&&img.naturalHeight>img.naturalWidth;}
 function gallery(img){
  const viewport=img?.closest('.gallery-viewport');if(!viewport)return;
  viewport.dataset.fitPhoto=img.src;
  const fit=()=>{if(viewport.dataset.fitPhoto===img.src)viewport.classList.toggle('tb-portrait-frame',portrait(img));};
  fit();if(!img.complete)img.addEventListener('load',fit,{once:true});
 }
 window.tebicampFitGalleryPhoto=gallery;
 function fit(img){
  if(!img.naturalWidth)return;
  const isPortrait=portrait(img);img.classList.toggle('tb-portrait-photo',isPortrait);
  const frame=img.closest('.photo,.card-media,.thumb,.similar-photo');
  if(frame)frame.classList.toggle('tb-portrait-frame',isPortrait);
  if(img.closest('.gallery-slide')){
   const images=[...document.querySelectorAll('.gallery-slide img')];
   const active=[...document.querySelectorAll('.thumb')].findIndex(t=>t.getAttribute('aria-selected')==='true');
   if(images[Math.max(0,active)]===img)gallery(img);
  }
 }
 function scan(root){
  const imgs=root.matches?.(selector)?[root]:[...(root.querySelectorAll?.(selector)||[])];
  imgs.forEach(img=>{if(bound.has(img))return;bound.add(img);img.addEventListener('load',()=>fit(img));fit(img);});
 }
 scan(document);
 new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(scan))).observe(document.body,{childList:true,subtree:true});
})();
