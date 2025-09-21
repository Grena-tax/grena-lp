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

/* ===== 固定CTAの高さ → 本文余白に反映（※bottomはJSで触らない） ===== */
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
}
addEventListener('DOMContentLoaded', buildMenu);

/* ===== 重複ブロック除去（免責/キャンセルを #disclaimer だけに揃える） ===== */
function cutOnlyBottomDup() {
  document.getElementById('site-disclaimer')?.remove();
  document.querySelectorAll('details.disclaimer').forEach(d => d.remove());
  document.querySelectorAll('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !t.includes('キャンセル') && !d.closest('#disclaimer')) d.remove();
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

/* === 追加②：UI縮み追従だけtransformで相殺（bounce中は凍結） === */
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
    let y = (scroller === document.documentElement || scroller === document.body)
      ? (window.scrollY || document.documentElement.scrollTop || 0)
      : (scroller.scrollTop || 0);

    const isBouncingBottom = y > maxScroll + 1;
    if (!isBouncingBottom) stable = uiGap;

    const use = isBouncingBottom ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize',  apply);
  visualViewport.addEventListener('scroll',  apply);
  (scroller.addEventListener ? scroller : window).addEventListener('scroll', apply, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* =========================================================
   多言語（自己修復・何度でも切替OK）
   - 必要なHTML/CSSが無ければ自動生成
   - クリックはイベント委任で確実に拾う（IDズレ/生成順の影響なし）
   - UIはプロキシ<select>で操作→毎回オリジナルへchange伝搬
   ========================================================= */
(function languageSwitcherSelfHealing(){
  try {

    // 0) 必要なHTML/CSSを自動生成（無い場合のみ）
    function ensureLangMarkup(){
      const head = document.head || document.getElementsByTagName('head')[0];
      if (!document.getElementById('lang-style')) {
        const css = document.createElement('style');
        css.id = 'lang-style';
        css.textContent = `
          .lang-btn{
            position:fixed; top:calc(10px + env(safe-area-inset-top));
            right:calc(10px + env(safe-area-inset-right) + 48px + 14px);
            z-index:10050 !important; width:48px;height:48px;border-radius:12px;
            display:inline-grid;place-items:center;background:#111827;color:#fff;
            border:1px solid rgba(255,255,255,.08); box-shadow:0 4px 14px rgba(0,0,0,.15);
            cursor:pointer; pointer-events:auto;
          }
          .lang-btn:active{ transform:translateY(1px) }
          .lang-dialog{ position:fixed; inset:0; z-index:10040; display:none; pointer-events:none }
          .lang-dialog[data-open="1"]{ display:block; pointer-events:auto }
          .lang-backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.35); backdrop-filter:blur(1px); }
          .lang-panel{
            position:absolute; top:calc(70px + env(safe-area-inset-top));
            right:calc(10px + env(safe-area-inset-right));
            width:min(560px,92vw); max-height:min(70vh,520px);
            background:#fff; border:1px solid #e5e7eb; border-radius:12px;
            box-shadow:0 20px 50px rgba(0,0,0,.25); display:flex; flex-direction:column; overflow:auto;
            -webkit-overflow-scrolling:touch;
          }
          .lang-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 12px; border-bottom:1px solid #e5e7eb }
          .lang-head strong{ font-weight:800 }
          .lang-close{ width:36px; height:36px; border-radius:10px; border:1px solid #e5e7eb; background:#fff }
          .lang-close:hover{ background:#f3f4f6 }
          .lang-body{ padding:10px 12px }
          #langSelectSlot select{
            width:100%; height:40px; border-radius:8px; border:1px solid #d1d5db; padding:0 10px; font-size:16px;
          }
          .lang-hint{ margin-top:8px; color:#64748b; font-size:12px }
          #google_translate_element{ position:fixed; left:-9999px; top:-9999px; width:0; height:0; overflow:hidden; opacity:0; pointer-events:none }
          @media (max-width:480px){ .lang-btn{ transform:scale(.92); transform-origin:top right } }
          .menu-button{ z-index:10000; }
        `;
        head.appendChild(css);
      }

      if (!document.getElementById('langBtn')) {
        const btn = document.createElement('button');
        btn.id = 'langBtn';
        btn.className = 'lang-btn';
        btn.type = 'button';
        btn.title = '言語 / Language';
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.setAttribute('aria-controls', 'langDialog');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
          </svg>
        `;
        document.body.appendChild(btn);
      }

      if (!document.getElementById('langDialog')) {
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
              <div id="langSelectSlot"></div>
              <p class="lang-hint">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
            </div>
          </div>
        `;
        document.body.appendChild(dlg);
      }

      if (!document.getElementById('google_translate_element')) {
        const host = document.createElement('div');
        host.id = 'google_translate_element';
        host.setAttribute('aria-hidden','true');
        document.body.appendChild(host);
      }
    }

    // 1) Google翻訳スクリプト読み込み（重複防止）
    function ensureGoogleScript(){
      if (window.google && window.google.translate) return;
      if (document.getElementById('___goog_translate_lib')) return;
      const s = document.createElement('script');
      s.id = '___goog_translate_lib';
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.defer = true;
      document.head.appendChild(s);
    }

    // 2) オリジナル<select>の参照
    function findOriginalCombo(){
      return document.querySelector('#google_translate_element select.goog-te-combo');
    }

    // 3) cookie から現言語
    function getLangFromCookie(){
      const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
      if (!m) return '';
      try{
        const v = decodeURIComponent(m[1]);
        const parts = v.split('/');
        return parts[parts.length - 1] || '';
      }catch(_){ return ''; }
    }

    // 4) プロキシ<select>の再生成
    function rebuildProxy(){
      const slot = document.getElementById('langSelectSlot');
      if (!slot) return;

      const old = slot.querySelector('#langProxy');
      if (old) old.remove();

      const orig = findOriginalCombo();
      const proxy = document.createElement('select');
      proxy.id = 'langProxy';
      proxy.setAttribute('aria-label', '言語を選択 / Select Language');

      if (orig && orig.options && orig.options.length){
        for (let i=0; i<orig.options.length; i++){
          proxy.appendChild(orig.options[i].cloneNode(true));
        }
        if (proxy.options.length){
          proxy.options[0].textContent = '原文 / Original';
        }
      }else{
        const p = document.createElement('option');
        p.value = '';
        p.textContent = 'Loading languages…';
        proxy.appendChild(p);
      }

      const cur = getLangFromCookie();
      if (cur && Array.from(proxy.options).some(o => o.value === cur)){
        proxy.value = cur;
      }else{
        proxy.value = '';
      }

      proxy.addEventListener('change', ()=> applyLanguage(proxy.value));
      slot.appendChild(proxy);
    }

    // 5) 実適用：毎回オリジナルを取り直して change 発火
    function applyLanguage(val){
      const tryApply = ()=>{
        const orig = findOriginalCombo();
        if (!orig) return false;
        if (orig.value !== val) orig.value = val;
        orig.dispatchEvent(new Event('change'));
        return true;
      };
      if (tryApply()) return;
      // まだ生成前なら待機
      let tries = 0;
      const t = setInterval(()=>{
        if (tryApply() || tries++ > 40) clearInterval(t);
      }, 100);
    }

    // 6) モーダルの開閉（イベント委任で“必ず拾う”）
    function openLangDialog(){
      const dlg = document.getElementById('langDialog');
      const btn = document.getElementById('langBtn');
      dlg?.setAttribute('data-open','1');
      dlg?.setAttribute('aria-hidden','false');
      btn?.setAttribute('aria-expanded','true');
      rebuildProxy();
      setTimeout(()=>document.getElementById('langClose')?.focus(),0);
    }
    function closeLangDialog(){
      const dlg = document.getElementById('langDialog');
      const btn = document.getElementById('langBtn');
      dlg?.removeAttribute('data-open');
      dlg?.setAttribute('aria-hidden','true');
      btn?.setAttribute('aria-expanded','false');
      btn?.focus();
    }

    // ——— イベント委任（ここがポイント） ———
    document.addEventListener('click', (e)=>{
      const onBtn = e.target.closest('#langBtn, .lang-btn');
      if (onBtn){
        e.preventDefault();
        if (document.getElementById('langDialog')?.getAttribute('data-open')) {
          closeLangDialog();
        } else {
          openLangDialog();
        }
        return;
      }
      const onClose = e.target.closest('#langClose');
      if (onClose){
        e.preventDefault();
        closeLangDialog();
        return;
      }
      const dlg = document.getElementById('langDialog');
      if (dlg?.getAttribute('data-open') && !e.target.closest('#langDialog')){
        closeLangDialog();
      }
    });

    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeLangDialog(); });

    // 7) 初期化
    ensureLangMarkup();
    // Google翻訳の初期化コールバック
    window.googleTranslateElementInit = window.googleTranslateElementInit || function(){
      try{
        new google.translate.TranslateElement({ pageLanguage: 'ja', autoDisplay: false }, 'google_translate_element');
      }catch(_){}
      let tries = 0;
      const waiter = setInterval(()=>{
        if (findOriginalCombo() || tries++ > 40){
          clearInterval(waiter);
          rebuildProxy();
        }
      }, 100);

      const host = document.getElementById('google_translate_element');
      if (host && 'MutationObserver' in window){
        new MutationObserver(()=>rebuildProxy()).observe(host, { childList:true, subtree:true });
      }
    };
    ensureGoogleScript();

    // cookie 変化をゆるく追従（手動で戻した時もUIに反映）
    let last = getLangFromCookie();
    setInterval(()=>{
      const cur = getLangFromCookie();
      if (cur !== last){
        last = cur;
        const proxy = document.getElementById('langProxy');
        if (proxy && Array.from(proxy.options).some(o => o.value === cur)){
          proxy.value = cur;
        }else if (proxy){
          proxy.value = '';
        }
      }
    }, 800);

  } catch (err) {
    console.error('Language switcher init error:', err);
  }
})();
