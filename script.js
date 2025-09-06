/* ===== script.js vfull-3.1 ===== */

/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* 要素参照 */
const root = document.getElementById('scrollRoot');      // ← ここがスクロール対象
const cta  = document.getElementById('ctaBar');
const spacer = document.getElementById('ctaSpacer');

/* CTA高さ → 本文の下余白に反映（固定CTAが“上がってくる”見え方を防止） */
function adjustCtaLayout(){
  if(!cta || !root || !spacer) return;
  const h = Math.ceil(cta.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  root.style.paddingBottom = `calc(${h}px + env(safe-area-inset-bottom, 0px))`;
  spacer.style.height = `calc(${h}px + env(safe-area-inset-bottom, 0px))`;
}
window.addEventListener('load', adjustCtaLayout);
window.addEventListener('resize', adjustCtaLayout);

/* ページ内リンクは “window” ではなく scrollRoot をスムーススクロール */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return; // 存在しないアンカーは素通し

  e.preventDefault();

  // 詳細表示の自動オープン（ただし #disclaimer は開かない）
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  // scrollRoot 内の相対位置にスムーススクロール
  const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 8;
  root.scrollTo({ top, behavior: 'smooth' });

  history.pushState(null, '', id);
});

/* 「トップへ」：scrollRoot の先頭に必ず移動 */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  e.preventDefault();
  root.scrollTo({ top: 0, behavior: 'smooth' });
});

/* 申込：必ずフォームに飛ぶ（未設定なら警告） */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー：開閉＆メニュー自動生成 ===== */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer.setAttribute('aria-hidden','false');  btn.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer.setAttribute('aria-hidden','true');   btn.setAttribute('aria-expanded','false'); };

btn.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

// メニューから除外する小項目名（本文はそのまま）
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

// slug化
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

// sectionごとに、直下の details をメニュー化
function buildMenu(){
  const sections = Array.from(document.querySelectorAll('main#scrollRoot section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div'); wrap.className = 'menu-group';

    // 「plans」は見出し（h2）をメニューに出さない
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
        const top = d.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 8;
        root.scrollTo({ top, behavior:'smooth' });
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
}
document.addEventListener('DOMContentLoaded', buildMenu);
