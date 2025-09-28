/* =========================================
   script.js — FINAL (scroll-root / CTA lock / menu & language safe)
   ========================================= */
'use strict';

/* ===== 設定 ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $ = (s, root=document) => root.querySelector(s);

/* ===== 1) スクロール容器の設置（CTAを固定しつつ本文だけスクロール） ===== */
(function mountScrollRoot(){
  if ($('#scroll-root')) return;

  const body = document.body;
  const cta  = $('.fixed-cta, .cta-bar, #ctaBar');
  const keep = new Set([cta, $('#menuBtn'), $('#menuDrawer'), $('#ls-btn'), $('#ls-dlg')]);

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);

  // CTA・メニュー・言語UI 以外を #scroll-root 内へ移動
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

/* ===== 2) CTA 高さを検出して本文/メニューの下余白に反映 ===== */
function adjustCtaPadding(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  const scroller = $('#scroll-root');
  if (!bar) return;

  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  if (scroller) scroller.classList.add('has-cta'); else document.body.classList.add('has-cta');
}
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 3) iOS ラバーバンド時も CTA を最下部に固定（transform だけで追従） ===== */
(function lockCtaOnBounce(){
  const bar = $('.fixed-cta') || $('.cta-bar') || $('#ctaBar');
  if (!bar || !window.visualViewport) return;

  const scroller = $('#scroll-root') || document.documentElement;
  let frozen = 0;

  const apply = () => {
    const vv = visualViewport;
    const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const y = scroller === document.documentElement ? (window.scrollY||0) : (scroller.scrollTop||0);
    const bouncingBottom = y > maxScroll + 1;

    if (!bouncingBottom) frozen = gap;
    const use = bouncingBottom ? frozen : gap;

    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize', apply);
  visualViewport.addEventListener('scroll', apply);
  ( $('#scroll-root') || window ).addEventListener('scroll', apply, {passive:true});
  addEventListener('orientationchange', () => setTimeout(apply, 60));
})();

/* ===== 4) KYC ⇄ 料金プランの余白を確実にゼロへ（後勝ちパッチ） ===== */
(function patchPlansGap(){
  const style = document.createElement('style');
  style.textContent = `
    section#plans{ padding-top:0 !important; margin-top:0 !important; }
    section#corp-setup + section#plans{ margin-top:0 !important; }
  `;
  document.head.appendChild(style);
})();

/* ===== 5) ハンバーガー開閉（既存IDを使用） ===== */
const btn        = $('#menuBtn');
const drawer     = $('#menuDrawer');
const closeBt    = $('#menuClose');
const overlay    = $('#menuBackdrop');
const groupsRoot = $('#menuGroups');

function openMenu(){
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  setTimeout(()=>closeBt?.focus(),0);
}
function closeMenu(){
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
  btn?.focus();
}
btn?.addEventListener('click', ()=> document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu());
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });

/* ===== 6) 目次（ハンバーガー内）自動生成：最後までスクロールできるよう下余白はCSSで確保済み ===== */
(function buildMenu(){
  if (!groupsRoot) return;
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const items = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!items.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    const h2 = sec.querySelector(':scope > h2');
    if (h2) {
      const h4 = document.createElement('h4');
      h4.textContent = (h2.textContent||'').trim();
      wrap.appendChild(h4);
    }else{
      wrap.classList.add('no-title');
    }

    const ul = document.createElement('ul'); ul.className='menu-list';

    items.forEach(d=>{
      const sum = d.querySelector('summary');
      const t = sum?.textContent?.trim() || '項目';
      if (!d.id) d.id = `acc-${i++}-${t.toLowerCase().replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click', e=>{
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
})();

/* ===== 7) ページ内アンカー（#…）のスムーススクロール ===== */
document.addEventListener('click', e=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({behavior:'smooth', block:'start'});
  if (target.id !== 'disclaimer'){ const first = target.querySelector('details'); if (first && !first.open) first.open = true; }
  history.pushState(null,'',id);
});

/* ===== 8) 「トップへ」 ===== */
$('#toTop')?.addEventListener('click', e=>{
  e.preventDefault();
  const scroller = $('#scroll-root') || window;
  scroller.scrollTo?.({ top:0, behavior:'smooth' });
});

/* ===== 9) 申込ボタン ===== */
$('#applyNow')?.addEventListener('click', e=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== 10) Google 翻訳（既存 v3.6 と共存。バナーはCSSで抑止） ===== */
/* 既に v3.6 を使っているため、ここでは何もしない。クリック不能の原因は
   バナーiframeの被さりなので CSS で無効化済み（style.css参照） */
