<script>
/* ===== ハンバーガー＆言語パネル：開閉・被り防止・冪等化 ===== */
(function(){
  if (window.__siteInited) return; window.__siteInited = true;

  const html = document.documentElement;
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const state = {
    get menu(){ return html.classList.contains('menu-open'); },
    get lang(){ return html.classList.contains('lang-open'); }
  };

  const lockScroll = on => { document.body.style.overflow = on ? 'hidden' : ''; };

  function syncPointer(){
    const mw = $('.menu-wrap'); if (mw) mw.style.pointerEvents = state.menu ? 'auto':'none';
    const lw = $('.lang-wrap'); if (lw) lw.style.pointerEvents = state.lang ? 'auto':'none';
  }

  function openMenu(){ html.classList.add('menu-open'); html.classList.remove('lang-open'); lockScroll(true);  syncPointer(); onMenuOpenOnce(); }
  function closeMenu(){ html.classList.remove('menu-open'); if(!state.lang) lockScroll(false); syncPointer(); }
  function toggleMenu(){ state.menu ? closeMenu() : openMenu(); }

  function openLang(){ html.classList.add('lang-open'); html.classList.remove('menu-open'); lockScroll(true);  syncPointer(); }
  function closeLang(){ html.classList.remove('lang-open'); if(!state.menu) lockScroll(false); syncPointer(); }
  function toggleLang(){ state.lang ? closeLang() : openLang(); }

  function on(el, ev, fn){ el && el.addEventListener(ev, fn, {passive:false}); }

  on($('.menu-button'), 'click', e=>{ e.preventDefault(); e.stopPropagation(); toggleMenu(); });
  on($('.menu-close'),  'click', e=>{ e.preventDefault(); closeMenu(); });
  on($('.menu-backdrop'),'click',e=>{ e.preventDefault(); closeMenu(); });

  on($('.lang-button'), 'click', e=>{ e.preventDefault(); e.stopPropagation(); toggleLang(); });
  on($('.lang-close'),  'click', e=>{ e.preventDefault(); closeLang(); });
  on($('.lang-backdrop'),'click',e=>{ e.preventDefault(); closeLang(); });

  $$('.menu-list a').forEach(a=> on(a, 'click', ()=> closeMenu()));

  on(document,'keydown',e=>{ if(e.key==='Escape'){ if(state.lang) closeLang(); else if(state.menu) closeMenu(); }});
  ['load','resize','orientationchange','transitionend'].forEach(ev=> window.addEventListener(ev, syncPointer));
  syncPointer();

  /* ===== ハンバーガー内部の整形：1)（トップ）除外 2) KYCの直後に #plans 先頭3件を差し込む ===== */

  function removeTopLinks(){
    const anchors = $$('#menuGroups .menu-list a');
    anchors.forEach(a=>{
      const t = (a.textContent||'').replace(/\s+/g,'');
      if (t.includes('（トップ）')) {
        const li = a.closest('li'); if (li) li.remove();
      }
    });
  }

  function collectPlansTop3(){
    const sec = document.getElementById('plans');
    if (!sec) return [];
    const acc = sec.querySelector('.accordion');
    if (!acc) return [];
    const results = [];
    for (let i=0;i<acc.children.length;i++){
      const d = acc.children[i];
      if (!d || d.tagName !== 'DETAILS') continue;
      const sum = d.querySelector(':scope > summary');
      if (!sum) continue;
      results.push({details:d, summary:sum});
      if (results.length >= 3) break;
    }
    return results;
  }

  function ensureId(el, base){
    if (el.id) return el.id;
    let n=1, id=base;
    while(document.getElementById(id)) id = base+'-'+(++n);
    el.id = id; return id;
  }

  function openAncestors(node){
    let p = node && node.parentElement;
    while(p){ if (p.tagName && p.tagName.toLowerCase()==='details') p.open = true; p = p.parentElement; }
  }

  function makeLi(label, targetId){
    const li = document.createElement('li');
    li.setAttribute('data-injected','plans');
    const a = document.createElement('a');
    a.href = '#'+targetId;
    a.textContent = label;
    a.addEventListener('click', function(e){
      e.preventDefault();
      const tgt = document.getElementById(targetId);
      if (tgt){
        if (tgt.tagName && tgt.tagName.toLowerCase()==='details') tgt.open = true;
        openAncestors(tgt);
        try{ tgt.scrollIntoView({behavior:'smooth',block:'start'}); }catch(_){}
      }
      closeMenu();
    }, false);
    li.appendChild(a);
    return li;
  }

  function injectPlansAfterKYC(){
    // 既に差し込み済みなら何もしない
    if ($$('#menuGroups [data-injected="plans"]').length) return;

    const picks = collectPlansTop3(); if (!picks.length) return;

    // KYC を部分一致で探す（表記ゆれOK）
    let kycLi = null, listUl = null;
    $$('#menuGroups .menu-list a').some(a=>{
      const t = (a.textContent || '').replace(/\s+/g,'');
      if (/KYC/i.test(t)) { kycLi = a.closest('li'); listUl = a.closest('ul'); return true; }
      return false;
    });
    if (!listUl){
      // 最初のグループにフォールバック
      listUl = $('#menuGroups .menu-list');
    }
    if (!listUl) return;

    let ref = kycLi;
    picks.forEach((p, idx)=>{
      const label = (p.summary.textContent||'').trim().replace(/\s+/g,' ');
      const id = ensureId(p.details, 'plans-pick-'+(idx+1));
      const li = makeLi(label, id);
      if (ref && ref.nextSibling){ listUl.insertBefore(li, ref.nextSibling); ref = li; }
      else { listUl.appendChild(li); ref = li; }
    });
  }

  let didFirstOpen = false;
  function onMenuOpenOnce(){
    removeTopLinks();            // 何度開いても安全（再翻訳対策）
    injectPlansAfterKYC();       // 二重差し込み防止フラグあり
    if (!didFirstOpen){ didFirstOpen = true; }
  }

  // 初回ロードでも一応整形（メニューを開かなくても差分が入るように）
  removeTopLinks();
  injectPlansAfterKYC();

})();
</script>
<script>
/* ==== CLICK-SAFE PATCH (append only) ==== */
(function(){
  // DOM準備を待つ（head読み込みでも確実に動く）
  function ready(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, {once:true});
    } else { fn(); }
  }

  ready(function(){
    const html = document.documentElement;

    // 実際のマークアップに幅広く対応（クラス名ズレても拾う）
    const MENU_SELECTORS = ['.menu-button', '#menuButton', '.menu-btn', '.hamburger', '[data-menu]'];
    const LANG_SELECTORS = ['.lang-button', '#langButton', '.globe-button', '.globe', '[data-lang]', '#google_translate_button'];

    const qAny = (list)=> {
      for (const s of list) {
        const el = document.querySelector(s);
        if (el) return el;
      }
      return null;
    };

    function openMenu(){ html.classList.add('menu-open'); html.classList.remove('lang-open'); document.body.style.overflow='hidden'; }
    function closeMenu(){ html.classList.remove('menu-open'); if (!html.classList.contains('lang-open')) document.body.style.overflow=''; }
    function toggleMenu(){ html.classList.contains('menu-open') ? closeMenu() : openMenu(); }

    function openLang(){ html.classList.add('lang-open'); html.classList.remove('menu-open'); document.body.style.overflow='hidden'; }
    function closeLang(){ html.classList.remove('lang-open'); if (!html.classList.contains('menu-open')) document.body.style.overflow=''; }
    function toggleLang(){ html.classList.contains('lang-open') ? closeLang() : openLang(); }

    // 直接バインド（見つかったもの全部）
    function bindDirect(){
      const mb = qAny(MENU_SELECTORS);
      const lb = qAny(LANG_SELECTORS);
      if (mb && !mb.__boundMenu){
        ['click','touchstart'].forEach(evt=>{
          mb.addEventListener(evt, function(e){ e.preventDefault(); e.stopPropagation(); toggleMenu(); }, {passive:false});
        });
        mb.__boundMenu = true;
        // 最前面＆クリック可を強制（上書きされていても勝つ）
        Object.assign(mb.style, {position:'fixed', zIndex:'2147483647', pointerEvents:'auto'});
      }
      if (lb && !lb.__boundLang){
        ['click','touchstart'].forEach(evt=>{
          lb.addEventListener(evt, function(e){ e.preventDefault(); e.stopPropagation(); toggleLang(); }, {passive:false});
        });
        lb.__boundLang = true;
        Object.assign(lb.style, {position:'fixed', zIndex:'2147483647', pointerEvents:'auto'});
      }
    }
    bindDirect();

    // デリゲーション（万一DOM差し替えがあっても拾う）
    document.addEventListener('click', function(e){
      const t = e.target.closest(MENU_SELECTORS.join(','));
      if (t){ e.preventDefault(); e.stopPropagation(); toggleMenu(); return; }
      const g = e.target.closest(LANG_SELECTORS.join(','));
      if (g){ e.preventDefault(); e.stopPropagation(); toggleLang(); return; }
    }, true); // captureで先取り

    // MutationObserverで後から出現しても再バインド
    const mo = new MutationObserver(()=> bindDirect());
    mo.observe(document.documentElement, {subtree:true, childList:true, attributes:true});

    // バックドロップ/パネルからは閉じる（クラス名が違っても拾う）
    document.addEventListener('click', function(e){
      if (html.classList.contains('menu-open') &&
          e.target.closest('.menu-close, .menu-backdrop')) { e.preventDefault(); closeMenu(); }
      if (html.classList.contains('lang-open') &&
          e.target.closest('.lang-close, .lang-backdrop')) { e.preventDefault(); closeLang(); }
    });

    // Escapeでも閉じる
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){
        if (html.classList.contains('lang-open')) closeLang();
        else if (html.classList.contains('menu-open')) closeMenu();
      }
    });

    // 念のためのZ軸整列（他CSSに負けない“非常ボタン”）
    function bringToFront(){
      const mb = qAny(MENU_SELECTORS);
      const lb = qAny(LANG_SELECTORS);
      if (mb){ mb.style.zIndex = '2147483647'; mb.style.pointerEvents='auto'; }
      if (lb){ lb.style.zIndex = '2147483647'; lb.style.pointerEvents='auto'; }
    }
    bringToFront();
    window.addEventListener('resize', bringToFront);
    window.addEventListener('orientationchange', bringToFront);
  });
})();
</script>
