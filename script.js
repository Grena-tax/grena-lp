// app.js（完全版・そのまま保存）

/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ========== 1) スクロールを scrollRoot に限定（ラバーバンド防止） ========== */
const scrollRoot = document.getElementById('scrollRoot');
(function rubberbandKiller(root){
  if(!root) return;
  let startY = 0, startX = 0;
  root.addEventListener('touchstart', (e)=>{ 
    if(!e.touches || !e.touches.length) return;
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
  }, {passive:true});
  root.addEventListener('touchmove', (e)=>{
    const el = root;
    const atTop = el.scrollTop <= 0;
    const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
    const dy = e.touches[0].clientY - startY;
    const dx = e.touches[0].clientX - startX;
    if (Math.abs(dy) > Math.abs(dx)) {
      if ((atTop && dy > 0) || (atBottom && dy < 0)) {
        e.preventDefault(); // ← 余分なバウンスを止める
      }
    }
  }, {passive:false});
})(scrollRoot);

/* ========== 2) 内部リンクは scrollRoot 内へスムーススクロール ========== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id === '#') return;
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // #disclaimer だけは自動で開かない
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  history.pushState(null, '', id);
});

/* 「トップへ」：scrollRoot を確実に最上部へ */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  e.preventDefault();
  scrollRoot?.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null,'','#page-top');
});

/* ========== 3) CTAの高さを本文余白に反映（重なり防止） ========== */
const adjustCtaLayout = () => {
  const bar = document.getElementById('ctaBar'); if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  const spacer = document.getElementById('bottomSpacer');
  if (spacer) spacer.style.height = (h + 28) + 'px'; // 28pxのバッファ
};
window.addEventListener('load', adjustCtaLayout);
window.addEventListener('resize', adjustCtaLayout);

/* 申込：必ずフォームに飛ぶ（未設定なら警告） */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ========== 4) ハンバーガー：開閉＆メニュー自動生成 ========== */
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

// メニューには出さない titles（本文は残す）
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

// slug化
const slug = (t) => (t||'').toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

// sectionごとに、直下のdetailsをメニュー化（本文は無改変）
function buildMenu(){
  if(!groupsRoot) return;
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div'); 
    wrap.className = 'menu-group';

    // plans は見出し非表示（h2があっても出さない）
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    } else if (sec.id === 'plans') {
      wrap.classList.add('compact');
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
        d.scrollIntoView({behavior:'smooth', block:'start'});
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
}
document.addEventListener('DOMContentLoaded', buildMenu);

/* ========== 5) 画像などの遅延・その他（必要なら） ========== */
// 今回は未使用（拡張用フック）
