/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* =========================
   ページ内リンク（スムーススクロール）
========================= */
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

// 「トップへ」
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    window.scrollTo({top:0, behavior:'smooth'});
  }
});

/* =========================
   固定CTA（重なり防止）
========================= */
const adjustCtaPadding = () => {
  const bar = document.getElementById('ctaBar'); if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
window.addEventListener('load', adjustCtaPadding);
window.addEventListener('resize', adjustCtaPadding);

document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* =========================
   ハンバーガー：開閉＆メニュー自動生成
========================= */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => {
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
};

btn?.addEventListener('click', () => {
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
});
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

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
    const title = (h2?.textContent || '').trim();
    if (sec.id === 'plans') {
      wrap.classList.add('compact'); // 見出しなし用の余白調整
    } else if (title) {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    }

    const ul = document.createElement('ul'); ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return; // メニューからのみ除外
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

/* =========================
   iPhoneの“ラバーバンド（バウンド）”を完全抑止
   ─ CTAが上へせり上がらないようにする
========================= */
(function stopRubberBand(){
  const el = document.scrollingElement || document.documentElement;
  let startY = 0, startX = 0;

  const onStart = (e)=>{
    if (e.touches && e.touches.length) {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    }
  };

  const onMove = (e)=>{
    if (!e.touches || !e.touches.length) return;
    const y = e.touches[0].clientY;
    const x = e.touches[0].clientX;
    const dy = startY - y;
    const dx = startX - x;

    // 水平スクロールの誤判定は素通し
    if (Math.abs(dx) > Math.abs(dy)) return;

    const atTop    = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    // 先頭で上スクロール、末尾で下スクロールの「行き過ぎ」を抑止
    if ((atTop && dy < 0) || (atBottom && dy > 0)) {
      e.preventDefault();
    }
  };

  // window & document 両方に非パッシブで登録（iOS対策）
  window.addEventListener('touchstart', onStart, {passive:false});
  window.addEventListener('touchmove',  onMove,  {passive:false});
  document.addEventListener('touchstart', onStart, {passive:false});
  document.addEventListener('touchmove',  onMove,  {passive:false});
})();
