/* =========================================================
   script.js  — 全置き換え版（言語ボタン＆モーダル内蔵）
   ========================================================= */

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
  const scroller = document.getElementById('scroll-root') || window;
  if (scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== 固定CTAの高さ → 本文余白に反映（※bottomはJSで触らない） ===== */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  // 余白を付けるのは実際にスクロールする要素（#scroll-root）
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

  // 念のため：どこかの古いJSが h4 "plans" を作っても即削除
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
// 何も書かない（ラバーバンド時に誤検知で浮くのを根絶）

/* === 追加②：保険（UI縮みの追従だけtransformで相殺。bounce中は値を凍結） === */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  let stable = 0; // 直近の安定値
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
   言語ボタン（ハンバーガーの下）＋モーダル＆Google翻訳
   ========================================================= */
(function languageUI(){
  const menuBtn = document.getElementById('menuBtn');

  /* ▼ クイック切替で表示したい言語（増減はここだけ） */
  const QUICK_LANGS = [
    ['en','English'],
    ['zh-CN','中文(简)'],
    ['zh-TW','中文(繁)'],
    ['ko','한국어'],
    ['fr','Français'],
    ['es','Español'],
    ['de','Deutsch'],
    ['ru','Русский'],
    ['ar','العربية'],
    ['hi','हिन्दी'],
    ['th','ไทย'],
    ['vi','Tiếng Việt'],
    ['id','Bahasa Indonesia'],
    ['ms','Bahasa Melayu'],
    ['pt','Português'],
    ['it','Italiano'],
    ['tr','Türkçe'],
    ['uk','Українська'],
    ['pl','Polski'],
    ['fil','Filipino'],
  ];

  /* ▼ 言語ボタン（ハンバーガーの真下に固定） */
  let langBtn = document.getElementById('langBtn');
  if (!langBtn) {
    langBtn = document.createElement('button');
    langBtn.id = 'langBtn';
    langBtn.type = 'button';
    langBtn.className = 'lang-fab'; // CSSは既存の追従（半透明の濃いグレー）
    langBtn.setAttribute('aria-label','言語 / Language');
    langBtn.innerHTML = '<span>Translate / 言語</span>';
    document.body.appendChild(langBtn);
  }
  const place = () => {
    const r = menuBtn?.getBoundingClientRect();
    const top = r ? Math.max(10, r.bottom + 10) : 64;
    langBtn.style.position = 'fixed';
    langBtn.style.right = '10px';
    langBtn.style.top = `${top}px`;
    langBtn.style.zIndex = '10000';
  };
  place();
  addEventListener('resize', place, { passive:true });
  addEventListener('scroll', place, { passive:true });

  /* ▼ モーダル生成（Powered by / Google / 翻訳 などはCSSで非表示） */
  let panel;
  function ensurePanel(){
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'langPanel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');
    panel.style.cssText = `
      position:fixed; right:10px; top:${(menuBtn?.getBoundingClientRect().bottom||64)+10}px;
      width:min(560px,92vw); background:rgba(17,24,39,.88); color:#fff;
      border:1px solid rgba(255,255,255,.08); border-radius:12px; box-shadow:0 14px 40px rgba(0,0,0,.35);
      padding:12px; z-index:10001; backdrop-filter: blur(8px);
    `;
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <strong style="font-weight:800">🌐 言語 / Language</strong>
        <button type="button" id="langClose" style="background:transparent;border:1px solid rgba(255,255,255,.25);border-radius:8px;color:#fff;padding:.25rem .6rem">Close</button>
      </div>
      <div id="google_translate_element"></div>
      <div id="gt-quick" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"></div>
      <div id="gt-fail" hidden style="margin-top:8px;opacity:.9;font-size:.9em">
        Translation module didn’t load. <a href="#" id="gt-open" style="color:#a3d3ff">Open in Google Translate</a>
      </div>
    `;
    document.body.appendChild(panel);

    // パネル内だけに効くスタイル（Powered by/Google/翻訳を消す）
    if (!document.getElementById('langPanelStyle')) {
      const style = document.createElement('style');
      style.id = 'langPanelStyle';
      style.textContent = `
        #langPanel .goog-logo-link,
        #langPanel .goog-te-gadget > span,
        #langPanel img.goog-te-gadget-icon { display:none !important; }
        #langPanel .goog-te-gadget { color:#fff !important; }
        #langPanel select.goog-te-combo{
          width:100%; padding:.55rem .6rem; border-radius:10px;
          border:1px solid rgba(255,255,255,.25); background:rgba(0,0,0,.2); color:#fff;
        }
        #langPanel a.chip{
          display:inline-block; padding:.28rem .6rem; border-radius:999px; text-decoration:none;
          border:1px solid rgba(255,255,255,.28); color:#fff;
        }
        #langPanel a.chip:hover{ background:rgba(255,255,255,.08); }
      `;
      document.head.appendChild(style);
    }

    panel.querySelector('#langClose')?.addEventListener('click', ()=>{ panel.remove(); panel=null; });
    return panel;
  }

  /* ▼ Google翻訳 初期化コールバック（必須のグローバル） */
  window.googleTranslateElementInit = function googleTranslateElementInit(){
    try{
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        autoDisplay: false,
        includedLanguages: QUICK_LANGS.map(x=>x[0]).join(','),
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');

      // クイック言語（配列から描画）
      const quick = document.getElementById('gt-quick');
      if (quick) {
        quick.innerHTML = QUICK_LANGS
          .map(([code,label])=>`<a href="#" class="chip" data-tl="${code}">${label}</a>`)
          .join('');
        quick.querySelectorAll('a.chip').forEach(a=>{
          a.addEventListener('click', (e)=>{
            e.preventDefault();
            const sel = document.querySelector('#google_translate_element select.goog-te-combo');
            if (!sel) return;
            sel.value = a.getAttribute('data-tl');
            sel.dispatchEvent(new Event('change'));
          });
        });
      }
    }catch{}
  };

  /* ▼ ライブラリ読込（失敗したらフォールバック案内を表示） */
  function loadGoogle(){
    if (window.google && window.google.translate) return;
    if (document.getElementById('gt-lib')) return;

    const s = document.createElement('script');
    s.id = 'gt-lib';
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.onerror = ()=>{
      const fail = document.getElementById('gt-fail');
      if (fail) fail.hidden = false;
      const a = document.getElementById('gt-open');
      if (a) {
        a.addEventListener('click',(e)=>{
          e.preventDefault();
          const tl = 'en';
          const u  = location.href;
          const url = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(tl)}&u=${encodeURIComponent(u)}`;
          window.open(url,'_blank','noopener');
        });
      }
    };
    document.head.appendChild(s);
  }

  /* ▼ クリックでモーダル表示＆ライブラリ読込 */
  langBtn.addEventListener('click', ()=>{
    ensurePanel();
    loadGoogle();
  });
})();
