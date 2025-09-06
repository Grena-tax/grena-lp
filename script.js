/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ========= アンカー移動は #scrollRoot でスムーススクロール ========= */
(function localSmoothScroll(){
  const root = document.getElementById('scrollRoot');
  if (!root) return;

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute('href');
    // ここがポイント：#page-top は専用処理に流す
    if (id === '#page-top') {
      e.preventDefault();
      root.scrollTo({ top: 0, behavior: 'smooth' });
      history.pushState(null, '', id);
      return; // 以降の処理で上書きしない
    }

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();

    // #disclaimer だけは自動で開かない（他は先頭detailsを開く）
    if (target.id !== 'disclaimer') {
      const first = target.querySelector('details');
      if (first && !first.open) first.open = true;
    }

    // 位置計算を #scrollRoot 基準で厳密に
    const top = root.scrollTop + (target.getBoundingClientRect().top - root.getBoundingClientRect().top);
    root.scrollTo({ top, behavior: 'smooth' });
    history.pushState(null, '', id);
  });
})();

/* ========= 「トップへ」は #scrollRoot の先頭に移動（上書き防止） ========= */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  const root = document.getElementById('scrollRoot');
  if (!root) return;
  e.preventDefault();
  // 重要：グローバルのアンカー処理にバブルさせない
  e.stopImmediatePropagation();
  root.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ========= 申込：必ずフォームに飛ぶ（未設定なら警告） ========= */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ========= 固定CTAの高さを測って本文余白＆スペーサを自動調整 ========= */
(function adjustCtaLayout(){
  const bar   = document.getElementById('ctaBar');
  const root  = document.getElementById('scrollRoot');
  const space = document.getElementById('ctaSpacer');
  if (!bar || !root || !space) return;

  const apply = () => {
    const h   = Math.ceil(bar.getBoundingClientRect().height);
    const buf = 28; // まだ被るなら 36〜44 に上げる
    root.style.paddingBottom = (h + buf) + 'px';
    space.style.height       = (h + buf) + 'px';
    document.documentElement.style.setProperty('--cta-h', h + 'px');
  };

  ['load','resize','orientationchange'].forEach(ev => window.addEventListener(ev, apply));
  if (window.visualViewport){
    ['resize','scroll'].forEach(ev => visualViewport.addEventListener(ev, apply));
  }
  apply(); setTimeout(apply, 150); setTimeout(apply, 400);
})();

/* ========= ハンバーガー：開閉＆メニュー自動生成 ========= */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer.setAttribute('aria-hidden','false');  btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer.setAttribute('aria-hidden','true');   btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

// メニューから除外する小見出し（本文は残す）
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

    const wrap = document.createElement('div'); wrap.className = 'menu-group';
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {
      const h4 = document.createElement('h4'); h4.textContent = title; wrap.appendChild(h4);
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
        const root = document.getElementById('scrollRoot');
        const top = root.scrollTop + (d.getBoundingClientRect().top - root.getBoundingClientRect().top);
        root.scrollTo({behavior:'smooth', top});
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
}
document.addEventListener('DOMContentLoaded', buildMenu);
