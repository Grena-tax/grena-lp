(() => {
  'use strict';
  if (window.__GRN_BUILD__) return;
  window.__GRN_BUILD__ = 'R6-minimal-safe';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* --- 事前：Google翻訳クッキー掃除（初期英語化防止） --- */
  (function cleanGTransCookie(){
    try{
      const host = location.hostname.replace(/^www\./,'');
      const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
      if (!m) return;
      const v = decodeURIComponent(m[1]||'');
      if (v && v !== '/ja/ja') {
        const exp='Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie='googtrans=; expires='+exp+'; path=/';
        document.cookie='googtrans=; expires='+exp+'; path=/; domain=.'+host;
        document.cookie='googtrans=; expires='+exp+'; path=/; domain='+host;
        if (/#googtrans/.test(location.hash)) {
          history.replaceState('', document.title, location.pathname + location.search);
        }
      }
    }catch(_){}
  })();

  /* --- Google翻訳コールバック（先に定義しておく） --- */
  window.googleTranslateElementInit = function(){
    try {
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    } catch(_){}
  };

  /* --- Google翻訳のオーバーレイを殺す（クリック阻害対策） --- */
  (function injectGTOverlayKiller(){
    const css = `
      iframe.goog-te-banner-frame{ display:none !important; }
      #goog-gt-tt, .goog-te-spinner-pos, .VIpgJd-ZVi9od-ORHb-OEVmcd{
        display:none !important; pointer-events:none !important; visibility:hidden !important; z-index:-9999 !important;
      }
      body{ top:0 !important; }
    `;
    let st = document.getElementById('gt-kill-overlays');
    if (!st){
      st = document.createElement('style'); st.id = 'gt-kill-overlays'; st.type='text/css';
      st.appendChild(document.createTextNode(css)); document.head.appendChild(st);
    }
    const fixTop = () => { try { if (document.body && document.body.style.top) document.body.style.top = '0px'; } catch(_){} };
    window.addEventListener('load', fixTop, {once:true});
    setInterval(fixTop, 1500);
  })();

  /* --- ハンバーガー --- */
  function initMenu(){
    const btn = $('#menuBtn'), drawer = $('#menuDrawer');
    const backdrop = $('#menuBackdrop'), close = $('#menuClose');
    function set(open){
      html.classList.toggle('menu-open', open);
      if (drawer) drawer.setAttribute('aria-hidden', String(!open));
      if (btn)    btn.setAttribute('aria-expanded', String(open));
    }
    function toggle(e){ e && e.preventDefault(); set(!html.classList.contains('menu-open')); }
    if (btn){
      ['click','touchstart'].forEach(ev => btn.addEventListener(ev, toggle, {passive:false}));
      /* 稀に pointer-events: none が付く事故のガード */
      const guard = () => { if (getComputedStyle(btn).pointerEvents === 'none') btn.style.pointerEvents = 'auto'; };
      setInterval(guard, 1200);
    }
    if (backdrop) backdrop.addEventListener('click', () => set(false));
    if (close)    close.addEventListener('click', () => set(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* --- 言語ドロワー（Google公式セレクトを叩く） --- */
  function ensureGTranslateLoaded(cb){
    if (window.google?.translate?.TranslateElement) return cb();
    if (window.__GT_LOADING__){
      let t=0; const tm=setInterval(()=>{ 
        if (window.google?.translate?.TranslateElement || ++t>25){ clearInterval(tm); cb(); } 
      }, 200);
      return;
    }
    window.__GT_LOADING__ = true;
    // すでに window.googleTranslateElementInit は定義済み
    cb(); // Googleのelement.jsはindex.html側でasync読込
  }
  function initLang(){
    const btn = $('#langBtn'), drawer = $('#langDrawer');
    const backdrop = $('#langBackdrop'), close = $('#langClose');
    const list = $('#langList'), search = $('#langSearch');

    function set(open){
      html.classList.toggle('lang-open', open);
      if (drawer) drawer.setAttribute('aria-hidden', String(!open));
      if (btn)    btn.setAttribute('aria-expanded', String(open));
    }
    function doTranslate(code){
      const sel = $('#google_translate_element select.goog-te-combo'); if (!sel) return;
      sel.value = code; sel.dispatchEvent(new Event('change', {bubbles:true}));
      const exp = new Date(Date.now()+365*24*3600*1000).toUTCString();
      document.cookie = `googtrans=/auto/${code};expires=${exp};path=/`;
      document.cookie = `googtrans=/ja/${code};expires=${exp};path=/`;
      setTimeout(()=> sel.dispatchEvent(new Event('change', {bubbles:true})), 150);
    }
    function buildList(){
      ensureGTranslateLoaded(()=>{
        const sel = $('#google_translate_element select.goog-te-combo');
        if (!sel || !list) return;
        const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;
        const items = Array.from(sel.options)
          .filter(o => o.value && o.value !== 'auto')
          .map(o => {
            const code = o.value.trim();
            const name = (dn && dn.of(code.replace('_','-'))) || (o.textContent || code).trim();
            return {code, name};
          })
          .sort((a,b) => a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
        list.innerHTML = '';
        items.forEach(({code,name})=>{
          const el = document.createElement('div');
          el.className = 'ls-item'; el.setAttribute('role','option');
          el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
          el.addEventListener('click', ()=>{ doTranslate(code); set(false); });
          list.appendChild(el);
        });
        if (search){
          search.value = '';
          search.oninput = ()=>{
            const q = search.value.trim().toLowerCase();
            $$('.ls-item', list).forEach(el=>{
              const t=(el.textContent||'').toLowerCase();
              el.style.display = (!q || t.includes(q)) ? '' : 'none';
            });
          };
        }
      });
    }
    if (btn){
      ['click','touchstart'].forEach(ev => btn.addEventListener(ev, e=>{
        e.preventDefault(); set(true); buildList();
      }, {passive:false}));
      const guard = () => { if (getComputedStyle(btn).pointerEvents === 'none') btn.style.pointerEvents = 'auto'; };
      setInterval(guard, 1200);
    }
    if (backdrop) backdrop.addEventListener('click', () => set(false));
    if (close)    close.addEventListener('click', () => set(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* 起動 */
  function boot(){
    initMenu();
    initLang();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
})();
