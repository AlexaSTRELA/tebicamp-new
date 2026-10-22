/* TEBICAMP V52: каталог без запросов к Supabase из браузера посетителя. */
window.TB_CATALOG = (() => {
  'use strict';
  const safeSlug = s => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s || '');
  const seed = window.TEBICAMP_CATALOG_SEED || [];
  const rows = (window.TEBICAMP_CATALOG_DATA || []).filter(x =>
    x && x.is_published === true && ['available','in_transit','sold'].includes(x.status));
  const list = async () => rows.slice();
  const get = async slug => safeSlug(slug) ? (rows.find(x => x.slug === slug) || null) : null;
  const mergePreview = items => items;
  const money = n => (Number(n)||0).toLocaleString('ru-RU')+' ₽';
  const href = item => 'caravan.html?slug='+encodeURIComponent(item.slug);
  return {seed,list,get,mergePreview,money,href,safeSlug};
})();
