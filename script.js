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
/* =========================================================
   Language Switcher — FULL JS (append-only / no layout change)
   ペースト先：既存 script.js の一番下
   ========================================================= */
(() => {
  if (window.__LANG_SW_INIT__) return; // 二重読込ガード
  window.__LANG_SW_INIT__ = true;

  /* ---------- 1) UI を自動で挿入（ボタン＋モーダル＋隠しGT容器） ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // 地球儀ボタン
  if (!$('#ls-btn')) {
    const btn = document.createElement('button');
    btn.id = 'ls-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', '言語を選択');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm7.9 9h-3.38a15.2 15.2 0 0 0-1.2-5.03A8.02 8.02 0 0 1 19.9 11ZM12 4.1c.93 0 2.4 1.87 3.11 5.9H8.89c.7-4.03 2.18-5.9 3.11-5.9Zm-3.32 1A15.2 15.2 0 0 0 7.48 11H4.1a8.02 8.02 0 0 1 4.58-5.9ZM4.1 13h3.38c.27 1.86.78 3.64 1.4 5.03A8.02 8.02 0 0 1 4.1 13Zm7.9 6.9c-.93 0-2.4-1.87-3.11-5.9h6.22c-.7 4.03-2.18 5.9-3.11 5.9Zm3.32-1a15.2 15.2 0 0 0 1.2-5.03h3.38a8.02 8.02 0 0 1-4.58 5.03Z"/></svg>';
    document.body.appendChild(btn);
  }

  // モーダル
  if (!$('#ls-dlg')) {
    const dlg = document.createElement('div');
    dlg.id = 'ls-dlg';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-label', '言語を選択');
    dlg.dataset.open = '0';
    dlg.innerHTML = `
      <div class="ls-back" id="ls-back"></div>
      <div class="ls-panel" role="document">
        <div class="ls-head">
          <strong>Select language / 言語を選択</strong>
          <button class="ls-close" id="ls-close" aria-label="閉じる">×</button>
        </div>
        <div class="ls-body">
          <div id="ls-slot"><select class="goog-te-combo" disabled><option>Loading…</option></select></div>
          <p class="ls-hint">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
          <div style="margin-top:10px;display:flex;gap:8px">
            <button type="button" id="ls-reset" class="ls-close" style="height:36px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;">Original / 原文に戻す</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(dlg);
  }

  // Google Translate の隠し置き場
  if (!$('#google_translate_element')) {
    const ghost = document.createElement('div');
    ghost.id = 'google_translate_element';
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, {
      position: 'fixed', left: '-9999px', top: '-9999px', width: '0', height: '0',
      overflow: 'hidden', opacity: '0', pointerEvents: 'none'
    });
    document.body.appendChild(ghost);
  }

  const btn = $('#ls-btn');
  const dlg = $('#ls-dlg');
  const closeBtn = $('#ls-close');
  const back = $('#ls-back');
  const slot = $('#ls-slot');

  const openDlg  = () => { dlg.dataset.open = '1'; };
  const closeDlg = () => { dlg.dataset.open = '0'; };

  btn?.addEventListener('click', openDlg);
  closeBtn?.addEventListener('click', closeDlg);
  back?.addEventListener('click', closeDlg);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDlg(); });

  // スクロール中はボタンを少し控えめに（任意）
  const scroller = document.getElementById('scroll-root') || window;
  let shyTimer = null;
  scroller.addEventListener('scroll', () => {
    btn?.setAttribute('data-shy', '1');
    clearTimeout(shyTimer);
    shyTimer = setTimeout(() => btn?.removeAttribute('data-shy'), 180);
  }, { passive: true });

  /* ---------- 2) Google Translate をロード ---------- */
  function loadGoogleTranslate() {
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      initGoogleTranslate();
      return;
    }
    // コールバックをグローバルに
    window.googleTranslateElementInit = initGoogleTranslate;
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  }

  function initGoogleTranslate() {
    try {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'ja', autoDisplay: false },
        'google_translate_element'
      );
    } catch (e) {
      // 失敗しても次の処理でリトライ
    }
    // select を移植する
    waitAndGraftSelect();
  }

  /* ---------- 3) Google の <select> をモーダルに移植 ---------- */
  function graftSelect() {
    const sel = $('#google_translate_element select.goog-te-combo');
    if (!sel) return false;

    // 既に移植済みならスキップ
    if (slot.contains(sel)) return true;

    // リセットボタン & 値の同期
    $('#ls-reset')?.addEventListener('click', () => {
      clearGTCookies();
      sel.value = '';
      fireChange(sel);
      localStorage.removeItem('lsLang');
      closeDlg();
    });

    // 「原文に戻す」を option に入れたい場合はここで追加も可
    // const opt = document.createElement('option');
    // opt.value = '';
    // opt.textContent = 'Original / 原文 (Reset)';
    // sel.insertBefore(opt, sel.firstChild);

    // モーダルへ移植
    slot.textContent = '';
    slot.appendChild(sel);

    // 選択時に保存＆閉じる
    sel.addEventListener('change', () => {
      // Google側の値は '' or 'en' 等
      const v = sel.value || '';
      if (v) localStorage.setItem('lsLang', v);
      closeDlg();
    }, { passive: true });

    // 以前の選択を復元
    const saved = readSavedLang();
    if (saved && sel.value !== saved) {
      sel.value = saved;
      fireChange(sel);
    }

    return true;
  }

  function waitAndGraftSelect() {
    const maxWait = 8000; // 8秒で諦め
    const start = Date.now();
    const timer = setInterval(() => {
      if (graftSelect()) { clearInterval(timer); return; }
      if (Date.now() - start > maxWait) clearInterval(timer);
    }, 120);
  }

  /* ---------- 4) ユーティリティ ---------- */
  function fireChange(el) {
    const ev = document.createEvent('HTMLEvents');
    ev.initEvent('change', true, true);
    el.dispatchEvent(ev);
  }

  function clearGTCookies() {
    // GTが設定するクッキーを全パターンで消す
    try {
      const kill = (name, domain) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` + (domain ? `; domain=${domain}` : '');
      };
      const host = location.hostname.replace(/^www\./, '');
      kill('googtrans');          // カレントドメイン
      kill('googtrans', '.' + host); // ルートドメイン
      // 互換
      kill('googtrans', location.hostname);
    } catch (e) { /* noop */ }
  }

  function readSavedLang() {
    // localStorage 優先、無ければ googtrans クッキーから推測
    const v = localStorage.getItem('lsLang');
    if (v) return v;
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (m && m[1]) {
      // 形式: /ja/en など → 後半を返す
      const parts = decodeURIComponent(m[1]).split('/');
      return parts[2] || '';
    }
    return '';
  }

  /* ---------- 5) 実行 ---------- */
  loadGoogleTranslate();

  // 既存のハンバーガー開閉と被ったら地球儀を隠す（CSSでも制御）
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      // CSS側の `html.menu-open #ls-btn { opacity:0; pointer-events:none }` が効きます
      // ここでは特に処理しない（将来の拡張用）
    });
  }

  // 互換：Googleの上部バナーが出ても画面押し下げを即時戻す
  const bannerFix = () => { try { document.body.style.top = '0px'; } catch (e) {} };
  window.addEventListener('load', bannerFix);
  setTimeout(bannerFix, 1500);
})();
