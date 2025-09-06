/* ====== 基本設定 ====== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

const scrollArea = document.getElementById('scrollArea');

/* ====== アンカーは #scrollArea 内でスムーススクロール ====== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();

  // スクロール先（#scrollArea基準）
  const top = target.getBoundingClientRect().top + scrollArea.scrollTop - 8;
  scrollArea.scrollTo({ top, behavior: 'smooth' });

  // #disclaimer 以外は最初の details を自動で開く
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  history.pushState(null, '', id);
});

/* 「トップへ」：#scrollArea を最上部へ */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  e.preventDefault();
  scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
});

/* CTA高さをCSSカスタムプロパティに反映 */
const adjustCtaPadding = () => {
  const bar = document.getElementById('ctaBar'); if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
window.addEventListener('load', adjustCtaPadding);
window.addEventListener('resize', adjustCtaPadding);

/* 申込：必ずフォームに飛ぶ（未設定なら警告） */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー：開閉 ===== */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer.setAttribute('aria-hidden','false');  btn.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer.setAttribute('aria-hidden','true');   btn.setAttribute('aria-expanded','false'); };

btn.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ===== メニュー自動生成 ===== */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

function buildMenu(){
  const groupsRoot = document.getElementById('menuGroups');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div'); 
    wrap.className = 'menu-group';

    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    } else if (sec.id === 'plans') {
      wrap.classList.add('compact'); // 見出し無しの見栄え調整
    }

    const ul = document.createElement('ul'); 
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary'); 
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return; // メニューからのみ除外
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`; 
      a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        const top = d.getBoundingClientRect().top + scrollArea.scrollTop - 8;
        scrollArea.scrollTo({ top, behavior:'smooth' });
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); 
      ul.appendChild(li);
    });

    wrap.appendChild(ul); 
    frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; 
  groupsRoot.appendChild(frag);

  // Safety: 旧版で作られた h4=“plans” を強制排除
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}
document.addEventListener('DOMContentLoaded', buildMenu);

/* ===== iOS慣性スクロールの小揺れ防止（任意） ===== */
scrollArea.addEventListener('touchmove',()=>{}, {passive:true});
