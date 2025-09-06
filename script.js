/* =========================================
   script.js — 完全版
   ========================================= */

/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== スムーススクロール（ページ内リンク） ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (!id || id === '#') return;

  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // #disclaimer 以外は最初のdetailsを自動で開く（読みやすさ）
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  history.pushState(null, '', id);
});

/* ===== トップへ ===== */
const toTopBtn = document.getElementById('toTop');
if (toTopBtn) {
  toTopBtn.addEventListener('click', (e) => {
    // #page-top アンカーが無い環境でも確実に最上部へ
    const topEl = document.getElementById('page-top');
    if (!topEl) e.preventDefault();

    // どのブラウザでも上がるように冗長化
    const scrollTargets = [
      window,
      document.documentElement,
      document.scrollingElement || document.documentElement,
      document.body
    ];
    scrollTargets.forEach(t => {
      try {
        if (t === window && t.scrollTo) { t.scrollTo({ top: 0, behavior: 'smooth' }); }
        else if (t.scrollTo) { t.scrollTo({ top: 0, behavior: 'smooth' }); }
        else { t.scrollTop = 0; }
      } catch(_) {}
    });
  });
}

/* ===== CTA：高さ → スペーサ＆本文余白に反映 ===== */
function adjustCtaLayout() {
  const bar = document.getElementById('ctaBar');
  const spacer = document.getElementById('ctaSpacer');
  if (!bar || !spacer) return;

  const rect = bar.getBoundingClientRect();
  const h = Math.max(56, Math.ceil(rect.height));
  const cs = getComputedStyle(document.documentElement);
  const safeBottomPx = parseFloat((cs.getPropertyValue('--safe-bottom') || '0').replace('px','')) || 0;
  const buffer = 28; // もう少し被るなら 36 などに上げる

  const total = h + safeBottomPx;
  document.documentElement.style.setProperty('--cta-h', `${h}px`);
  spacer.style.height = `${total + buffer}px`;
}
window.addEventListener('load', adjustCtaLayout, { passive: true });
window.addEventListener('resize', adjustCtaLayout, { passive: true });
window.addEventListener('orientationchange', adjustCtaLayout, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') adjustCtaLayout(); });

/* ===== 申込ボタン ===== */
const apply = document.getElementById('applyNow');
if (apply) {
  apply.addEventListener('click', (e) => {
    e.preventDefault();
    if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
    window.open(FORM_URL, '_blank', 'noopener');
  });
}

/* ===== ハンバーガー：開閉＆目次自動生成 ===== */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer.setAttribute('aria-hidden','false');  btn.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer.setAttribute('aria-hidden','true');   btn.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* 目次に出さないサマリー（本文は残す） */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

/* slug */
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* 目次生成：section直下のdetailsを拾う（plans見出しはメニューに出さない） */
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
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    }

    const ul = document.createElement('ul'); ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
}
document.addEventListener('DOMContentLoaded', buildMenu);
