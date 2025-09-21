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

/* ===== ここ重要：CTAの bottom を JS では一切いじらない ===== */

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

  if (scroller && scroller.addEventListener) {
    scroller.addEventListener('scroll', apply, { passive: true });
  } else {
    window.addEventListener('scroll', apply, { passive: true });
  }

  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* =========================================================
   多言語：何度でも切り替えできるプロキシセレクト方式
   - オリジナルの .goog-te-combo は隠しホストに保持
   - UI はクローンを使い、毎回オリジナルへ change を伝播
   ========================================================= */
(function languageSwitcherStable(){

  // 1) Google翻訳スクリプトが未読込なら読み込む（二重読込ガード）
  function ensureGoogleScript(){
    if (window.google && window.google.translate) return;
    if (document.getElementById('___goog_translate_lib')) return;
    const s = document.createElement('script');
    s.id = '___goog_translate_lib';
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.defer = true;
    document.head.appendChild(s);
  }

  // 2) オリジナルの select を探す（隠しホスト or 既存スロット）
  function findOriginalCombo(){
    return document.querySelector('#google_translate_element select.goog-te-combo') ||
           document.querySelector('#langSelectSlot select.goog-te-combo');
  }

  // 3) cookie から現在言語を読む（/ja/en みたいな形式）
  function getLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{
      const v = decodeURIComponent(m[1]);
      const parts = v.split('/');
      return parts[parts.length - 1] || '';
    }catch(_){ return ''; }
  }

  // 4) プロキシを rebuild（オプションを毎回コピー）
  function rebuildProxy(){
    const slot = document.getElementById('langSelectSlot');
    if (!slot) return;

    // 既存を掃除
    const old = slot.querySelector('#langProxy');
    if (old) old.remove();

    const orig = findOriginalCombo();
    const proxy = document.createElement('select');
    proxy.id = 'langProxy';
    proxy.setAttribute('aria-label', '言語を選択 / Select Language');
    proxy.style.width = '100%';
    proxy.style.height = '40px';
    proxy.style.borderRadius = '8px';
    proxy.style.border = '1px solid #d1d5db';
    proxy.style.padding = '0 10px';
    proxy.style.fontSize = '16px';

    // オプションを複製（存在しないときはプレースホルダ）
    if (orig && orig.options && orig.options.length){
      for (let i=0; i<orig.options.length; i++){
        const o = orig.options[i].cloneNode(true);
        proxy.appendChild(o);
      }
      // 先頭は「原文 / Original」に名称変更（valueは空のまま＝原文）
      if (proxy.options.length){
        proxy.options[0].textContent = '原文 / Original';
      }
    }else{
      const p = document.createElement('option');
      p.value = '';
      p.textContent = 'Loading languages…';
      proxy.appendChild(p);
    }

    // 現在言語に同期（cookieベース）
    const cur = getLangFromCookie();
    if (cur && Array.from(proxy.options).some(o => o.value === cur)){
      proxy.value = cur;
    }else{
      proxy.value = '';
    }

    proxy.addEventListener('change', ()=>{
      applyLanguage(proxy.value);
    });

    slot.appendChild(proxy);
  }

  // 5) 実際に言語を適用（毎回最新の orig を取り直して change 発火）
  function applyLanguage(val){
    const orig = findOriginalCombo();
    if (!orig) {
      // まだ生成前なら少し待って再試行
      let tries = 0;
      const t = setInterval(()=>{
        const o2 = findOriginalCombo();
        if (o2 || tries++ > 40){
          clearInterval(t);
          if (o2){
            o2.value = val;
            o2.dispatchEvent(new Event('change'));
          }
        }
      }, 100);
      return;
    }
    if (orig.value !== val){
      orig.value = val;
    }
    orig.dispatchEvent(new Event('change'));
  }

  // 6) モーダルの開閉に合わせて毎回 rebuild（＝何度でも確実に使える）
  (function wireModal(){
    const btn = document.getElementById('langBtn');
    const dlg = document.getElementById('langDialog');
    const close = document.getElementById('langClose');
    const backdrop = document.getElementById('langBackdrop');

    function open(){ 
      dlg?.setAttribute('data-open','1'); 
      dlg?.setAttribute('aria-hidden','false'); 
      btn?.setAttribute('aria-expanded','true'); 
      rebuildProxy();
      setTimeout(()=>close?.focus(),0); 
    }
    function closeDlg(){ 
      dlg?.removeAttribute('data-open'); 
      dlg?.setAttribute('aria-hidden','true'); 
      btn?.setAttribute('aria-expanded','false'); 
      btn?.focus(); 
    }

    btn?.addEventListener('click', ()=> (dlg?.getAttribute('data-open') ? closeDlg() : open()));
    close?.addEventListener('click', closeDlg);
    backdrop?.addEventListener('click', closeDlg);
    document.addEventListener('keydown', e => { if(e.key==='Escape') closeDlg(); });
  })();

  // 7) Google翻訳の初期化（すでに初期化済みならそのまま）
  window.googleTranslateElementInit = window.googleTranslateElementInit || function(){
    try{
      new google.translate.TranslateElement({ pageLanguage: 'ja', autoDisplay: false }, 'google_translate_element');
    }catch(_){}
    // 生成完了を待って初回プロキシ構築
    let tries = 0;
    const waiter = setInterval(()=>{
      if (findOriginalCombo() || tries++ > 40){
        clearInterval(waiter);
        rebuildProxy();
      }
    }, 100);
    // 以後、隠しホストの変化を監視 → オプションが差し替わったら再構築
    const host = document.getElementById('google_translate_element');
    if (host && 'MutationObserver' in window){
      new MutationObserver(()=>rebuildProxy())
        .observe(host, { childList:true, subtree:true });
    }
  };

  // 起動
  ensureGoogleScript();

  // ページロード後、cookie 変化に応じてプロキシ表示を追従（ゆるくポーリング）
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

})();
