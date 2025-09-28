/* =========================================
   script.js — v3.2.1 (CTA lock, menu builder, gap fix)
   ========================================= */
'use strict';

/* ====== 定数 ====== */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ====== 小ユーティリティ ====== */
const slug = (t)=> (t||'').toLowerCase()
  .replace(/[（）()\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* ====== 画面固定＋スクロール容器作成 ====== */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;

  const body = document.body;
  const cta  = document.querySelector('.cta-bar, .fixed-cta, #ctaBar');
  const keep = new Set([cta]);

  // スクロール容器
  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  // 先頭に本文とUIのスペーサーを挿入（フローティングUIと被らない）
  const spacer = document.createElement('div');
  spacer.className = 'top-spacer';
  wrap.appendChild(spacer);

  // CTA より上に入れる
  cta ? body.insertBefore(wrap, cta) : body.appendChild(wrap);

  // 既存ノードを #scroll-root へ（CTAとメニュー/言語UIは除外）
  const uiIds = ['menuBtn','menuDrawer','langBtn','langDialog','ls-btn','ls-dlg'];
  Array.from(body.childNodes).forEach(n=>{
    if (n.nodeType !== 1) return;          // elementのみ
    if (keep.has(n)) return;               // CTAは除外
    if (uiIds.some(id => n.id === id || (n.querySelector && n.querySelector('#'+id)))) return;
    wrap.appendChild(n);                   // 本文を容器へ退避
  });
})();

/* ====== CTA の高さ → 本文余白へ反映 ====== */
function adjustCtaPadding(){
  const bar = document.querySelector('.cta-bar, .fixed-cta, #ctaBar');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h+'px');
  const scroller = document.getElementById('scroll-root');
  scroller && scroller.classList.add('has-cta');
}
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ====== 「トップへ」 ====== */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    const sc = document.getElementById('scroll-root') || window;
    sc.scrollTo?.({ top:0, behavior:'smooth' });
  }
});

/* ====== 申込ボタン ====== */
document.getElementById('applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ====== ハンバーガー開閉 ====== */
const btn        = document.getElementById('menuBtn');
const drawer     = document.getElementById('menuDrawer');
const closeBt    = document.getElementById('menuClose') || drawer?.querySelector('[data-close]');
const overlay    = document.getElementById('menuBackdrop') || drawer?.querySelector('.backdrop');
const groupsRoot = document.getElementById('menuGroups'); // 無ければ後で作る

const openMenu = () => {
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  setTimeout(()=> closeBt?.focus(), 0);
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
  btn?.focus();
};
btn?.addEventListener('click', ()=> document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu());
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ====== メニュー自動生成 ====== */
const EXCLUDE = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

function ensureMenuRoot(){
  if (document.getElementById('menuGroups')) return document.getElementById('menuGroups');
  if (!drawer) return null;
  const host = drawer.querySelector('.menu-body') || drawer;
  const div = document.createElement('div');
  div.id = 'menuGroups';
  host.appendChild(div);
  return div;
}

function buildMenu(){
  const host = ensureMenuRoot();
  if (!host) return;

  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    const h2 = sec.querySelector(':scope > h2');
    if (h2 && sec.id !== 'plans'){
      const h4 = document.createElement('h4');
      h4.textContent = (h2.textContent||'').trim();
      wrap.appendChild(h4);
    }else{
      wrap.classList.add('no-title');
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector(':scope > summary');
      const text = s?.textContent?.trim() || '';
      if (EXCLUDE.some(x=> text.includes(x))) return;

      if (!d.id) d.id = `acc-${i++}-${slug(text) || 'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = text;
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({ behavior:'smooth', block:'start' });
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });

    wrap.appendChild(ul);
    frag.appendChild(wrap);
  });

  host.textContent = '';
  host.appendChild(frag);
}
addEventListener('DOMContentLoaded', buildMenu);

/* ====== KYC ↔ 料金のギャップ（最終ガード） ====== */
function normalizeKycPlansGap(){
  const a = document.getElementById('corp-setup');
  const b = document.getElementById('plans');
  if (!a || !b) return;
  b.style.marginTop = '12px'; // 常に12pxで固定
}
addEventListener('load', normalizeKycPlansGap);
addEventListener('resize', normalizeKycPlansGap);

/* ====== FINAL PATCH ====== */
(function(){
  const scroller = document.getElementById('scroll-root');
  if (!scroller) return;

  /* フローティングUIは必ず<body>直下へ退避（押せなくなるのを防止） */
  ['langBtn','langDialog','menuBtn','menuDrawer','ls-btn','ls-dlg'].forEach(id=>{
    const el = document.getElementById(id);
    if (el && scroller.contains(el)) document.body.appendChild(el);
  });

  /* トップ用スペーサー（UIと本文の被り防止） */
  if (!scroller.querySelector('.top-spacer')){
    const s = document.createElement('div');
    s.className = 'top-spacer';
    scroller.prepend(s);
  }

  /* CTA 高さを計測して本文側に反映 */
  function adjustCta(){
    const bar = document.querySelector('.cta-bar, .fixed-cta, #ctaBar');
    if (!bar) return;
    const h = Math.ceil(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--cta-h', h + 'px');
    scroller.classList.add('has-cta');
  }
  window.addEventListener('load', adjustCta);
  window.addEventListener('resize', adjustCta);
})();
