/* ===== v20250914-shadow1 — stable minimal ===== */
/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === 本文スクロール容器（HTML無改変） === */
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

/* === ページ内リンク（スムース） === */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* === 「トップへ」 === */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    const scroller = document.getElementById('scroll-root') || window;
    scroller.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
});

/* === CTA高さ → 余白反映 === */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  const scroller = document.getElementById('scroll-root');
  (scroller || document.body).classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* === 申込ボタン === */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* === ハンバーガー === */
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

/* === メニュー自動生成 === */
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
    } else { wrap.classList.add('no-title'); }
    const ul = document.createElement('ul'); ul.className = 'menu-list';
    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;
      const li = document.createElement('li'); const a  = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{ e.preventDefault(); closeMenu(); d.open = true; d.scrollIntoView({behavior:'smooth', block:'start'}); history.pushState(null,'',`#${d.id}`); });
      li.appendChild(a); ul.appendChild(li);
    });
    wrap.appendChild(ul); frag.appendChild(wrap);
  });
  if (!groupsRoot) return;
  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
  killPlansHeading();
}
function killPlansHeading(){ if (!groupsRoot) return; groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{ if (h.textContent.trim().toLowerCase() === 'plans') h.remove(); }); }
addEventListener('DOMContentLoaded', buildMenu);
addEventListener('load', killPlansHeading);
if (groupsRoot) new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });

/* === 重複ブロック除去 === */
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

/* === CTAはbottomをJSで触らない（transform相殺のみ） === */
(function lockCtaToBottomFreeze(){
  const bar = document.querySelector('.fixed-cta') || document.querySelector('.cta-bar') || document.getElementById('ctaBar');
  if (!bar || !window.visualViewport) return;
  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const doc = document.documentElement;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
    if (maxScroll < 0) maxScroll = 0;
    const sc = (document.getElementById('scroll-root') || window);
    const y = sc.scrollY || window.scrollY || 0;
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

/* ==========================================================
   言語UI（Shadow DOM・外部タブ翻訳のみ／衝突しない・確実動作）
   ========================================================== */
(function mountLanguageShadow(){
  // 旧UI・残骸の掃除（重複ボタン/旧パネル）
  document.querySelectorAll('#lang-host, #langPanel, .lang-panel, #langFab, .lang-fab, [data-role="lang-fab"]').forEach(el=>el.remove());

  const langs = [
    ['en','English'],['zh-CN','中文(简)'],['zh-TW','中文(繁)'],['ko','한국어'],['fr','Français'],
    ['es','Español'],['de','Deutsch'],['ru','Русский'],['ar','العربية'],['hi','हिन्दी'],
    ['th','ไทย'],['vi','Tiếng Việt'],['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],
    ['pt','Português'],['it','Italiano'],['uk','Українська'],['pl','Polski'],['fil','Filipino'],['tr','Türkçe']
  ];

  const host = document.createElement('div');
  host.id = 'lang-host';
  host.style.position = 'fixed';
  host.style.zIndex   = '10010'; // メニューより上
  document.body.appendChild(host);

  const root = host.attachShadow({ mode:'open' });
  root.innerHTML = `
    <style>
      :host{ position:fixed; inset:auto auto auto auto; }
      *,*::before,*::after{ box-sizing:border-box; }
      .fab{
        position:fixed; right:12px; top:78px;
        padding:8px 12px; border-radius:12px;
        border:1px solid rgba(0,0,0,.08); background:rgba(33,37,45,.86); color:#fff;
        font:700 12px/1 system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif;
        box-shadow:0 12px 28px rgba(0,0,0,.24); cursor:pointer; backdrop-filter:saturate(140%) blur(6px);
      }
      .backdrop{ position:fixed; inset:0; background:transparent; display:none; }
      .panel{
        position:fixed; right:12px; top:84px;
        width:min(560px, 92vw); max-height:60vh; overflow:auto;
        background:#fff; color:#0b1220; border:1px solid #e5e7eb; border-radius:14px;
        box-shadow:0 24px 60px rgba(0,0,0,.22); display:none;
        font: 400 14px/1.4 system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif;
      }
      .head{ display:flex; align-items:center; justify-content:space-between; gap:8px;
             font-weight:800; padding:10px 12px; border-bottom:1px solid #e5e7eb; background:#fff; position:sticky; top:0; }
      .close{ border:1px solid #e5e7eb; background:#fff; border-radius:10px; padding:6px 10px; cursor:pointer; }
      .content{ padding:12px; }
      .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:8px; }
      .chip{
        padding:8px 10px; border-radius:10px; background:#f3f4f6; border:1px solid #e5e7eb; color:#334155;
        font:700 13px/1.2 system-ui, -apple-system, "Segoe UI", "Noto Sans JP", sans-serif;
        white-space:nowrap; cursor:pointer; text-align:center;
      }
      .show{ display:block !important; }
    </style>
    <button class="fab" type="button">Translate / 言語</button>
    <div class="backdrop" part="backdrop"></div>
    <div class="panel" part="panel" aria-label="言語 / Language">
      <div class="head">
        <div>言語 / Language</div>
        <button class="close" type="button">Close</button>
      </div>
      <div class="content">
        <div class="grid" id="grid"></div>
      </div>
    </div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const fab = $('.fab');
  const panel = $('.panel');
  const backdrop = $('.backdrop');
  const grid = $('#grid');

  const anchorBtn = document.getElementById('menuBtn');
  const placeFab = () => {
    try{
      const r = anchorBtn?.getBoundingClientRect();
      if (r) { fab.style.top = Math.round(r.bottom + 8) + 'px'; }
      else   { fab.style.top = '78px'; }
    }catch(_){ fab.style.top = '78px'; }
  };
  placeFab(); addEventListener('resize', placeFab);

  // チップ（外部タブ翻訳）
  const openTranslate = (code) => {
    const u = location.href;
    const url = `https://translate.google.com/translate?sl=ja&tl=${encodeURIComponent(code)}&u=${encodeURIComponent(u)}`;
    window.open(url, '_blank', 'noopener');
  };
  langs.forEach(([code,label])=>{
    const b = document.createElement('button');
    b.className = 'chip'; b.type = 'button'; b.textContent = label;
    b.addEventListener('click', ()=> openTranslate(code));
    grid.appendChild(b);
  });

  const openPanel = ()=>{ panel.classList.add('show'); backdrop.classList.add('show'); };
  const closePanel = ()=>{ panel.classList.remove('show'); backdrop.classList.remove('show'); };

  fab.addEventListener('click', ()=> panel.classList.contains('show') ? closePanel() : openPanel());
  backdrop.addEventListener('click', closePanel);
  root.querySelector('.close').addEventListener('click', closePanel);
})();
