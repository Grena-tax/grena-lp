/* =========================================================
   script.js — sticky CTA + 「トップへ」確実動作版
   ========================================================= */

/* 申込フォームURL */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* スクロール対象（#scrollRoot を最優先） */
const root = document.getElementById('scrollRoot') || document.scrollingElement;

/* ---------- CTAの高さを実測して本文の余白を調整 ---------- */
const ctaBar = document.getElementById('ctaBar');
function adjustCtaLayout(){
  if (!ctaBar) return;
  const h = Math.ceil(ctaBar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  let spacer = document.getElementById('ctaSpacer');
  if (!spacer){
    spacer = document.createElement('div');
    spacer.id = 'ctaSpacer';
    (document.getElementById('scrollRoot') || document.body).appendChild(spacer);
  }
  spacer.style.height = `calc(${h}px + var(--cta-buffer))`;
}
window.addEventListener('load', adjustCtaLayout, { once:true });
window.addEventListener('resize', adjustCtaLayout);

/* ---------- CTAボタン動作 ---------- */
document.getElementById('applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* 「トップへ」：#scrollRoot を最優先で先頭へ。無ければ window をスクロール */
function goTop(){
  const el = document.getElementById('scrollRoot');
  if (el){
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }else{
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}
document.getElementById('toTop')?.addEventListener('click', (e)=>{ e.preventDefault(); goTop(); });

/* ---------- ページ内リンクは root を基準にスクロール ---------- */
function scrollToId(id){
  const target = document.querySelector(id);
  if (!target) return;

  // details を自動で開く（免責を除外したい場合は条件追加）
  const first = target.matches('details') ? target : target.querySelector('details');
  if (first && !first.open) first.open = true;

  const sc = document.getElementById('scrollRoot') || document.scrollingElement;
  const offset = target.getBoundingClientRect().top - sc.getBoundingClientRect().top;
  sc.scrollTo({ top: sc.scrollTop + offset - 8, behavior: 'smooth' });
  history.pushState(null, '', id);
}
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;   // 存在しないアンカーは素通し
  e.preventDefault();
  scrollToId(id);
});

/* ---------- ハンバーガー ---------- */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

/* ---------- 目次自動生成（plans の見出しは非表示） ---------- */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

function buildMenu(){
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const groupsRoot = document.getElementById('menuGroups');
  if (!groupsRoot) return;
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div'); wrap.className = 'menu-group';

    const h2 = sec.querySelector('h2'); const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans'){
      const h4 = document.createElement('h4'); h4.textContent = title; wrap.appendChild(h4);
    } else if (sec.id === 'plans'){ wrap.classList.add('compact'); }

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
        const sc = document.getElementById('scrollRoot') || document.scrollingElement;
        const off = d.getBoundingClientRect().top - sc.getBoundingClientRect().top;
        sc.scrollTo({ top: sc.scrollTop + off - 8, behavior:'smooth' });
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
}
document.addEventListener('DOMContentLoaded', buildMenu);

/* ---------- iPhone Chrome の強引な引っ張り対策（最終保険） ---------- */
(function guardRubberBand(){
  const sc = document.getElementById('scrollRoot');
  if (!sc) return;
  let lastY = 0;
  sc.addEventListener('touchstart', (e)=>{ lastY = e.touches[0].clientY; }, {passive:true});
  sc.addEventListener('touchmove', (e)=>{
    const y = e.touches[0].clientY;
    const atTop = sc.scrollTop <= 0;
    const atEnd = Math.ceil(sc.scrollTop + sc.clientHeight) >= sc.scrollHeight;
    if ((atTop && y > lastY) || (atEnd && y < lastY)){ sc.scrollTop += (y > lastY ? 1 : -1); }
    lastY = y;
  }, {passive:true});
})();
