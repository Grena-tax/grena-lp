/* =========================================================
   script.js — COMPLETE (v3.2 fallback-first)
   ========================================================= */
'use strict';

/* ===== 設定 ===== */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $  = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
const slug = (t)=> (t||'').toLowerCase()
  .replace(/[（）()\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* =========================================================
   1) iOS ラバーバンド対策：#scroll-root
   ========================================================= */
(function mountScrollRoot(){
  if ($('#scroll-root')) return;

  const body = document.body;
  const cta  = $('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = $('#menuBtn');
  const menuDrawer = $('#menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';
  Object.assign(wrap.style, {
    position:'fixed', inset:'0', overflowY:'auto',
    WebkitOverflowScrolling:'touch', overscrollBehaviorY:'contain', background:'inherit'
  });

  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);

  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n=>{ if(!keep.has(n)) wrap.appendChild(n); });

  document.documentElement.style.height = '100%';
  document.documentElement.style.overflow = 'hidden';
  body.style.height = '100%';
  body.style.overflow = 'hidden';
})();

/* =========================================================
   2) スムーススクロール / Top
   ========================================================= */
document.addEventListener('click',(e)=>{
  const a = e.target.closest('a[href^="#"]'); if(!a) return;
  const id = a.getAttribute('href'); const target = $(id); if(!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior:'smooth', block:'start' });
  if (target.id !== 'disclaimer'){
    const first = target.querySelector('details'); if(first && !first.open) first.open = true;
  }
  history.pushState(null,'',id);
});
$('#toTop')?.addEventListener('click',()=>{
  const scroller = $('#scroll-root') || window;
  scroller.scrollTo?.({ top:0, behavior:'smooth' });
});

/* =========================================================
   3) CTA 高さ → 余白
   ========================================================= */
function adjustCtaPadding(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if(!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  const scroller = $('#scroll-root');
  if (scroller) scroller.classList.add('has-cta'); else document.body.classList.add('has-cta');
}
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* =========================================================
   4) 申込ボタン
   ========================================================= */
$('#applyNow')?.addEventListener('click',(e)=>{
  e.preventDefault();
  if(!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* =========================================================
   5) ハンバーガー
   ========================================================= */
const btn        = $('#menuBtn');
const drawer     = $('#menuDrawer');
const closeBt    = $('#menuClose');
const overlay    = $('#menuBackdrop');
const groupsRoot = $('#menuGroups');

const openMenu  = ()=>{
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  setTimeout(()=>closeBt?.focus(),0);
};
const closeMenu = ()=>{
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
  btn?.focus();
};

btn?.classList.add('ui-fab');
btn?.addEventListener('click', ()=> document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu());
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });

const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
function buildMenu(){
  const sections = $$('section[id]');
  const frag = document.createDocumentFragment(); let i = 1;
  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if(!details.length) return;
    const wrap = document.createElement('div'); wrap.className='menu-group';
    const h2 = sec.querySelector('h2');
    if (h2 && sec.id !== 'plans'){ const h4 = document.createElement('h4'); h4.textContent=h2.textContent.trim(); wrap.appendChild(h4); }
    else { wrap.classList.add('no-title'); }
    const ul = document.createElement('ul'); ul.className='menu-list';
    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x=>t.includes(x))) return;
      if(!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;
      const li = document.createElement('li'); const a = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{ e.preventDefault(); closeMenu(); d.open=true; d.scrollIntoView({behavior:'smooth',block:'start'}); history.pushState(null,'',`#${d.id}`); });
      li.appendChild(a); ul.appendChild(li);
    });
    wrap.appendChild(ul); frag.appendChild(wrap);
  });
  if(!groupsRoot) return;
  groupsRoot.textContent=''; groupsRoot.appendChild(frag);
}
addEventListener('DOMContentLoaded', buildMenu);

/* =========================================================
   6) Language Switcher（必ず選べる：フォールバック先行）
   ========================================================= */
(function initLanguageUI(){

  /* --- 地球儀ボタン --- */
  const gbtn = document.createElement('button');
  gbtn.id='langBtn'; gbtn.className='lang-btn ui-fab'; gbtn.type='button';
  gbtn.title='Select language / 言語を選択';
  gbtn.setAttribute('aria-haspopup','dialog'); gbtn.setAttribute('aria-expanded','false');
  gbtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path>
    </svg>`;
  document.body.appendChild(gbtn);

  /* --- モーダル --- */
  const dlg = document.createElement('div');
  dlg.id='langDialog'; dlg.className='lang-dialog';
  dlg.setAttribute('aria-hidden','true'); dlg.setAttribute('role','dialog'); dlg.setAttribute('aria-modal','true');
  dlg.innerHTML = `
    <div class="lang-backdrop" id="langBackdrop"></div>
    <div class="lang-panel" role="document">
      <div class="lang-head">
        <strong>Select language / 言語を選択</strong>
        <button id="langClose" class="lang-close" type="button" aria-label="閉じる">×</button>
      </div>
      <div class="lang-body">
        <select id="langProxy" aria-label="Select Language"></select>
        <p class="lang-hint">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
      </div>
    </div>`;
  document.body.appendChild(dlg);

  const closeBtn = $('#langClose', dlg);
  const backdrop = $('#langBackdrop', dlg);
  const proxySel = $('#langProxy', dlg);

  const openDlg  = ()=>{ dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); gbtn.setAttribute('aria-expanded','true'); setTimeout(()=>closeBtn?.focus(),0); };
  const closeDlg = ()=>{ dlg.removeAttribute('data-open');  dlg.setAttribute('aria-hidden','true');  gbtn.setAttribute('aria-expanded','false'); gbtn.focus(); };

  gbtn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? closeDlg() : openDlg());
  closeBtn.addEventListener('click', closeDlg);
  backdrop.addEventListener('click', closeDlg);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDlg(); });
  document.addEventListener('click', (e)=>{
    if(!dlg.getAttribute('data-open')) return;
    if(e.target.closest('#langDialog') || e.target.closest('#langBtn')) return;
    closeDlg();
  });

  /* --- Google host --- */
  const host = document.createElement('div');
  host.id='google_translate_element';
  document.body.appendChild(host);

  /* --- cookie helpers --- */
  function setGT(src,dst){
    const v = `/${src}/${dst}`;
    const ex = new Date(Date.now()+365*864e5).toUTCString();
    const d = location.hostname.replace(/^www\./,'');
    document.cookie = `googtrans=${encodeURIComponent(v)}; expires=${ex}; path=/`;
    document.cookie = `googtrans=${encodeURIComponent(v)}; expires=${ex}; path=/; domain=.${d}`;
    document.cookie = `googtrans=${encodeURIComponent(v)}; expires=${ex}; path=/; domain=${d}`;
  }
  function clearGT(){
    const d = location.hostname.replace(/^www\./,'');
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }
  function currentLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{ return (decodeURIComponent(m[1]).split('/')[2]||''); }catch(_){ return ''; }
  }

  /* --- Fallback list：先に必ず埋める --- */
  const FALLBACK_LANGS = [
    ['__RESET','Original / 原文 (Reset)'],
    ['en','English'], ['ko','Korean'], ['zh-CN','Chinese (Simplified)'], ['zh-TW','Chinese (Traditional)'],
    ['th','Thai'], ['vi','Vietnamese'], ['ru','Russian'], ['es','Spanish'],
    ['fr','French'], ['de','German'], ['it','Italian'], ['pt','Portuguese'],
    ['id','Indonesian'], ['tr','Turkish'], ['uk','Ukrainian'], ['ar','Arabic'],
    ['hi','Hindi'], ['ms','Malay'], ['pl','Polish'], ['nl','Dutch']
  ];
  function fillFallback(){
    proxySel.innerHTML = '';
    for (const [val,label] of FALLBACK_LANGS){
      const o=document.createElement('option'); o.value=val; o.textContent=label; proxySel.appendChild(o);
    }
    const cur = currentLangFromCookie();
    proxySel.value = cur || '__RESET';
    if (proxySel.selectedIndex < 0) proxySel.selectedIndex = 0; // Safariの空表示対策
    proxySel.onchange = function(){
      const v = this.value;
      if (v === '__RESET'){ clearGT(); location.reload(); return; }
      setGT('ja', v); location.reload();
    };
  }
  fillFallback(); // ←最初から表示される

  /* --- Google init: 成功したら本家リストへ差し替え --- */
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element');
    }catch(_){}
    cloneFromGoogleOrKeepFallback();
  };

  function cloneFromGoogleOrKeepFallback(){
    let tries = 0;
    (function poll(){
      const combo = $('#google_translate_element select.goog-te-combo');
      if (!combo){
        if (tries++ < 80){ setTimeout(poll,150); return; }
        // 取得できなければフォールバックのまま
        return;
      }
      // 取得できたら置き換え
      const cur = currentLangFromCookie();
      proxySel.innerHTML = '';
      const reset = document.createElement('option');
      reset.value='__RESET'; reset.textContent='Original / 原文 (Reset)';
      proxySel.appendChild(reset);
      Array.from(combo.options).forEach((op,idx)=>{
        if (idx===0) return;
        const o=document.createElement('option'); o.value=op.value; o.textContent=op.textContent;
        proxySel.appendChild(o);
      });
      proxySel.value = cur || '__RESET';
      if (proxySel.selectedIndex < 0) proxySel.selectedIndex = 0;
      proxySel.onchange = function(){
        const v = this.value;
        if (v === '__RESET'){ clearGT(); combo.value=''; combo.dispatchEvent(new Event('change')); location.reload(); return; }
        combo.value = v; combo.dispatchEvent(new Event('change'));
      };
    })();
  }

  // 毎回開くたび最新化
  gbtn.addEventListener('click', cloneFromGoogleOrKeepFallback);

  // Google script 読み込み（hl=en）
  if (!$('#ls-gte-script')){
    const s = document.createElement('script');
    s.id='ls-gte-script';
    s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
    s.async=true; document.head.appendChild(s);
  }
})();
