/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === スクロール容器 (#scroll-root) を用意（HTML無改変） === */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;
  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');
  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';
  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);
  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

const getScroller = () => document.getElementById('scroll-root') || document.scrollingElement || document.documentElement;
const getScrollY = () => {
  const s = getScroller();
  return s === window || s === document.documentElement
    ? (window.scrollY || document.documentElement.scrollTop || 0)
    : (s.scrollTop || 0);
};
const setScrollY = (y, behavior='auto') => {
  const s = getScroller();
  if (s === window || s === document.documentElement) window.scrollTo({ top:y, behavior });
  else if (s.scrollTo) s.scrollTo({ top:y, behavior });
  else s.scrollTop = y;
};
const smoothTo = (y) => {
  try { setScrollY(y, 'smooth'); }
  catch(_) {
    const start = getScrollY(), dist = Math.max(0, y) - start, dur = 280, t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = now => { const t = Math.min(1, (now - t0)/dur); setScrollY(start + dist*ease(t)); if (t<1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
};
const scrollToEl = (el) => {
  if (!el) return;
  const s = getScroller();
  const sr = (s.getBoundingClientRect && s.getBoundingClientRect()) || { top:0 };
  const tr = el.getBoundingClientRect();
  const y = (s.scrollTop || 0) + (tr.top - sr.top);
  smoothTo(Math.max(0, y));
};

/* ===== ページ内リンク（#〜） ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  scrollToEl(target);
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* ===== CTA「トップへ」 ===== */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  e.preventDefault();
  smoothTo(0);
});

/* ===== 固定CTAの高さ → 本文余白に反映 ===== */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  const scroller = document.getElementById('scroll-root');
  if (scroller) scroller.classList.add('has-cta'); else document.body.classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン ===== */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー開閉 ===== */
const btn        = document.getElementById('menuBtn');
const drawer     = document.getElementById('menuDrawer');
const closeBt    = document.getElementById('menuClose');
const overlay    = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ===== メニュー自動生成 ===== */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
function buildMenu(){
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;
  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
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
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        scrollToEl(d);
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
}
function killPlansHeading(){
  if (!groupsRoot) return;
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}
addEventListener('DOMContentLoaded', buildMenu);
addEventListener('load', killPlansHeading);
if (groupsRoot) new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });

/* ===== 免責/キャンセルの重複を末尾に統一 ===== */
function cutOnlyBottomDup() {
  document.getElementById('site-disclaimer')?.remove();
  document.querySelectorAll('details.disclaimer').forEach(d => d.remove());
  document.querySelectorAll('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });
  const cancels = Array.from(document.querySelectorAll('details')).filter(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    return /キャンセルポリシー/.test(t);
  });
  if (cancels.length > 1) {
    const keep = cancels.find(d => d.closest('#disclaimer')) || cancels[0];
    cancels.forEach(d => { if (d !== keep) d.remove(); });
  }
}
document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);
window.addEventListener('load', cutOnlyBottomDup);

/* ===== CTAの最下端ロック（transform 相殺のみ） ===== */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');
  if (!bar || !window.visualViewport) return;
  const scroller = getScroller();
  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const maxScroll = (scroller.scrollHeight - scroller.clientHeight);
    const y = getScrollY();
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const isBouncingBottom = y > maxScroll + 1;
    if (!isBouncingBottom) stable = uiGap;
    const use = isBouncingBottom ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };
  apply();
  visualViewport.addEventListener('resize',  apply);
  visualViewport.addEventListener('scroll',  apply);
  (document.getElementById('scroll-root') || window).addEventListener('scroll', apply, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* =========================================================
   言語ボタン＆パネル（Google Website Translator + フォールバック）
   ========================================================= */
(function languageUI(){
  /* スタイル（濃いめ半透明グレー／ハンバーガーの下） + フォールバックUI */
  (function injectLangStyles(){
    if (document.getElementById('lang-ui-inline-style')) return;
    const css = `
    .lang-fab{
      position:fixed; top:calc(64px + var(--safe-top,0px)); right:calc(10px + var(--safe-right,0px)); z-index:10000;
      display:inline-flex; align-items:center; gap:.45rem; height:36px; padding:0 .8rem;
      border-radius:10px; background:rgba(28,28,28,.88); color:#fff;
      border:1px solid rgba(255,255,255,.12); backdrop-filter: blur(2px);
      font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,.18);
    }
    .lang-fab:hover{ opacity:.97 }
    .lang-fab .globe{ font-size:15px; line-height:1 }

    #langPanel{
      position:fixed; top:calc(104px + var(--safe-top,0px)); right:10px; width:min(380px, 92vw);
      background:rgba(20,20,20,.94); color:#fff; border:1px solid rgba(255,255,255,.14);
      border-radius:12px; padding:12px; z-index:10001; display:none; box-shadow:0 10px 40px rgba(0,0,0,.35);
      backdrop-filter: blur(8px);
    }
    #langPanel.open{ display:block; }
    #langPanel h3{ margin:0 0 8px; font-size:14px; font-weight:800; letter-spacing:.01em; display:flex; justify-content:space-between; align-items:center; }
    #langPanel .close{ background:transparent; border:1px solid rgba(255,255,255,.35); color:#fff; border-radius:8px; padding:4px 10px; cursor:pointer; }

    #google_translate_element{ background:#fff; border-radius:8px; padding:10px; color:#111; }

    /* “Powered by / Google / 翻訳” は非表示（機能は残す） */
    #google_translate_element .goog-logo-link,
    #google_translate_element .goog-te-gadget > span { display:none !important; }
    #google_translate_element .goog-te-gadget { font-size:0 !important; line-height:0 !important; }
    #google_translate_element select.goog-te-combo{
      font-size:14px !important; line-height:1.2 !important; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb;
      box-shadow:0 1px 2px rgba(0,0,0,.04);
    }

    /* Googleの上部バナー等は非表示（体裁崩れ防止） */
    .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame { display:none !important; }
    body{ top:0 !important; }

    /* ▼フォールバック（直でGoogle翻訳に飛ばす） */
    #gt-alt{ margin-top:10px; }
    #gt-alt[hidden]{ display:none; }
    #gt-alt .row{ display:flex; gap:.5rem; align-items:center; }
    #gt-alt select{ flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; background:#fff; color:#111; }
    #gt-alt .open-btn{ padding:7px 10px; border-radius:8px; border:1px solid rgba(255,255,255,.35); background:#1f2937; color:#fff; cursor:pointer; }
    `;
    const style = document.createElement('style');
    style.id = 'lang-ui-inline-style';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  function ensureLangButton(){
    if (document.getElementById('siteTranslateBtn')) return;
    const b = document.createElement('button');
    b.id = 'siteTranslateBtn';
    b.className = 'lang-fab';
    b.innerHTML = `<span class="globe">🌐</span><span>言語 / Language</span>`;
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn && menuBtn.parentNode) menuBtn.insertAdjacentElement('afterend', b);
    else document.body.appendChild(b);
  }

  function ensureLangPanel(){
    if (document.getElementById('langPanel')) return;
    const m = document.createElement('div');
    m.id = 'langPanel';
    m.innerHTML = `
      <h3>🌐 言語 / Language <button class="close" data-close>Close</button></h3>
      <div id="google_translate_element" aria-label="Google Website Translator"></div>
      <div id="gt-alt" hidden>
        <div class="row" style="margin-top:6px">
          <select id="gt-lang">
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="ko">한국어</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
            <option value="ru">Русский</option>
            <option value="ar">العربية</option>
            <option value="hi">हिन्दी</option>
            <option value="th">ไทย</option>
            <option value="vi">Tiếng Việt</option>
            <option value="id">Bahasa Indonesia</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="pt">Português</option>
            <option value="fil">Filipino</option>
            <option value="uk">Українська</option>
            <option value="pl">Polski</option>
            <option value="it">Italiano</option>
            <option value="tr">Türkçe</option>
          </select>
          <button class="open-btn" id="gt-open">Open</button>
        </div>
        <div style="font-size:12px;opacity:.75;margin-top:6px">Opens Google Translate in a new tab.</div>
      </div>`;
    document.body.appendChild(m);

    // フォールバック：選択→Open で Google 翻訳のプロキシに飛ばす
    const openViaProxy = () => {
      const tl = m.querySelector('#gt-lang')?.value || 'en';
      const u  = location.href.replace(/#.*$/,'');
      const url = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(tl)}&u=${encodeURIComponent(u)}`;
      window.open(url, '_blank', 'noopener');
    };
    m.addEventListener('click', (e)=>{
      if (e.target && e.target.id === 'gt-open'){ e.preventDefault(); openViaProxy(); }
    });
  }

  /* Google Translate を読み込み（必要時のみ）＋失敗時フォールバック */
  function loadGoogleTranslate(cb){
    if (window.google && window.google.translate && window.google.translate.TranslateElement) { cb && cb(true); return; }

    let decided = false;
    const decide = (ok) => {
      if (decided) return;
      decided = true;
      cb && cb(ok);
    };

    window.googleTranslateElementInit = function(){
      try {
        new google.translate.TranslateElement({
          pageLanguage: 'ja',
          autoDisplay: false,
          includedLanguages: 'en,zh-CN,zh-TW,ko,fr,de,es,ru,ar,hi,th,vi,id,ms,pt,fil,uk,pl,it,tr'
        }, 'google_translate_element');
        decide(true);
      } catch(_) { decide(false); }
    };

    // 既に読み込み中なら待つ
    if (document.querySelector('script[data-gt]')) {
      setTimeout(()=>decide(!!(window.google && window.google.translate)), 2500);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true; s.defer = true; s.setAttribute('data-gt','1');
    s.onerror = () => decide(false);
    document.head.appendChild(s);

    // タイムアウト（ブロック時）
    setTimeout(()=>decide(!!(window.google && window.google.translate)), 2500);
  }

  function openPanel(ok){
    const p = document.getElementById('langPanel');
    if (!p) return;
    p.classList.add('open');
    const alt = p.querySelector('#gt-alt');
    const gadget = p.querySelector('#google_translate_element');

    if (ok && gadget && gadget.querySelector('select.goog-te-combo')) {
      alt?.setAttribute('hidden','');
    } else {
      alt?.removeAttribute('hidden'); // フォールバックを表示
    }
  }
  function closePanel(){ document.getElementById('langPanel')?.classList.remove('open'); }

  function initLang(){
    ensureLangButton();
    ensureLangPanel();

    document.getElementById('siteTranslateBtn')?.addEventListener('click', (e)=>{
      e.preventDefault();
      loadGoogleTranslate((ok)=>openPanel(ok));
    });
    document.addEventListener('click', (e)=>{
      if (e.target.matches('#langPanel [data-close]')) { e.preventDefault(); closePanel(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLang);
  else initLang();
})();
