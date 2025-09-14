/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === ページ内リンク（スムーススクロール） === */
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* === 固定CTAの高さ → 本文余白に反映（bottom は JS で触らない） === */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  document.body.classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* === 申込ボタン === */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* === ハンバーガー開閉 === */
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

/* === メニュー自動生成（#plans 見出しは非表示） === */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
function buildMenu(){
  if (!groupsRoot) return;
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;
  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;
    const wrap = document.createElement('div'); wrap.className = 'menu-group';
    const h2 = sec.querySelector('h2');
    if (h2 && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = (h2.textContent || '').trim();
      wrap.appendChild(h4);
    } else { wrap.classList.add('no-title'); }
    const ul = document.createElement('ul'); ul.className = 'menu-list';
    details.forEach(d=>{
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault(); closeMenu(); d.open = true;
        d.scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });
    wrap.appendChild(ul); frag.appendChild(wrap);
  });
  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
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

/* === 重複ブロック除去（免責/キャンセル整頓） === */
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

/* === CTA の transform だけ相殺（bottom は触らない） === */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');
  if (!bar || !window.visualViewport) return;
  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const doc = document.documentElement;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
    if (maxScroll < 0) maxScroll = 0;
    const y = window.scrollY || 0;
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

/* === 言語ボタン：重複除去→1個だけ生成。Google本体は使わず新規タブで翻訳 === */
(function languageFabSafe(){
  const VER = 'lang-fab safe';
  try { console.info('[INIT]', VER); } catch(_){}

  // 既存/過去の“言語/Translate”ボタンを除去（右上近傍のみ）
  function sweep(){
    const nodes = Array.from(document.querySelectorAll('a,button,div'));
    nodes.forEach(el=>{
      if (el.id === 'langFab') return;
      const t = (el.textContent||'').trim();
      const hasKW = /translate|言語|language/i.test(t) ||
                    /\b(lang|translate)\b/i.test(el.className||'') ||
                    /\b(lang|translate)\b/i.test(el.id||'');
      if (!hasKW) return;
      const cs = getComputedStyle(el);
      const fixedish = /fixed|absolute|sticky/.test(cs.position);
      if (!fixedish) return;
      const r = el.getBoundingClientRect();
      const nearTopRight = r.top >= 0 && r.top < 200 && (innerWidth - r.right) < 220;
      if (nearTopRight) try { el.remove(); } catch(_){}
    });
  }
  sweep(); setTimeout(sweep, 500); setTimeout(sweep, 1500);

  // FAB
  const fab = document.createElement('button');
  fab.id = 'langFab';
  fab.type = 'button';
  fab.textContent = 'Translate / 言語';
  fab.style.cssText = `
    position:fixed; z-index:10000; top:calc(60px + env(safe-area-inset-top,0)); right:calc(10px + env(safe-area-inset-right,0));
    padding:8px 12px; border-radius:12px; background:rgba(17,24,39,.88); color:#fff;
    border:1px solid rgba(255,255,255,.22); font:700 13px/1.2 system-ui,-apple-system,"Noto Sans JP",sans-serif;
    box-shadow:0 10px 24px rgba(0,0,0,.25); cursor:pointer; backdrop-filter:saturate(120%) blur(4px);
  `;
  document.body.appendChild(fab);

  // パネル
  const panel = document.createElement('div');
  panel.style.cssText = `
    position:fixed; z-index:10001; display:none; background:#fff; color:#0b1220;
    border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 16px 40px rgba(0,0,0,.18);
    padding:12px; min-width:min(740px,92vw); max-width:92vw;
  `;
  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:0 0 8px;font-weight:800';
  head.innerHTML = '<span>言語 / Language</span>';
  const close = document.createElement('button');
  close.textContent = 'Close';
  close.style.cssText = 'border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:6px 8px;cursor:pointer';
  head.appendChild(close); panel.appendChild(head);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
  ([
    ['en','English'],['zh-CN','中文(簡)'],['zh-TW','中文(繁)'],['ko','한국어'],
    ['fr','Français'],['es','Español'],['de','Deutsch'],['ru','Русский'],
    ['ar','العربية'],['hi','हिन्दी'],['th','ไทย'],['vi','Tiếng Việt'],
    ['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],['pt','Português'],
    ['it','Italiano'],['uk','Українська'],['pl','Polski'],['fil','Filipino'],['tr','Türkçe']
  ]).forEach(([code,label])=>{
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label; b.dataset.lang = code;
    b.style.cssText = 'padding:10px 14px;border-radius:999px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:700;cursor:pointer';
    grid.appendChild(b);
  });
  panel.appendChild(grid); document.body.appendChild(panel);

  function place(){
    const r = fab.getBoundingClientRect();
    panel.style.right = `calc(${Math.max(10, innerWidth - r.right)}px + env(safe-area-inset-right, 0px))`;
    panel.style.top   = `calc(${Math.max(10, Math.round(r.bottom + 8))}px + env(safe-area-inset-top, 0px))`;
  }
  const toggle = () => { place(); panel.style.display = (panel.style.display==='none'?'block':'none'); };
  fab.addEventListener('click', toggle);
  close.addEventListener('click', ()=> panel.style.display='none');
  addEventListener('resize', place, { passive:true }); addEventListener('scroll', place, { passive:true });

  grid.addEventListener('click', (e)=>{
    const t = e.target.closest('button[data-lang]'); if (!t) return;
    const tl = t.dataset.lang || 'en';
    const u  = location.href.replace(/#.*$/,'');
    window.open(`https://translate.google.com/translate?u=${encodeURIComponent(u)}&sl=auto&tl=${encodeURIComponent(tl)}`, '_blank', 'noopener,noreferrer');
    panel.style.display = 'none';
  });
})();
