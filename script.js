/* =========================================
   script.js — FINAL v4
   ========================================= */

/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === ① スクロール容器 #scroll-root を作成（本文はすべてここに移す） === */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;
  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);

  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => {
    if (!keep.has(n)) wrap.appendChild(n);
  });
})();

/* ===== スムーススクロール（#disclaimer 以外は自動オープン） ===== */
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
  e.preventDefault();
  const scroller = document.getElementById('scroll-root') || window;
  if (scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== 固定CTAの高さ → 余白反映 ===== */
function adjustCtaPadding(){
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  const scroller = document.getElementById('scroll-root');
  if (scroller) scroller.classList.add('has-cta');
}
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

/* ===== 免責/キャンセルの重複掃除（下部だけ残す） ===== */
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

/* ===== CTA の「底ズレ」保険（iOSラバーバンド時の追従） ===== */
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
  (document.getElementById('scroll-root') || window).addEventListener('scroll', apply, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* ============================================================
   Language Switcher（地球儀ボタン＋モーダル）— 完全自己完結版
   ============================================================ */
(function initLanguageUI(){
  if (window.__LANG_READY__) return;
  window.__LANG_READY__ = true;

  /* 旧 gt cookie が残っていたら一度だけ原文に戻す（初回のみ） */
  try{
    if (!sessionStorage.getItem('gt_reset_done')) {
      const had = /(?:^|;)\s*googtrans=\/[^/]+\/[^/]+/.test(document.cookie);
      if (had){
        const host = location.hostname.replace(/^www\./,'');
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${host}`;
        sessionStorage.setItem('gt_reset_done','1');
        location.reload();
        return;
      }
    }
  }catch(_){}

  /* 旧UIが残っていたら消す（重複対策） */
  document.getElementById('ls-btn')?.remove();
  document.getElementById('ls-dlg')?.remove();

  /* 地球儀ボタン（ハンバーガーと完全一致の見た目） */
  const btn = document.createElement('button');
  btn.id = 'langBtn';
  btn.className = 'lang-btn';
  btn.type = 'button';
  btn.title = 'Select language / 言語を選択';
  btn.setAttribute('aria-haspopup','dialog');
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path>
    </svg>
  `;
  document.body.appendChild(btn);

  /* モーダル */
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
        <select id="langProxy" aria-label="Select language">
          <option value="__RESET">Original / 原文 (Reset)</option>
          <option value="" disabled>Loading languages...</option>
        </select>
        <p class="lang-hint">Select a language and the page will translate. / リストから選ぶと即時翻訳されます。</p>
      </div>
    </div>
  `;
  document.body.appendChild(dlg);

  const closeBtn = document.getElementById('langClose');
  const backdrop = document.getElementById('langBackdrop');
  const proxySel = document.getElementById('langProxy');

  const open  = ()=>{ dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=>closeBtn?.focus(),0); };
  const close = ()=>{ dlg.removeAttribute('data-open');  dlg.setAttribute('aria-hidden','true');  btn.setAttribute('aria-expanded','false'); btn.focus(); };

  btn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? close() : open());
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
  document.addEventListener('click', (e)=>{
    if(!dlg.getAttribute('data-open')) return;
    if(e.target.closest('#langDialog') || e.target.closest('#langBtn')) return;
    close();
  });

  /* Google 翻訳ホスト（隠し） */
  let host = document.getElementById('google_translate_element');
  if (!host){
    host = document.createElement('div');
    host.id = 'google_translate_element';
    document.body.appendChild(host);
  }

  /* Google 初期化（UI英語化：hl=en） */
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element');
    }catch(_){}
    cloneOptionsToProxy();
  };
  const s = document.createElement('script');
  s.id = 'ls-gte'; s.async = true;
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
  document.head.appendChild(s);

  /* プロキシselectにGoogleの言語一覧をクローン */
  function cloneOptionsToProxy(){
    let tries = 0;
    (function tick(){
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo){
        if (tries++ < 60) return setTimeout(tick, 150);
        return;
      }
      const keepReset = proxySel.querySelector('option[value="__RESET"]');
      proxySel.innerHTML = '';
      if (keepReset) proxySel.appendChild(keepReset);

      Array.from(combo.options).forEach((op, i)=>{
        if (i === 0) return; // ダミー行はスキップ
        const o = document.createElement('option');
        o.value = op.value;
        o.textContent = op.textContent; // 英語表記で統一
        proxySel.appendChild(o);
      });

      const current = readGoogTrans() || '';
      proxySel.value = current ? current : '__RESET';

      proxySel.onchange = function(){
        const v = this.value;
        const real = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!real) return;
        if (v === '__RESET'){
          clearGT();
          real.value = '';
          real.dispatchEvent(new Event('change'));
          return;
        }
        real.value = v;
        real.dispatchEvent(new Event('change'));
      };
    })();
  }

  function readGoogTrans(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{
      const v = decodeURIComponent(m[1]);
      const p = v.split('/');
      return p[2] || '';
    }catch(e){ return ''; }
  }
  function clearGT(){
    const d = location.hostname.replace(/^www\./,'');
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }

  // 毎回開くたび最新のリスト/状態へ同期
  btn.addEventListener('click', cloneOptionsToProxy);
})();
