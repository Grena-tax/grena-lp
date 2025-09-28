/* =========================================================
   script.js — FINAL
   - CTA固定 & iOSバウンス対策
   - ハンバーガー/地球儀 クリック安定
   - KYC↔料金の間隔はCSS側で12pxに統一
   - 言語UI（プロキシ）: 初期に“Original/原文(Reset)”を表示
   ========================================================= */

'use strict';

/* ===== 設定 ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ===== ① スクロール容器の作成（#scroll-root） ===== */
(function mountScrollRoot(){
  if ($('#scroll-root')) return;

  const body       = document.body;
  const cta        = $('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn    = $('#menuBtn');
  const menuDrawer = $('#menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  if (cta) body.insertBefore(wrap, cta);
  else body.appendChild(wrap);

  // CTA・メニューUI以外を全部 #scroll-root に移す
  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

/* ===== ② CTAの高さを本文側余白へ反映 ===== */
function adjustCtaPadding(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  const scroller = $('#scroll-root');

  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  if (scroller) scroller.classList.add('has-cta');
  else document.body.classList.add('has-cta');
}
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== ③ 「トップへ」 ===== */
$('#toTop')?.addEventListener('click', (e)=>{
  if (!$('#page-top')) {
    e.preventDefault();
    const scroller = $('#scroll-root') || window;
    scroller.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
});

/* ===== ④ 申込ボタン ===== */
$('#applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ⑤ ハンバーガー開閉 ===== */
const btn        = $('#menuBtn');
const drawer     = $('#menuDrawer');
const closeBt    = $('#menuClose');
const overlay    = $('#menuBackdrop');

function openMenu(){
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  setTimeout(()=> closeBt?.focus(), 0);
}
function closeMenu(){
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
  btn?.focus();
}
btn?.addEventListener('click', ()=> document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu());
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });

/* ===== ⑥ メニュー（ハンバーガー内）自動生成 ===== */
const groupsRoot = $('#menuGroups');
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
const slug = (t) => (t||'').toLowerCase()
  .replace(/[（）()\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

function buildMenu(){
  if (!groupsRoot) return;

  const sections = $$('section[id]');
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = $$('.accordion > details, :scope > details', sec);
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    const h2 = sec.querySelector('h2');
    if (h2 && sec.id !== 'plans'){
      const h4 = document.createElement('h4');
      h4.textContent = (h2.textContent||'').trim();
      wrap.appendChild(h4);
    }else{
      wrap.classList.add('no-title'); // plans は見出し非表示
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x=> t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({ behavior:'smooth', block:'start' });
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });

    wrap.appendChild(ul);
    frag.appendChild(wrap);
  });

  groupsRoot.textContent = '';
  groupsRoot.appendChild(frag);
}
addEventListener('DOMContentLoaded', buildMenu);

/* ===== ⑦ 言語スイッチャ（Google翻訳プロキシ） ===== */
(function initLanguageUI(){
  // CSSはstyle.cssで注入済み。ここではUI生成と本体ロードだけ。
  if ($('#langBtn')) return; // 二重生成ガード

  // 地球儀ボタン
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
    </svg>`;
  document.body.appendChild(btn);

  // モーダル
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
        <strong>Select language / 言語を選択</strong>
        <button id="langClose" class="lang-close" type="button" aria-label="閉じる">×</button>
      </div>
      <div class="lang-body">
        <select id="langProxy" aria-label="Select Language">
          <option value="__RESET" selected>Original / 原文 (Reset)</option>
        </select>
        <p class="lang-hint">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
      </div>
    </div>`;
  document.body.appendChild(dlg);

  const closeBtn = $('#langClose', dlg);
  const backdrop = $('#langBackdrop', dlg);
  const proxySel = $('#langProxy', dlg);

  function open(){ dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=> closeBtn?.focus(),0); syncProxy(); }
  function close(){ dlg.removeAttribute('data-open'); dlg.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false'); btn.focus(); }

  btn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? close() : open());
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  document.addEventListener('click', (e)=>{ if(!dlg.getAttribute('data-open')) return; if(e.target.closest('#langDialog') || e.target.closest('#langBtn')) return; close(); });

  // Google本体（隠しホスト）
  const host = document.createElement('div');
  host.id = 'google_translate_element';
  document.body.appendChild(host);

  // Googleコールバック（グローバル命名必須）
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element');
    }catch(e){}
    syncProxy(true);
  };

  // 読み込み（UI英語化のためhl=en）
  const s = document.createElement('script');
  s.id = 'ls-gte-script';
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
  s.async = true;
  document.head.appendChild(s);

  // Proxyへ言語一覧をクローン（毎回開くたび最新化）
  function syncProxy(force=false){
    let tries = 0;
    (function tick(){
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo){
        if (tries++ < 50) return setTimeout(tick, 120);
        return; // give up
      }
      // 初回 or 強制時のみ組み直し
      if (force || proxySel.options.length <= 1){
        const keepReset = proxySel.querySelector('option[value="__RESET"]') || new Option('Original / 原文 (Reset)','__RESET');
        proxySel.innerHTML = '';
        proxySel.appendChild(keepReset);

        Array.from(combo.options).forEach((op, idx)=>{
          if (idx === 0) return; // "Select Language" ダミー除外
          proxySel.appendChild(new Option(op.textContent, op.value));
        });
      }
      // Cookieから現在選択を復元
      const cur = getCurrentLangFromCookie();
      proxySel.value = cur || '__RESET';

      proxySel.onchange = function(){
        const val = this.value;
        const real = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!real) return;
        if (val === '__RESET'){ clearGT(); real.value=''; real.dispatchEvent(new Event('change')); return; }
        real.value = val; real.dispatchEvent(new Event('change'));
      };
    })();
  }

  function getCurrentLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{
      const v = decodeURIComponent(m[1]).split('/');
      return v[2] || '';
    }catch(e){ return ''; }
  }
  function clearGT(){
    const d = location.hostname.replace(/^www\\./,'');
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }
})();

/* ===== ⑧ CTAを“視覚ビューポート”に追従（上に上がって見えなくなるのを防ぐ） ===== */
(function lockCtaToBottomFreeze(){
  const bar = $('.fixed-cta') || $('.cta-bar') || $('#ctaBar');
  if (!bar || !window.visualViewport) return;

  const scroller = $('#scroll-root') || document.documentElement;
  let stable = 0;

  const apply = ()=>{
    const vv = window.visualViewport;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    const maxScroll = Math.max(0, (scroller.scrollHeight||0) - (scroller.clientHeight||0));
    const y = scroller === document.documentElement ? (window.scrollY || document.documentElement.scrollTop || 0) : (scroller.scrollTop||0);
    const bouncing = y > maxScroll + 1;

    if (!bouncing) stable = uiGap;
    const use = bouncing ? stable : uiGap;

    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize', apply);
  visualViewport.addEventListener('scroll', apply);
  scroller.addEventListener?.('scroll', apply, { passive:true });
  addEventListener('orientationchange', ()=> setTimeout(apply, 50));
})();

/* ===== 最後：安全確認（クリック阻害要素を殺す） ===== */
/* モーダル閉時は pointer-events: none（CSSで済んでいるが念のため） */
(() => {
  const dlg = $('#langDialog');
  const ensure = () => {
    if (!dlg) return;
    const open = dlg.getAttribute('data-open') === '1';
    dlg.style.pointerEvents = open ? 'auto' : 'none';
  };
  setInterval(ensure, 500);
})();
