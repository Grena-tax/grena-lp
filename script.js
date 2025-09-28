/* =========================================================
   App JS — SAFE FULL BUILD (scroll-root / hamburger / CTA / Translate)
   ========================================================= */
(() => {
  "use strict";

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* ---------- A. scroll-root を確実に作る（これが失敗すると全部止まる） ---------- */
  (function mountScrollRoot(){
    try{
      const body = document.body;
      const docEl = document.documentElement;
      const cta  = $('.fixed-cta, .cta-bar, #ctaBar');
      const menuBtn = $('#menuBtn');
      const menuDrawer = $('#menuDrawer');

      let wrap = $('#scroll-root');
      if (!wrap){
        wrap = document.createElement('div');
        wrap.id = 'scroll-root';
        if (cta) body.insertBefore(wrap, cta);
        else body.appendChild(wrap);
      }

      // CTA・メニューUI以外を #scroll-root に移動
      const keep = new Set([wrap, cta, menuBtn, menuDrawer]);
      Array.from(body.children).forEach(n => {
        if (!keep.has(n)) wrap.appendChild(n);
      });

      // 「JS準備OK」フラグ（CSSで overflow:hidden を有効にするトリガ）
      docEl.classList.add('js-ok');
      body.classList.add('js-ok');
    }catch(e){
      console.error('[mountScrollRoot]', e);
    }
  })();

  /* ---------- B. アンカー：スムーススクロール ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || id === '#') return;

    const target = $(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (target.id !== 'disclaimer') {
      const first = target.querySelector('details');
      if (first && !first.open) first.open = true;
    }
    history.pushState(null, '', id);
  });

  /* ---------- C. 「トップへ」 ---------- */
  $('#toTop')?.addEventListener('click', (e)=>{
    const root = $('#scroll-root');
    if (root && root.scrollTo){
      e.preventDefault();
      root.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* ---------- D. CTA高さ → 余白反映 ---------- */
  function adjustCtaPadding(){
    const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
    const h = bar ? Math.ceil(bar.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--cta-h', h + 'px');

    const scroller = $('#scroll-root');
    if (scroller) scroller.classList.add('has-cta');
    else document.body.classList.add('has-cta');
  }
  window.addEventListener('load', adjustCtaPadding);
  window.addEventListener('resize', adjustCtaPadding);

  /* ---------- E. 申込ボタン ---------- */
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';
  $('#applyNow')?.addEventListener('click', (e)=>{
    e.preventDefault();
    if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
    window.open(FORM_URL, '_blank', 'noopener');
  });

  /* ---------- F. ハンバーガー ---------- */
  const btn        = $('#menuBtn');
  const drawer     = $('#menuDrawer');
  const closeBt    = $('#menuClose');
  const overlay    = $('#menuBackdrop');
  const groupsRoot = $('#menuGroups');

  const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
  const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

  btn?.addEventListener('click', () => {
    document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
  });
  closeBt?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

  /* ---------- G. ハンバーガー内メニュー自動生成 ---------- */
  const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

  function slug(t){
    return (t||'').toLowerCase()
      .replace(/[（）()\[\]【】]/g,' ')
      .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
      .replace(/-+/g,'-').replace(/^-|-$/g,'');
  }

  function killPlansHeading(){
    if (!groupsRoot) return;
    groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
      if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
    });
  }

  function buildMenu(){
    try{
      const sections = $$('section[id]');
      const frag = document.createDocumentFragment();
      let i = 1;

      sections.forEach(sec=>{
        const details = $$('.accordion > details, :scope > details', sec);
        if (!details.length) return;

        const wrap = document.createElement('div');
        wrap.className = 'menu-group';

        const h2 = sec.querySelector('h2');
        if (h2 && sec.id !== 'plans') {
          const h4 = document.createElement('h4');
          h4.textContent = (h2.textContent || '').trim();
          wrap.appendChild(h4);
        } else {
          wrap.classList.add('no-title');
        }

        const ul = document.createElement('ul');
        ul.className = 'menu-list';

        details.forEach(d=>{
          const s = d.querySelector('summary');
          const t = s?.textContent?.trim() || '項目';
          if (excludeTitles.some(x=>t.includes(x))) return;
          if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;

          const li = document.createElement('li');
          const a  = document.createElement('a');
          a.href = `#${d.id}`;
          a.textContent = t;
          a.addEventListener('click',(e)=>{
            e.preventDefault();
            closeMenu();
            d.open = true;
            d.scrollIntoView({behavior:'smooth', block:'start'});
            history.pushState(null,'',`#${d.id}`);
          });
          li.appendChild(a);
          ul.appendChild(li);
        });

        wrap.appendChild(ul);
        frag.appendChild(wrap);
      });

      if (!groupsRoot) return;
      groupsRoot.textContent = '';
      groupsRoot.appendChild(frag);
      killPlansHeading();

      new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });
    }catch(e){
      console.error('[buildMenu]', e);
    }
  }
  window.addEventListener('DOMContentLoaded', buildMenu);
  window.addEventListener('load', buildMenu);

  /* ---------- H. 重複(免責/キャンセル)を下の #disclaimer に統一 ---------- */
  function cutOnlyBottomDup() {
    try{
      $('#site-disclaimer')?.remove();
      $$('.disclaimer').forEach(d => d.remove());
      $$('details').forEach(d=>{
        const t = d.querySelector('summary')?.textContent?.trim() || '';
        if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
      });
      const cancels = $$('details').filter(d=>{
        const t = d.querySelector('summary')?.textContent?.trim() || '';
        return /キャンセルポリシー/.test(t);
      });
      if (cancels.length > 1) {
        const keep = cancels.find(d => d.closest('#disclaimer')) || cancels[0];
        cancels.forEach(d => { if (d !== keep) d.remove(); });
      }
    }catch(e){
      console.error('[cutOnlyBottomDup]', e);
    }
  }
  document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);
  window.addEventListener('load', cutOnlyBottomDup);

  /* ---------- I. iOSラバーバンド中のCTA浮きをtransformで相殺 ---------- */
  (function lockCtaToBottomFreeze(){
    try{
      const bar = $('.fixed-cta') || $('.cta-bar') || $('#ctaBar');
      if (!bar || !window.visualViewport) return;

      let stable = 0;
      const apply = () => {
        const vv  = window.visualViewport;
        const doc = document.documentElement;
        const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

        let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
        if (maxScroll < 0) maxScroll = 0;

        const scroller = $('#scroll-root') || window;
        const y = scroller.scrollY ?? window.scrollY ?? 0;

        const isBouncingBottom = y > maxScroll + 1;
        if (!isBouncingBottom) stable = uiGap;

        const use = isBouncingBottom ? stable : uiGap;
        const tx = `translate3d(0, ${use}px, 0)`;
        if (bar.style.transform !== tx) bar.style.transform = tx;
      };

      apply();
      visualViewport.addEventListener('resize',  apply);
      visualViewport.addEventListener('scroll',  apply);
      window.addEventListener('scroll',          apply, { passive: true });
      window.addEventListener('orientationchange', () => setTimeout(apply, 50));
    }catch(e){
      console.error('[lockCtaToBottomFreeze]', e);
    }
  })();

  /* ---------- J. Language Switcher（Google翻訳） ---------- */
  (function langSwitcher(){
    if (window.__LANG_SW_INIT__) return;
    window.__LANG_SW_INIT__ = true;

    // 1) UI 生成
    if (!$('#ls-btn')){
      const b = document.createElement('button');
      b.id = 'ls-btn'; b.type='button';
      b.setAttribute('aria-label','言語を選択');
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm7.9 9h-3.38a15.2 15.2 0 0 0-1.2-5.03A8.02 8.02 0 0 1 19.9 11ZM12 4.1c.93 0 2.4 1.87 3.11 5.9H8.89c.7-4.03 2.18-5.9 3.11-5.9Zm-3.32 1A15.2 15.2 0 0 0 7.48 11H4.1a8.02 8.02 0 0 1 4.58-5.9ZM4.1 13h3.38c.27 1.86.78 3.64 1.4 5.03A8.02 8.02 0 0 1 4.1 13Zm7.9 6.9c-.93 0-2.4-1.87-3.11-5.9h6.22c-.7 4.03-2.18 5.9-3.11 5.9Zm3.32-1a15.2 15.2 0 0 0 1.2-5.03h3.38a8.02 8.02 0 0 1-4.58 5.03Z"/></svg>';
      document.body.appendChild(b);
    }
    if (!$('#ls-dlg')){
      const d = document.createElement('div');
      d.id='ls-dlg'; d.dataset.open='0';
      d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true');
      d.innerHTML = `
        <div class="ls-back" id="ls-back"></div>
        <div class="ls-panel" role="document">
          <div class="ls-head">
            <strong>Select language / 言語を選択</strong>
            <button class="ls-close" id="ls-close" aria-label="閉じる">×</button>
          </div>
          <div class="ls-body">
            <div id="ls-slot"><select class="goog-te-combo" disabled><option>Loading…</option></select></div>
            <p class="ls-hint">選ぶと即時翻訳。Original を押すと原文に戻ります。</p>
            <div style="margin-top:10px">
              <button type="button" id="ls-reset" class="ls-close" style="height:36px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;">Original / 原文</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(d);
    }
    if (!$('#google_translate_element')){
      const g = document.createElement('div');
      g.id='google_translate_element';
      Object.assign(g.style,{position:'fixed',left:'-9999px',top:'-9999px',width:'0',height:'0',overflow:'hidden',opacity:'0',pointerEvents:'none'});
      document.body.appendChild(g);
    }

    const btn = $('#ls-btn'), dlg = $('#ls-dlg');
    const closeBtn = $('#ls-close'), back = $('#ls-back'), slot = $('#ls-slot');

    const openDlg = () => (dlg.dataset.open='1');
    const closeDlg = () => (dlg.dataset.open='0');

    btn?.addEventListener('click', openDlg);
    closeBtn?.addEventListener('click', closeDlg);
    back?.addEventListener('click', closeDlg);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDlg(); });

    // スクロール中は少し控えめに
    const scroller = $('#scroll-root') || window;
    let shyTimer = null;
    scroller.addEventListener('scroll', ()=>{
      btn?.setAttribute('data-shy','1');
      clearTimeout(shyTimer);
      shyTimer = setTimeout(()=>btn?.removeAttribute('data-shy'),180);
    }, {passive:true});

    function loadGT(){
      if (window.google?.translate?.TranslateElement){ initGT(); return; }
      window.googleTranslateElementInit = initGT;
      const s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      document.head.appendChild(s);
    }
    function initGT(){
      try{
        new window.google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false}, 'google_translate_element');
      }catch(e){}
      waitAndGraft();
    }
    function graft(){
      const sel = $('#google_translate_element select.goog-te-combo');
      if (!sel) return false;
      if (!slot.contains(sel)){
        slot.textContent = ''; slot.appendChild(sel);
        $('#ls-reset')?.addEventListener('click', ()=>{
          clearGTCookies(); sel.value=''; fireChange(sel); localStorage.removeItem('lsLang'); closeDlg();
        });
        sel.addEventListener('change', ()=>{
          const v = sel.value || '';
          if (v) localStorage.setItem('lsLang', v);
          closeDlg();
        }, {passive:true});
        const saved = readSavedLang();
        if (saved && sel.value !== saved){ sel.value = saved; fireChange(sel); }
      }
      return true;
    }
    function waitAndGraft(){
      const start = Date.now(), limit = 8000;
      const t = setInterval(()=>{
        if (graft()) { clearInterval(t); return; }
        if (Date.now()-start>limit) clearInterval(t);
      }, 120);
    }
    function fireChange(el){
      const ev = document.createEvent('HTMLEvents');
      ev.initEvent('change', true, true);
      el.dispatchEvent(ev);
    }
    function clearGTCookies(){
      try{
        const kill=(n,d)=>document.cookie=`${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`+(d?`; domain=${d}`:'');
        const host = location.hostname.replace(/^www\./,'');
        kill('googtrans'); kill('googtrans','.'+host); kill('googtrans', location.hostname);
      }catch(e){}
    }
    function readSavedLang(){
      const v = localStorage.getItem('lsLang');
      if (v) return v;
      const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
      if (m && m[1]){
        const p = decodeURIComponent(m[1]).split('/');
        return p[2] || '';
      }
      return '';
    }
    function bannerFix(){ try{ document.body.style.top='0px'; }catch(e){} }
    window.addEventListener('load', bannerFix);
    setTimeout(bannerFix, 1500);

    loadGT();
  })();
})();
