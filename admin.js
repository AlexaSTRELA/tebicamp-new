/* TEBICAMP V49: simple catalog admin. Auth and authorization are enforced by Supabase RLS. */
(()=>{
 'use strict';
 const C=window.TB_CATALOG;
 const API_URL='https://gtbaelazxrapzdkygbsh.supabase.co';
 const API_KEY='sb_publishable_wt8VJ9ulkSNHQipnSwBwAw_dSChivV3';
 const API_HEADERS={apikey:API_KEY};
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;};
 const clean=x=>String(x??'').trim();
 const specDefs={
  external:[
   ['mod','Тип / модификация',['Тип / модификация']],
   ['length','Длина с дышлом',['Длина с дышлом']],
   ['body','Длина кузова',['Длина кузова']],
   ['width','Ширина',['Ширина']],
   ['height','Высота',['Высота']],
   ['axles','Количество осей',['Количество осей','Оси']]
  ],
  internal:[
   ['insideLength','Длина внутри',['Внутренняя длина','Длина жилой части']],
   ['insideWidth','Ширина внутри',['Внутренняя ширина','Ширина жилого пространства']],
   ['insideHeight','Высота внутри',['Высота внутри']],
   ['sleeping','Спальных мест',['Спальных мест']],
   ['wall','Толщина стен',['Толщина стен']],
   ['type','Тип каравана',['Тип каравана']],
   ['mainBed','Размер постоянной кровати',['Французская кровать','Постоянная кровать']],
   ['extraBed','Размер дополнительного спального места',['Диванная зона / кровать','Столовая зона / кровать']]
  ]
 };
 const groups=[
  {name:'Отопление и горячая вода',items:[
   ['alde','ALDE','Жидкостное газовое отопление с радиаторами по периметру.'],
   ['truma','Truma','Газовое воздушное отопление с разводкой по салону.'],
   ['floor','Тёплый пол','Тёплый пол.'],
   ['gasboiler','Газовый бойлер','Газовый нагрев воды.'],
   ['elecboiler','Электрический бойлер','Электрический нагрев воды.']
  ]},
  {name:'Автономность и электрика',items:[
   ['mover','Мувер','Маневрирование каравана с пульта без автомобиля.'],
   ['solar','Солнечная панель','Солнечная панель.'],
   ['battery','Аккумулятор','Аккумулятор для автономного питания.'],
   ['water','Бак чистой воды','Бак чистой воды.'],
   ['gasbottle','Газовый баллон','Газовый баллон для оборудования.']
  ]},
  {name:'Кухня',items:[
   ['fridge','Холодильник','Холодильник.'],
   ['freezer','Морозильная камера','Морозильная камера.'],
   ['stove','Газовая плита','Газовая плита.'],
   ['oven','Газовый духовой шкаф','Газовый духовой шкаф.'],
   ['microwave','Микроволновая печь','Микроволновая печь.'],
   ['sink','Кухонная мойка','Кухонная мойка.']
  ]},
  {name:'Санузел и комфорт',items:[
   ['shower','Душ','Душевая зона.'],
   ['toilet','Кассетный биотуалет','Кассетный биотуалет.'],
   ['washbasin','Умывальник','Умывальник.'],
   ['awning','Маркиза','Наружная маркиза.'],
   ['tent','Полноразмерная палатка','Палатка на всю длину каравана.'],
   ['skylight','Панорамный потолочный люк','Панорамный потолочный люк.'],
   ['nets','Москитные сетки','Москитные сетки.'],
   ['blackout','Blackout-шторы','Плотные солнцезащитные шторы.'],
   ['storage','Много мест хранения','Шкафы, полки и отделения для хранения.'],
   ['carpet','Ковровое покрытие','Ковровое покрытие.'],
   ['doubleaxle','Двухосное шасси','Двухосное шасси.']
  ]}
 ];
 const presets=groups.flatMap(g=>g.items).map(([id,title,description])=>({id,title,description}));
 const presetMap=Object.fromEntries(presets.map(p=>[p.id,p]));
 const checkDefs=[
  ['clean','Клининг и химчистка','Выполнены'],
  ['body','Корпус: проверка герметичности','Сухой, проверен на протечки и герметичность'],
  ['chassis','Рама, подвеска и шины','Проверено, в исправном состоянии'],
  ['heating','Отопление','Проверено, работает'],
  ['gas','Газовая система','Проверена, работает'],
  ['water','Водоснабжение','Проверено, работает'],
  ['electric','Электрика','Проверена, работает'],
  ['fridge','Холодильник','Проверен, работает'],
  ['boiler','Бойлер','Проверен, работает'],
  ['floor','Тёплый пол','Проверен, работает']
 ];
 function blank(){return {slug:'',legacy_page:null,name:'',year:null,price_rub:0,status:'available',is_published:false,is_winter:false,no_russia_mileage:false,max_weight:'',cover_url:'',home_cover_url:'',photos:[],video_url:'',lead:'',description_lead:'',paragraphs:[],spec_groups:[],technical_groups:[],equipment:[],check_groups:[],catalog_facts:[],catalog_meta:'',home_features:[],home_text:'',display_order:0,expected_at:null};}
 let items=clone(C.seed),state=blank(),original=blank(),selectedSlug='',mode='demo',token=null,refreshToken=null,user=null;
 let form={specs:{},otherSpecs:[],equipment:new Set(),oldEquipment:{},details:{},originalDetails:{},extraEquipment:'',checks:new Set(),oldChecks:{},docs:{country:'',mileage:'Нет',documents:'ПТС, СБКТС, таможенная декларация',inspection:'Доступен',delivery:'Возможна',countryOther:'',documentsOther:''}};
 function message(s,error=false){$('#saveMessage').textContent=s;$('#saveMessage').classList.toggle('error',error);}
 function photoMessage(s,error=false){$('#photoMessage').textContent=s;$('#photoMessage').classList.toggle('error',error);}
 function authMessage(s,error=false){$('#authMsg').textContent=s;$('#authMsg').classList.toggle('error',error);}
 function notice(s,error=false){$('#modeNotice').textContent=s;$('#modeNotice').className='status '+(error?'err':mode==='admin'?'ok':'');}
 function equipmentId(title,text){
  const t=clean(title).toLowerCase(),v=clean(text).toLowerCase();
  if(t==='alde')return 'alde';if(t==='truma')return 'truma';
  if(t==='тёплый пол')return 'floor';
  if(t.includes('бойлер'))return (t.includes('электр')||(t==='бойлер'&&v.includes('электр')))?'elecboiler':'gasboiler';
  if(t==='мувер')return 'mover';if(t.includes('солнечн'))return 'solar';if(t==='аккумулятор')return 'battery';if(t.includes('бак чистой воды'))return 'water';if(t==='газовый баллон')return 'gasbottle';
  if(t.includes('холодильник')||t==='dometic')return 'fridge';if(t==='морозильная камера')return 'freezer';if(t==='газовая плита')return 'stove';if(t.includes('духовой'))return 'oven';if(t.includes('микроволнов'))return 'microwave';if(t==='кухонная мойка')return 'sink';
  if(t==='душ')return 'shower';if(t.includes('биотуалет'))return 'toilet';if(t.includes('умывальник'))return 'washbasin';if(t==='санузел')return 'shower';
  if(t==='маркиза')return 'awning';if(t.includes('палатка'))return 'tent';if(t.includes('потолочный люк'))return 'skylight';if(t.includes('москитные'))return 'nets';if(t.includes('blackout'))return 'blackout';
  if(t.includes('мест хранения')||t==='места хранения')return 'storage';if(t.includes('ковровое'))return 'carpet';if(t.includes('двухосное'))return 'doubleaxle';return null;
 }
 function extractNumber(text,unit){const rx=unit==='w'?/(\d+)\s*Вт/i:unit==='a'?/(\d+)\s*А[·\s-]*ч/i:/(\d+)\s*(?:л\b|литр)/i;return String(text||'').match(rx)?.[1]||'';}
 function originalValue(group,label){return (group?.rows||[]).find(r=>r.label===label)?.value||'';}
 function readForm(item){
  const specs={};const used=new Set();
  for(const [section,defs] of Object.entries(specDefs))for(const [key,label,aliases] of defs){let v='';for(const g of item.spec_groups||[]){for(const r of g.rows||[]){if(aliases.includes(r.label)){v=r.value;used.add(g.title+'\u0000'+r.label);break;}}if(v)break;}specs[key]=v;}
  const otherSpecs=[];for(const g of item.spec_groups||[]){if(/отопление|автономность/i.test(g.title))continue;for(const r of g.rows||[]){if(used.has(g.title+'\u0000'+r.label))continue;if(['Год выпуска','Максимально разрешённая масса','Макс. разрешённая масса'].includes(r.label))continue;if(clean(r.value))otherSpecs.push({group:g.title,label:r.label,value:r.value});}}
  const equipment=new Set(),oldEquipment={},other=[];
  for(const e of item.equipment||[]){const id=equipmentId(e.title,e.text);if(id){equipment.add(id);oldEquipment[id]=clone(e);}else other.push(e.title);}
  const details={solar:'',battery:'',water:'',boiler:'',floor:'',fridge:''};
  for(const [id,field,unit] of [['solar','solar','w'],['battery','battery','a'],['water','water','l'],['gasboiler','boiler','l'],['elecboiler','boiler','l']]){if(oldEquipment[id])details[field]=extractNumber(oldEquipment[id].text,unit);}
  const floorText=oldEquipment.floor?.text||'';if(/электр/i.test(floorText))details.floor='Электрический, 220 В';else if(/жидк/i.test(floorText))details.floor='Жидкостный';
  const fridgeText=oldEquipment.fridge?.text||'';if(/12\s*в/i.test(fridgeText))details.fridge='Газ / 220 В / 12 В';else if(/газ/i.test(fridgeText))details.fridge='Газ / 220 В';
  const checks=new Set(),oldChecks={};
  for(const g of item.check_groups||[]){if(!/проверка|состояние/i.test(g.title))continue;for(const r of g.rows||[]){const t=r.label.toLowerCase();let id=null;
   if(/клининг|химчистк/.test(t))id='clean';else if(/корпус/.test(t))id='body';else if(/рама|подвеск/.test(t))id='chassis';else if(/отоплен/.test(t))id='heating';else if(/газов/.test(t))id='gas';else if(/водоснабж/.test(t))id='water';else if(/электрик/.test(t))id='electric';else if(/холодильник/.test(t))id='fridge';else if(/бойлер/.test(t))id='boiler';else if(/тёплый пол/.test(t))id='floor';
   if(id){checks.add(id);oldChecks[id]=clone(r);}
  }}
  const doc=(item.check_groups||[]).find(g=>/документы|осмотр/i.test(g.title));const country=originalValue(doc,'Страна покупки');const documents=originalValue(doc,'Документы');
  const countryOptions=[...$('[data-doc="country"]').options].map(o=>o.value);const documentOptions=[...$('[data-doc="documents"]').options].map(o=>o.value);
  const docs={country:countryOptions.includes(country)?country:country?'Другая страна':'',countryOther:countryOptions.includes(country)?'':country,
   mileage:originalValue(doc,'Пробег по РФ / РБ')|| (item.no_russia_mileage?'Нет':'Не указан'),
   documents:documentOptions.includes(documents)?documents:documents?'Другое':'ПТС, СБКТС, таможенная декларация',documentsOther:documentOptions.includes(documents)?'':documents,
   inspection:originalValue(doc,'Осмотр')||'Доступен',delivery:originalValue(doc,'Доставка по России')||'Возможна'};
  return {specs,otherSpecs,equipment,oldEquipment,details,originalDetails:clone(details),extraEquipment:other.join('\n'),checks,oldChecks,docs,dirty:{specs:false,equipment:false,checks:false,docs:false,short:false,long:false,photos:false}};
 }
 function longDescription(item){const p=(item.paragraphs||[]).map(p=>[p.title,p.text].filter(Boolean).join(' ')).filter(Boolean).join('\n\n');const lead=clean(item.description_lead);if(lead&&lead!==clean(item.lead)&&!p.startsWith(lead))return lead+(p?'\n\n'+p:'');return p||lead;}
 function renderSpecs(){for(const [section,defs] of Object.entries(specDefs)){const root=$('#spec'+(section==='external'?'External':'Internal'));root.replaceChildren();for(const [key,label] of defs){const div=node('div','field'),lab=node('label','',label),inp=node('input');inp.dataset.spec=key;inp.placeholder=key==='sleeping'?'Например, 4 или 4–5':key==='axles'?'Например, 1 ось / 2 оси':'Необязательно';inp.value=form.specs[key]||'';inp.addEventListener('input',()=>{form.specs[key]=inp.value;form.dirty.specs=true;});div.append(lab,inp);root.appendChild(div);}}
  const root=$('#otherSpecs');root.replaceChildren();form.otherSpecs.forEach((o,i)=>{const div=node('div','extra-spec'),lab=node('label','',o.label),inp=node('input');inp.value=o.value;inp.addEventListener('input',()=>{form.otherSpecs[i].value=inp.value;form.dirty.specs=true;});div.append(lab,inp);root.appendChild(div);});$('#otherSpecsWrap').classList.toggle('hidden',!form.otherSpecs.length);
 }
 function renderEquipment(){const root=$('#equipmentOptions');root.replaceChildren();for(const group of groups){const wrap=node('details','group');wrap.open=group.items.some(([id])=>form.equipment.has(id));const summary=node('summary','',group.name);wrap.appendChild(summary);const list=node('div','checklist');for(const [id,title] of group.items){const label=node('label','check'),cb=node('input');cb.type='checkbox';cb.dataset.equipment=id;cb.checked=form.equipment.has(id);cb.addEventListener('change',()=>{cb.checked?form.equipment.add(id):form.equipment.delete(id);form.dirty.equipment=true;updateDetailVisibility();});label.append(cb,document.createTextNode(title));list.appendChild(label);}wrap.appendChild(list);root.appendChild(wrap);}
  $$('[data-detail]').forEach(input=>{input.value=form.details[input.dataset.detail]||'';});$('#extraEquipment').value=form.extraEquipment||'';updateDetailVisibility();
 }
 function updateDetailVisibility(){const pairs={solar:['solar'],battery:['battery'],water:['water'],boiler:['gasboiler','elecboiler'],floor:['floor'],fridge:['fridge']};let count=0;for(const [field,ids] of Object.entries(pairs)){const show=ids.some(id=>form.equipment.has(id));const el=$('[data-detail="'+field+'"]');if(el){el.closest('.field').classList.toggle('hidden',!show);if(show)count++;}}$('#equipmentDetails').classList.toggle('hidden',!count);}
 function renderChecks(){const root=$('#checkOptions');root.replaceChildren();for(const [id,title] of checkDefs){const label=node('label','check'),cb=node('input');cb.type='checkbox';cb.checked=form.checks.has(id);cb.addEventListener('change',()=>{cb.checked?form.checks.add(id):form.checks.delete(id);form.dirty.checks=true;});label.append(cb,document.createTextNode(title));root.appendChild(label);}}
 function renderDocs(){for(const [k,v] of Object.entries(form.docs)){const input=$('[data-doc="'+k+'"]');if(input)input.value=v;}
  $('#countryOther').value=form.docs.countryOther||'';$('#documentsOther').value=form.docs.documentsOther||'';toggleDocs();}
 function toggleDocs(){const isOtherCountry=form.docs.country==='Другая страна';$('#countryOtherField').classList.toggle('hidden',!isOtherCountry);$('#countryOther').required=isOtherCountry;$('#documentsOtherField').classList.toggle('hidden',form.docs.documents!=='Другое');}
 function toggleArrival(){$('#arrivalField').classList.toggle('hidden',state.status!=='in_transit');if(state.status!=='in_transit'){state.expected_at=null;$('[data-field="expected_at"]').value='';}}
 function renderPhotos(){const root=$('#photoList');root.replaceChildren();(state.photos||[]).forEach((p,i)=>{const url=typeof p==='string'?p:p.url,thumb=typeof p==='string'?p:(p.thumb||p.url);const cell=node('div','photo'+(i===0?' primary':''));const img=node('img');img.src=thumb||'';img.alt='Фото '+(i+1);cell.appendChild(img);cell.appendChild(node('small','',i===0?'★ Главное фото':'Фото '+(i+1)));
   const row=node('div','row');for(const [label,fn,title] of [['←',()=>movePhoto(i,-1),'Переместить раньше'],['→',()=>movePhoto(i,1),'Переместить позже'],['×',()=>removePhoto(i),'Удалить фото']]){const b=node('button','btn outline small',label);b.type='button';b.title=title;b.disabled=(label==='←'&&i===0)||(label==='→'&&i===state.photos.length-1);b.addEventListener('click',fn);row.appendChild(b);}cell.appendChild(row);root.appendChild(cell);});}
 function movePhoto(i,delta){form.dirty.photos=true;const j=i+delta;if(j<0||j>=state.photos.length)return;[state.photos[i],state.photos[j]]=[state.photos[j],state.photos[i]];renderPhotos();}
 function removePhoto(i){form.dirty.photos=true;state.photos.splice(i,1);renderPhotos();}
 function renderList(){const root=$('#itemList');root.replaceChildren();if(!items.length){root.appendChild(node('p','hint','Пока нет караванов. Нажмите «Добавить».'));return;}
  for(const item of items.slice().sort((a,b)=>(a.display_order||100)-(b.display_order||100))){const b=node('button','catalog-item'+(selectedSlug===item.slug?' active':''));b.type='button';b.appendChild(node('strong','',item.name||'Без названия'));b.appendChild(node('small','',({available:'В наличии',in_transit:'В пути',sold:'Продан',archived:'Архив'}[item.status]||'Черновик')+' · '+(item.year||'')+(item.is_published?' · Опубликован':' · Черновик')));b.addEventListener('click',()=>select(item.slug));root.appendChild(b);}}
 function renderForm(){for(const input of $$('[data-field]')){const k=input.dataset.field;let value;if(k==='short_description')value=state.lead||state.home_text||'';else if(k==='long_description')value=longDescription(state);else value=state[k];if(input.type==='checkbox')input.checked=!!value;else input.value=value??'';}
  $('#formTitle').textContent=state.name||'Новый караван';renderSpecs();renderEquipment();renderChecks();renderDocs();toggleArrival();renderPhotos();
  const preview=$('#preview');preview.classList.toggle('hidden',!state.slug || (mode==='admin'&&!state.is_published));preview.href='caravan.html?slug='+encodeURIComponent(state.slug||'')+(mode==='demo'?'&demo=1':'');
 }
 function select(slug){selectedSlug=slug;state=clone(items.find(i=>i.slug===slug)||blank());original=clone(state);form=readForm(state);renderForm();renderList();message(mode==='admin'?'Изменения сохраняются только после нажатия «Сохранить караван».':'Демо-режим: можно менять поля и добавлять фотографии, но сохранение недоступно.');}
 function showApp(){
  $('#saveBtn').disabled=mode!=='admin';
  $('#adminTools').classList.toggle('hidden',mode!=='admin'||C.seed.every(s=>items.some(i=>i.slug===s.slug)));
  notice(mode==='admin'?'Доступ подтверждён. Теперь можно сохранять изменения.':'Демо: всё можно попробовать, включая загрузку фотографий. Данные в интернет не отправляются.');
  renderList();
  select(items[0]?.slug||'');
  $('#app').classList.remove('hidden');
  $('#auth').classList.add('hidden');
  window.scrollTo(0,0);
 }
 function translit(s){const ru='абвгдеёжзийклмнопрстуфхцчшщъыьэюя',en=['a','b','v','g','d','e','yo','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','shch','','y','','e','yu','ya'];const map=Object.fromEntries([...ru].map((ch,i)=>[ch,en[i]]));return [...clean(s).toLowerCase()].map(ch=>map[ch]??ch).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,75);}
 function uniqueSlug(name,year){let base=translit(name+' '+year)||'caravan',s=base,n=2;while(items.some(i=>i.slug===s)){s=base+'-'+n;n++;}return s;}
 function toEquipment(){const result=[];for(const p of presets){if(!form.equipment.has(p.id))continue;let title=p.title,text=p.description;const old=form.oldEquipment[p.id];const key=({solar:'solar',battery:'battery',water:'water',gasboiler:'boiler',elecboiler:'boiler',floor:'floor',fridge:'fridge'})[p.id];const unchanged=key?form.details[key]===form.originalDetails[key]:true;
   if(old&&unchanged){title=old.title;text=old.text;}else{
    const d=form.details;if(p.id==='solar'&&clean(d.solar))text=clean(d.solar)+' Вт.';
    if(p.id==='battery'&&clean(d.battery))text=clean(d.battery)+' А·ч.';
    if(p.id==='water'&&clean(d.water))text=clean(d.water)+' л.';
    if((p.id==='gasboiler'||p.id==='elecboiler')&&clean(d.boiler))text=clean(d.boiler)+' л.';
    if(p.id==='floor'&&clean(d.floor))text=clean(d.floor)+'.';
    if(p.id==='fridge'&&clean(d.fridge))text=clean(d.fridge)+'.';
   }
   result.push({title,text});}
  for(const line of form.extraEquipment.split(/\r?\n/)){const title=clean(line);if(title&&!result.some(x=>x.title.toLowerCase()===title.toLowerCase()))result.push({title,text:''});}return result;
 }
 function toSpecs(){const rows=(defs)=>defs.map(([k,label])=>({label,value:clean(form.specs[k])})).filter(x=>x.value);const ext=[{label:'Год выпуска',value:String(state.year||'')}];if(clean(form.specs.mod))ext.push({label:'Тип / модификация',value:clean(form.specs.mod)});
  ext.push(...rows(specDefs.external.filter(([k])=>k!=='mod'&&k!=='axles')));
  if(clean(state.max_weight))ext.push({label:'Максимально разрешённая масса',value:clean(state.max_weight)});
  if(clean(form.specs.axles))ext.push({label:'Количество осей',value:clean(form.specs.axles)});
  const inside=rows(specDefs.internal);const out=[{title:'Внешние характеристики',rows:ext}];if(inside.length)out.push({title:'Внутренние характеристики',rows:inside});
  for(const e of form.otherSpecs){if(!clean(e.value))continue;let group=out.find(g=>g.title===e.group);if(!group){group={title:e.group,rows:[]};out.push(group);}if(!group.rows.some(r=>r.label===e.label))group.rows.push({label:e.label,value:clean(e.value)});}return out;
 }
 function toChecks(){const checks=[];for(const [id,label,defaultValue] of checkDefs){if(!form.checks.has(id))continue;const old=form.oldChecks[id];checks.push(old||{label,value:defaultValue});}
  const d=form.docs,country=d.country==='Другая страна'?clean(d.countryOther):d.country,documents=d.documents==='Другое'?clean(d.documentsOther):d.documents;
  const docRows=[['Страна покупки',country],['Пробег по РФ / РБ',d.mileage],['Документы',documents],['Осмотр',d.inspection],['Доставка по России',d.delivery]].filter(([,v])=>clean(v)).map(([label,value])=>({label,value}));
  return [{title:'Состояние и проверка',rows:checks},{title:'Документы и осмотр',rows:docRows}];
 }
 function sleepingLabel(value){const n=Number(value);if(Number.isInteger(n)&&n>=1){return value+(n%10===1&&n%100!==11?' спальное место':[2,3,4].includes(n%10)&&![12,13,14].includes(n%100)?' спальных места':' спальных мест');}return value+' спальных мест';}
 function toCatalogFacts(equipment){const ids=form.equipment,facts=[];const add=x=>{if(x&&!facts.includes(x)&&facts.length<5)facts.push(x);};add(clean(state.max_weight));add(ids.has('alde')?'ALDE':ids.has('truma')?'Truma':'');add(clean(form.specs.axles));add(clean(form.specs.sleeping)?sleepingLabel(clean(form.specs.sleeping)):'');if(facts.length<4)add(ids.has('mover')?'мувер':ids.has('floor')?'тёплый пол':'');if(facts.length<4)add(ids.has('awning')?'маркиза':'');
  const meta=[];if(ids.has('solar'))meta.push('Солнечная панель'+(clean(form.details.solar)?' '+clean(form.details.solar)+' Вт':''));if(ids.has('battery'))meta.push('аккумулятор'+(clean(form.details.battery)?' '+clean(form.details.battery)+' А·ч':''));if(ids.has('water'))meta.push('бак'+(clean(form.details.water)?' '+clean(form.details.water)+' л':''));if(ids.has('floor'))meta.push('тёплый пол');if(ids.has('awning'))meta.push('маркиза');if(ids.has('mover'))meta.push('мувер');
  const home=[];if(clean(state.max_weight))home.push('Макс. масса '+clean(state.max_weight));for(const id of ['mover','solar','awning','floor','tent','alde','truma']){if(ids.has(id)&&home.length<3){const label=id==='solar'?'Солнечная панель'+(clean(form.details.solar)?' '+clean(form.details.solar)+' Вт':''):presetMap[id].title;home.push(label);}}
  return {facts,meta:meta.slice(0,4).join(' · '),home};
 }
 function preserveSpecs(){
  const groups=clone(original.spec_groups||[]);
  const ext=()=>{let g=groups.find(g=>/внешн/i.test(g.title));if(!g){g={title:'Внешние характеристики',rows:[]};groups.unshift(g);}return g;};
  const inside=()=>{let g=groups.find(g=>/внутренн/i.test(g.title));if(!g){g={title:'Внутренние характеристики',rows:[]};groups.push(g);}return g;};
  function patch(aliases,label,value,target){
   const val=clean(value);let found=false;
   for(const g of groups)for(const r of g.rows||[])if(aliases.includes(r.label)){r.value=val;found=true;}
   if(!found&&val)target().rows.push({label,value:val});
  }
  patch(['Год выпуска'],'Год выпуска',state.year||'',ext);
  patch(['Максимально разрешённая масса','Макс. разрешённая масса'],'Максимально разрешённая масса',state.max_weight,ext);
  for(const [key,label,aliases] of specDefs.external)patch(aliases,label,form.specs[key],ext);
  for(const [key,label,aliases] of specDefs.internal)patch(aliases,label,form.specs[key],inside);
  for(const e of form.otherSpecs){for(const g of groups){if(g.title!==e.group)continue;for(const r of g.rows||[]){if(r.label===e.label)r.value=clean(e.value);}}}
  return groups.map(g=>({...g,rows:(g.rows||[]).filter(r=>clean(r.value))})).filter(g=>g.rows.length);
 }
 function preserveEquipment(){
  const made=toEquipment(),done=new Set(),result=[];
  const extras=new Set(form.extraEquipment.split(/\r?\n/).map(x=>clean(x).toLowerCase()).filter(Boolean));
  for(const old of original.equipment||[]){const id=equipmentId(old.title,old.text);
   if(!id){if(extras.has(clean(old.title).toLowerCase()))result.push(old);continue;}
   if(!form.equipment.has(id))continue;
   const key=({solar:'solar',battery:'battery',water:'water',gasboiler:'boiler',elecboiler:'boiler',floor:'floor',fridge:'fridge'})[id];
   if(key&&form.details[key]!==form.originalDetails[key]){
     if(!done.has(id)){const fresh=made.find(x=>equipmentId(x.title,x.text)===id);if(fresh)result.push(fresh);}done.add(id);
   }else{result.push(old);done.add(id);}
  }
  for(const item of made){const id=equipmentId(item.title,item.text);if(id){if(!done.has(id)){result.push(item);done.add(id);}}else if(!result.some(x=>clean(x.title).toLowerCase()===clean(item.title).toLowerCase()))result.push(item);}
  return result;
 }
 function preserveChecks(){
  const groups=clone(original.check_groups||[]);
  if(!groups.length)return toChecks();
  if(form.dirty.checks){
   let group=groups.find(g=>/состояние|проверка/i.test(g.title));if(!group){group={title:'Состояние и проверка',rows:[]};groups.unshift(group);}
   const used=new Set();group.rows=(group.rows||[]).filter(r=>{
     const t=clean(r.label).toLowerCase();const id= /клининг|химчистк/.test(t)?'clean':/корпус/.test(t)?'body':/рама|подвеск/.test(t)?'chassis':/отоплен/.test(t)?'heating':/газов/.test(t)?'gas':/водоснабж/.test(t)?'water':/электрик/.test(t)?'electric':/холодильник/.test(t)?'fridge':/бойлер/.test(t)?'boiler':/тёплый пол/.test(t)?'floor':null;
     if(!id)return true;
     used.add(id);return form.checks.has(id);
   });
   for(const [id,label,val] of checkDefs)if(form.checks.has(id)&&!used.has(id))group.rows.push({label,value:val});
  }
  if(form.dirty.docs){
   const docs=toChecks().find(g=>g.title==='Документы и осмотр');
   const pos=groups.findIndex(g=>/документы|осмотр/i.test(g.title));
   if(pos<0)groups.push(docs);else groups[pos]=docs;
  }
  return groups;
 }
 function makePayload(){
  const out=clone(state);if(/^\d+$/.test(clean(out.max_weight)))out.max_weight=clean(out.max_weight)+' кг';state.max_weight=out.max_weight;
  const short=clean($('[data-field="short_description"]').value),long=clean($('[data-field="long_description"]').value);
  const isOld=!!original.id;
  if(!isOld||form.dirty.short){out.lead=short;out.home_text=short;}
  if(!isOld||form.dirty.long){out.description_lead=short;out.paragraphs=long?[{title:'',text:long}]:[];}
  out.spec_groups=isOld?preserveSpecs():toSpecs();
  out.technical_groups=isOld?clone(original.technical_groups||[]):[];
  out.equipment=isOld?preserveEquipment():toEquipment();
  out.check_groups=isOld?preserveChecks():toChecks();
  out.no_russia_mileage=form.docs.mileage==='Нет';out.expected_at=out.status==='in_transit'?(out.expected_at||null):null;
  if(!isOld||form.dirty.specs||form.dirty.equipment||state.max_weight!==original.max_weight){
    const derived=toCatalogFacts(out.equipment);out.catalog_facts=derived.facts;out.catalog_meta=derived.meta;out.home_features=derived.home;
  }
  if(!isOld||form.dirty.photos){out.cover_url=out.photos[0]?.url||out.photos[0]||'';out.home_cover_url=out.cover_url;}
  if(!out.slug)out.slug=uniqueSlug(out.name,out.year);
  out.legacy_page=out.legacy_page||null;
  if(out.status==='sold'&&original.status!=='sold')out.sold_at=new Date().toISOString();
  else if(out.status!=='sold')out.sold_at=null;
  delete out.id;delete out.created_at;delete out.updated_at;
  return out;
 }
 // Form input bindings
 $$('[data-field]').forEach(input=>input.addEventListener('input',()=>{const k=input.dataset.field;if(k==='short_description'||k==='long_description'){form.dirty[k==='short_description'?'short':'long']=true;return;}state[k]=input.type==='checkbox'?input.checked:input.type==='number'?(input.value===''?null:Number(input.value)):input.value;
  if(k==='name')$('#formTitle').textContent=input.value||'Новый караван';if(k==='status')toggleArrival();}));
 $$('[data-detail]').forEach(input=>input.addEventListener('input',()=>{form.details[input.dataset.detail]=input.value;form.dirty.equipment=true;}));
 $$('[data-doc]').forEach(input=>input.addEventListener('change',()=>{form.docs[input.dataset.doc]=input.value;form.dirty.docs=true;toggleDocs();if(input.dataset.doc==='country'&&input.value==='Другая страна')$('#countryOther').focus();}));
 $('#countryOther').addEventListener('input',e=>{form.docs.countryOther=e.target.value;form.dirty.docs=true;});$('#documentsOther').addEventListener('input',e=>{form.docs.documentsOther=e.target.value;form.dirty.docs=true;});
 $('#extraEquipment').addEventListener('input',e=>{form.extraEquipment=e.target.value;form.dirty.equipment=true;});
 $('#newBtn').addEventListener('click',()=>{selectedSlug='';state=blank();original=clone(state);form=readForm(state);renderForm();renderList();message('Новый караван. Заполните основные поля, добавьте фотографии и комплектацию.');});
 $('#resetBtn').addEventListener('click',()=>{state=clone(original);form=readForm(state);renderForm();message('Правки отменены.');});
 $('#photoUpload').addEventListener('change',async e=>{const files=[...e.target.files];let count=0;for(const f of files){if(f.size>10*1024*1024||!['image/jpeg','image/png','image/webp','image/avif'].includes(f.type)){photoMessage('Файл «'+f.name+'» не подходит: используйте JPG, PNG, WEBP или AVIF до 10 МБ.',true);continue;}
   if(mode==='demo'){const url=URL.createObjectURL(f);state.photos.push({url,thumb:url});form.dirty.photos=true;count++;renderPhotos();continue;}
   const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[f.type],slug=C.safeSlug(state.slug)?state.slug:uniqueSlug(state.name||'caravan',state.year),name=slug+'/'+crypto.randomUUID()+'.'+ext;
   photoMessage('Загружаем «'+f.name+'»…');try{const r=await request('/storage/v1/object/catalog-photos/'+name,{method:'POST',headers:{'Content-Type':f.type,'x-upsert':'false'},body:f});if(!r.ok)throw Error('Ошибка загрузки: '+r.status+' '+(await r.text()).slice(0,160));const url=API_URL+'/storage/v1/object/public/catalog-photos/'+name;state.photos.push({url,thumb:url});form.dirty.photos=true;count++;renderPhotos();}catch(err){photoMessage(err.message,true);}}
  e.target.value='';if(count)photoMessage(mode==='demo'?'Добавлено фото: '+count+'. Это только просмотр — в интернет фотографии не загружены.':'Загружено фотографий: '+count+'. Первое фото будет главным.');
 });
 // Auth, protected reads and writes
 function authHeaders(){return {...API_HEADERS,'Authorization':'Bearer '+token,'Content-Type':'application/json'};}
 async function request(path,opts={}){
  const send=async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{return await fetch(API_URL+path,{...opts,signal:controller.signal,headers:{...authHeaders(),...opts.headers}});}
   catch(e){if(e.name==='AbortError')throw Error('Сервер не ответил за 15 секунд ('+path.split('?')[0]+').');throw e;}
   finally{clearTimeout(timer);}
  };
  let r=await send();
  if(r.status===401&&refreshToken){if(await refresh())r=await send();}
  return r;
 }
 async function refresh(){try{const r=await fetch(API_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:API_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refreshToken})});if(!r.ok)return false;const d=await r.json();token=d.access_token;refreshToken=d.refresh_token;sessionStorage.setItem('tb_admin_session',JSON.stringify({token,refreshToken}));return true;}catch(e){return false;}}
 async function getAdmin(){const r=await request('/rest/v1/catalog_admins?select=user_id&limit=1');return r.ok&&(await r.json()).length>0;}
 async function getItems(){
  const path='/rest/v1/catalog_items?select=*&order=display_order.asc,created_at.desc';
  let lastError;
  for(let attempt=1;attempt<=2;attempt++){
   try{
    authMessage('Права подтверждены. Получаем каталог (попытка '+attempt+' из 2)…');
    const r=await request(path,{cache:'no-store'});
    if(!r.ok)throw Error('Сервер каталога ответил '+r.status);
    authMessage('Ответ каталога получен. Читаем данные…');
    let timer;
    try{
     const body=await Promise.race([r.text(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Загрузка данных каталога заняла больше 12 секунд')),12000);})]);
     const data=JSON.parse(body);
     if(!Array.isArray(data))throw Error('Сервер вернул каталог в неожиданном формате');
     authMessage('Получено караванов: '+data.length+'. Открываем админку…');
     return data;
    }finally{clearTimeout(timer);}
   }catch(e){
    lastError=e;
    if(attempt<2)authMessage('Первая попытка загрузки не удалась: '+e.message+'. Повторяем…',true);
   }
  }
  throw Error('Каталог не загрузился: '+lastError.message);
 }
 async function establish(t,rt){
  token=t;refreshToken=rt;
  authMessage('Пароль принят. Проверяем права администратора…');
  if(!await getAdmin())throw Error('Не удалось подтвердить права администратора.');
  authMessage('Права подтверждены. Загружаем каталог караванов…');
  const loaded=await getItems();
  items=loaded;mode='admin';user={email:$('#email').value.trim()||'Администратор'};
  $('#who').textContent=user.email;
  $('#logout').classList.remove('hidden');
  sessionStorage.setItem('tb_admin_session',JSON.stringify({token,refreshToken}));
  showApp();
 }
 $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();authMessage('Проверяем доступ…');try{const r=await fetch(API_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:API_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:$('#email').value.trim(),password:$('#password').value})});if(!r.ok){const x=await r.json();throw Error(x.msg||x.error_description||'Неверная почта или пароль');}const d=await r.json();await establish(d.access_token,d.refresh_token);}catch(err){authMessage(err.message,true);token=null;refreshToken=null;sessionStorage.removeItem('tb_admin_session');}});
 // Password recovery via Supabase Auth. No password or token is logged or stored persistently.
 let recoveryMode=false;
 $('#recoveryLinkForm').classList.remove('hidden');
  $('#forgotBtn').addEventListener('click',async()=>{
  const email=$('#email').value.trim();
  if(!email||!$('#email').checkValidity()){authMessage('Сначала укажите электронную почту от админки.',true);$('#email').focus();return;}
  const btn=$('#forgotBtn');btn.disabled=true;authMessage('Отправляем письмо для восстановления пароля…');
  try{
   const url=API_URL+'/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+'/admin.html');
   const r=await fetch(url,{method:'POST',headers:{apikey:API_KEY,'Content-Type':'application/json'},body:JSON.stringify({email})});
   if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.msg||d.error_description||d.message||'Не удалось отправить письмо ('+r.status+').');}
   $('#recoveryLinkForm').classList.remove('hidden');
   authMessage('Письмо отправлено, если почта зарегистрирована. Не открывайте ссылку из письма: скопируйте её адрес и вставьте в поле ниже.');
  }catch(e){authMessage('Ошибка отправки: '+e.message,true);}finally{btn.disabled=false;}
 });
 function showRecoveryForm(access,refresh){
  recoveryMode=true;token=access;refreshToken=refresh||null;
  sessionStorage.removeItem('tb_admin_session');
  $('#loginForm').classList.add('hidden');$('#forgotBtn').classList.add('hidden');
  $('#registerBtn').classList.add('hidden');$('#demoBtn').classList.add('hidden');
  $('#resetForm').classList.remove('hidden');
  authMessage('Ссылка подтверждена. Придумайте новый пароль для админки.');
  history.replaceState(null,'',location.pathname+location.search);
  $('#newPassword').focus();
 }
 const recoveryHash=new URLSearchParams(location.hash.slice(1));
 const recoveryQuery=new URLSearchParams(location.search);
 if(recoveryHash.get('type')==='recovery'&&recoveryHash.get('access_token')){
  showRecoveryForm(recoveryHash.get('access_token'),recoveryHash.get('refresh_token'));
 }else if(recoveryQuery.get('type')==='recovery'&&recoveryQuery.get('token_hash')){
  recoveryMode=true;authMessage('Проверяем ссылку для восстановления…');
  fetch(API_URL+'/auth/v1/verify',{method:'POST',headers:{apikey:API_KEY,'Content-Type':'application/json'},body:JSON.stringify({type:'recovery',token_hash:recoveryQuery.get('token_hash')})})
   .then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.msg||d.message||'Ссылка недействительна');showRecoveryForm(d.access_token,d.refresh_token);})
   .catch(e=>{recoveryMode=false;authMessage('Не удалось подтвердить ссылку: '+e.message,true);});
 }else if(recoveryHash.get('error')||recoveryQuery.get('error')){
  authMessage('Ссылка восстановления недействительна или устарела. Запросите новую.',true);
  history.replaceState(null,'',location.pathname+location.search);
 }
 $('#recoveryLinkForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const raw=$('#recoveryLink').value.trim();
  let url;
  try{url=new URL(raw);}catch(_){authMessage('Ссылка некорректна. Скопируйте полный адрес из письма.',true);return;}
  if(url.protocol!=='https:'||url.hostname!=='gtbaelazxrapzdkygbsh.supabase.co'||url.pathname!=='/auth/v1/verify'||url.searchParams.get('type')!=='recovery'){
   authMessage('Это не ссылка восстановления от нашего проекта Supabase.',true);return;
  }
  const tokenHash=url.searchParams.get('token');
  if(!tokenHash||!/^[a-f0-9]{32,128}$/i.test(tokenHash)){authMessage('В ссылке отсутствует действительный код восстановления.',true);return;}
  const btn=$('#recoveryLinkForm button[type="submit"]');btn.disabled=true;
  authMessage('Проверяем код восстановления…');
  try{
   const r=await fetch(API_URL+'/auth/v1/verify',{method:'POST',headers:{apikey:API_KEY,'Content-Type':'application/json'},body:JSON.stringify({token_hash:tokenHash,type:'recovery'})});
   const d=await r.json().catch(()=>({}));
   if(!r.ok||!d.access_token)throw Error(d.msg||d.error_description||d.message||'Ссылка истекла или уже использована. Запросите новое письмо.');
   $('#recoveryLink').value='';
   $('#recoveryLinkForm').classList.add('hidden');
   showRecoveryForm(d.access_token,d.refresh_token);
  }catch(err){authMessage('Не удалось подтвердить ссылку: '+err.message,true);}finally{btn.disabled=false;}
 });
 $('#resetForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!recoveryMode||!token){authMessage('Ссылка восстановления устарела. Запросите новую.',true);return;}
  const password=$('#newPassword').value;
  if(password.length<8){authMessage('Пароль должен содержать не менее 8 символов.',true);return;}
  const btn=$('#resetForm button[type="submit"]');btn.disabled=true;authMessage('Сохраняем новый пароль…');
  try{
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),12000);
   let r;
   try{
    r=await fetch(API_URL+'/auth/v1/user',{method:'PUT',headers:{apikey:API_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({password}),signal:controller.signal});
   }finally{clearTimeout(timeout);}
   if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.msg||d.error_description||d.message||'Ошибка изменения пароля ('+r.status+').');}
   recoveryMode=false;token=null;refreshToken=null;sessionStorage.removeItem('tb_admin_session');
   $('#resetForm').classList.add('hidden');$('#recoveryLinkForm').classList.add('hidden');$('#loginForm').classList.remove('hidden');
   $('#forgotBtn').classList.remove('hidden');$('#registerBtn').classList.remove('hidden');$('#demoBtn').classList.remove('hidden');
   $('#password').value='';$('#newPassword').value='';
   authMessage('Пароль успешно изменён! Теперь войдите с новым паролем.');
  }catch(e){
   const detail=e.name==='AbortError'?'Сервер не ответил за 12 секунд. Возможно, соединение блокируется браузером или сетью. Попробуйте войти с новым паролем; если вход не получится, запросите новую ссылку.':e.message;
   authMessage('Не удалось подтвердить сохранение пароля: '+detail,true);
  }finally{btn.disabled=false;}
 });
 $('#registerBtn').addEventListener('click',async()=>{const email=$('#email').value.trim(),password=$('#password').value;if(!email||password.length<8){authMessage('Укажите почту и пароль не короче 8 символов.',true);return;}authMessage('Регистрируем аккаунт…');try{const r=await fetch(API_URL+'/auth/v1/signup',{method:'POST',headers:{apikey:API_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw Error(d.msg||d.error_description||d.message||'Ошибка регистрации');authMessage('Проверьте почту и подтвердите адрес. Затем потребуется назначить права администратора.');}catch(e){authMessage(e.message,true);}});
 $('#demoBtn').addEventListener('click',()=>{mode='demo';items=clone(C.seed);showApp();});
 $('#logout').addEventListener('click',async()=>{if(token){try{await request('/auth/v1/logout',{method:'POST'});}catch(e){}}token=null;refreshToken=null;user=null;sessionStorage.removeItem('tb_admin_session');location.reload();});
 $('#importBtn').addEventListener('click',async()=>{if(mode!=='admin')return;if(!confirm('Перенести три утверждённые карточки в базу? Уже существующие записи не будут перезаписаны.'))return;message('Переносим карточки…');try{for(const i of C.seed){const r=await request('/rest/v1/catalog_items?on_conflict=slug',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(i)});if(!r.ok)throw Error(i.name+': '+r.status+' '+(await r.text()).slice(0,160));}items=await getItems();$('#adminTools').classList.toggle('hidden',C.seed.every(s=>items.some(i=>i.slug===s.slug)));select(items[0]?.slug||'');message('Импорт завершён. Все три карточки в базе. Проверяйте их в тестовом каталоге.');}catch(e){message('Ошибка импорта: '+e.message,true);}});
 $('#caravanForm').addEventListener('submit',async e=>{e.preventDefault();if(mode!=='admin'){message('Сначала войдите как администратор, чтобы сохранить.',true);return;}
  if(!clean(state.name)||!state.year||!Number.isFinite(state.price_rub)){message('Заполните название, год и цену.',true);return;}
  if(state.is_published&&!state.photos.length){message('Для публикации добавьте хотя бы одну фотографию. Черновик можно сохранить без фото.',true);return;}
  const payload=makePayload();if(!C.safeSlug(payload.slug)){message('Не удалось создать адрес страницы. Проверьте название.',true);return;}
  if(payload.photos.some(p=>String(p.url||p).startsWith('blob:'))){message('Фотографии в демо нельзя сохранить. Загрузите их после входа.',true);return;}
  message('Сохраняем…');$('#saveBtn').disabled=true;
  try{let r;if(original.id){r=await request('/rest/v1/catalog_items?id=eq.'+encodeURIComponent(original.id),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});}else{r=await request('/rest/v1/catalog_items',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});}
   if(!r.ok)throw Error('Ошибка сохранения '+r.status+': '+(await r.text()).slice(0,300));const rows=await r.json();items=await getItems();select(rows[0]?.slug||payload.slug);message('Сохранено. '+(payload.is_published?'Карточка опубликована в базе.':'Это черновик — на сайте не показывается.'));
  }catch(err){message(err.message,true);}finally{$('#saveBtn').disabled=false;}
 });
 try{const saved=JSON.parse(sessionStorage.getItem('tb_admin_session')||'null');if(!recoveryMode&&saved?.token&&saved?.refreshToken)establish(saved.token,saved.refreshToken).catch(()=>{sessionStorage.removeItem('tb_admin_session');});}catch(e){}
})();