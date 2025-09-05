/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* =========================================================
   0) ページ本体のスクロールをラッパー #scrollArea に移す
      - body は固定。CTA は body 直下にあるので完全固定になる。
========================================================= */
function setupScrollContainer(){
  if (document.getElementById('scrollArea')) return; // 1回だけ

  const keepIds = new Set(['menuBtn','menuDrawer','menuBackdrop','menuClose','ctaBar']); // 移動しない要素
  const body = document.body;
  const wrapper = document.createElement('div');
  wrapper.id = 'scrollArea';

  // スクリプトは最後に戻す
  const scripts = [];

  Array.from(body.children).forEach(node=>{
    const id = node.id || '';
    if (node.tagName === 'SCRIPT') { scripts.push(node); return; }
    if (keepIds.has(id)) return; // そのまま残す（CTAやメニュー）
    wrapper.appendChild(node);
  });

  // CTAの直前にラッパーを差し込む（CTAが無ければ末尾）
  body.insertBefore(wrapper, document.getElementById('ctaBar') || null);
  scripts.forEach(s => body.appendChild(s)); // スクリプトを復帰
}

/* =========================================================
   1) ページ内リンク（スムーススクロール）
========================================================= */
function setupSmoothScroll(){
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    // ラッパー側がスクロールコンテナになる
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
      (document.getElementById('scrollArea') || window).scrollTo({top:0, behavior:'smooth'});
    }
  });
}

/* =========================================================
   2) 固定CTA（重なり防止：本文下余白調整）
========================================================= */
function adjustCtaPadding(){
  const bar = document.getElementById('ctaBar'); if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
}

/* =========================================================
   3) 申込ボタン
========================================================= */
function setupApply(){
  document.getElementById('applyNow')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
    window.open(FORM_URL, '_blank', 'noopener');
  });
}

/* =========================================================
   4) ハンバーガー：開閉＆メニュー自動生成
========================================================= */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
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

    const wrap = document.createElement('div'); wrap.className = 'menu-group';

    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (sec.id === 'plans') {
      wrap.classList.add('compact'); // 見出しを出さない
    } else if (title) {
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
        d.scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
}

/* =========================================================
   起動
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  setupScrollContainer();      // ← これが肝
  setupSmoothScroll();
  setupApply();
  buildMenu();
  adjustCtaPadding();
});

window.addEventListener('resize', adjustCtaPadding);
