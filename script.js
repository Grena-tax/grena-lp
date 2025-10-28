<!-- script.js（全置換） -->
<script>
(() => {
  'use strict';

  // 多重読み込み防止
  if (window.__GRN_BUILD__) return;
  window.__GRN_BUILD__ = 'R6-minimal-safe';

  /* ---------------------------------------------------------
   * ユーティリティ
   * --------------------------------------------------------- */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------------------------------------------------------
   * 0) Google翻訳のバナー/ツールチップ等のクリック阻害だけ無効化
   *    （翻訳本体は触らない：セレクトや変換には不干渉）
   * --------------------------------------------------------- */
  (function injectGTOverlayKiller(){
    // クリック阻害を起こす要素のみ pointer-events を切る
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
    // 念のため定期的に body.top を戻す
    const fixTop = () => { try { if (document.body && document.body.style.top) document.body.style.top = '0px'; } catch(_){} };
    window.addEventListener('load', fixTop, {once:true});
    setInterval(fixTop, 1500);
  })();

  /* ---------------------------------------------------------
   * 1) ハンバーガーメニュー（最低限：クリック不能対策のみ）
   *    DOM構造やスタイルは既存のまま使う
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
      // 念のためクリック不能になっていないか監視（他要素が被さっていたら一時的に pointer-events を付与）
      const guard = () => {
        const pe = getComputedStyle(btn).pointerEvents;
        if (pe === 'none') btn.style.pointerEvents = 'auto';
      };
      setInterval(guard, 1200);
    }
    if (backdrop) backdrop.addEventListener('click', () => set(false));
    if (close)    close.addEventListener('click',    () => set(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* ---------------------------------------------------------
   * 2) 言語ドロワー（Google翻訳の公式セレクトを叩くだけ）
   *    翻訳ロジックは Google に任せる。UIは既存IDだけ使用
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

      // cookie 併用で戻しも速く
      const exp = new Date(Date.now()+365*24*3600*1000).toUTCString();
      document.cookie = `googtrans=/auto/${code};expires=${exp};path=/`;
      document.cookie = `googtrans=/ja/${code};expires=${exp};path=/`;

      // iOSで戻り描画が鈍い時の軽い刺激
      setTimeout(()=> sel.dispatchEvent(new Event('change', {bubbles:true})), 150);
      // 翻訳差し替えに追従して数値パッチ再実行
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
      // 念のためクリック不能ガード
      const guard = () => {
        const pe = getComputedStyle(btn).pointerEvents;
        if (pe === 'none') btn.style.pointerEvents = 'auto';
      };
      setInterval(guard, 1200);
    }
    if (backdrop) backdrop.addEventListener('click', () => set(false));
    if (close)    close.addEventListener('click',    () => set(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* ---------------------------------------------------------
   * 3) FX表の末尾「, -」→ 「000」補正だけを実施（テーブルは触らない）
   *    - ラップしない、クラス追加しない、列幅を変えない
   * --------------------------------------------------------- */
  function runFxFix(){
    try{
      // 対象テーブル判定：ヘッダに「円換算額」と「損益」が同居
      function isFxTable(tbl){
        const head = (tbl.tHead?.textContent || tbl.rows[0]?.textContent || '').replace(/\s+/g,'');
        return head.includes('円換算額') && head.includes('損益');
      }
      const RE = /^([¥￥]\s*\d{1,3}(?:[,，]\d{3})*)\s*,\s*(?:[\-\u2212\u2010\u2011\u2012\u2013\u2014\u2015\u30FC\uFF0D])\s*$/u;

      function yenColIndex(tbl){
        const row = (tbl.tHead?.rows[0] || tbl.rows[0]); if (!row) return -1;
        const cells = Array.from(row.cells||[]);
        return cells.findIndex(c => /円換算額/.test((c.textContent||'').replace(/\s+/g,'')));
      }
      function fixCell(td){
        if (!td) return false;
        td.querySelectorAll && td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
        const before = (td.textContent || '')
          .replace(/\u00A0/g,' ')
          .replace(/\s+/g,' ')
          .trim();
        const m = before.match(RE);
        if (!m) return false;
        const after = m[1] + '000';
        if (after !== before) { td.textContent = after; return true; }
        return false;
      }

      $$('table').forEach(tbl=>{
        if (!isFxTable(tbl)) return;

        const ycol = yenColIndex(tbl);
        if (ycol < 0) return;

        const rows = Array.from(tbl.tBodies[0]?.rows || []);
        rows.forEach(tr => { fixCell(tr.cells[ycol]); });

        // 最終列の +/▲ にだけ色クラスを付与（クラス名は既存CSSに委ねる）
        const last = (tbl.tHead ? tbl.tHead.rows[0].cells.length : (tbl.rows[0]?.cells.length||1)) - 1;
        if (last >= 0){
          Array.from(tbl.tBodies[0]?.rows||[]).forEach(tr=>{
            const td = tr.cells[last]; if (!td) return;
            const t = (td.textContent||'').trim();
            td.classList.remove('fx-pos','fx-neg');
            if (/^[＋+]/.test(t)) td.classList.add('fx-pos');
            else if (/▲|−|-/.test(t)) td.classList.add('fx-neg');
          });
        }
      });
    }catch(_){}
  }

  /* ---------------------------------------------------------
   * 起動シーケンス（DOM完成後にだけ動かす）
   * --------------------------------------------------------- */
  function boot(){
    initMenu();
    initLang();
    runFxFix();

    // details 開閉や翻訳差し替えに追従
    document.addEventListener('toggle', e=>{
      if (e.target.tagName === 'DETAILS' && e.target.open){
        setTimeout(runFxFix, 0);
      }
    }, true);

    const obs = new MutationObserver(muts=>{
      for (const m of muts){
        if (m.addedNodes && m.addedNodes.length){ setTimeout(runFxFix, 0); break; }
      }
    });
    obs.observe(document.body, {childList:true, subtree:true});

    // デバッグ用フック
    window.__grn_debug__ = {
      build: window.__GRN_BUILD__,
      fxRun: runFxFix
    };
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
})();
</script>
