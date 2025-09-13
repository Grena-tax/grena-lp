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
  return s === window || s === document.documentElement ? window.scrollY || document.documentElement.scrollTop || 0 : s.scrollTop || 0;
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
    // 古い環境フォールバック
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
  // 要素の表示位置を scroller 基準で算出
  const sr = (s.getBoundingClientRect && s.getBoundingClientRect()) || { top: 0, left: 0 };
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

    // スクロール下限（scroll-root が実体）
    const maxScroll = (scroller.scrollHeight - scroller.clientHeight);
    const y = getScrollY();

    // 端末UIで可視領域が縮んだ分
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
  // scroll-root のスクロールも監視
  (document.getElementById('scroll-root') || window).addEventListener('scroll', apply, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* ---------------------------------------------------------
   9) 言語ボタンの開閉を“確実化”＋不要3行の除去
   --------------------------------------------------------- */
(function languageUI(){
  // 想定されるボタン／モーダルの候補（幅広く捕捉）
  const BTN_SELECTORS = [
    '#siteTranslateBtn','#langBtn','.lang-btn','.lang-pill','.translate-badge',
    '[data-lang-btn]','[aria-label*="Translate"]','[aria-label*="言語"]'
  ];
  const MODAL_SELECTORS = [
    '#langModal','#siteLangModal','.lang-modal','[data-lang-modal]',
    '[role="dialog"][aria-label*="Translate"]','[role="dialog"][aria-label*="言語"]'
  ];

  const findBtn = () => {
    for (const s of BTN_SELECTORS) { const el = document.querySelector(s); if (el) return el; }
    const cands = Array.from(document.querySelectorAll('a,button,div[role="button"],.badge,.pill'))
      .filter(el => /translate|言語|language/i.test(el.textContent || ''));
    return cands[0] || null;
  };
  const findModal = () => {
    for (const s of MODAL_SELECTORS) { const el = document.querySelector(s); if (el) return el; }
    return null;
  };

  const openModal = () => {
    const m = findModal();
    if (!m) return; // モーダルが無ければ何もしない（HTML無改変前提）
    m.style.display = 'block';
    m.removeAttribute('aria-hidden');
    m.classList.add('open');
    // Google翻訳UIの不要行を後追いで除去
    setTimeout(() => tidyTranslator(m), 0);
  };
  const closeModal = () => {
    const m = findModal();
    if (!m) return;
    m.setAttribute('aria-hidden', 'true');
    m.classList.remove('open');
    m.style.display = 'none';
  };

  // クリックで開閉（デリゲーション）
  document.addEventListener('click', (e) => {
    if (e.target.closest(BTN_SELECTORS.join(','))) { e.preventDefault(); openModal(); return; }
    const m = findModal(); if (!m) return;
    if (e.target === m || e.target.closest('[data-close], .menu-close, .lang-close')) {
      e.preventDefault(); closeModal();
    }
  });

  // モーダル内が更新されても自動で掃除
  const m0 = findModal();
  if (m0) {
    new MutationObserver(() => tidyTranslator(m0))
      .observe(m0, { childList:true, subtree:true });
  }

  function tidyTranslator(root){
    if (!root) return;
    // 「Powered by / Google / 翻訳 / 翻訳翻訳 / /」だけ単体行で消す
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

    // select 周辺の余分な <br> を間引き
    const sel = root.querySelector('select');
    if (sel) {
      let prev = sel.previousSibling;
      while (prev && prev.nodeType === 1 && prev.tagName === 'BR') { const r=prev; prev=prev.previousSibling; r.remove(); }
      let next = sel.nextSibling;
      while (next && next.nodeType === 1 && next.tagName === 'BR') { const r=next; next=next.nextSibling; r.remove(); }
    }
  }
})();

/* === ここまで。既存デザインや本文は無改変。 === */
