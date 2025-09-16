/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/-$/g, '').replace(/^-/,'');

/* === ページ本体をスクロール容器に移す（HTMLは無改変） === */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;

  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  // CTAより上にスクロール容器を挿入
  if (cta) body.insertBefore(wrap, cta);
  else body.appendChild(wrap);

  // CTA・メニューUI以外を全部 #scroll-root に移動
  const keep = new Set([cta, menuBtn, menuDrawer, wrap,
                        document.getElementById('langBtn'),
                        document.getElementById('langDrawer')]);
  Array.from(body.childNodes).forEach(n => {
    if (!keep.has(n)) wrap.appendChild(n);
  });
})();

/* ===== ページ内リンク（スムーススクロール） ===== */
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

/* ===== 「トップへ」 ===== */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    const scroller = document.getElementById('scroll-root') || window;
    if (scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ===== 固定CTAの高さ → 本文余白に反映 ===== */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  const scroller = document.getElementById('scroll-root');
  if (scroller) scroller.classList.add('has-cta');
  else document.body.classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン ===== */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー開閉 ===== */
const btn        = document.getElementById('menuBtn');
const drawer     = document.getElementById('menuDrawer');
const closeBt    = document.getElementById('menuClose');
const overlay    = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => {
  // 片方が開いていたら閉じる（言語⇄メニュー排他）
  closeLang();
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  setTimeout(() => closeBt?.focus(), 0);
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
  btn?.focus();
};

btn?.addEventListener('click', () => {
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
});
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ===== メニュー（ハンバーガー内）自動生成 ===== */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

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
  killPlansHeading();
}

function killPlansHeading(){
  if (!groupsRoot) return;
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}
addEventListener('DOMContentLoaded', buildMenu);
addEventListener('load', killPlansHeading);
if (groupsRoot) {
  new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });
}

/* ===== 重複ブロック除去（免責/キャンセルを #disclaimer に統一） ===== */
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

/* ===== CTAの bottom はJSで触らない ===== */

/* === CTA固定の保険（rubber-band相殺） === */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  const scroller = document.getElementById('scroll-root') || document.documentElement;

  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const maxScroll = Math.max(0, (scroller.scrollHeight || 0) - (scroller.clientHeight || 0));

    let y = 0;
    if (scroller === document.documentElement || scroller === document.body) {
      y = window.scrollY || document.documentElement.scrollTop || 0;
    } else {
      y = scroller.scrollTop || 0;
    }

    const isBouncingBottom = y > maxScroll + 1;
    if (!isBouncingBottom) stable = uiGap;

    const use = isBouncingBottom ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize',  apply);
  visualViewport.addEventListener('scroll',  apply);
  if (scroller && scroller.addEventListener) {
    scroller.addEventListener('scroll', apply, { passive: true });
  } else {
    window.addEventListener('scroll', apply, { passive: true });
  }
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* =========================================================
   🌐 Language Drawer（Google Translate 全言語 自動生成）
   ========================================================= */
const langBtn      = document.getElementById('langBtn');
const langDrawer   = document.getElementById('langDrawer');
const langCloseBtn = document.getElementById('langClose');
const langBackdrop = document.getElementById('langBackdrop');
const langList     = document.getElementById('langList');
const langSearch   = document.getElementById('langSearch');

function openLang(){
  closeMenu(); // 排他
  document.documentElement.classList.add('lang-open');
  langDrawer?.setAttribute('aria-hidden','false');
  langBtn?.setAttribute('aria-expanded','true');
  setTimeout(()=>langCloseBtn?.focus(),0);
}
function closeLang(){
  document.documentElement.classList.remove('lang-open');
  langDrawer?.setAttribute('aria-hidden','true');
  langBtn?.setAttribute('aria-expanded','false');
}
langBtn?.addEventListener('click', ()=>{
  document.documentElement.classList.contains('lang-open') ? closeLang() : openLang();
});
langCloseBtn?.addEventListener('click', closeLang);
langBackdrop?.addEventListener('click', closeLang);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeLang(); });

/* Googleの<select>が用意されるまで待ってからメニュー生成 */
function getGoogleSelect(){
  return document.querySelector('#google_translate_element select.goog-te-combo');
}

function googCookieLang(){
  // cookie "googtrans=/auto/xx" を拾って現在の言語を推定
  const m = (document.cookie || '').match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!m) return '';
  const val = decodeURIComponent(m[1]);
  const sp = val.split('/');
  return sp[2] || '';
}

function buildLangList(){
  const sel = getGoogleSelect();
  if (!sel) { setTimeout(buildLangList, 200); return; }

  langList.textContent = '';
  const current = (googCookieLang() || '').toLowerCase();

  Array.from(sel.options).forEach(opt=>{
    if (!opt.value) return;
    const li = document.createElement('li');
    const b  = document.createElement('button');
    b.type = 'button';
    b.className = 'lang-item';
    b.dataset.code = opt.value;
    b.textContent = opt.textContent;
    if (opt.value.toLowerCase() === current) b.classList.add('active');
    b.addEventListener('click', ()=>{
      sel.value = b.dataset.code;
      sel.dispatchEvent(new Event('change'));
      // アクティブ表示更新
      langList.querySelectorAll('.lang-item.active').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      closeLang();
    });
    li.appendChild(b);
    langList.appendChild(li);
  });
}

/* 検索フィルタ */
langSearch?.addEventListener('input', ()=>{
  const q = (langSearch.value || '').toLowerCase().trim();
  langList.querySelectorAll('li').forEach(li=>{
    const txt = (li.textContent || '').toLowerCase();
    li.style.display = txt.includes(q) ? '' : 'none';
  });
});

/* GoogleのUIが非同期で変わることがあるので監視して自動再構築 */
const obsTarget = document.getElementById('google_translate_element');
if (obsTarget && 'MutationObserver' in window){
  new MutationObserver(()=>buildLangList())
    .observe(obsTarget, { childList:true, subtree:true });
}
window.addEventListener('load', buildLangList);
document.addEventListener('DOMContentLoaded', buildLangList);
