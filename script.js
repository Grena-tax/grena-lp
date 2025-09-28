/* =========================================
   script.js — v3.0
   - CTAを絶対に固定（bottomはCSSのみ。JSはtransform補正だけ）
   - #scroll-root を自動挿入して実スクロールをそこで行う
   - KYC/料金のDOMは触らない（詰めはCSSで完結）
   - 言語モーダル：Googleの読込が遅い場合はフォールバックを自動注入
   ========================================= */

'use strict';

/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $ = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

/* === 1) スクロール容器 #scroll-root を作り、本文を全部入れる === */
(function mountScrollRoot(){
  if ($('#scroll-root')) return;
  const body = document.body;
  const cta  = $('.fixed-cta, .cta-bar, #ctaBar');
  const keep = new Set([cta]);

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';
  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);

  // グローバルUIは後でbody直下に生成するので退避不要
  Array.from(body.childNodes).forEach(n => {
    if (!keep.has(n) && n !== wrap) wrap.appendChild(n);
  });
})();

/* === 2) CTA高さ → 本文側の下余白（CSS変数） === */
function adjustCtaPadding(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  $('#scroll-root')?.classList.add('has-cta');
}
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* === 3) CTAを“常に”画面最下部へロック（iOSホームバー/ズームUIでのズレ補正） === */
(function lockCtaToBottomFreeze(){
  const bar = $('.fixed-cta') || $('.cta-bar') || $('#ctaBar');
  if (!bar || !window.visualViewport) return;

  const scroller = $('#scroll-root');
  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const y = scroller.scrollTop || 0;
    const isBouncingBottom = y > maxScroll + 1;

    if (!isBouncingBottom) stable = uiGap;
    const use = isBouncingBottom ? stable : uiGap;

    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };
  apply();
  visualViewport.addEventListener('resize', apply);
  visualViewport.addEventListener('scroll', apply);
  scroller.addEventListener('scroll', apply, { passive:true });
  addEventListener('orientationchange', () => setTimeout(apply, 60));
})();

/* === 4) ページ内リンクのスムーススクロール（#scroll-root基準） === */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if(!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if(!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior:'smooth', block:'start' });

  const first = target.querySelector('details');
  if (first && !/disclaimer/.test(target.id)) first.open = true;

  history.pushState(null,'',id);
});

/* === 5) トップへ === */
$('#toTop')?.addEventListener('click', (e)=>{
  if (!$('#page-top')) {
    e.preventDefault();
    const scroller = $('#scroll-root') || window;
    scroller.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
});

/* === 6) ハンバーガー開閉（既存ID想定） === */
const menuBtn     = $('#menuBtn');
const menuDrawer  = $('#menuDrawer');
const menuClose   = $('#menuClose');
const menuOverlay = $('#menuBackdrop');

const openMenu  = () => { document.documentElement.classList.add('menu-open'); menuDrawer?.setAttribute('aria-hidden','false'); menuBtn?.setAttribute('aria-expanded','true'); setTimeout(()=>menuClose?.focus(),0); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); menuDrawer?.setAttribute('aria-hidden','true');  menuBtn?.setAttribute('aria-expanded','false'); menuBtn?.focus(); };
menuBtn?.addEventListener('click', ()=> document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu());
menuClose?.addEventListener('click', closeMenu);
menuOverlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* === 7) 言語スイッチャ（地球儀＋モーダル） === */
(function initLanguageUI(){
  // ボタン
  const btn = document.createElement('button');
  btn.id = 'langBtn';
  btn.className = 'lang-btn';
  btn.type = 'button';
  btn.title = 'Language';
  btn.setAttribute('aria-haspopup','dialog');
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>`;
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
        <button id="langClose" class="lang-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="lang-body">
        <select id="langProxy" aria-label="Select Language">
          <option value="__RESET">Original / 原文 (Reset)</option>
          <option value="" disabled>Loading languages…</option>
        </select>
        <p class="lang-hint">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
      </div>
    </div>`;
  document.body.appendChild(dlg);

  const closeBtn = $('#langClose', dlg);
  const backdrop = $('#langBackdrop', dlg);
  const proxySel = $('#langProxy', dlg);

  const open = ()=>{ dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=>closeBtn?.focus(),0); };
  const close= ()=>{ dlg.removeAttribute('data-open');  dlg.setAttribute('aria-hidden','true');  btn.setAttribute('aria-expanded','false'); btn.focus(); };

  btn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? close() : open());
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  document.addEventListener('click', (e)=>{ if(!dlg.getAttribute('data-open')) return; if(e.target.closest('#langDialog')||e.target.closest('#langBtn')) return; close(); });

  // Google 本体のホスト（不可視）
  const host = document.createElement('div');
  host.id = 'google_translate_element';
  document.body.appendChild(host);

  // Google 初期化
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element');
    }catch(e){}
    cloneOptionsToProxy();
  };
  // 読込（UIは英語）
  const s = document.createElement('script');
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
  s.defer = true;
  document.head.appendChild(s);

  // コンボの中身をプロキシに複製（失敗時はフォールバック注入）
  function cloneOptionsToProxy(){
    let tries = 0, done = false;
    const fallback = [
      ['en','English'],['zh-CN','Chinese (Simplified)'],['zh-TW','Chinese (Traditional)'],
      ['ko','Korean'],['th','Thai'],['vi','Vietnamese'],['id','Indonesian'],
      ['ru','Russian'],['es','Spanish'],['fr','French'],['de','German']
    ];
    (function tick(){
      const combo = $('#google_translate_element select.goog-te-combo');
      if (!combo){
        if (tries++ < 60){ setTimeout(tick, 120); return; }
        // Fallback（60回 ≒7.2秒待っても来ないとき）
        const keepReset = proxySel.querySelector('option[value="__RESET"]');
        proxySel.innerHTML = ''; if (keepReset) proxySel.appendChild(keepReset);
        fallback.forEach(([v,t])=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; proxySel.appendChild(o); });
        wireProxy(); done = true; return;
      }
      if (done) return;
      const keepReset = proxySel.querySelector('option[value="__RESET"]');
      proxySel.innerHTML = ''; if (keepReset) proxySel.appendChild(keepReset);
      Array.from(combo.options).forEach((op,idx)=>{ if(idx===0) return; const o=document.createElement('option'); o.value=op.value; o.textContent=op.textContent; proxySel.appendChild(o); });
      wireProxy();
    })();
  }

  function getCurrentLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{ const v = decodeURIComponent(m[1]).split('/'); return v[2] || ''; }catch(_){ return ''; }
  }
  function clearGT(){
    const d = location.hostname.replace(/^www\./,'');
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }
  function wireProxy(){
    const combo = $('#google_translate_element select.goog-te-combo');
    const current = getCurrentLangFromCookie() || '';
    proxySel.value = current || '__RESET';
    proxySel.onchange = function(){
      const val = this.value;
      if (val === '__RESET'){ clearGT(); if(combo){ combo.value=''; combo.dispatchEvent(new Event('change')); } return; }
      if (combo){ combo.value = val; combo.dispatchEvent(new Event('change')); }
    };
  }

  // モーダルを開くたびに最新状態へ同期
  btn.addEventListener('click', cloneOptionsToProxy);
})();

/* === 8) 申込ボタン === */
$('#applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL,'_blank','noopener');
});

/* === 9) 免責/キャンセルの重複カット（本文側のみ残す） === */
function cutOnlyBottomDup(){
  $('#site-disclaimer')?.remove();
  $$('details.disclaimer').forEach(d=>d.remove());
  $$('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });
}
document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);
addEventListener('load', cutOnlyBottomDup);
