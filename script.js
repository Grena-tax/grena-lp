/* =========================================
   script.js — v3.2 STABLE
   - CTA完全固定（rubber-bandでも浮かない）
   - ハンバーガー & 地球儀は常にタップ可
   - 言語モーダル：確実にリスト表示（遅延ロード対応）
   - 目次（ハンバーガー内）に #disclaimer も出す
   ========================================= */

'use strict';

/* ===== 設定 ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const slug = t => (t||'').toLowerCase()
  .replace(/[（）()[\]【】]/g,' ').replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* ===== ① スクロール容器 #scroll-root を作る（HTMLは無改変） ===== */
(function mountScrollRoot(){
  if ($('#scroll-root')) return;

  const body = document.body;
  const cta  = $('.fixed-cta, .cta-bar, #ctaBar');
  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  // CTAより上に差し込む
  cta ? body.insertBefore(wrap, cta) : body.appendChild(wrap);

  // CTA・メニューUI以外は全部 #scroll-root へ
  const keep = new Set([cta, wrap, $('#menuBtn'), $('#menuDrawer')]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

/* ===== ② CTA高さを計測して本文側の下余白に反映 ===== */
function adjustCtaPadding(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  const scroller = $('#scroll-root');
  if (scroller) scroller.classList.add('has-cta'); else document.body.classList.add('has-cta');
}
addEventListener('load', adjustCtaPadding, { once:true });
addEventListener('resize', adjustCtaPadding);

/* ===== ③ iOS rubber-band 中でも CTA を底に据え付け（bottomは触らない） ===== */
(function lockCtaToBottomFreeze(){
  const bar = $('.fixed-cta') || $('.cta-bar') || $('#ctaBar');
  if (!bar || !window.visualViewport) return;

  const scroller = $('#scroll-root') || document.documentElement;
  let stable = 0;

  const apply = () => {
    const vv = window.visualViewport;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop); // 端末UIぶん
    // #scroll-root を基準に “一番下を超えてバウンスしてるか” を判定
    const maxScroll = Math.max(0, (scroller.scrollHeight||0) - (scroller.clientHeight||0));
    const y = (scroller === document.documentElement || scroller === document.body)
      ? (window.scrollY || document.documentElement.scrollTop || 0)
      : scroller.scrollTop || 0;
    const bouncing = y > maxScroll + 1;
    if (!bouncing) stable = uiGap;
    const use = bouncing ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize', apply);
  visualViewport.addEventListener('scroll', apply);
  scroller.addEventListener('scroll', apply, { passive:true });
  addEventListener('orientationchange', () => setTimeout(apply, 60));
})();

/* ===== ④ 「トップへ」 ===== */
$('#toTop')?.addEventListener('click', e=>{
  if (!$('#page-top')) {
    e.preventDefault();
    const scroller = $('#scroll-root') || window;
    scroller.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
});

/* ===== ⑤ 申込ボタン ===== */
$('#applyNow')?.addEventListener('click', e=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ⑥ ハンバーガー開閉（ボタンのタップ優先度を上げる） ===== */
const menuBtn     = $('#menuBtn');
const menuDrawer  = $('#menuDrawer');
const menuClose   = $('#menuClose');
const menuBackdrop= $('#menuBackdrop');

function openMenu(){
  document.documentElement.classList.add('menu-open');
  menuDrawer?.setAttribute('aria-hidden','false');
  menuBtn?.setAttribute('aria-expanded','true');
  setTimeout(()=>menuClose?.focus(),0);
}
function closeMenu(){
  document.documentElement.classList.remove('menu-open');
  menuDrawer?.setAttribute('aria-hidden','true');
  menuBtn?.setAttribute('aria-expanded','false');
  menuBtn?.focus();
}
menuBtn?.addEventListener('click', ()=> document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu());
menuClose?.addEventListener('click', closeMenu);
menuBackdrop?.addEventListener('click', closeMenu);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });

/* ===== ⑦ 目次（ハンバーガー内）自動生成：#disclaimer も含める ===== */
const groupsRoot = $('#menuGroups');
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック']; // 除外したい行だけ

function buildMenu(){
  if (!groupsRoot) return;
  const sections = $$('section[id]');
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = $$(':scope > .accordion > details, :scope > details', sec);
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    const h2 = $('h2', sec);
    if (h2 && sec.id !== 'plans'){
      const h4 = document.createElement('h4');
      h4.textContent = (h2.textContent||'').trim();
      wrap.appendChild(h4);
    }else{
      wrap.classList.add('no-title');
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = $('summary', d);
      const t = (s?.textContent || '').trim();
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click', e=>{
        e.preventDefault(); closeMenu();
        d.open = true;
        d.scrollIntoView({ behavior:'smooth', block:'start' });
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul);
    frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
}
addEventListener('DOMContentLoaded', buildMenu);

/* ===== ⑧ ページ内リンク（#xxx へスムーススクロール） ===== */
document.addEventListener('click', e=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior:'smooth', block:'start' });
  const first = target.querySelector('details');
  if (first && !first.open && target.id !== 'disclaimer') first.open = true;
  history.pushState(null,'',id);
});

/* ===== ⑨ 言語スイッチャ（地球儀ボタン + モーダル + Google翻訳ラッパ） ===== */
(function initLanguageUI(){
  // 地球儀ボタン（既存がなければ生成）
  let langBtn = document.querySelector('.lang-btn');
  if (!langBtn){
    langBtn = document.createElement('button');
    langBtn.className = 'lang-btn';
    langBtn.type = 'button';
    langBtn.title = '言語 / Language';
    langBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path>
      </svg>`;
    document.body.appendChild(langBtn);
  }

  // モーダル
  const dlg = document.createElement('div');
  dlg.id = 'langDialog';
  dlg.className = 'lang-dialog';
  dlg.setAttribute('aria-hidden','true');
  dlg.innerHTML = `
    <div class="lang-backdrop" id="langBackdrop"></div>
    <div class="lang-panel" role="document">
      <div class="lang-head">
        <strong>Select language / 言語を選択</strong>
        <button id="langClose" class="lang-close" type="button" aria-label="閉じる">×</button>
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

  const open = () => { dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); langBtn.setAttribute('aria-expanded','true'); setTimeout(()=>closeBtn?.focus(),0); syncProxy(); };
  const close= () => { dlg.removeAttribute('data-open'); dlg.setAttribute('aria-hidden','true'); langBtn.setAttribute('aria-expanded','false'); langBtn.focus(); };

  langBtn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? close() : open());
  closeBtn.addEventListener('click', close); backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });

  // Google本体（隠しコンテナ）
  const host = document.createElement('div'); host.id = 'google_translate_element'; document.body.appendChild(host);

  // Google初期化コールバック（グローバル必須）
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element');
    }catch(e){}
    // 生成完了を待ってプロキシに複製
    ensureComboReady(syncProxy);
  };

  // スクリプト読込（UI英語）
  const s = document.createElement('script');
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
  s.defer = true;
  document.head.appendChild(s);

  /* == 内部関数 == */
  function ensureComboReady(cb){
    let tries = 0;
    (function wait(){
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo || !combo.options?.length){
        if (tries++ < 80) return setTimeout(wait, 120);
        return; // give up
      }
      cb && cb();
    })();
  }

  function getCurrentLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{
      const v = decodeURIComponent(m[1]);
      const p = v.split('/');
      return p[2] || '';
    }catch(_){ return ''; }
  }

  function clearGT(){
    const d = location.hostname.replace(/^www\./,'');
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }

  function syncProxy(){
    const combo = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!combo) return;

    // 1回だけ複製（原文の option は維持）
    const keep0 = proxySel.querySelector('option[value="__RESET"]');
    proxySel.innerHTML = '';
    if (keep0) proxySel.appendChild(keep0);

    Array.from(combo.options).forEach((op, idx)=>{
      if (idx === 0) return; // dummy
      const o = document.createElement('option');
      o.value = op.value; o.textContent = op.textContent;
      proxySel.appendChild(o);
    });

    // 現在状態を反映
    const current = getCurrentLangFromCookie() || '';
    proxySel.value = current ? current : '__RESET';

    // 変更 → 本体へ伝播
    proxySel.onchange = function(){
      const v = this.value;
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo) return;
      if (v === '__RESET'){
        clearGT();
        combo.value = '';
        combo.dispatchEvent(new Event('change'));
        return;
      }
      combo.value = v;
      combo.dispatchEvent(new Event('change'));
    };
  }
})();

/* ===== ⑩ KYC と 料金の余白は CSS で完全詰め、ここでは保険 ===== */
(function tightenKycPlans(){
  const a = $('#corp-setup + #plans');
  if (a) a.style.marginTop = '-8px';
})();
