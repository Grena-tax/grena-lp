/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* =========================
   A. ページ内リンクのスムーススクロール
========================= */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // #disclaimer だけは自動で開かない（開きっぱなし防止）
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  history.pushState(null, '', id);
});

// 「トップへ」：アンカーが無くても確実に上へ
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); }
});

/* =========================
   B. 固定CTAの高さ → 本文余白＆スペーサに反映
========================= */
function adjustCtaLayout(){
  const bar = document.getElementById('ctaBar');
  const spacer = document.getElementById('ctaSpacer');
  if (!bar || !spacer) return;

  const h = Math.ceil(bar.getBoundingClientRect().height);
  // グローバルCSS変数に反映
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  // せり上がり抑止のバッファ（必要なら数値を増やしてください）
  const buffer = 28; // ←気になるなら 36 などに変更
  document.documentElement.style.setProperty('--cta-buffer', buffer + 'px');

  // スペーサ高さはCSSのcalcに任せるが、念のため再描画
  spacer.style.minHeight = `calc(var(--cta-h) + var(--safe-bottom) + ${buffer}px)`;
}
window.addEventListener('load', adjustCtaLayout);
window.addEventListener('resize', adjustCtaLayout);
window.addEventListener('orientationchange', adjustCtaLayout);

/* 申込：必ずフォームに飛ぶ（未設定なら警告） */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* =========================
   C. ハンバーガー：開閉＆メニュー自動生成
========================= */
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

// 目次から除外したい小項目（本文は残す）
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

// slug化（IDに使う）
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

    // plans は見出し（h4）をメニューに出さない
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    }else if(sec.id === 'plans'){
      // 見出しを出さない分、余白を詰める
      wrap.classList.add('compact');
    }

    const ul = document.createElement('ul'); ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return; // 小項目はメニューから除外（本文は残す）
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

  // Safety: 旧版で作られた h4="plans" を強制排除（保険）
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}
document.addEventListener('DOMContentLoaded', buildMenu);
