/* =========================================================
   script.js — v20250914-safe
   目的：
   - スクロール正常化（#scroll-root 非使用）
   - CTA余白調整・トップへ・アンカー開閉
   - ハンバーガー自動目次
   - 重複の免責/キャンセル整理
   - iOSラバーバンド中のCTAズレ相殺（transformのみ）
   - 言語パネル（新規タブでGoogle翻訳・ページはリロードしない）
   - 旧CSSの overflow:hidden を検出したら強制解除（fail-safe）
   ========================================================= */

/* ===== 申込フォームURL ===== */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) =>
  (t || '')
    .toLowerCase()
    .replace(/[（）()\[\]【】]/g, ' ')
    .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/* ===== ページ内リンク（スムーススクロール） ===== */
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

/* ===== 「トップへ」 ===== */
document.getElementById('toTop')?.addEventListener('click', (e) => {
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    (window.scrollTo
      ? window.scrollTo({ top: 0, behavior: 'smooth' })
      : (document.documentElement.scrollTop = 0));
  }
});

/* ===== 固定CTAの高さ → 本文余白に反映（※ bottom は JS で触らない） ===== */
const adjustCtaPadding = () => {
  const bar =
    document.querySelector('.cta-bar') ||
    document.getElementById('ctaBar') ||
    document.querySelector('.fixed-cta');

  if (!bar) return;

  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  document.body.classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン ===== */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) {
    alert('フォームURLが未設定です');
    return;
  }
  window.open(FORM_URL, '_blank', 'noopener,noreferrer');
});

/* ===== ハンバーガー開閉 ===== */
const btn = document.getElementById('menuBtn');
const drawer = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu = () => {
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden', 'false');
  btn?.setAttribute('aria-expanded', 'true');
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden', 'true');
  btn?.setAttribute('aria-expanded', 'false');
};

btn?.addEventListener('click', () => {
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
});
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

/* ===== メニュー（ハンバーガー内）自動生成 ===== */
const excludeTitles = ['基本プラン', '設立＋LPパック', '設立+LPパック', 'フルサポートパック'];

function buildMenu() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach((sec) => {
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

    details.forEach((d) => {
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some((x) => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', `#${d.id}`);
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

function killPlansHeading() {
  if (!groupsRoot) return;
  groupsRoot.querySelectorAll('.menu-group h4').forEach((h) => {
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}
addEventListener('DOMContentLoaded', buildMenu);
addEventListener('load', killPlansHeading);
if (groupsRoot) {
  new MutationObserver(killPlansHeading).observe(groupsRoot, { childList: true, subtree: true });
}

/* ===== 重複ブロック除去（免責/キャンセルを #disclaimer だけに揃える） ===== */
function cutOnlyBottomDup() {
  document.getElementById('site-disclaimer')?.remove();
  document.querySelectorAll('details.disclaimer').forEach((d) => d.remove());
  document.querySelectorAll('details').forEach((d) => {
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });
  const cancels = Array.from(document.querySelectorAll('details')).filter((d) => {
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    return /キャンセルポリシー/.test(t);
  });
  if (cancels.length > 1) {
    const keep = cancels.find((d) => d.closest('#disclaimer')) || cancels[0];
    cancels.forEach((d) => {
      if (d !== keep) d.remove();
    });
  }
}
document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);
window.addEventListener('load', cutOnlyBottomDup);

/* ===== ここ重要：CTA の bottom を JS では一切いじらない ===== */
/* 何も書かない（ラバーバンド時に誤検知で浮くのを根絶） */

/* === iOS等：UI縮み追従だけ transform で相殺。bounce 中は値を凍結 === */
(function lockCtaToBottomFreeze() {
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar') ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  let stable = 0; // 直近の安定値
  const apply = () => {
    const vv = window.visualViewport;
    const doc = document.documentElement;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
    if (maxScroll < 0) maxScroll = 0;
    const y = window.scrollY || 0;

    const isBouncingBottom = y > maxScroll + 1;
    if (!isBouncingBottom) stable = uiGap;

    const use = isBouncingBottom ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize', apply);
  visualViewport.addEventListener('scroll', apply);
  window.addEventListener('scroll', apply, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* =========================================================
   言語パネル（ページはリロードしない／新規タブで翻訳）
   - 右上の「Translate / 言語」ボタンを1つだけ生成
   - 既存の重複ボタン/古いウィジェットは出現前に掃除
   ========================================================= */
(function languageFab() {
  'use strict';

  // 既存のボタン/ウィジェットを掃除（重複防止）
  document.querySelectorAll('#langFab, #langPanel, [data-langfab], .skiptranslate, #google_translate_element').forEach((n) => {
    // Google埋め込みウィジェットまで消す（今回使わない）
    n.remove();
  });

  // スタイルをJSで注入（CSS改変なし）
  const css = `
  .lang-fab{position:fixed;top:calc(64px + env(safe-area-inset-top,0px));right:12px;z-index:10000}
  .lang-fab > button{
    -webkit-backdrop-filter: blur(8px) saturate(140%); backdrop-filter: blur(8px) saturate(140%);
    background: rgba(17,24,39,.85); color:#fff; border:1px solid rgba(255,255,255,.12);
    padding:.4rem .6rem; border-radius:10px; font:600 13px/1.2 system-ui, "Noto Sans JP", sans-serif;
    display:inline-flex; gap:.35rem; align-items:center; box-shadow:0 6px 18px rgba(0,0,0,.2);
  }
  .lang-panel{
    position:fixed; right:10px; top:calc(110px + env(safe-area-inset-top,0px)); z-index:10001;
    width:min(760px, 94vw); background:#fff; color:#0b1220; border:1px solid #e5e7eb; border-radius:12px;
    box-shadow:0 20px 60px rgba(0,0,0,.2); padding:10px 10px 12px; display:none;
  }
  .lang-panel .head{display:flex; justify-content:space-between; align-items:center; padding:6px 8px 10px; font-weight:800}
  .lang-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:8px; padding:8px}
  .lang-chip{
    display:inline-flex; align-items:center; justify-content:center; padding:.55rem .7rem; border-radius:10px;
    border:1px solid #e5e7eb; background:#f9fafb; font-weight:700; cursor:pointer; user-select:none; text-decoration:none; color:#111827;
  }
  .lang-chip:hover{background:#eef2f7}
  .lang-close{border:1px solid #e5e7eb; background:#fff; border-radius:10px; padding:.35rem .6rem; font-weight:700; cursor:pointer}
  @media (max-width:480px){
    .lang-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  }
  `;
  const tag = document.createElement('style');
  tag.id = 'lang-style';
  tag.textContent = css;
  document.head.appendChild(tag);

  // ボタン
  const fabWrap = document.createElement('div');
  fabWrap.className = 'lang-fab';
  fabWrap.id = 'langFab';
  fabWrap.setAttribute('data-langfab', '1');
  fabWrap.innerHTML = `<button type="button" aria-haspopup="dialog" aria-controls="langPanel">Translate / 言語</button>`;
  document.body.appendChild(fabWrap);

  // パネル
  const panel = document.createElement('div');
  panel.className = 'lang-panel';
  panel.id = 'langPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.innerHTML = `
    <div class="head">
      <div>言語 / Language</div>
      <button class="lang-close" type="button" aria-label="Close">Close</button>
    </div>
    <div class="lang-grid" id="langGrid"></div>
  `;
  document.body.appendChild(panel);

  const grid = panel.querySelector('#langGrid');

  // チップ定義（表示名, tl パラメータ）
  const langs = [
    ['English','en'], ['中文(簡)','zh-CN'], ['中文(繁)','zh-TW'], ['한국어','ko'],
    ['Français','fr'], ['Español','es'], ['Deutsch','de'], ['Русский','ru'],
    ['العربية','ar'], ['हिन्दी','hi'], ['ไทย','th'], ['Tiếng Việt','vi'],
    ['Bahasa Indonesia','id'], ['Bahasa Melayu','ms'], ['Português','pt'],
    ['Italiano','it'], ['Українська','uk'], ['Polski','pl'], ['Filipino','fil'], ['Türkçe','tr']
  ];

  const toTranslateURL = (tl) =>
    `https://translate.google.com/translate?hl=ja&sl=auto&tl=${encodeURIComponent(tl)}&u=${encodeURIComponent(location.href)}`;

  langs.forEach(([label, tl]) => {
    const a = document.createElement('a');
    a.className = 'lang-chip';
    a.href = toTranslateURL(tl);
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = label;
    grid.appendChild(a);
  });

  // 動作
  const open = () => { panel.style.display = 'block'; };
  const close = () => { panel.style.display = 'none'; };
  fabWrap.querySelector('button')?.addEventListener('click', () => (panel.style.display === 'block' ? close() : open()));
  panel.querySelector('.lang-close')?.addEventListener('click', close);

  // 画面幅が極端に狭い時に被らないよう微調整（CTAと干渉しにくく）
  const relocate = () => {
    const menuBtn = document.getElementById('menuBtn');
    const rect = menuBtn?.getBoundingClientRect();
    if (rect && rect.bottom > 0) {
      fabWrap.style.top = `calc(${Math.max(rect.bottom + 8, 56)}px + env(safe-area-inset-top,0px))`;
    }
  };
  addEventListener('resize', relocate);
  addEventListener('load', relocate);
})();

/* =========================================================
   FAIL-SAFE：旧CSSの overflow:hidden を検出したら解除
   （CSSを触れない環境でもスクロール不能を確実に解消）
   ========================================================= */
(function unlockScrollFailSafe() {
  function isHidden(el) {
    const cs = getComputedStyle(el);
    return /(hidden|clip)/.test(cs.overflowY) || /(hidden|clip)/.test(cs.overflow);
  }
  function apply() {
    if (isHidden(document.documentElement) || isHidden(document.body)) {
      let tag = document.getElementById('scroll-unlock');
      if (!tag) {
        tag = document.createElement('style');
        tag.id = 'scroll-unlock';
        tag.textContent = `
          html,body{height:auto !important; overflow-y:auto !important; overflow-x:hidden !important;}
        `;
        document.head.appendChild(tag);
        console.info('[scroll-unlock] applied');
      }
    }
  }
  apply();
  addEventListener('DOMContentLoaded', apply);
  addEventListener('load', apply);
})();
