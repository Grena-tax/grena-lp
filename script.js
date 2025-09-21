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
    // スクロール対象は #scroll-root
    const scroller = document.getElementById('scroll-root') || window;
    if (scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
  }
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

const openMenu  = () => {
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  // A11y: 開いたら閉じるボタンへフォーカス
  setTimeout(() => closeBt?.focus(), 0);
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
  // A11y: 閉じたらトグルにフォーカスを戻す
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

  const scroller = document.getElementById('scroll-root') || document.documentElement;

  let stable = 0; // 直近の安定値
  const apply = () => {
    const vv  = window.visualViewport;

    // 端のUIが出たぶんの隙間（iOSのホームバー等）
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    // スクロール量/最大量を #scroll-root（存在時）基準に判定
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

  // 実際のスクロールイベントも拾う（#scroll-root優先）
  if (scroller && scroller.addEventListener) {
    scroller.addEventListener('scroll', apply, { passive: true });
  } else {
    window.addEventListener('scroll', apply, { passive: true });
  }

  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* ============================================================
   Language Switcher（地球儀ボタン＋モーダル）— 完全自己完結版
   - HTML/CSSは一切いじらなくてOK（このJSが注入）
   - Googleリストは英語表記（hl=en）
   - 何回でも切替可／Originalへリセット可
   ============================================================ */
(function initLanguageUI(){

  // --- 注入CSS（ボタン・モーダル） ---
  const css = `
  .lang-btn{
    position:fixed;
    top:calc(10px + env(safe-area-inset-top));
    right:calc(10px + env(safe-area-inset-right) + 48px + 14px);
    z-index:10050;
    width:48px;height:48px;border-radius:12px;
    display:inline-grid;place-items:center;
    background:#111827;color:#fff;border:1px solid rgba(255,255,255,.08);
    box-shadow:0 4px 14px rgba(0,0,0,.15);cursor:pointer
  }
  .lang-btn:active{transform:translateY(1px)}
  .lang-dialog{position:fixed;inset:0;z-index:10040;display:none;pointer-events:none}
  .lang-dialog[data-open="1"]{display:block;pointer-events:auto}
  .lang-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(1px)}
  .lang-panel{
    position:absolute;top:calc(70px + env(safe-area-inset-top));
    right:calc(10px + env(safe-area-inset-right));
    width:min(560px,92vw);max-height:min(70vh,520px);
    background:#fff;border:1px solid #e5e7eb;border-radius:12px;
    box-shadow:0 20px 50px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:auto
  }
  .lang-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid #e5e7eb}
  .lang-head strong{font-weight:800}
  .lang-close{width:36px;height:36px;border-radius:10px;border:1px solid #e5e7eb;background:#fff}
  .lang-close:hover{background:#f3f4f6}
  .lang-body{padding:12px}
  #langProxy{width:100%;height:42px;border-radius:10px;border:1px solid #d1d5db;padding:0 10px;font-size:16px}
  .lang-hint{margin-top:8px;color:#64748b;font-size:12px}
  /* 隠し本体 */
  #google_translate_element{position:fixed;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none}
  @media (max-width:480px){ .lang-btn{transform:scale(.92);transform-origin:top right} }
  `;
  const styleTag = document.createElement('style');
  styleTag.id = 'lang-style';
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // --- UI生成（地球儀ボタン＋モーダル） ---
  const btn = document.createElement('button');
  btn.id = 'langBtn';
  btn.className = 'lang-btn';
  btn.type = 'button';
  btn.title = '言語 / Language';
  btn.setAttribute('aria-haspopup','dialog');
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path>
    </svg>
  `;
  document.body.appendChild(btn);

  const dlg = document.createElement('div');
  dlg.id = 'langDialog';
  dlg.className = 'lang-dialog';
  dlg.setAttribute('aria-hidden','true');
  dlg.setAttribute('role','dialog');
  dlg.setAttribute('aria-modal','true');
  dlg.innerHTML = `
    <div class="lang-backdrop" id="langBackdrop"></div>
    <div class="lang-panel" role="document">
      <div class="lang-head">
        <strong>言語を選択 / Language</strong>
        <button id="langClose" class="lang-close" type="button" aria-label="閉じる">×</button>
      </div>
      <div class="lang-body">
        <select id="langProxy" aria-label="Select Language">
          <option value="__RESET">Original / 原文（Reset）</option>
          <option value="" disabled>Loading languages…</option>
        </select>
        <p class="lang-hint">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
      </div>
    </div>
  `;
  document.body.appendChild(dlg);

  const closeBtn = dlg.querySelector('#langClose');
  const backdrop = dlg.querySelector('#langBackdrop');
  const proxySel = dlg.querySelector('#langProxy');

  function open()  { dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=>closeBtn?.focus(),0); }
  function close() { dlg.removeAttribute('data-open');  dlg.setAttribute('aria-hidden','true');  btn.setAttribute('aria-expanded','false'); btn.focus(); }

  btn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? close() : open());
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  document.addEventListener('click', (e)=>{
    if(!dlg.getAttribute('data-open')) return;
    if(e.target.closest('#langDialog') || e.target.closest('#langBtn')) return;
    close();
  });

  // --- Google翻訳 本体の設置（隠し） ---
  const host = document.createElement('div');
  host.id = 'google_translate_element';
  document.body.appendChild(host);

  // 旧「</body>直前ブロック」が残っていたら無効化（重複対策）
  const legacy = document.getElementById('langSelectSlot');
  if (legacy) legacy.remove();

  // --- Google初期化コールバック（グローバルに必要） ---
  window.googleTranslateElementInit = function(){
    try{
      /* UI英語化のため hl=en を使用 */
      new google.translate.TranslateElement({ pageLanguage: 'ja', autoDisplay: false }, 'google_translate_element');
    }catch(e){}
    // 生成完了を待ってプロキシに一覧をクローン
    cloneOptionsToProxy();
  };

  // --- Googleスクリプト読込（UI英語表記にするため hl=en を付与） ---
  (function loadGTE(){
    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
    s.defer = true;
    document.head.appendChild(s);
  })();

  // --- プロキシセレクトへ言語を複製 ---
  function cloneOptionsToProxy(){
    let tries = 0;
    (function tick(){
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo){
        if (tries++ < 50) return setTimeout(tick, 120);
        return; // give up
      }
      // 一度だけクローン（毎回開くたびに重複しないようクリアしてから）
      const keepReset = proxySel.querySelector('option[value="__RESET"]');
      proxySel.innerHTML = '';
      if (keepReset) proxySel.appendChild(keepReset);

      Array.from(combo.options).forEach((op, idx)=>{
        // 最初の "Select Language" 的なダミーはスキップ
        if (idx === 0) return;
        const o = document.createElement('option');
        o.value = op.value;
        o.textContent = op.textContent;
        proxySel.appendChild(o);
      });

      // 現在の状態に合わせて選択表示
      const current = getCurrentLangFromCookie() || '';
      if (!current) proxySel.value = '__RESET';
      else proxySel.value = current;

      // 選択変更 → 本体へ反映
      proxySel.onchange = function(){
        const val = this.value;
        const combo = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!combo) return;
        if (val === '__RESET') {
          clearGT();
          // すぐに原文に戻す
          combo.value = '';
          combo.dispatchEvent(new Event('change'));
          return;
        }
        combo.value = val;
        combo.dispatchEvent(new Event('change'));
      };
    })();
  }

  // Cookieから現在の言語コードを読む（例：/ja/en）
  function getCurrentLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{
      const v = decodeURIComponent(m[1]);
      const parts = v.split('/');
      return parts[2] || '';
    }catch(e){ return ''; }
  }

  // 翻訳状態のクッキーを消去
  function clearGT(){
    const d = location.hostname.replace(/^www\./,'');
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }

  // モーダルを開くたびに最新の一覧/状態へ同期
  btn.addEventListener('click', cloneOptionsToProxy);

})();
