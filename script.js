/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === スクロール容器 #scroll-root を用意（本文は移動） === */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;

  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  if (cta) body.insertBefore(wrap, cta);
  else body.appendChild(wrap);

  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
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
    scroller.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
});

/* ===== CTA高さ → 余白反映 ===== */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  const scroller = document.getElementById('scroll-root');
  (scroller || document.body).classList.add('has-cta');
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

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ===== メニュー自動生成 ===== */
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
      const t = d.querySelector('summary')?.textContent?.trim() || '項目';
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
if (groupsRoot) new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });

/* ===== 免責/キャンセル重複掃除 ===== */
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

/* ===== CTA固定（bounce時だけtransformで追従） ===== */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const doc = document.documentElement;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
    if (maxScroll < 0) maxScroll = 0;
    const y = (document.getElementById('scroll-root') || window).scrollY || window.scrollY || 0;

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

/* =========================================================
   ▼ 言語ボタン（ハンバーガー直下）＋ 標準ドロップダウンだけ表示
   ========================================================= */
(function languageDropdownOnly(){
  const FAB_ID     = 'langFab';
  const PANEL_ID   = 'langPanel';
  const OVERLAY_ID = 'langOverlay';
  const GOOGLE_ID  = 'google_translate_element';

  // 旧UI/残骸の掃除
  document.getElementById(FAB_ID)?.remove();
  document.getElementById(PANEL_ID)?.remove();
  document.getElementById(OVERLAY_ID)?.remove();
  document.querySelectorAll('.lang-cloud, .lang-chip, .lang-quick').forEach(n=>n.remove());

  // オーバーレイ
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  Object.assign(overlay.style, {
    position:'fixed', inset:'0', background:'rgba(0,0,0,.35)',
    opacity:'0', pointerEvents:'none', transition:'opacity .18s ease',
    zIndex:'10001', backdropFilter:'blur(1px)'
  });
  document.body.appendChild(overlay);

  // モーダル
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','言語を選択 / Translate Language');
  Object.assign(panel.style, {
    position:'fixed',
    left:'50%',
    top:'156px',                // ← ハンバーガーと見出しに被らない位置
    transform:'translateX(-50%)',
    width:'min(860px, 92vw)',
    background:'#fff',
    color:'#0b1220',
    border:'1px solid #e5e7eb',
    borderRadius:'14px',
    boxShadow:'0 20px 60px rgba(0,0,0,.25)',
    zIndex:'10002',
    display:'none'
  });
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #e5e7eb;background:#fff;border-top-left-radius:14px;border-top-right-radius:14px">
      <strong style="font-weight:800">言語 / Language</strong>
      <button id="langClose" type="button" aria-label="Close"
        style="width:34px;height:34px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;cursor:pointer">Close</button>
    </div>
    <div style="padding:14px 16px">
      <div id="${GOOGLE_ID}"></div>
      <div id="gt-fallback" style="display:none;margin-top:8px;font-size:13px;color:#64748b">
        Translation module didn’t load. Please allow translate.google.com and try again.
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // ハンバーガー直下に小さめの起動ボタン（FAB）
  const fab = document.createElement('button');
  fab.id = FAB_ID;
  fab.type = 'button';
  fab.setAttribute('aria-label','Translate / 言語');
  fab.textContent = 'Translate / 言語';
  Object.assign(fab.style, {
    position:'fixed',
    top: `calc(78px + env(safe-area-inset-top, 0px))`, // ← 少し下げて被り防止
    right: `calc(10px + env(safe-area-inset-right, 0px))`,
    zIndex:'10000',
    padding:'8px 12px',
    fontWeight:'700',
    borderRadius:'12px',
    border:'1px solid rgba(0,0,0,.15)',
    background:'rgba(17,24,39,.84)',
    color:'#fff',
    boxShadow:'0 6px 22px rgba(0,0,0,.25)',
    backdropFilter:'saturate(140%) blur(4px)',
    cursor:'pointer'
  });
  document.body.appendChild(fab);

  const open = () => {
    overlay.style.pointerEvents = 'auto';
    overlay.style.opacity = '1';
    panel.style.display = 'block';
    ensureLoader();
  };
  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    panel.style.display = 'none';
  };

  overlay.addEventListener('click', close);
  panel.querySelector('#langClose')?.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
  fab.addEventListener('click', open);

  /* === Google Translate ローダ（標準ドロップダウン固定） === */
  let loaded = false, failed = false;

  function loadGoogle(cb){
    if (window.google?.translate?.TranslateElement) { cb(); return; }

    // 既に読み込み中ならコールバックだけ差し替え
    if (document.getElementById('gt-loader')) {
      window.googleTranslateElementInit = cb;
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.id  = 'gt-loader';
    s.async = true;
    s.onerror = () => { failed = true; panel.querySelector('#gt-fallback').style.display='block'; };
    document.head.appendChild(s);

    // ★ ここが重要（正しい関数名）
    window.googleTranslateElementInit = cb;
  }

  function initWidget(){
    try{
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE, // ← ドロップダウン + Powered by だけ
        includedLanguages: [
          // 主要 + よく使う言語（必要なら増減OK）
          'en','zh-CN','zh-TW','ko','fr','es','de','ru','ar','hi','th','vi','id','ms','pt','it','tr',
          'uk','pl','fil','nl','sv','fi','cs','sk','hu','el','he','ro','bg','hr','sr','sl'
        ].join(',')
      }, GOOGLE_ID);
      loaded = true;
    }catch(e){
      failed = true;
      panel.querySelector('#gt-fallback').style.display='block';
    }
  }

  function ensureLoader(){
    if (loaded || failed) return;
    loadGoogle(initWidget);
  }
})();
