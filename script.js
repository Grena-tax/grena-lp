/* ===== script.js — full replace v3 ===== */

/* 1) 申込フォーム URL（変更可） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* 2) 要素取得（存在しなくても落ちないよう optional） */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* 3) CTA 高さを計測して余白を自動調整 */
function adjustCtaLayout(){
  const bar = $('#ctaBar');
  const spacer = $('#ctaSpacer');
  if (!bar || !spacer) return;

  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  spacer.style.height = `calc(${h}px + env(safe-area-inset-bottom, 0px) + 8px)`;
}
window.addEventListener('load', adjustCtaLayout, { once:true });
window.addEventListener('resize', adjustCtaLayout);
window.addEventListener('orientationchange', adjustCtaLayout);

/* 4) スムーススクロール（#page-top などページ内リンク） */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;            // 存在しないアンカーは素通し

  e.preventDefault();

  // 免責だけは自動で開かない。他は最初の details を開く
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  target.scrollIntoView({ behavior:'smooth', block:'start' });
  history.pushState(null, '', id);
});

/* 5) トップへボタン（iOS/Chrome でも確実に上へ） */
$('#toTop')?.addEventListener('click', (e) => {
  e.preventDefault();
  // scrollRoot がある場合はそこ、無ければドキュメント
  const root = document.getElementById('scrollRoot') ||
               document.scrollingElement || document.documentElement || document.body;
  root.scrollTo({ top: 0, behavior: 'smooth' });
});

/* 6) 申込みは必ずフォームに飛ぶ */
$('#applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* 7) ハンバーガーの開閉 */
const btn      = $('#menuBtn');
const drawer   = $('#menuDrawer');
const closeBtn = $('#menuClose');
const overlay  = $('#menuBackdrop');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true');  };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBtn?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* 8) 目次（自動生成） */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

function buildMenu(){
  const groupsRoot = $('#menuGroups');
  if (!groupsRoot) return;

  const sections = $$('section[id]');
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = $$('.accordion > details, :scope > details', sec);
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    // plans の h2 は表示しない（空行にしない）
    const h2 = $('h2', sec);
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans'){
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    } else {
      wrap.classList.add('compact');
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = $('summary', d);
      const t = (s?.textContent || '項目').trim();
      if (excludeTitles.some(x => t.includes(x))) return;

      if (!d.id){
        const id = `acc-${i++}-${slug(t) || 'item'}`;
        d.id = id;
      }

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({ behavior:'smooth', block:'start' });
        history.pushState(null, '', `#${d.id}`);
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

/* 9) iOS のラバーバンドで CTA が上がって見えないよう “下スペーサ” を最後に再調整 */
window.addEventListener('load', () => setTimeout(adjustCtaLayout, 50));
