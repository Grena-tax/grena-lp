/* ===== Google翻訳の自動適用を無効化（cookieリセット） ===== */
(function resetGoogleTranslateCookie(){
  try{
    var past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    var host = location.hostname.replace(/^www\./,'');
    document.cookie = 'googtrans=; expires='+past+'; path=/';
    document.cookie = 'googtrans=; expires='+past+'; domain='+host+'; path=/';
    document.cookie = 'googtrans=; expires='+past+'; domain=.'+host+'; path=/';
  }catch(e){}
})();

/* ===== 最小限のUI操作JS（メニュー・言語ドロワー・目次） ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // メニュー
  const menuBtn = $('#menuBtn'),
        menuDrawer = $('#menuDrawer'),
        menuBackdrop = $('#menuBackdrop'),
        menuClose = $('#menuClose');

  const openMenu = () => {
    document.documentElement.classList.add('menu-open');
    if (menuDrawer) menuDrawer.setAttribute('aria-hidden','false');
    if (menuBtn) menuBtn.setAttribute('aria-expanded','true');
  };
  const closeMenu = () => {
    document.documentElement.classList.remove('menu-open');
    if (menuDrawer) menuDrawer.setAttribute('aria-hidden','true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded','false');
  };
  if (menuBtn)     menuBtn.addEventListener('click', openMenu);
  if (menuClose)   menuClose.addEventListener('click', closeMenu);
  if (menuBackdrop)menuBackdrop.addEventListener('click', closeMenu);

  // 言語ドロワー
  const langBtn = $('#langBtn'),
        langDrawer = $('#langDrawer'),
        langBackdrop = $('#langBackdrop'),
        langClose = $('#langClose');

  const openLang = () => {
    document.documentElement.classList.add('lang-open');
    if (langDrawer) langDrawer.setAttribute('aria-hidden','false');
    if (langBtn) langBtn.setAttribute('aria-expanded','true');
  };
  const closeLang = () => {
    document.documentElement.classList.remove('lang-open');
    if (langDrawer) langDrawer.setAttribute('aria-hidden','true');
    if (langBtn) langBtn.setAttribute('aria-expanded','false');
  };
  if (langBtn)      langBtn.addEventListener('click', openLang);
  if (langClose)    langClose.addEventListener('click', closeLang);
  if (langBackdrop) langBackdrop.addEventListener('click', closeLang);

  // 目次（主要セクションのみ）
  const secMap = [
    ['corp-setup','法人設立'],
    ['plans','料金プラン'],
    ['sole-setup','個人事業主（IE/SBS）'],
    ['personal-account','個人口座開設（銀行）'],
    ['disclaimer','免責事項・キャンセル']
  ];
  const groups = $('#menuGroups');
  if (groups) {
    const ul = document.createElement('ul'); ul.className = 'menu-list';
    secMap.forEach(([id,label])=>{
      const li=document.createElement('li');
      const a=document.createElement('a'); a.href='#'+id; a.textContent=label;
      a.addEventListener('click', closeMenu);
      li.appendChild(a); ul.appendChild(li);
    });
    const g=document.createElement('div'); g.className='menu-group';
    const h=document.createElement('h4'); h.textContent='セクション';
    g.appendChild(h); g.appendChild(ul); groups.appendChild(g);
  }

  // 言語検索（英語名でフィルタ）—（リスト項目は未使用でもOK）
  const langSearch = $('#langSearch'), list = $('#langList');
  if (langSearch && list){
    langSearch.addEventListener('input', ()=>{
      const q = langSearch.value.trim().toLowerCase();
      $$('.ls-item', list).forEach(it=>{
        const label = (it.textContent||'').toLowerCase();
        it.style.display = !q || label.includes(q) ? '' : 'none';
      });
    });
  }
})();
/* ===== Google翻訳：全言語リストを英語名で表示し、クリックで適用 ===== */
(function initLangList(){
  'use strict';
  var listEl = document.getElementById('langList');
  var hostEl = document.getElementById('google_translate_element');
  if (!listEl || !hostEl) return;

  var dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  function buildList(){
    var sel = hostEl.querySelector('select.goog-te-combo');
    if(!sel){ setTimeout(buildList, 150); return; }

    var cookie = (document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '';
    var cur = decodeURIComponent(cookie||'');

    var frag = document.createDocumentFragment();
    for(var i=0;i<sel.options.length;i++){
      var o = sel.options[i];
      var code = (o.value||'').trim();
      if(!code || code==='auto') continue;

      var name = (dn ? (dn.of(code)||'') : '') || (o.textContent||'').trim() || code;

      var item = document.createElement('div');
      item.className = 'ls-item' + (cur.endsWith('/'+code) ? ' ls-active' : '');
      item.setAttribute('role','option');
      item.dataset.code = code;
      item.innerHTML = '<span class="ls-name">'+name+'</span><span class="ls-code">'+code+'</span>';
      frag.appendChild(item);
    }
    listEl.innerHTML = '';
    listEl.appendChild(frag);
  }

  // クリックで公式<select>をドライブ
  document.addEventListener('click', function(e){
    var t = e.target.closest('.ls-item[data-code]');
    if(!t) return;
    var code = t.dataset.code;
    var sel  = hostEl.querySelector('select.goog-te-combo');
    if(!sel) return;

    sel.value = code;
    sel.dispatchEvent(new Event('change', {bubbles:true}));

    // アクティブ表示更新
    listEl.querySelectorAll('.ls-item').forEach(function(el){
      el.classList.toggle('ls-active', el === t);
    });

    // ドロワーを閉じる
    document.documentElement.classList.remove('lang-open');
    var drawer = document.getElementById('langDrawer'); if (drawer) drawer.setAttribute('aria-hidden','true');
    var btn = document.getElementById('langBtn'); if (btn) btn.setAttribute('aria-expanded','false');
  }, true);

  // 青いバナーは常時殺す（DOMは残ってもOK）
  function killBanner(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      ['goog-te-banner-frame','goog-gt-tt'].forEach(function(id){
        var el=document.getElementById(id);
        if(el){ if(el.remove) el.remove(); else { el.style.display='none'; el.style.visibility='hidden'; } }
      });
    }catch(_){}
  }
  new MutationObserver(killBanner).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killBanner, {once:true});
  killBanner();

  // リスト構築（公式UIの挿入タイミングに対応）
  buildList();
  new MutationObserver(buildList).observe(hostEl, {childList:true, subtree:true});
})();
