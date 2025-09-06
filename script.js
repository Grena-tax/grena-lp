/* =========================================================
   script.js — sticky CTA 安定版（iPhone Chrome 対策）
   ========================================================= */

/* ★ 申込フォームURL（実URLをセット） */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* DOM 取得 */
const root    = document.getElementById('scrollRoot') || document.scrollingElement;
const ctaBar  = document.getElementById('ctaBar');
const toTop   = document.getElementById('toTop');

/* ===== 1) CTA 高さを実測して余白を調整 ===== */
function adjustCtaLayout(){
  if (!ctaBar) return;
  const h = Math.ceil(ctaBar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  // スペーサを末尾に用意（なければ作る）
  let spacer = document.getElementById('ctaSpacer');
  if (!spacer){
    spacer = document.createElement('div');
    spacer.id = 'ctaSpacer';
    root.appendChild(spacer);
  }
  spacer.style.height = `calc(${h}px + var(--cta-buffer))`;
}
window.addEventListener('load', adjustCtaLayout, { once:true });
window.addEventListener('resize', adjustCtaLayout);

/* ===== 2) ボタン動作 ===== */
// 申込
document.getElementById('applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

// トップへ（scrollRootの先頭へ）
toTop?.addEventListener('click', (e)=>{
  e.preventDefault();
  root.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== 3) ページ内リンクを scrollRoot でスムーススクロール ===== */
function scrollToId(id){
  const target = document.querySelector(id);
  if (!target) return;
  // details は自動で開く（ただし免責セクションは除外したい場合は条件追加）
  const firstDetails = target.matches('details') ? target : target.querySelector('details');
  if (firstDetails && !firstDetails.open) firstDetails.open = true;

  const offset = target.getBoundingClientRect().top - root.getBoundingClientRect().top;
  root.scrollTo({ top: root.scrollTop + offset - 8, behavior: 'smooth' });
  history.pushState(null, '', id);
}

document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;           // 存在しないアンカーは素通し
  e.preventDefault();
  scrollToId(id);
});

/* ===== 4) ハンバーガー開閉 ===== */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ===== 5) 目次を自動生成（plans の見出し h4 は非表示） ===== */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

function buildMenu(){
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const groupsRoot = document.getElementById('menuGroups');
  if (!groupsRoot) return;
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div'); wrap.className = 'menu-group';

    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans'){          // ← plans 見出しは出さない
      const h4 = document.createElement('h4'); h4.textContent = title; wrap.appendChild(h4);
    }else if (sec.id === 'plans'){
      wrap.classList.add('compact');
    }

    const ul = document.createElement('ul'); ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return; // 小項目をメニューから除外
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        // scrollRoot基準でスムーススクロール
        const offset = d.getBoundingClientRect().top - root.getBoundingClientRect().top;
        root.scrollTo({ top: root.scrollTop + offset - 8, behavior:'smooth' });
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
}
document.addEventListener('DOMContentLoaded', buildMenu);

/* ===== 6) iPhone Chrome の「強引な引っ張り」でCTAがせり上がるのを更に抑制 ===== */
/* overscroll-behavior でほぼ止まるが、念のためエッジ時にダミー慣性を食わせる */
(function guardRubberBand(){
  let lastY = 0;
  root.addEventListener('touchstart', (e)=>{ lastY = e.touches[0].clientY; }, {passive:true});
  root.addEventListener('touchmove', (e)=>{
    const y = e.touches[0].clientY;
    const atTop = root.scrollTop <= 0;
    const atEnd = Math.ceil(root.scrollTop + root.clientHeight) >= root.scrollHeight;

    // 上端で更に上へ・下端で更に下へ引っ張ったときは微小スクロールを与えてバウンス抑止
    if ((atTop && y > lastY) || (atEnd && y < lastY)){
      root.scrollTop += (y > lastY ? 1 : -1);
    }
    lastY = y;
  }, {passive:true});
})();
