/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* ---------------------------------------------------------
   0) スクロール容器 (#scroll-root) を用意（HTMLは無改変）
   --------------------------------------------------------- */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;

  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  // CTA直前に差し込み
  if (cta) body.insertBefore(wrap, cta);
  else body.appendChild(wrap);

  // CTAとメニューUI以外を #scroll-root に移動
  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => {
    if (!keep.has(n)) wrap.appendChild(n);
  });
})();

const getScroller = () => document.getElementById('scroll-root') || document.scrollingElement || document.documentElement;
const getScrollY = () => {
  const s = getScroller();
  return s === window || s === document.documentElement ? (window.scrollY || document.documentElement.scrollTop || 0) : (s.scrollTop || 0);
};
const setScrollY = (y, behavior='auto') => {
  const s = getScroller();
  if (s === window || s === document.documentElement) {
    window.scrollTo({ top: y, behavior });
  } else if (s.scrollTo) {
    s.scrollTo({ top: y, behavior });
  } else {
    s.scrollTop = y;
  }
};
const smoothTo = (y) => {
  try { setScrollY(y, 'smooth'); }
  catch(_) {
    const start = getScrollY();
    const dist  = Math.max(0, y) - start;
    const dur = 300;
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function step(now){
      const t = Math.min(1, (now - t0) / dur);
      setScrollY(start + dist * ease(t), 'auto');
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
};
const scrollToEl = (el) => {
  if (!el) return;
  const s = getScroller();
  const sr = (s.getBoundingClientRect && s.getBoundingClientRect()) || { top: 0 };
  const tr = el.getBoundingClientRect();
  const y = (s.scrollTop || 0) + (tr.top - sr.top);
  smoothTo(Math.max(0, y));
};

/* ---------------------------------------------------------
   1) ページ内リンク（#〜） → 常に scroller でスムース
   --------------------------------------------------------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  scrollToEl(target);

  // 免責(#disclaimer) だけは自動オープンしない
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* ---------------------------------------------------------
   2) CTA「トップへ」 → 必ず scroller の先頭へ
   --------------------------------------------------------- */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  e.preventDefault();
  smoothTo(0);
});

/* ---------------------------------------------------------
   3) 固定CTAの高さ → 本文余白に反映（bottomは触らない）
   --------------------------------------------------------- */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  const scroller = document.getElementById('scroll-root');
  if (scroller) scroller.classList.add('has-cta');
  else document.body.classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ---------------------------------------------------------
   4) 申込ボタン
   --------------------------------------------------------- */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ---------------------------------------------------------
   5) ハンバーガー開閉
   --------------------------------------------------------- */
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

/* ---------------------------------------------------------
   6) メニュー（自動生成）
   --------------------------------------------------------- */
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

    // #plans は見出し(h4)を出さない
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
if (groupsRoot) {
  new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });
}

/* ---------------------------------------------------------
   7) 重複ブロック除去（免責/キャンセルを末尾に統一）
   --------------------------------------------------------- */
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

/* ---------------------------------------------------------
   8) CTAの最下端ロック（bottomは弄らず transform 相殺）
   --------------------------------------------------------- */
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

/* ---------------------------------------------------------
   9) 言語ボタン＆モーダルを自動生成＋Google翻訳UIをロード
   --------------------------------------------------------- */
(function languageUI(){
  // 9-1) スタイル（インラインで注入。CSSファイルは触らない）
  (function injectLangStyles(){
    if (document.getElementById('lang-ui-inline-style')) return;
    const css = `
    .lang-fab{
      position:fixed; top:calc(64px + var(--safe-top,0px)); right:calc(10px + var(--safe-right,0px)); z-index:10000;
      display:inline-flex; align-items:center; gap:.45rem; height:40px; padding:0 .85rem;
      border-radius:10px; background:rgba(55,65,81,.82); color:#fff;
      border:1px solid rgba(255,255,255,.10); backdrop-filter: blur(2px);
      font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,.15);
    }
    .lang-fab:hover{ opacity:.95 }
    .lang-fab .globe{ font-size:16px; line-height:1 }
    #langModal{ position:fixed; inset:0; z-index:10001; display:none; }
    #langModal.open{ display:block; }
    #langModal .backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.35); }
    #langModal .panel{
      position:absolute; top:clamp(60px, 8vh, 100px); right:10px; width:min(420px,92vw);
      background:rgba(17,24,39,.92); color:#fff; border:1px solid rgba(255,255,255,.12);
      border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,.35); padding:12px; backdrop-filter: blur(8px);
    }
    #langModal .panel h3{ margin:0 0 8px; font-size:14px; font-weight:800; letter-spacing:.01em; display:flex; justify-content:space-between; align-items:center; }
    #langModal .close{ background:transparent; border:1px solid rgba(255,255,255,.3); color:#fff; border-radius:8px; padding:4px 10px; cursor:pointer; }
    #google_translate_element{ background:#fff; border-radius:8px; padding:8px; color:#111; }
    /* 余計なGoogle表示を隠す（テキストはJSでも掃除） */
    .goog-logo-link, .goog-te-gadget span, .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame { display:none !important; }
    body { top: 0 !important; }
    `;
    const style = document.createElement('style');
    style.id = 'lang-ui-inline-style';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  // 9-2) ボタンが無ければ作る（ハンバーガーの“下”に出る）
  function ensureLangButton(){
    if (document.getElementById('siteTranslateBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'siteTranslateBtn';
    btn.className = 'lang-fab';
    btn.innerHTML = `<span class="globe">🌐</span><span>言語 / Language</span>`;
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn && menuBtn.parentNode) {
      menuBtn.insertAdjacentElement('afterend', btn);
    } else {
      document.body.appendChild(btn);
    }
  }

  // 9-3) モーダルが無ければ作る
  function ensureLangModal(){
    if (document.getElementById('langModal')) return;
    const modal = document.createElement('div');
    modal.id = 'langModal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `
      <div class="backdrop" data-close></div>
      <div class="panel" role="dialog" aria-modal="true" aria-label="Language">
        <h3>🌐 言語 / Language <button class="close" data-close>Close</button></h3>
        <div id="google_translate_element" aria-label="Google Website Translator"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 9-4) Google翻訳ウィジェットを読み込み
  function loadGoogleTranslate(cb){
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      if (typeof cb === 'function') cb();
      return;
    }
    window.googleTranslateElementInit = function(){
      try {
        new google.translate.TranslateElement({
          pageLanguage: 'ja',
          autoDisplay: false
          // includedLanguages を省略＝なるべく全言語
        }, 'google_translate_element');
      } catch(_) {}
      if (typeof cb === 'function') cb();
    };
    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  }

  // 9-5) モーダル開閉
  function openModal(){
    const m = document.getElementById('langModal');
    if (!m) return;
    m.classList.add('open');
    m.removeAttribute('aria-hidden');
    setTimeout(()=> tidyTranslator(m), 0);
  }
  function closeModal(){
    const m = document.getElementById('langModal');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden','true');
  }

  // 9-6) 不要テキストを掃除
  function tidyTranslator(root){
    if (!root) return;
    const isJunk = (t) => /^\s*(powered\s*by|google|翻訳|翻訳翻訳|\/)\s*$/i.test(t);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const trash = [];
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (isJunk(n.nodeValue || '')) trash.push(n);
    }
    trash.forEach(n => {
      const p = n.parentNode;
      n.remove();
      if (p && !/^(select|option|input|button)$/i.test(p.tagName || '') &&
          (p.textContent || '').trim() === '') p.remove();
    });
    // select 周辺の余計な <br> を間引き
    const sel = root.querySelector('select');
    if (sel) {
      let prev = sel.previousSibling;
      while (prev && prev.nodeType === 1 && prev.tagName === 'BR') { const r=prev; prev=prev.previousSibling; r.remove(); }
      let next = sel.nextSibling;
      while (next && next.nodeType === 1 && next.tagName === 'BR') { const r=next; next=next.nextSibling; r.remove(); }
    }
  }

  // 9-7) 初期化とイベント
  function initLang(){
    ensureLangButton();
    ensureLangModal();

    const btn = document.getElementById('siteTranslateBtn');
    btn?.addEventListener('click', (e)=>{
      e.preventDefault();
      ensureLangModal();
      loadGoogleTranslate(()=> {
        openModal();
      });
    });

    document.addEventListener('click', (e)=>{
      if (e.target.matches('#langModal [data-close]') || e.target.id === 'langModal') {
        e.preventDefault();
        closeModal();
      }
    });

    const m = document.getElementById('langModal');
    if (m) {
      new MutationObserver(()=> tidyTranslator(m)).observe(m, { childList:true, subtree:true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLang);
  } else {
    initLang();
  }
})();
