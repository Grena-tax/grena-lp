/* =========================================
   script.js — v3.2 (CTA lock, menu builder, language UI)
   ========================================= */
'use strict';

/* ====== 定数 ====== */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ====== 小ユーティリティ ====== */
const slug = (t)=> (t||'').toLowerCase()
  .replace(/[（）()\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* ====== 画面固定＋スクロール容器作成 ====== */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;

  const body = document.body;
  const cta  = document.querySelector('.cta-bar, .fixed-cta, #ctaBar');
  const keep = new Set([cta]);

  // スクロール容器
  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  // 先頭に本文とUIのスペーサーを挿入（フローティングUIと被らない）
  const spacer = document.createElement('div');
  spacer.className = 'top-spacer';
  wrap.appendChild(spacer);

  // CTA より上に入れる
  cta ? body.insertBefore(wrap, cta) : body.appendChild(wrap);

  // 既存ノードを #scroll-root へ（CTAとメニュー/言語UIは除外）
  const uiIds = ['menuBtn','menuDrawer','langBtn','langDialog'];
  Array.from(body.childNodes).forEach(n=>{
    if (n.nodeType !== 1) return; // elementのみ
    if (keep.has(n)) return;
    if (uiIds.some(id => n.id === id || (n.querySelector && n.querySelector('#'+id)))) return;
    wrap.appendChild(n);
  });
})();

/* ====== CTA の高さ → 本文余白へ反映（bottomはCSSで固定） ====== */
function adjustCtaPadding(){
  const bar = document.querySelector('.cta-bar, .fixed-cta, #ctaBar');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h+'px');
  const scroller = document.getElementById('scroll-root');
  scroller && scroller.classList.add('has-cta');
}
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ====== 「トップへ」 ====== */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    const sc = document.getElementById('scroll-root') || window;
    sc.scrollTo?.({ top:0, behavior:'smooth' });
  }
});

/* ====== 申込ボタン ====== */
document.getElementById('applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ====== ハンバーガー開閉 ====== */
const btn        = document.getElementById('menuBtn');
const drawer     = document.getElementById('menuDrawer');
const closeBt    = document.getElementById('menuClose') || drawer?.querySelector('[data-close]');
const overlay    = document.getElementById('menuBackdrop') || drawer?.querySelector('.backdrop');
const groupsRoot = document.getElementById('menuGroups'); // 無ければ後で作る

const openMenu = () => {
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  setTimeout(()=> closeBt?.focus(), 0);
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
  btn?.focus();
};
btn?.addEventListener('click', ()=> document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu());
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ====== メニュー（ハンバーガー内）自動生成（無ければ差し込み） ====== */
const EXCLUDE = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

function ensureMenuRoot(){
  if (document.getElementById('menuGroups')) return document.getElementById('menuGroups');
  if (!drawer) return null;
  const host = drawer.querySelector('.menu-body') || drawer;
  const div = document.createElement('div');
  div.id = 'menuGroups';
  host.appendChild(div);
  return div;
}

function buildMenu(){
  const host = ensureMenuRoot();
  if (!host) return;

  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    const h2 = sec.querySelector(':scope > h2');
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
      const s = d.querySelector(':scope > summary');
      const text = s?.textContent?.trim() || '';
      if (EXCLUDE.some(x=> text.includes(x))) return;

      if (!d.id) d.id = `acc-${i++}-${slug(text) || 'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = text;
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

  host.textContent = '';
  host.appendChild(frag);
}
addEventListener('DOMContentLoaded', buildMenu);

/* ====== KYC ↔ 料金のギャップ最終ガード（計算でズレても正す） ====== */
function normalizeKycPlansGap(){
  const a = document.getElementById('corp-setup');
  const b = document.getElementById('plans');
  if (!a || !b) return;
  // 期待値 12px
  const desired = 12;
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();
  if (rectB.top - rectA.bottom !== desired){
    b.style.marginTop = desired + 'px';
  }
}
addEventListener('load', normalizeKycPlansGap);
addEventListener('resize', normalizeKycPlansGap);

/* ====== Language Switcher（地球儀ボタン＋モーダル） ====== */
(function initLanguageUI(){
  // 既に作成済みなら抜ける
  if (document.getElementById('langBtn')) return;

  // ボタン
  const btn = document.createElement('button');
  btn.id = 'langBtn'; btn.className = 'lang-btn floating-ui'; btn.type = 'button';
  btn.title = '言語 / Language'; btn.setAttribute('aria-haspopup','dialog'); btn.setAttribute('aria-expanded','false');
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>`;
  document.body.appendChild(btn);

  // ダイアログ
  const dlg = document.createElement('div');
  dlg.id = 'langDialog'; dlg.className = 'lang-dialog'; dlg.setAttribute('aria-hidden','true'); dlg.setAttribute('role','dialog'); dlg.setAttribute('aria-modal','true');
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

  const closeBtn = dlg.querySelector('#langClose');
  const backdrop = dlg.querySelector('#langBackdrop');
  const proxySel = dlg.querySelector('#langProxy');

  function open(){ dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=> closeBtn?.focus(),0); cloneOptionsToProxy(true); }
  function close(){ dlg.removeAttribute('data-open'); dlg.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false'); btn.focus(); }

  btn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? close() : open());
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });

  // Google本体（hidden host）
  const host = document.createElement('div'); host.id = 'google_translate_element'; document.body.appendChild(host);

  // Google callback
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element');
    }catch(e){}
    cloneOptionsToProxy(false);
  };

  // loader
  const s = document.createElement('script');
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
  s.defer = true; document.head.appendChild(s);

  // プロキシへオプション複製
  function cloneOptionsToProxy(force){
    let tries = 0;
    (function tick(){
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo){
        if (tries++ < 60){ setTimeout(tick, 120); return; }
        return;
      }
      if (!force && proxySel.options.length > 1) return; // 既に複製済み

      const keepReset = proxySel.querySelector('option[value="__RESET"]');
      proxySel.innerHTML = ''; if (keepReset) proxySel.appendChild(keepReset);

      Array.from(combo.options).forEach((op, idx)=>{
        if (idx===0) return;
        const o = document.createElement('option');
        o.value = op.value; o.textContent = op.textContent;
        proxySel.appendChild(o);
      });

      // 現在の言語状態に追従
      const lang = getCurrentLangFromCookie();
      proxySel.value = lang || '__RESET';

      // 変更 → 本体反映
      proxySel.onchange = function(){
        const val = this.value;
        const combo = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!combo) return;
        if (val === '__RESET'){ clearGT(); combo.value=''; combo.dispatchEvent(new Event('change')); return; }
        combo.value = val; combo.dispatchEvent(new Event('change'));
      };
    })();
  }

  function getCurrentLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{ const v = decodeURIComponent(m[1]).split('/'); return v[2] || ''; }catch(e){ return ''; }
  }
  function clearGT(){
    const d = location.hostname.replace(/^www\./,'');
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }
})();
/* --- FINAL PATCH (place LAST) --- */
(function(){
  const scroller = document.getElementById('scroll-root');
  if (!scroller) return;

  /* フローティングUIは必ず<body>直下へ退避（押せなくなるのを防止） */
  ['langBtn','langDialog','menuBtn','menuDrawer'].forEach(id=>{
    const el = document.getElementById(id);
    if (el && scroller.contains(el)) document.body.appendChild(el);
  });

  /* トップ用スペーサー（UIと本文の被り防止） */
  if (!scroller.querySelector('.top-spacer')){
    const s = document.createElement('div');
    s.className = 'top-spacer';
    scroller.prepend(s);
  }

  /* CTA 高さを計測して本文側に反映（bottomはCSSで固定） */
  function adjustCta(){
    const bar = document.querySelector('.cta-bar, .fixed-cta, #ctaBar');
    if (!bar) return;
    const h = Math.ceil(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--cta-h', h + 'px');
    scroller.classList.add('has-cta');
  }
  window.addEventListener('load', adjustCta);
  window.addEventListener('resize', adjustCta);

  /* KYC ↔ 料金の最終ガード：12pxに矯正 */
  function fixGap(){
    const a = document.getElementById('corp-setup');
    const b = document.getElementById('plans');
    if (!(a && b)) return;
    b.style.marginTop = '12px';
  }
  window.addEventListener('load', fixGap);
  window.addEventListener('resize', fixGap);
})();
