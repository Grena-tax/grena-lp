/* =========================================================
   script.js — 完全版（アンカー/Top/CTA高さ/ハンバーガー/目次生成）
   ========================================================= */

/* 申込フォームURL */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ルートスクロール要素（#scrollRoot が無い場合でも動く） */
const root = document.getElementById('scrollRoot') ||
             document.scrollingElement || document.documentElement;

/* ---------------- アンカー & トップへ（scrollRoot対応） ---------------- */
(function setupAnchors(){
  // 「トップへ」
  document.getElementById('toTop')?.addEventListener('click', (e)=>{
    e.preventDefault();
    root.scrollTo({ top:0, behavior:'smooth' });
  });

  // ページ内リンク
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute('href');
    if (!id || id === '#') return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();

    const rootTop = (root === document.documentElement)
      ? (window.pageYOffset || document.documentElement.scrollTop)
      : root.scrollTop;

    const y = target.getBoundingClientRect().top + rootTop - 8;
    root.scrollTo({ top:y, behavior:'smooth' });

    if (target.id !== 'disclaimer') {
      const d = target.querySelector('details');
      if (d && !d.open) d.open = true;
    }
    history.pushState(null,'',id);
  });
})();

/* ---------------- 申込ボタン ---------------- */
document.getElementById('applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL,'_blank','noopener');
});

/* ---------------- 固定CTAの高さ反映（本文の下余白を自動調整） ---------------- */
(function ctaLayout(){
  const bar = document.getElementById('ctaBar');
  let spacer; // 末尾に挿入する見えないスペーサ

  function adjustCtaLayout(){
    if (!bar) return;
    const h = Math.ceil(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--cta-h', h + 'px');

    // 本文末尾にスペーサ（CTA重なり防止）
    if (!spacer){
      spacer = document.createElement('div');
      spacer.setAttribute('data-cta-spacer','');
      spacer.style.height = '0px';
      spacer.style.pointerEvents = 'none';
      document.querySelector('#scrollRoot')?.appendChild(spacer);
    }
    const buffer = 28; // 被りが気になる場合は 36 などに調整
    spacer.style.height = (h + buffer) + 'px';
  }

  window.addEventListener('load', adjustCtaLayout);
  window.addEventListener('resize', adjustCtaLayout);
  window.addEventListener('orientationchange', adjustCtaLayout);
  setTimeout(adjustCtaLayout, 100); // 遅延計測の保険
})();

/* ---------------- ハンバーガー（開閉） ---------------- */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');

function openMenu(){  document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); }
function closeMenu(){ document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); }

btn?.addEventListener('click', ()=>{ document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeMenu(); });

/* ---------------- 目次の自動生成 ---------------- */
(function buildMenu(){
  const groupsRoot = document.getElementById('menuGroups');
  if (!groupsRoot) return;

  // メニューから除外する「小項目」タイトル
  const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

  const slug = (t)=> t.toLowerCase()
    .replace(/[（）()［\[\]【】]/g,' ')
    .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
    .replace(/-+/g,'-').replace(/^-|-$/g,'');

  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    // plans セクションは見出し（h4）を表示しない
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans'){
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    }else if (sec.id === 'plans'){
      wrap.classList.add('compact');
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;  // 小項目の除外
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;

      a.addEventListener('click', (e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        const rectTop = d.getBoundingClientRect().top +
                        ((root===document.documentElement)? (window.pageYOffset||document.documentElement.scrollTop) : root.scrollTop);
        root.scrollTo({ top: rectTop - 8, behavior:'smooth' });
        history.pushState(null,'',`#${d.id}`);
      });

      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
})();
