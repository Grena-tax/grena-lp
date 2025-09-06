/* ===== 固定設定 ===== */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

const scrollRoot = document.getElementById('scrollRoot');

/* ===== 1) ページ内リンクは scrollRoot をスムーススクロール ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();

  // details は自動で開いてから移動
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  // 近いスクロールコンテナへ
  const root = scrollRoot || document.scrollingElement;
  const top = target.getBoundingClientRect().top + root.scrollTop - 12;
  root.scrollTo({ top, behavior: 'smooth' });

  history.pushState(null, '', id);
});

/* 「トップへ」 */
document.getElementById('toTop')?.addEventListener('click', (e) => {
  e.preventDefault();
  const root = scrollRoot || document.scrollingElement;
  root.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== 2) CTAの高さを本文余白に反映（重なり防止） ===== */
function adjustCtaPadding() {
  const bar = document.getElementById('ctaBar');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
}
window.addEventListener('load', adjustCtaPadding);
window.addEventListener('resize', adjustCtaPadding);

/* 申込：必ずフォームに飛ぶ（未設定なら警告） */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== 3) ハンバーガー：開閉＆メニュー自動生成 ===== */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => {
  document.documentElement.classList.add('menu-open');
  drawer.setAttribute('aria-hidden','false');
  btn.setAttribute('aria-expanded','true');
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer.setAttribute('aria-hidden','true');
  btn.setAttribute('aria-expanded','false');
};

btn?.addEventListener('click', () => {
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
});
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* メニューに出さない titles（本文は残す） */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

/* slug化 */
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* section直下のdetailsをメニュー化（plansのh2は非表示） */
function buildMenu(){
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div'); wrap.className = 'menu-group';

    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {           // ★ plansは見出しを出さない
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    }

    const ul = document.createElement('ul'); ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return; // 小項目は除外
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        const root = scrollRoot || document.scrollingElement;
        const top = d.getBoundingClientRect().top + root.scrollTop - 12;
        root.scrollTo({ top, behavior:'smooth' });
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);

  // 旧版で出てしまった「plans」見出しを念のため除去
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}
document.addEventListener('DOMContentLoaded', buildMenu);

/* ===== 4) iOS系での“せり上がり”抑止を最後にもう一押し ===== */
document.addEventListener('touchmove', ()=>{}, {passive:true}); // 一部WebViewの挙動安定化
