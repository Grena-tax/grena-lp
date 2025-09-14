/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === 追加①：ページ本体をスクロール容器に移す（HTMLは無改変） === */
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
  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
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

  // 免責(#disclaimer) だけは自動オープンしない
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

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
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

    // #plans は見出し(h4)を出さない
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

/* ===== 重複ブロック除去（免責/キャンセルを #disclaimer だけに揃える） ===== */
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

/* ===== ここ重要：CTAの bottom を JS では一切いじらない ===== */

/* === 追加②：保険（UI縮みの追従だけtransformで相殺。bounce中は値を凍結） === */
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
   ▼▼ 言語ボタン（ハンバーガー直下）＋Google翻訳ドロップダウン
   ——「あの時の見た目」に戻した版
   ========================================================= */
(function mountLanguageUI(){
  // フローティングの小さなバー（ハンバーガー直下）
  const bar = document.createElement('button');
  bar.id = 'langFab';
  bar.type = 'button';
  bar.setAttribute('aria-label','Translate / 言語');
  bar.textContent = 'Translate / 言語';
  Object.assign(bar.style, {
    position:'fixed',
    top: `calc(60px + env(safe-area-inset-top, 0px))`,
    right: `calc(10px + env(safe-area-inset-right, 0px))`,
    zIndex:'10001',
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
  document.body.appendChild(bar);

  // モーダル本体（ドロップダウン＋Powered by Google）
  const panel = document.createElement('div');
  panel.id = 'langPanel';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','言語を選択 / Translate Language');
  Object.assign(panel.style, {
    position:'fixed',
    left:'50%',
    top:'140px',
    transform:'translateX(-50%)',
    width:'min(820px, 92vw)',
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
      <strong style="font-weight:800">言語を選択 / Translate Language</strong>
      <button id="langClose" type="button" aria-label="Close" style="width:34px;height:34px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;cursor:pointer">×</button>
    </div>
    <div style="padding:14px 16px">
      <div id="google_translate_element"></div>
      <div id="gt-fallback" style="display:none;margin-top:8px;font-size:13px;color:#64748b">
        Translation module didn't load. Please allow translate.google.com and try again.
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const open = () => { panel.style.display = 'block'; ensureTranslateLoaded(); };
  const close = () => { panel.style.display = 'none'; };
  bar.addEventListener('click', open);
  panel.querySelector('#langClose')?.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  // Google Translate ローダ
  let loaded = false, failed = false;
  function ensureTranslateLoaded(){
    if (loaded || failed) return;
    if (window.google?.translate?.TranslateElement) { init(); return; }

    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=__initTranslate__';
    s.async = true;
    window.__initTranslate__ = init;
    s.onerror = () => { failed = true; panel.querySelector('#gt-fallback').style.display='block'; };
    document.head.appendChild(s);
  }

  function init(){
    try{
      loaded = true;
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        // 必要に応じて追加してください（広めに設定）
        includedLanguages: 'en,zh-CN,zh-TW,ko,fr,es,de,ru,ar,hi,th,vi,id,ms,pt,it,tr,uk,pl,fil'
      }, 'google_translate_element');

      // 既存の画像や余計な要素を軽く整理（見た目調整だけ）
      setTimeout(()=>{
        const gadget = panel.querySelector('#google_translate_element');
        gadget?.querySelectorAll('a, img, span[style*="vertical-align:middle"]').forEach(el=>{
          if (el.tagName==='IMG') el.remove();
        });
      }, 300);
    }catch(err){
      failed = true;
      panel.querySelector('#gt-fallback').style.display='block';
    }
  }
})();
