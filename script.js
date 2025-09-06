/* =========================
   script.js — 全差し替え版
   ========================= */

/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* 便利参照 */
const scroller   = document.getElementById('scrollRoot') || document.scrollingElement || document.documentElement;
const ctaBar     = document.getElementById('ctaBar');
const toTopBtn   = document.getElementById('toTop');
const applyBtn   = document.getElementById('applyNow');

/* ===== CTA高さを測って本文の下余白＆スペーサを調整 ===== */
function adjustCtaLayout() {
  if (!ctaBar) return;
  const rect = ctaBar.getBoundingClientRect();
  const h = Math.ceil(rect.height);

  // CSS変数に反映（bodyのpadding-bottomで使用）
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  // スクロール末尾のスペーサ（CTAに隠れないため）
  let spacer = document.getElementById('cta-spacer');
  if (!spacer) {
    spacer = document.createElement('div');
    spacer.id = 'cta-spacer';
    // 本文の最後（スクロール対象の一番下）に置く
    (document.getElementById('scrollRoot') || document.body).appendChild(spacer);
  }
  // ほんの少しバッファを入れて、強めのラバーバンドでも被らないように
  const buffer = 28;
  spacer.style.height = (h + buffer) + 'px';
}
window.addEventListener('load', adjustCtaLayout, { passive: true });
window.addEventListener('resize', adjustCtaLayout, { passive: true });

/* ===== アンカー（#xxx）へのスムーススクロール ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  if (!id || id === '#') return;

  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();

  // ハンバーガー内からの遷移なら閉じておく
  if (document.documentElement.classList.contains('menu-open')) {
    document.documentElement.classList.remove('menu-open');
    document.getElementById('menuDrawer')?.setAttribute('aria-hidden','true');
    document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
  }

  // <details>なら自動で開く（免責セクションだけは開きっぱなしにしない運用なら外してOK）
  if (target.matches('details')) target.open = true;
  const first = target.querySelector('details');
  if (first && !first.open && target.id !== 'disclaimer') first.open = true;

  // #scrollRoot を基準にスムーススクロール
  if (scroller && typeof scroller.scrollTo === 'function') {
    // targetまでの相対位置
    const sRect = scroller.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const currentTop = scroller.scrollTop;
    const offset = tRect.top - sRect.top + currentTop;
    scroller.scrollTo({ top: offset, behavior: 'smooth' });
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  history.pushState(null, '', id);
}, { passive: false });

/* ===== 「トップへ」：#scrollRoot の先頭へ確実に戻す ===== */
toTopBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  if (scroller && typeof scroller.scrollTo === 'function') {
    scroller.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ===== 申込み：必ずフォームに飛ぶ（未設定なら警告） ===== */
applyBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー開閉 ===== */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false');  btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');   btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); }, { passive: true });

/* ===== 目次オート生成（plans見出しは非表示。小項目の特定語は除外） ===== */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

function buildMenu(){
  if (!groupsRoot) return;
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    // 見出し（h2）は plans だけ出さない
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    } else if (sec.id === 'plans') {
      wrap.classList.add('compact');
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        // #scrollRoot を基準にスクロール
        if (scroller && typeof scroller.scrollTo === 'function') {
          const sRect = scroller.getBoundingClientRect();
          const tRect = d.getBoundingClientRect();
          const offset = tRect.top - sRect.top + scroller.scrollTop;
          scroller.scrollTo({ top: offset, behavior: 'smooth' });
        } else {
          d.scrollIntoView({ behavior:'smooth', block:'start' });
        }
        history.pushState(null,'',`#${d.id}`);
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
document.addEventListener('DOMContentLoaded', buildMenu, { once: true });
