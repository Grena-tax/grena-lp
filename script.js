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
   多言語スイッチャ（強制表示・何度でも切替OK・CSS依存を排除）
   - ボタン/モーダル/隠しホストを自動生成
   - CSSが壊れても inline-style で確実に開く
   - Google翻訳の成否に関係なく UI は動作（開閉・選択）
   ========================================================= */
(function languageSwitcherSolid(){
  try {
    // --- 必要DOMを強制用意（なければ作る） ---
    function ensureMarkup(){
      // 地球儀ボタン
      let btn = document.getElementById('langBtn');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'langBtn';
        btn.type = 'button';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>';
        document.body.appendChild(btn);
      }
      // 必ず見えるように inline で上書き
      Object.assign(btn.style, {
        position:'fixed', top:'calc(10px + env(safe-area-inset-top))',
        right:'calc(10px + env(safe-area-inset-right) + 48px + 14px)',
        zIndex: '10050', width:'48px', height:'48px', borderRadius:'12px',
        display:'inline-grid', placeItems:'center',
        background:'#111827', color:'#fff',
        border:'1px solid rgba(255,255,255,.08)',
        boxShadow:'0 4px 14px rgba(0,0,0,.15)', cursor:'pointer', pointerEvents:'auto'
      });
      btn.setAttribute('aria-haspopup','dialog');
      btn.setAttribute('aria-controls','langDialog');
      btn.setAttribute('aria-expanded','false');
      btn.title = '言語 / Language';

      // モーダル
      let dlg = document.getElementById('langDialog');
      if (!dlg) {
        dlg = document.createElement('div');
        dlg.id = 'langDialog';
        dlg.innerHTML = `
          <div id="langBackdrop"></div>
          <div id="langPanel">
            <div id="langHead">
              <strong>言語を選択 / Language</strong>
              <button id="langClose" type="button" aria-label="閉じる">×</button>
            </div>
            <div id="langBody">
              <div id="langSelectSlot"></div>
              <p id="langHint">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
            </div>
          </div>
        `;
        document.body.appendChild(dlg);
      }
      // 見えるように inline でスタイル（displayは後で切替）
      Object.assign(dlg.style, {
        position:'fixed', inset:'0px', zIndex:'10040',
        display:'none', pointerEvents:'none'
      });
      const bd = document.getElementById('langBackdrop');
      Object.assign(bd.style, {
        position:'absolute', inset:'0px',
        background:'rgba(0,0,0,.35)', backdropFilter:'blur(1px)'
      });
      const panel = document.getElementById('langPanel');
      Object.assign(panel.style, {
        position:'absolute',
        top:'calc(70px + env(safe-area-inset-top))',
        right:'calc(10px + env(safe-area-inset-right))',
        width:'min(560px,92vw)', maxHeight:'min(70vh,520px)',
        background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px',
        boxShadow:'0 20px 50px rgba(0,0,0,.25)',
        display:'flex', flexDirection:'column', overflow:'auto',
        WebkitOverflowScrolling:'touch'
      });
      const head = document.getElementById('langHead');
      Object.assign(head.style, {
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:'8px', padding:'10px 12px', borderBottom:'1px solid #e5e7eb'
      });
      const close = document.getElementById('langClose');
      Object.assign(close.style, {
        width:'36px', height:'36px', borderRadius:'10px',
        border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer'
      });
      const body = document.getElementById('langBody');
      Object.assign(body.style, { padding:'10px 12px' });
      const hint = document.getElementById('langHint');
      Object.assign(hint.style, { marginTop:'8px', color:'#64748b', fontSize:'12px' });

      // 隠しホスト
      if (!document.getElementById('google_translate_element')){
        const host = document.createElement('div');
        host.id = 'google_translate_element';
        Object.assign(host.style, {
          position:'fixed', left:'-9999px', top:'-9999px',
          width:'0px', height:'0px', overflow:'hidden', opacity:'0', pointerEvents:'none'
        });
        document.body.appendChild(host);
      }
    }

    // --- ダイアログ開閉（CSSに依存しない） ---
    function openLangDialog(){
      const dlg = document.getElementById('langDialog');
      const btn = document.getElementById('langBtn');
      if (!dlg) return;
      dlg.style.display = 'block';
      dlg.style.pointerEvents = 'auto';
      btn?.setAttribute('aria-expanded','true');
      rebuildProxy(); // ここで毎回プロキシ再構築
      setTimeout(()=>document.getElementById('langClose')?.focus(),0);
    }
    function closeLangDialog(){
      const dlg = document.getElementById('langDialog');
      const btn = document.getElementById('langBtn');
      if (!dlg) return;
      dlg.style.display = 'none';
      dlg.style.pointerEvents = 'none';
      btn?.setAttribute('aria-expanded','false');
      btn?.focus();
    }

    // --- Google翻訳ロード（重複防止 & https固定） ---
    function ensureGoogleScript(){
      if (window.google && window.google.translate) return;
      if (document.getElementById('___goog_translate_lib')) return;
      const s = document.createElement('script');
      s.id = '___goog_translate_lib';
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.defer = true;
      document.head.appendChild(s);
    }

    // --- オリジナル<select>参照 ---
    const findOriginalCombo = () =>
      document.querySelector('#google_translate_element select.goog-te-combo');

    // --- cookie → 現在言語 ---
    function getLangFromCookie(){
      const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
      if (!m) return '';
      try{
        const v = decodeURIComponent(m[1]);
        const parts = v.split('/');
        return parts[parts.length - 1] || '';
      }catch(_){ return ''; }
    }

    // --- プロキシ<select>を毎回作り直し（何回でも切替OK） ---
    function rebuildProxy(){
      const slot = document.getElementById('langSelectSlot');
      if (!slot) return;

      const old = slot.querySelector('#langProxy');
      if (old) old.remove();

      const orig = findOriginalCombo();
      const proxy = document.createElement('select');
      proxy.id = 'langProxy';
      proxy.setAttribute('aria-label','言語を選択 / Select Language');
      Object.assign(proxy.style, {
        width:'100%', height:'40px', borderRadius:'8px',
        border:'1px solid #d1d5db', padding:'0 10px', fontSize:'16px'
      });

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

    // --- 実適用：毎回オリジナルへ change を伝搬 ---
    function applyLanguage(val){
      const tryApply = ()=>{
        const orig = findOriginalCombo();
        if (!orig) return false;
        if (orig.value !== val) orig.value = val;
        orig.dispatchEvent(new Event('change'));
        return true;
      };
      if (tryApply()) return;
      let tries = 0;
      const t = setInterval(()=>{
        if (tryApply() || tries++ > 40) clearInterval(t);
      }, 100);
    }

    // --- イベント（委任） ---
    document.addEventListener('click', (e)=>{
      const onBtn   = e.target.closest('#langBtn');
      const onClose = e.target.closest('#langClose');
      const dlgOpen = document.getElementById('langDialog')?.style.display === 'block';
      if (onBtn){
        e.preventDefault();
        dlgOpen ? closeLangDialog() : openLangDialog();
        return;
      }
      if (onClose){
        e.preventDefault(); closeLangDialog(); return;
      }
      const dlg = document.getElementById('langDialog');
      if (dlg && dlg.style.display === 'block' && !e.target.closest('#langPanel')){
        closeLangDialog();
      }
    });
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeLangDialog(); });

    // --- 初期化 ---
    ensureMarkup();

    // Googleの初期化CB（UIは先に開ける／翻訳は後から有効化）
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

    // cookie 変化に追従（戻した/変えたをUIに反映）
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
