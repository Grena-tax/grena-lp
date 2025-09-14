/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === 追加①：ページ本体をスクロール容器に移す（HTMLは無改変） === */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;

  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  // CTAより上にスクロール容器を挿入
  if (cta) body.insertBefore(wrap, cta);
  else body.appendChild(wrap);

  // CTA・メニューUI以外を全部 #scroll-root に移動
  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => {
    if (!keep.has(n)) wrap.appendChild(n);
  });
})();

/* ===== ページ内リンク（スムーススクロール） ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 免責(#disclaimer) だけは自動オープンしない
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* ===== 「トップへ」 ===== */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    // スクロール対象は #scroll-root
    const scroller = document.getElementById('scroll-root') || window;
    if (scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ===== 固定CTAの高さ → 本文余白に反映（※bottomはJSで触らない） ===== */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  // 余白を付けるのは実際にスクロールする要素（#scroll-root）
  const scroller = document.getElementById('scroll-root');
  if (scroller) scroller.classList.add('has-cta');
  else document.body.classList.add('has-cta');
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

/* ===== メニュー（ハンバーガー内）自動生成 ===== */
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

  // 念のため：どこかの古いJSが h4 "plans" を作っても即削除
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

/* ===== 重複ブロック除去（免責/キャンセルを #disclaimer だけに揃える） ===== */
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

/* ===== ここ重要：CTAの bottom を JS では一切いじらない ===== */
// 何も書かない（ラバーバンド時に誤検知で浮くのを根絶）

/* === 追加②：保険（UI縮みの追従だけtransformで相殺。bounce中は値を凍結） === */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  let stable = 0; // 直近の安定値
  const apply = () => {
    const vv  = window.visualViewport;
    const doc = document.documentElement;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
    if (maxScroll < 0) maxScroll = 0;
    const y = (document.getElementById('scroll-root') || window).scrollY || window.scrollY || 0;

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
})();

/* =========================================================
   ▼ 言語ボタン：重複一掃 → 1個だけ生成（ハンバーガー下）▼
   - 既存のGoogleウィジェット/古いFABを定期的に除去
   - クリックで translate.google.com の翻訳版を新規タブで開く
   - 元ページはリロードしない
   ========================================================= */
(function languageFabV2(){
  'use strict';
  const VER = 'lang-fab v20250914-stable';
  try { console.info('[INIT]', VER); } catch(_){}

  // 0) 強制CSS（Googleのバナー/残骸を隠す）
  (function injectKillCss(){
    if (document.getElementById('gt-kill-style')) return;
    const st = document.createElement('style');
    st.id = 'gt-kill-style';
    st.textContent = `
      .skiptranslate, .goog-te-gadget, .goog-te-banner-frame, #goog-gt-tt { display:none !important; }
      body { top: 0 !important; }
      [aria-label="Google Translate"] { display:none !important; }
    `;
    document.head.appendChild(st);
  })();

  // 1) 既存の“翻訳/言語”系UIを除去（初回＆定期）
  const obviousSelectors = [
    '#langFab', '#langPanel',
    '.goog-te-gadget', '#google_translate_element', '.skiptranslate',
    '[data-lang-fab]', '[data-gtfab]',
    'iframe.goog-te-banner-frame'
  ];
  function sweepOnce(){
    // セレクタで除去
    obviousSelectors.forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=> el.remove());
    });
    // テキスト由来・位置由来の疑似FABも除去（右上の重なり対策）
    const nodes = Array.from(document.querySelectorAll('a,button,div,span'));
    nodes.forEach(el=>{
      const t = (el.textContent || '').trim();
      if (!t) return;
      const looksLikeFab =
        /translate|言語/i.test(t) ||
        /language/i.test(t) ||
        /\b(lang|translate)\b/i.test(el.className || '') ||
        /\b(lang|translate)\b/i.test(el.id || '');
      if (!looksLikeFab) return;
      const cs = getComputedStyle(el);
      const fixedish = cs.position === 'fixed' || cs.position === 'sticky' || cs.position === 'absolute';
      if (!fixedish) return;
      const r = el.getBoundingClientRect();
      const nearTopRight = (r.top >= 0 && r.top < 160) && (window.innerWidth - r.right < 160);
      const isOur = el.id === 'langFab' || el.closest('#langPanel');
      if (nearTopRight && !isOur) {
        try { el.remove(); } catch(_){}
      }
    });
  }
  sweepOnce();
  const sweeper = setInterval(sweepOnce, 800);
  setTimeout(()=> clearInterval(sweeper), 8000); // 8秒だけ監視（遅延挿入対策）

  // 2) FAB生成（ハンバーガーの真下に自動配置）
  function placeFab(fab){
    const menuBtn = document.getElementById('menuBtn');
    let top = 64 + (window.visualViewport?.offsetTop || 0);
    let right = 10 + (window.visualViewport?.offsetLeft ? 0 : 0);
    if (menuBtn) {
      const r = menuBtn.getBoundingClientRect();
      top = Math.max(10, Math.round(r.bottom + 8));
      right = Math.max(10, Math.round(window.innerWidth - r.right));
    }
    fab.style.top = `calc(${top}px + env(safe-area-inset-top, 0px))`;
    fab.style.right = `calc(${right}px + env(safe-area-inset-right, 0px))`;
  }

  function buildFab(){
    // 既存を消す（重複防止）
    document.querySelectorAll('#langFab, [data-lang-fab]').forEach((el,i)=>{ if(i>0) el.remove(); });

    const fab = document.createElement('button');
    fab.id = 'langFab';
    fab.setAttribute('data-lang-fab','');
    fab.type = 'button';
    fab.setAttribute('aria-label','Translate / 言語');
    Object.assign(fab.style, {
      position:'fixed', zIndex: 10000,
      padding:'8px 12px', borderRadius:'12px',
      background:'rgba(17,24,39,.88)', color:'#fff',
      border:'1px solid rgba(255,255,255,.22)',
      font:'700 13px/1.2 system-ui, -apple-system, "Noto Sans JP", sans-serif',
      boxShadow:'0 10px 24px rgba(0,0,0,.25)', cursor:'pointer',
      backdropFilter:'saturate(120%) blur(4px)'
    });
    fab.textContent = 'Translate / 言語';
    document.body.appendChild(fab);
    placeFab(fab);
    return fab;
  }

  // 3) パネル（グリッド）
  function buildPanel(){
    const panel = document.createElement('div');
    panel.id = 'langPanel';
    Object.assign(panel.style, {
      position:'fixed', zIndex:10001,
      minWidth:'min(740px, 92vw)', maxWidth:'92vw',
      background:'#fff', color:'#0b1220', border:'1px solid #e5e7eb',
      borderRadius:'12px', boxShadow:'0 16px 40px rgba(0,0,0,.18)',
      padding:'12px', display:'none'
    });

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:0 0 8px;font-weight:800';
    header.innerHTML = '<span>言語 / Language</span>';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.style.cssText = 'border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:6px 8px;cursor:pointer';
    header.appendChild(close);
    panel.appendChild(header);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
    const langs = [
      ['en','English'],['zh-CN','中文(簡)'],['zh-TW','中文(繁)'],['ko','한국어'],
      ['fr','Français'],['es','Español'],['de','Deutsch'],['ru','Русский'],
      ['ar','العربية'],['hi','हिन्दी'],['th','ไทย'],['vi','Tiếng Việt'],
      ['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],['pt','Português'],
      ['it','Italiano'],['uk','Українська'],['pl','Polski'],['fil','Filipino'],
      ['tr','Türkçe']
    ];
    langs.forEach(([code, label])=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-lang', code);
      b.textContent = label;
      b.style.cssText = 'padding:10px 14px;border-radius:999px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:700;cursor:pointer';
      grid.appendChild(b);
    });
    panel.appendChild(grid);

    document.body.appendChild(panel);

    // 位置：FABの直下に寄せる
    function placePanel(){
      const fab = document.getElementById('langFab');
      if (!fab) return;
      const r = fab.getBoundingClientRect();
      panel.style.right = `calc(${Math.max(10, window.innerWidth - r.right)}px + env(safe-area-inset-right, 0px))`;
      panel.style.top   = `calc(${Math.max(10, Math.round(r.bottom + 8))}px + env(safe-area-inset-top, 0px))`;
    }
    placePanel();
    addEventListener('resize', placePanel);
    addEventListener('scroll', placePanel, { passive:true });

    // 動作
    close.addEventListener('click', ()=> panel.style.display = 'none');
    grid.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      const tl = btn.getAttribute('data-lang') || 'en';
      const u  = location.href.replace(/#.*$/,'');
      const url = `https://translate.google.com/translate?u=${encodeURIComponent(u)}&sl=auto&tl=${encodeURIComponent(tl)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      panel.style.display = 'none';
    });

    return { panel, placePanel };
  }

  const fab = buildFab();
  const { panel, placePanel } = buildPanel();
  const toggle = () => {
    if (panel.style.display === 'none') {
      placePanel();
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
  };
  fab.addEventListener('click', toggle);

  // 4) 画面再計測（回転・表示領域変動）
  addEventListener('resize', ()=> placeFab(fab));
  addEventListener('orientationchange', ()=> setTimeout(()=> placeFab(fab), 50));
  if (window.visualViewport){
    visualViewport.addEventListener('resize', ()=> placeFab(fab));
    visualViewport.addEventListener('scroll', ()=> placeFab(fab));
  }

  // 5) さらに後から湧く重複を念押しで除去
  const mo = new MutationObserver(()=>{
    const all = document.querySelectorAll('#langFab, [data-lang-fab]');
    if (all.length > 1) all.forEach((el,i)=>{ if (i>0) el.remove(); });
    sweepOnce();
  });
  mo.observe(document.body, { childList:true, subtree:true });

})();
