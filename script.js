/* =========================================
   script.js — SAFE consolidated
   ========================================= */

/* ====== 設定（申込フォームURL） ====== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ====== Smooth scroll for anchor links ====== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* 「トップへ」 */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  const top = document.getElementById('page-top');
  if (!top) return;
  e.preventDefault();
  top.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ====== CTA 高さを CSS 変数へ反映 ====== */
function adjustCtaPadding(){
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
}
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ====== 申込ボタン ====== */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ====== ハンバーガー開閉 ====== */
const btn        = document.getElementById('menuBtn');
const drawer     = document.getElementById('menuDrawer');
const closeBt    = document.getElementById('menuClose');
const overlay    = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ====== メニュー（ハンバーガー内）自動生成 ====== */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
function slug(t){ return (t||'').toLowerCase().replace(/[（）()\[\]【】]/g,' ').replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-').replace(/-+/g,'-').replace(/-$/,'').replace(/^-/,''); }

function buildMenu(){
  const sections = Array.from(document.querySelectorAll('section[id]'));
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

/* ====== 免責の重複ブロック除去（安全） ====== */
function cutOnlyBottomDup() {
  document.getElementById('site-disclaimer')?.remove();
  document.querySelectorAll('details.disclaimer').forEach(d => d.remove());
  document.querySelectorAll('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });
  const cancels = Array.from(document.querySelectorAll('details')).filter(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    return /キャンセルポリシー/.test(t);
  });
  if (cancels.length > 1) {
    const keep = cancels.find(d => d.closest('#disclaimer')) || cancels[0];
    cancels.forEach(d => { if (d !== keep) d.remove(); });
  }
}
document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);
window.addEventListener('load', cutOnlyBottomDup);

/* ====== CTAをiOSのUI縮みに同期（bottomはCSS固定のまま、transformで相殺） ====== */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
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

/* =========================================
   Language Switcher（Google Translate）
   ========================================= */
const lsBtn   = document.getElementById('ls-btn');
const lsDlg   = document.getElementById('ls-dlg');
const lsBack  = document.getElementById('ls-back');
const lsClose = document.getElementById('ls-close');
const lsSlot  = document.getElementById('ls-slot');

function openLang(){ lsDlg?.setAttribute('data-open','1'); lsDlg?.setAttribute('aria-hidden','false'); }
function closeLang(){ lsDlg?.setAttribute('data-open','0'); lsDlg?.setAttribute('aria-hidden','true'); }

lsBtn?.addEventListener('click', openLang);
document.getElementById('ls-back')?.addEventListener('click', closeLang);
document.getElementById('ls-close')?.addEventListener('click', closeLang);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeLang(); });

/* Google の <select> を作成 → #ls-slot に移植 */
window.googleTranslateElementInit = function(){
  try{
    new google.translate.TranslateElement({
      pageLanguage: 'ja',
      includedLanguages: 'en,zh-CN,zh-TW,ko,th,vi,ru,ar,es,fr,de,it,pt,hi,ms,fil,id,uk,pl,tr,ro,sv,da,nl,fi,no,cs,el,bg,he,hu,sk,sl',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
    }, 'google_translate_element');

    const tryMove = () => {
      const sel = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!sel) { setTimeout(tryMove, 200); return; }
      // Resetオプションを先頭に（ja|jaに戻す）
      if (![...sel.options].some(o=>o.value=='')) {
        const opt = document.createElement('option');
        opt.value = ''; opt.textContent = 'Original / 原文 (Reset)';
        sel.insertBefore(opt, sel.firstChild);
      }
      sel.addEventListener('change', ()=>{
        if (sel.value === '') {
          // 原文へリセット
          const iframe = document.querySelector('iframe.goog-te-banner-frame');
          if (iframe) iframe.parentNode.removeChild(iframe);
          const cookieKeys = ['googtrans','googtransopt'];
          cookieKeys.forEach(k=>document.cookie = k+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;');
          location.reload();
        }
      });
      // 移植
      lsSlot.innerHTML = '';
      lsSlot.appendChild(sel);
    };
    tryMove();
  }catch(e){ console.error(e); }
};

// Google翻訳スクリプトを遅延ロード
(function loadG(){
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.defer = true;
  document.head.appendChild(s);
})();
