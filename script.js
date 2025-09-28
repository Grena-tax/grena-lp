/* =====================================================
   script.js — COMPLETE v3.2
   - #scroll-root 化（iOSラバーバンド安定）
   - ハンバーガー生成/操作
   - 固定CTA高さの反映
   - Language Switcher（Google Website Translator）
   ===================================================== */

'use strict';

/* ===== 申込フォームURL（必要に応じて変更） ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $ = (sel, root=document)=>root.querySelector(sel);

/* === 1) スクロール容器を #scroll-root に集約 ======================= */
(function mountScrollRoot(){
  if ($('#scroll-root')) return;

  const body = document.body;
  const cta  = $('.fixed-cta') || $('.cta-bar') || $('#ctaBar');
  const menuBtn = $('#menuBtn');
  const menuDrawer = $('#menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  // CTAの直前に挿入（無ければ末尾）
  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);

  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

/* ===== ページ内リンク（スムーススクロール） ===== */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior:'smooth', block:'start' });

  // #disclaimer 以外は先頭を自動で開く
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null,'',id);
});

/* ===== 「トップへ」 ===== */
$('#toTop')?.addEventListener('click',(e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    const scroller = $('#scroll-root') || window;
    if (scroller.scrollTo) scroller.scrollTo({ top:0, behavior:'smooth' });
  }
});

/* ===== 固定CTAの高さ → 変数 --cta-h に反映 ======================== */
function adjustCtaPadding(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  const scroller = $('#scroll-root');
  if (scroller) scroller.classList.add('has-cta'); else document.body.classList.add('has-cta');
}
addEventListener('DOMContentLoaded', adjustCtaPadding);
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン ===== */
$('#applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー開閉（既存HTMLを利用） ========================== */
const btn        = $('#menuBtn');
const drawer     = $('#menuDrawer');
const closeBt    = $('#menuClose');
const overlay    = $('#menuBackdrop');
const groupsRoot = $('#menuGroups');

function openMenu(){
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  setTimeout(()=>closeBt?.focus(),0);
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

/* ===== メニュー（項目リスト自動生成） ============================== */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
const slug = (t)=> (t||'').toLowerCase().replace(/[（）()\[\]【】]/g,' ').replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');

function buildMenu(){
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment(); let i=1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    const h2 = sec.querySelector('h2');
    if (h2 && sec.id !== 'plans'){
      const h4=document.createElement('h4'); h4.textContent=(h2.textContent||'').trim(); wrap.appendChild(h4);
    } else { wrap.classList.add('no-title'); }

    const ul=document.createElement('ul'); ul.className='menu-list';

    details.forEach(d=>{
      const s=d.querySelector('summary'); const t=s?.textContent?.trim()||'項目';
      if (excludeTitles.some(x=>t.includes(x))) return;
      if (!d.id) d.id=`acc-${i++}-${slug(t)||'item'}`;

      const li=document.createElement('li'); const a=document.createElement('a');
      a.href=`#${d.id}`; a.textContent=t;
      a.addEventListener('click',(e)=>{ e.preventDefault(); closeMenu(); d.open=true; d.scrollIntoView({behavior:'smooth',block:'start'}); history.pushState(null,'',`#${d.id}`); });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  if (!groupsRoot) return;
  groupsRoot.textContent=''; groupsRoot.appendChild(frag);
}
addEventListener('DOMContentLoaded', buildMenu);

/* ===== Language Switcher（Google Website Translator） ============== */
(function initLanguageUI(){
  // ボタン（既にHTMLにある .ls-btn を再利用、無い場合は生成）
  let btn = document.getElementById('ls-btn');
  if (!btn){
    btn = document.createElement('button');
    btn.id='ls-btn'; btn.className='ls-btn'; btn.type='button'; btn.title='Select language / 言語を選択';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>';
    document.body.appendChild(btn);
  }

  // モーダル（軽量版）
  const dlg = document.createElement('div');
  dlg.className='ls-dlg'; dlg.id='ls-dlg'; dlg.setAttribute('aria-hidden','true'); dlg.setAttribute('role','dialog'); dlg.setAttribute('aria-modal','true');
  dlg.innerHTML = `
    <div class="ls-back" id="ls-back" style="position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(1px)"></div>
    <div class="ls-panel" role="document" style="position:fixed;top:calc(70px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));width:min(560px,92vw);max-height:min(70vh,520px);overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,.25)">
      <div class="ls-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid #e5e7eb">
        <strong>Select language / 言語を選択</strong>
        <button id="ls-close" class="ls-close" type="button" aria-label="閉じる" style="width:36px;height:36px;border-radius:10px;border:1px solid #e5e7eb;background:#fff">×</button>
      </div>
      <div class="ls-body" style="padding:10px 12px">
        <select id="ls-proxy" aria-label="Select Language" style="width:100%;height:42px;border-radius:10px;border:1px solid #d1d5db;padding:0 10px;font-size:16px">
          <option value="__RESET">Original / 原文 (Reset)</option>
          <option value="" disabled>Loading languages…</option>
        </select>
        <p class="ls-hint" style="margin-top:8px;color:#64748b;font-size:12px">Select a language and the page will translate. / リストから選ぶと即時翻訳されます。</p>
      </div>
    </div>`;
  document.body.appendChild(dlg);

  const back = $('#ls-back', dlg), close = $('#ls-close', dlg), proxy = $('#ls-proxy', dlg);
  const open = ()=>{ dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=>close?.focus(),0); };
  const hide = ()=>{ dlg.removeAttribute('data-open'); dlg.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false'); };

  btn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? hide() : open());
  back.addEventListener('click', hide); close.addEventListener('click', hide);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') hide(); });

  // Google本体（画面外）
  if (!$('#google_translate_element')){
    const host = document.createElement('div'); host.id='google_translate_element'; document.body.appendChild(host);
  }

  // 初期化コールバック
  window.googleTranslateElementInit = function(){
    new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element');
    cloneOptions();
  };

  // 読み込み
  if (!$('#ls-gte')){
    const s=document.createElement('script'); s.id='ls-gte';
    s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en'; s.async=true;
    document.head.appendChild(s);
  }

  // プロキシへ複製
  function cloneOptions(){
    let tries=0;
    (function tick(){
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo){ if (tries++<60) return setTimeout(tick,120); else return; }

      const keep = proxy.querySelector('option[value="__RESET"]');
      proxy.innerHTML=''; if (keep) proxy.appendChild(keep);

      Array.from(combo.options).forEach((op,idx)=>{
        if (idx===0) return; const o=document.createElement('option');
        o.value=op.value; o.textContent=op.textContent; proxy.appendChild(o);
      });

      // Cookieに合わせて現在値を同期
      const ck = (document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1];
      const cur = ck ? decodeURIComponent(ck).split('/').pop() : '';
      proxy.value = cur || '__RESET';

      proxy.onchange = function(){
        const v = this.value;
        const real = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!real) return;
        if (v==='__RESET'){ real.value=''; real.dispatchEvent(new Event('change')); return; }
        real.value=v; real.dispatchEvent(new Event('change'));
      };
    })();
  }

  // 開く度に最新を反映
  btn.addEventListener('click', cloneOptions);
})();
/* ===== CTA HARD-LOCK SUPPORT (height only, no movement) ===== */
(function hardLockCTA(){
  const bar = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  if (!bar) return;

  // 高さを CSS 変数 --cta-h に反映（本文側の下余白に使用）
  const set = () => {
    const h = Math.ceil(bar.getBoundingClientRect().height || 72);
    document.documentElement.style.setProperty('--cta-h', h + 'px');
    document.body.classList.add('has-cta');
    const scroller = document.getElementById('scroll-root');
    if (scroller) scroller.classList.add('has-cta');
  };

  set();
  addEventListener('load', set);
  addEventListener('resize', set);
  if (window.ResizeObserver){
    new ResizeObserver(set).observe(bar);
  }

  // もし過去コードが transform を当てても即座に打ち消す
  const cancel = () => { if (bar.style.transform) bar.style.transform = 'none'; };
  setInterval(cancel, 250); // 軽量ポーリング（位置はCSSが支配）
})();
/* KYC(#corp-setup) ⇄ 料金(#plans) の間隔を単一ルールで固定 */
#corp-setup{ padding-bottom:0 !important; }
#plans{ padding-top:0 !important; }
#corp-setup .accordion > details:last-child{ margin-bottom:0 !important; }
#plans      .accordion > details:first-child{ margin-top:0 !important; }
#corp-setup + #plans{ margin-top:12px !important; }      /* PC/標準 */
@media (max-width:480px){
  #corp-setup + #plans{ margin-top:8px !important; }     /* SP */
}
/* 末尾セクションがCTAに隠れない（スクロール余白） */
#disclaimer{ scroll-margin-bottom: calc(var(--cta-h,72px) + 12px); }
