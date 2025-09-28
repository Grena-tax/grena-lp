/* =========================================
   script.js — 9/13 ベース＋翻訳UI＋スクロールFIX
   ========================================= */

/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* =========================
   A) スクロール & CTA 調整
   ========================= */

/* 固定CTAの高さ → 本文余白に反映 */
const adjustCtaPadding = () => {
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* 「トップへ」 */
$('#toTop')?.addEventListener('click', (e)=>{
  const target = $('#page-top');
  if (!target) return;
  // a[href="#page-top"] のデフォ動作に任せず強制スムース
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ページ内リンク（スムーススクロール） */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (!id || id === '#') return;
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 免責(#disclaimer) だけは自動オープンしない
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* =========================
   B) 申込ボタン
   ========================= */
$('#applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* =========================
   C) ハンバーガー
   ========================= */
const btn        = $('#menuBtn');
const drawer     = $('#menuDrawer');
const closeBt    = $('#menuClose');
const overlay    = $('#menuBackdrop');
const groupsRoot = $('#menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') { closeMenu(); closeLang(); }});

/* メニュー自動生成 */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
function buildMenu(){
  const sections = $$('section[id]');
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    const h2 = sec.querySelector('h2');
    if (h2 && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = (h2.textContent || '').trim();
      wrap.appendChild(h4);
    } else {
      wrap.classList.add('no-title');
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });

    wrap.appendChild(ul);
    frag.appendChild(wrap);
  });

  if (!groupsRoot) return;
  groupsRoot.textContent = '';
  groupsRoot.appendChild(frag);
}
addEventListener('DOMContentLoaded', buildMenu);

/* 免責/キャンセルの重複除去（保険） */
function cutOnlyBottomDup() {
  $('#site-disclaimer')?.remove();
  $$('.disclaimer').forEach(d => d.remove());
  $$('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });
  const cancels = $$('details').filter(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    return /キャンセルポリシー/.test(t);
  });
  if (cancels.length > 1) {
    const keep = cancels.find(d => d.closest('#disclaimer')) || cancels[0];
    cancels.forEach(d => { if (d !== keep) d.remove(); });
  }
}
document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);

/* =========================
   D) 翻訳（Google Website Translator）
   - 公式ウィジェットを非表示で設置し、<select>だけを自前UIへ移植
   - ハンバーガーと同時開を防止
   ========================= */

const lsRoot   = $('#ls-dlg');
const lsBtn    = $('#ls-btn');
const lsBack   = $('#ls-back');
const lsClose  = $('#ls-close');
const lsSlot   = $('#ls-slot');

function openLang(){
  document.documentElement.classList.add('ls-open');
  lsRoot?.setAttribute('aria-hidden','false');
  lsBtn?.setAttribute('aria-expanded','true');
  // 片方しか開けない
  closeMenu();
}
function closeLang(){
  document.documentElement.classList.remove('ls-open');
  lsRoot?.setAttribute('aria-hidden','true');
  lsBtn?.setAttribute('aria-expanded','false');
}

lsBtn?.addEventListener('click', ()=>{
  document.documentElement.classList.contains('ls-open') ? closeLang() : openLang();
});
lsBack?.addEventListener('click', closeLang);
lsClose?.addEventListener('click', closeLang);

/* Google翻訳の初期化と<select>移設 */
function mountTranslateSelect(){
  const host = document.getElementById('google_translate_element');
  if (!host) return;

  // 公式ウィジェット内の<select>を探す
  const selects = host.querySelectorAll('select.goog-te-combo');
  let sel = selects[0];

  if (!sel) {
    // まだ生成されていない場合は少し待つ
    setTimeout(mountTranslateSelect, 200);
    return;
  }

  // 既存をクリアして移設
  lsSlot.textContent = '';
  sel.style.width = '100%';
  sel.style.height= '40px';
  sel.style.border= '1px solid #d1d5db';
  sel.style.borderRadius = '8px';
  sel.style.padding = '0 10px';
  sel.style.fontSize = '16px';
  lsSlot.appendChild(sel);
}

/* Google翻訳のローダ */
(function loadGoogleTranslate(){
  // コールバックをグローバルに置く
  window.googleTranslateElementInit = function(){
    /* 言語リストは必要十分に（必要なら拡張可） */
    new google.translate.TranslateElement({
      pageLanguage: 'ja',
      includedLanguages: 'ja,en,ko,zh-CN,zh-TW,th,vi,ru,ar,fr,de,es,it,tr,pt,hi',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
    }, 'google_translate_element');

    mountTranslateSelect();
  };

  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.defer = true;
  document.head.appendChild(s);
})();

/* =========================
   E) 安定化（iOS UI縮み対策）
   - CTAがホームインジケータに吸われても見切れないように調整
   ========================= */
(function lockCtaBottom(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    // ラバーバンドで下に弾んだ時は直前の安定値で固定
    const y = window.scrollY || 0;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - (vv.height + vv.offsetTop));
    const isBouncingBottom = y > maxScroll + 1;
    if (!isBouncingBottom) stable = uiGap;

    const use = isBouncingBottom ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize',  apply);
  visualViewport.addEventListener('scroll',  apply);
  window.addEventListener('scroll',          apply, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();
