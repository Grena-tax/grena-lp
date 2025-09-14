/* =========================================================
   LP JS  — v20250914-stable3
   目的：
   - 既存UIはそのまま（HTML/CSS変更不要）
   - 「トップへ」/ アコーディオン自動オープン
   - CTA余白反映（bottomは触らない）＋iOSズレ相殺
   - ハンバーガー自動目次
   - 免責/キャンセルの重複整理
   - 言語パネル：Google公式ウィジェットをモーダル内へ
     * 1個だけ出す、古い残骸は全削除
     * Powered by 等は余白ごと非表示（スペース残さない）
     * 読み込み失敗時は明示メッセージ＋代替リンク
   ========================================================= */

console.info('[LP js v20250914-stable3] ready');

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

/* ===== アンカー（スムーススクロール＋最初のdetailsだけ開く） ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id && document.querySelector(id);
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
document.getElementById('toTop')?.addEventListener('click', (e) => {
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
});

/* ===== CTA高さ→本文余白（bottomは触らない） ===== */
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
  if (!FORM_URL) return alert('フォームURLが未設定です');
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
btn?.addEventListener('click', () =>
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu()
);
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

/* ===== ハンバーガー内 目次自動生成 ===== */
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

/* ===== 免責/キャンセルの重複を下部 #disclaimer に集約 ===== */
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
    cancels.forEach((d) => d !== keep && d.remove());
  }
}
document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);
addEventListener('load', cutOnlyBottomDup);

/* ===== CTA bottom は触らない。viewport縮みにだけ追従（iOS保険） ===== */
(function lockCtaToBottomFreeze() {
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar') ||
    document.getElementById('ctaBar');
  if (!bar || !window.visualViewport) return;

  let stable = 0;
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
  addEventListener('scroll', apply, { passive: true });
  addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* =========================================================
   言語：Google公式ウィジェット（1つだけ）＋確実ロード
   ========================================================= */
(function mountLanguage() {
  // 1) 既存残骸の掃除（重複対策）
  document
    .querySelectorAll(
      '#langFab,#langPanel,[data-langfab],#google_translate_element,.skiptranslate,[id^="\:0\.targetLanguage"]'
    )
    .forEach((n) => n.remove());

  // 2) スタイル注入（余白を綺麗に／ロゴ等を非表示＝スペースも消す）
  const style = document.createElement('style');
  style.textContent = `
    .lang-fab{position:fixed;top:calc(64px + env(safe-area-inset-top,0px));right:12px;z-index:10000}
    .lang-fab>button{
      -webkit-backdrop-filter: blur(8px) saturate(140%); backdrop-filter: blur(8px) saturate(140%);
      background:rgba(17,24,39,.85);color:#fff;border:1px solid rgba(255,255,255,.12);
      padding:.45rem .65rem;border-radius:10px;font:600 13px/1.2 system-ui,"Noto Sans JP",sans-serif;
      display:inline-flex;gap:.35rem;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,.2)
    }
    .lang-panel{position:fixed;right:10px;top:calc(110px + env(safe-area-inset-top,0px));z-index:10001;
      width:min(680px,94vw);background:#fff;color:#0b1220;border:1px solid #e5e7eb;border-radius:12px;
      box-shadow:0 22px 60px rgba(0,0,0,.2);padding:12px;display:none}
    .lang-panel .head{display:flex;justify-content:space-between;align-items:center;padding:6px 6px 10px;font-weight:800}
    .lang-close{border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:.35rem .6rem;font-weight:700;cursor:pointer}
    /* ▼ Googleウィジェット内の余計な表示と余白を完全除去 */
    #google_translate_element .goog-logo-link,
    #google_translate_element .goog-te-gadget>span,
    #google_translate_element .goog-te-gadget>div>span,
    #google_translate_element .goog-te-banner-frame{ display:none !important; }
    #google_translate_element .goog-te-gadget{ margin:0 !important; }
    #google_translate_element select.goog-te-combo{ width:100%; padding:.6rem .7rem; border:1px solid #e5e7eb; border-radius:10px; background:#f9fafb; font-weight:700; }
  `;
  document.head.appendChild(style);

  // 3) ボタン＆パネル
  const fab = document.createElement('div');
  fab.className = 'lang-fab';
  fab.id = 'langFab';
  fab.setAttribute('data-langfab', '1');
  fab.innerHTML = `<button type="button" aria-haspopup="dialog" aria-controls="langPanel">Translate / 言語</button>`;
  document.body.appendChild(fab);

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
    <div id="gt-fallback" style="display:none;padding:8px 10px;color:#444">
      Translation module didn't load.<br>
      Please allow <strong>translate.google.com</strong> and try again.
      <div style="margin-top:8px">
        <a href="https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(location.href)}" target="_blank" rel="noopener">Open in Google Translate (tab)</a>
      </div>
    </div>
    <div id="google_translate_element"></div>
  `;
  document.body.appendChild(panel);

  const open = () => (panel.style.display = 'block');
  const close = () => (panel.style.display = 'none');
  fab.querySelector('button')?.addEventListener('click', () => (panel.style.display === 'block' ? close() : open()));
  panel.querySelector('.lang-close')?.addEventListener('click', close);

  // 4) Google翻訳エレメントを確実に初期化
  let inited = false;
  window.googleTranslateElementInit = function () {
    try {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'ja',
          autoDisplay: false,
          includedLanguages:
            'en,zh-CN,zh-TW,ko,fr,es,de,ru,ar,hi,th,vi,id,ms,pt,it,uk,pl,fil,tr',
        },
        'google_translate_element'
      );
      inited = true;
      document.getElementById('gt-fallback').style.display = 'none';
    } catch (e) {
      document.getElementById('gt-fallback').style.display = 'block';
      console.warn('Translate init error:', e);
    }
  };

  const loadScriptOnce = () =>
    new Promise((resolve, reject) => {
      if (window.google?.translate?.TranslateElement) {
        // 既にロード済み（他のページから戻った等）
        window.googleTranslateElementInit();
        return resolve();
      }
      const s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      s.onerror = () => reject(new Error('load error'));
      s.onload = () => resolve();
      document.head.appendChild(s);
    });

  // 初回オープン時にロード（重複防止のため1回だけ）
  let tried = false;
  const ensure = async () => {
    if (inited || tried) return;
    tried = true;
    try {
      await loadScriptOnce();
      // onload→callbackでinitされる
      setTimeout(() => {
        if (!inited) document.getElementById('gt-fallback').style.display = 'block';
      }, 1500);
    } catch {
      document.getElementById('gt-fallback').style.display = 'block';
    }
  };
  fab.addEventListener('click', ensure, { once: true });

  // 念のため：ページ読み込み後に前倒しロード（回線が速ければ即使用可）
  addEventListener('load', () => {
    setTimeout(() => {
      if (!inited && !tried) ensure();
    }, 400);
  });
})();

/* =========================================================
   フェイルセーフ：html/body に overflow:hidden が残ってたら解除
   ========================================================= */
(function failSafe() {
  function unlock() {
    try {
      const r = (el) => getComputedStyle(el);
      const doc = document.documentElement, body = document.body;
      if (/(hidden|clip)/.test(r(doc).overflowY) || /(hidden|clip)/.test(r(body).overflowY)) {
        let tag = document.getElementById('scroll-unlock');
        if (!tag) {
          tag = document.createElement('style');
          tag.id = 'scroll-unlock';
          tag.textContent = 'html,body{height:auto !important;overflow-y:auto !important;overflow-x:hidden !important;}';
          document.head.appendChild(tag);
          console.info('scroll unlocked');
        }
      }
    } catch {}
  }
  addEventListener('DOMContentLoaded', unlock);
  addEventListener('load', unlock);
})();
/* === 追加：言語FABの自動レイアウト（他UIと重ならない）=== */
(function balanceLanguageFab(){
  const fab = document.getElementById('langFab');
  if (!fab) return;

  function reposition(){
    // デフォルトの基準（ヘッダーから少し下）
    const safeTopVar = getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-top') || '0px';
    const safeTop = parseInt(safeTopVar) || 0;
    let top = 56 + safeTop;        // ←基準値（必要ならここだけ調整）
    let right = 12;                // 右余白

    // ハンバーガー（.menu-button or #menuBtn）と重なる場合は、その下に逃がす
    const menu = document.querySelector('.menu-button, #menuBtn');
    if (menu){
      const r = menu.getBoundingClientRect();
      const candTop = Math.ceil(r.bottom) + 12; // 12pxの余白
      if (candTop > top) top = candTop;

      // 右端ギリギリにある場合は、FABも少しだけ左へ
      const vw = document.documentElement.clientWidth;
      if (vw - r.right < 64) right = Math.max(12, vw - r.right + 12);
    }

    fab.style.top = top + 'px';
    fab.style.right = right + 'px';
    fab.style.zIndex = 9999; // ハンバーガー(10000)より一段下で視覚衝突回避
  }

  reposition();
  addEventListener('resize', reposition);
  addEventListener('scroll', reposition, { passive: true });
  addEventListener('orientationchange', () => setTimeout(reposition, 60));
})();
