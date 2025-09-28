/* =========================================
   script.js — FINAL (CTA hard lock / top-UI / Lang)
   ========================================= */
'use strict';

/* ===== 申込フォームURL（必要なら差し替え） ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const slug = (t='') => t.toLowerCase()
  .replace(/[（）()\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* ===== 画面をスクロール容器(#scroll-root)に収める ===== */
(function mountScrollRoot(){
  if ($('#scroll-root')) return;

  const body = document.body;
  const cta  = $('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = $('#menuBtn');
  const menuDrawer = $('#menuDrawer');
  const langBtn = $('#langBtn');
  const langDlg = $('#langDialog');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  // CTAの直前に置く（なければ末尾）
  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);

  // これらは #scroll-root の外側に残す（最前面でクリック可能）
  const keep = new Set([wrap, cta, menuBtn, menuDrawer, langBtn, langDlg]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

/* ===== CTA 高さを --cta-h に反映（位置は絶対に動かさない） ===== */
function updateCtaPadding(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', `${h}px`);

  const scroller = $('#scroll-root');
  if (scroller) scroller.style.paddingBottom = `calc(${h}px + env(safe-area-inset-bottom))`;
}
addEventListener('load', updateCtaPadding, { once:true });
addEventListener('resize', updateCtaPadding);

/* ===== CTA をハードロック（他JSが transform/bottom を触っても即上書き） ===== */
(function hardLockCTA(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if (!bar) return;
  const apply = () => {
    bar.style.setProperty('position','fixed','important');
    bar.style.setProperty('left','0','important');
    bar.style.setProperty('right','0','important');
    bar.style.setProperty('bottom','max(0px, env(safe-area-inset-bottom))','important');
    bar.style.setProperty('transform','translateZ(0)','important');
    bar.style.setProperty('transition','none','important');
    bar.style.setProperty('will-change','transform','important');
    bar.style.setProperty('z-index','9999','important');
  };
  apply();
  new MutationObserver(apply).observe(bar, { attributes:true, attributeFilter:['style','class'] });
})();

/* ===== 「トップへ」 ===== */
$('#toTop')?.addEventListener('click', (e)=>{
  e.preventDefault();
  const s = $('#scroll-root') || window;
  (s.scrollTo ? s.scrollTo({ top:0, behavior:'smooth' }) : (s.scrollTop=0));
});

/* ===== ハンバーガー開閉 ===== */
(function menuToggle(){
  const btn    = $('#menuBtn');
  const drawer = $('#menuDrawer');
  const close  = $('#menuClose');
  const overlay= $('#menuBackdrop');
  if (!btn || !drawer) return;

  const open = ()=>{ document.documentElement.classList.add('menu-open'); drawer?.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=>close?.focus(),0); };
  const closeFn = ()=>{ document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false'); btn.focus(); };

  btn.addEventListener('click', ()=> drawer.getAttribute('aria-hidden')==='false' ? closeFn() : open());
  close?.addEventListener('click', closeFn);
  overlay?.addEventListener('click', closeFn);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeFn(); });
})();

/* ===== ハンバーガー内メニュー自動生成（必要なら） ===== */
(function buildMenu(){
  const root = $('#menuGroups');
  if (!root) return;
  const exclude = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
  const sections = $$('section[id]');
  const frag = document.createDocumentFragment();
  let i=1;
  sections.forEach(sec=>{
    const ds = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!ds.length) return;
    const wrap = document.createElement('div'); wrap.className='menu-group';
    const h2 = sec.querySelector('h2');
    if (h2 && sec.id!=='plans'){ const h4=document.createElement('h4'); h4.textContent=h2.textContent.trim(); wrap.appendChild(h4); }
    else { wrap.classList.add('no-title'); }
    const ul = document.createElement('ul'); ul.className='menu-list';
    ds.forEach(d=>{
      const t = d.querySelector('summary')?.textContent?.trim() || '項目';
      if (exclude.some(x=>t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;
      const li=document.createElement('li'); const a=document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',e=>{
        e.preventDefault();
        document.documentElement.classList.remove('menu-open');
        d.open = true;
        d.scrollIntoView({behavior:'smooth',block:'start'});
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });
    wrap.appendChild(ul); frag.appendChild(wrap);
  });
  root.textContent=''; root.appendChild(frag);
})();

/* ===== Google翻訳：地球儀ボタン＋モーダル（自己完結） ===== */
(function initLanguageUI(){
  // ボタンが既にあれば何もしない
  if (document.getElementById('langBtn')) return;

  // 1) ボタン
  const btn = document.createElement('button');
  btn.id='langBtn'; btn.type='button';
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>`;
  document.body.appendChild(btn);

  // 2) モーダル
  const dlg = document.createElement('div');
  dlg.id='langDialog'; dlg.className='lang-dialog'; dlg.setAttribute('aria-hidden','true');
  dlg.innerHTML = `
    <div class="lang-backdrop" id="langBackdrop"></div>
    <div class="lang-panel" role="document">
      <div class="lang-head">
        <strong>Select language / 言語を選択</strong>
        <button id="langClose" class="lang-close" type="button" aria-label="close">×</button>
      </div>
      <div class="lang-body">
        <select id="langProxy" aria-label="Select Language">
          <option value="__RESET">Original / 原文 (Reset)</option>
          <option value="" disabled>Loading languages…</option>
        </select>
        <p class="lang-hint text-sm muted">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
      </div>
    </div>`;
  document.body.appendChild(dlg);

  const closeBtn = document.getElementById('langClose');
  const backdrop = document.getElementById('langBackdrop');
  const proxySel = document.getElementById('langProxy');

  const open = ()=>{ dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=>closeBtn?.focus(),0); };
  const close= ()=>{ dlg.removeAttribute('data-open'); dlg.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false'); btn.focus(); };
  btn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? close() : open());
  closeBtn.addEventListener('click', close); backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });

  // 3) Google本体（隠し）
  const host = document.createElement('div'); host.id='google_translate_element'; document.body.appendChild(host);

  window.googleTranslateElementInit = function(){
    try{ new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element'); }catch(e){}
    cloneOptionsToProxy();
  };
  const s = document.createElement('script');
  s.src='//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
  s.defer=true; document.head.appendChild(s);

  function getCurrentLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{ const v=decodeURIComponent(m[1]); const p=v.split('/'); return p[2]||''; }catch(e){ return ''; }
  }
  function clearGT(){
    const d = location.hostname.replace(/^www\\./,'');
    document.cookie='googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie=`googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie=`googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }
  function cloneOptionsToProxy(){
    let tries=0;
    (function tick(){
      const combo = document.querySelector('#google_translate_element select.goog-te-combo');
      if (!combo){ if (tries++<50) return setTimeout(tick,120); return; }
      const keepReset = proxySel.querySelector('option[value="__RESET"]');
      proxySel.innerHTML=''; if (keepReset) proxySel.appendChild(keepReset);
      Array.from(combo.options).forEach((op,idx)=>{
        if (idx===0) return;
        const o=document.createElement('option'); o.value=op.value; o.textContent=op.textContent; proxySel.appendChild(o);
      });
      const cur=getCurrentLangFromCookie()||''; proxySel.value = cur || '__RESET';
      proxySel.onchange=function(){
        const val=this.value; const combo=document.querySelector('#google_translate_element select.goog-te-combo'); if (!combo) return;
        if (val==='__RESET'){ clearGT(); combo.value=''; combo.dispatchEvent(new Event('change')); return; }
        combo.value=val; combo.dispatchEvent(new Event('change'));
      };
    })();
  }
  btn.addEventListener('click', cloneOptionsToProxy);
})();

/* ===== 申込ボタン ===== */
document.getElementById('applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL){ alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ページ内リンク（スムーススクロール） ===== */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href'); const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior:'smooth', block:'start' });
  if (target.id !== 'disclaimer'){ const first = target.querySelector('details'); if (first && !first.open) first.open = true; }
  history.pushState(null,'',id);
});
