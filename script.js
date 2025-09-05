/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* =========================
   基本ナビ（ページ内リンク）
========================= */
// ページ内リンクだけスムーススクロール（存在しないアンカーは素通し）
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
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

// 「トップへ」：アンカーが無くても確実に上へ
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    window.scrollTo({top:0, behavior:'smooth'});
  }
});

/* =========================
   固定CTA（重なり防止）
========================= */
// CTAの高さを本文余白に反映（重なり防止）
const adjustCtaPadding = () => {
  const bar = document.getElementById('ctaBar'); if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
window.addEventListener('load', adjustCtaPadding);
window.addEventListener('resize', adjustCtaPadding);

// 申込：必ずフォームに飛ぶ（未設定なら警告）
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

// メニューには出さない titles（本文は残す）
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

// slug化
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

// sectionごとに、直下の details をメニュー化（本文は無改変）
function buildMenu(){
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    // plans は見出し（h4）をメニューに出さない（間隔用クラスは付与）
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (sec.id === 'plans') {
      wrap.classList.add('compact'); // CSSで余白を整える用
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
   iPhoneの「末端バウンド」を抑止して
   CTAが“上にせり上がらない”よう固定
========================= */
/* ポイント：
   - スクロール先頭/末尾でのラバーバンド（ゴムスク）を止める
   - これにより fixed のCTAが上に浮かず、常に画面下端にピタッと固定される
*/
(function(){
  let startY = 0;

  // タッチ開始位置だけ取る（パッシブでOK）
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length) startY = e.touches[0].clientY;
  }, { passive: true });

  // 末尾でさらに下へ、先頭でさらに上へ…の“行き過ぎ”だけ止める
  window.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches.length) return;
    const y = e.touches[0].clientY;
    const deltaY = startY - y; // >0: 下方向へスクロールしようとしている

    const doc = document.documentElement;
    const atTop    = window.scrollY <= 0;
    const atBottom = window.innerHeight + window.scrollY >= (doc.scrollHeight - 1);

    // 先頭で上スクロール（deltaY<0）、末尾で下スクロール（deltaY>0）を阻止
    if ((atTop && deltaY < 0) || (atBottom && deltaY > 0)) {
      e.preventDefault(); // ← iOSのラバーバンドを無効化
    }
  }, { passive: false });
})()
