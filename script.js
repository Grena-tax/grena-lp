<!-- script.js -->
<script>
(() => {
  'use strict';

  // 多重読み込み防止
  if (window.__GRN_BUILD__) return;
  window.__GRN_BUILD__ = 'R6-minimal-safe+hotfix-z';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------------------------------------------------------
   * Google翻訳のバナー/ツールチップ等によるクリック阻害を無効化
   * （UIや翻訳本文は触らない）
   * --------------------------------------------------------- */
  (function killGTSurface(){
    const css = `
      iframe.goog-te-banner-frame{ display:none !important; }
      #goog-gt-tt,
      .goog-te-spinner-pos,
      .VIpgJd-ZVi9od-ORHb-OEVmcd{
        display:none !important; pointer-events:none !important; visibility:hidden !important; z-index:-9999 !important;
      }
      body{ top:0 !important; }
    `;
    let st = document.getElementById('gt-kill-overlays');
    if (!st){
      st = document.createElement('style');
      st.id = 'gt-kill-overlays';
      st.type = 'text/css';
      st.appendChild(document.createTextNode(css));
      document.head.appendChild(st);
    }
    const fixTop = () => { try { if (document.body && document.body.style.top) document.body.style.top = '0px'; } catch(_){} };
    window.addEventListener('load', fixTop, {once:true});
    setInterval(fixTop, 1500);
  })();

  /* ---------------------------------------------------------
   * ハンバーガー（開閉のみ／UIはstyle.cssに任せる）
   * --------------------------------------------------------- */
  function initMenu(){
    const btn = $('#menuBtn');
    const drawer = $('#menuDrawer');
    const backdrop = $('#menuBackdrop');
    const close = $('#menuClose');

    function set(open){
      html.classList.toggle('menu-open', open);
      if (drawer) drawer.setAttribute('aria-hidden', String(!open));
      if (btn)    btn.setAttribute('aria-expanded', String(open));
    }
    function toggle(e){ e && e.preventDefault(); set(!html.classList.contains('menu-open')); }

    if (btn){
      ['click','touchstart'].forEach(ev => btn.addEventListener(ev, toggle, {passive:false}));
    }
    if (backdrop) backdrop.addEventListener('click', () => set(false));
    if (close)    close.addEventListener('click',    () => set(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* ---------------------------------------------------------
   * 言語ドロワー（Google公式セレクトを叩くだけ）
   * --------------------------------------------------------- */
  function ensureGTranslateLoaded(cb){
    if (window.google?.translate?.TranslateElement) return cb();
    if (window.__GT_LOADING__){
      let t=0; const tm=setInterval(()=>{
        if (window.google?.translate?.TranslateElement || ++t>25){ clearInterval(tm); cb(); }
      }, 200);
      return;
    }
    window.__GT_LOADING__ = true;
    window.googleTranslateElementInit = function(){
      try { new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element'); } catch(_){}
      cb();
    };
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true; document.head.appendChild(s);
  }

  function initLang(){
    const btn = $('#langBtn');
    const drawer = $('#langDrawer');
    const backdrop = $('#langBackdrop');
    const close = $('#langClose');
    const list = $('#langList');
    const search = $('#langSearch');

    function set(open){
      html.classList.toggle('lang-open', open);
      if (drawer) drawer.setAttribute('aria-hidden', String(!open));
      if (btn)    btn.setAttribute('aria-expanded', String(open));
    }

    function doTranslate(code){
      const sel = $('#google_translate_element select.goog-te-combo');
      if (!sel) return;
      sel.value = code;
      sel.dispatchEvent(new Event('change', {bubbles:true}));

      // cookie 併用（戻しも速く）
      const exp = new Date(Date.now()+365*24*3600*1000).toUTCString();
      document.cookie = `googtrans=/auto/${code};expires=${exp};path=/`;
      document.cookie = `googtrans=/ja/${code};expires=${exp};path=/`;

      // 翻訳差し替え後に数値パッチ（保険）
      setTimeout(runFxFix, 250);
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
          el.className = 'ls-item';
          el.setAttribute('role','option');
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
        e.preventDefault();
        set(true);
        buildList();
      }, {passive:false}));
    }
    if (backdrop) backdrop.addEventListener('click', () => set(false));
    if (close)    close.addEventListener('click',    () => set(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* ---------------------------------------------------------
   * 【Hotfix】地球儀＆ハンバーガーの“たまに効かない”を物理で潰す
   *  - クリック不能＝上に透明要素/バナーが被っているのが原因
   *  - 2つのボタンに常時 pointer-events:auto / 最高z-index を付与
   *  - レイアウトやフォントは一切変更しない
   * --------------------------------------------------------- */
  function clickZGuard(){
    const apply = el => {
      if (!el) return;
      const st = el.style;
      if (getComputedStyle(el).pointerEvents === 'none') st.pointerEvents = 'auto';
      // 最高位に固定（UI見た目はstyle.cssのまま。重なり順だけ確保）
      if ((+getComputedStyle(el).zIndex||0) < 2147483000) st.zIndex = '2147483000';
    };
    apply($('#langBtn'));
    apply($('#menuBtn'));
  }

  /* ---------------------------------------------------------
   * 「リスクと為替」：翻訳で「¥1,547, -」のように崩れた時だけ補正（保険）
   *  - HTMLの数値は正値に修正済み。これは“翻訳後の崩れ”用の最終防波堤
   * --------------------------------------------------------- */
  function runFxFix(){
    try{
      const RE = /^([¥￥]\s*\d{1,3}(?:[,，]\d{3})*)\s*,\s*(?:[\-\u2212\u2010\u2011\u2012\u2013\u2014\u2015\u30FC\uFF0D])\s*$/u;
      $$('table').forEach(tbl=>{
        const head = (tbl.tHead?.textContent || tbl.rows[0]?.textContent || '').replace(/\s+/g,'');
        if (!(head.includes('円換算額') && head.includes('損益'))) return;

        // 円換算額の列インデックス
        const row = (tbl.tHead?.rows[0] || tbl.rows[0]); if (!row) return;
        const cells = Array.from(row.cells||[]);
        const ycol = cells.findIndex(c => /円換算額/.test((c.textContent||'').replace(/\s+/g,'')));
        if (ycol < 0) return;

        Array.from(tbl.tBodies[0]?.rows || []).forEach(tr=>{
          const td = tr.cells[ycol]; if (!td) return;
          td.querySelectorAll && td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
          const before = (td.textContent||'').replace(/\u00A0/g,' ').replace(/\s+/g,' ').trim();
          const m = before.match(RE);
          if (m) td.textContent = m[1] + '000';
        });
      });
    }catch(_){}
  }

  /* ---------------------------------------------------------
   * 起動
   * --------------------------------------------------------- */
  function boot(){
    initMenu();
    initLang();
    runFxFix();
    clickZGuard();

    // 翻訳切替/DOM差し替えへの追従
    const obs = new MutationObserver(muts=>{
      for (const m of muts){
        if (m.addedNodes && m.addedNodes.length){
          setTimeout(()=>{ runFxFix(); clickZGuard(); }, 0);
          break;
        }
      }
    });
    obs.observe(document.body, {childList:true, subtree:true});

    // 念のため定期ガード（軽い）
    setInterval(clickZGuard, 1200);

    // details 開閉後に保険パッチ
    document.addEventListener('toggle', e=>{
      if (e.target.tagName === 'DETAILS' && e.target.open){
        setTimeout(()=>{ runFxFix(); clickZGuard(); }, 0);
      }
    }, true);

    // デバッグフック
    window.__grn_debug__ = { build: window.__GRN_BUILD__, fxRun: runFxFix };
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
})();
</script>
