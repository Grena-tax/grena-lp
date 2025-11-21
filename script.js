/* ===== script.js (Full Replace / No-Polling / One-Reload / Final) ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google青バナー/吹き出しの抑止（Observerのみ） ---------- */
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const tip = document.getElementById('goog-gt-tt');
      if (tip) (tip.remove ? tip.remove() : (tip.style.display='none'));
      const bar = document.querySelector('iframe.goog-te-banner-frame');
      if (bar) (bar.remove ? bar.remove() : (bar.style.display='none'));
      html.classList.remove('gtbar');
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  window.addEventListener('pageshow', killGoogleBar, {once:true});

  /* ---------- 0.1) 公式翻訳スクリプトの遅延ロード（多重読込ガード強化） ---------- */
  function hasGTranslateTag(){
    return !!document.querySelector('script[src*="translate_a/element.js"]');
  }
  function loadGTranslate(){
    if ((window.google && window.google.translate) || hasGTranslateTag()) return;
    const s = document.createElement('script');
    s.id  = 'gt-script';
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.defer = true;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadGTranslate);
  }else{
    loadGTranslate();
  }

  /* ---------- 1) ハンバーガー ---------- */
  const menuBtn      = $('#menuBtn');
  const menuDrawer   = $('#menuDrawer');
  const menuBackdrop = $('#menuBackdrop');
  const menuClose    = $('#menuClose');

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    if (menuDrawer) menuDrawer.setAttribute('aria-hidden', String(!open));
    if (menuBtn)    menuBtn.setAttribute('aria-expanded', String(open));
  }
  const toggleMenu = (e)=>{ e?.preventDefault(); setMenu(!html.classList.contains('menu-open')); };
  const closeMenu  = ()=> setMenu(false);

  menuBtn      && ['click','touchstart'].forEach(ev=>menuBtn.addEventListener(ev, toggleMenu, {passive:false}));
  menuBackdrop && menuBackdrop.addEventListener('click', closeMenu);
  menuClose    && menuClose.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  /* ---------- 2) サイド目次（トップ項目は作らない） ---------- */
  (function buildMenuNoTop(){
    const wrap = $('#menuGroups'); if (!wrap) return;
    const SECTIONS = [
      ['corp-setup',       '法人設立'],
      ['plans',            '料金プラン'],
      ['sole-setup',       '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer',       '免責事項・キャンセル']
    ];
    const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);
    function ensureId(detailsEl, secId, label, idx){
      if (detailsEl.id) return detailsEl.id;
      const base = (secId + '-' + (label||'item') + '-' + (idx+1))
        .toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
      let id = base || `${secId}-d-${idx+1}`, n=2;
      while (document.getElementById(id)) id = `${base}-${n++}`;
      detailsEl.id = id; return id;
    }
    function closeMenuSoft(){
      html.classList.remove('menu-open');
      menuDrawer?.setAttribute('aria-hidden','true');
      menuBtn?.setAttribute('aria-expanded','false');
    }
    wrap.innerHTML = '';
    SECTIONS.forEach(([secId, label])=>{
      const sec = document.getElementById(secId); if (!sec) return;
      const group = document.createElement('div'); group.className='menu-group';
      if (secId!=='plans'){ const h4=document.createElement('h4'); h4.textContent=label; group.appendChild(h4); }
      const ul=document.createElement('ul'); ul.className='menu-list';
      sec.querySelectorAll(':scope .accordion > details > summary').forEach((sum, idx)=>{
        const det = sum.closest('details'); if (!det) return;
        const id  = ensureId(det, secId, sum.textContent, idx);
        const li=document.createElement('li'); const a=document.createElement('a');
        a.href=`#${id}`; a.textContent=sanitize(sum.textContent);
        a.addEventListener('click', ()=>{ det.open=true; closeMenuSoft(); });
        li.appendChild(a); ul.appendChild(li);
      });
      group.appendChild(ul); wrap.appendChild(group);
    });
  })();

  /* ---------- 3) 言語ドロワー（自作リスト＋確実適用） ---------- */
  const langBtn      = $('#langBtn');
  const langDrawer   = $('#langDrawer');
  const langBackdrop = $('#langBackdrop');
  const langClose    = $('#langClose');
  const langList     = $('#langList');
  const langSearch   = $('#langSearch');

  function setLang(open){
    html.classList.toggle('lang-open', open);
    if (langDrawer) langDrawer.setAttribute('aria-hidden', String(!open));
    if (langBtn)    langBtn.setAttribute('aria-expanded', String(open));
  }
  const openLang  = ()=> { loadGTranslate(); setLang(true); setTimeout(buildLangList, 0); };
  const closeLang = ()=> setLang(false);

  langBtn      && ['click','touchstart'].forEach(ev=>langBtn.addEventListener(ev, (e)=>{ e.preventDefault(); openLang(); }, {passive:false}));
  langBackdrop && langBackdrop.addEventListener('click', closeLang);
  langClose    && langClose.addEventListener('click', closeLang);
  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeLang(); });

  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  function setGoogTransCookie(code){
    const exp  = new Date(Date.now()+365*864e5).toUTCString();
    const host = location.hostname.replace(/^www\./,'');
    const vals = [`/ja/${code}`, `/auto/${code}`];
    const domains = ['', `.${host}`];
    vals.forEach(v=>domains.forEach(dm=>{
      document.cookie = `googtrans=${encodeURIComponent(v)}; expires=${exp}; path=/` + (dm?`; domain=${dm}`:'');
    }));
  }

  // 一度だけ確実にリロード → 二度目以降はchange発火のみ
  function applyTranslate(code){
    try{
      const once = sessionStorage.getItem('gt-once') === '1';
      setGoogTransCookie(code);
      if (!once){
        sessionStorage.setItem('gt-desired', code);
        sessionStorage.setItem('gt-once', '1');
        location.reload();
        return;
      }
      const sel = document.querySelector('#google_translate_element select.goog-te-combo');
      if (sel){
        sel.value = code;
        const evt = document.createEvent('HTMLEvents'); evt.initEvent('change', true, true);
        sel.dispatchEvent(evt);
      }
    }catch(_){}
  }

  function buildLangList(){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel || !langList){ setTimeout(buildLangList, 200); return; }

    const curCookie = decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '');
    const items = Array.from(sel.options)
      .filter(o => o.value && o.value !== 'auto')
      .map(o => {
        const code = o.value.trim();
        const name = (dn && dn.of(code.replace('_','-'))) || (o.textContent||code).trim();
        return {code, name};
      })
      .sort((a,b)=> a.name.localeCompare(b.name,'en',{sensitivity:'base'}));

    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(({code,name})=>{
      const el = document.createElement('div');
      el.className = 'ls-item' + (curCookie.endsWith('/'+code) ? ' ls-active' : '');
      el.setAttribute('role','option');
      el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
      el.addEventListener('click', ()=>{
        closeLang();
        applyTranslate(code);
        killGoogleBar();
      });
      frag.appendChild(el);
    });
    langList.appendChild(frag);

    if (langSearch){
      langSearch.value = '';
      langSearch.oninput = ()=> {
        const q = langSearch.value.trim().toLowerCase();
        $$('.ls-item', langList).forEach(el=>{
          const txt = (el.textContent||'').toLowerCase();
          el.style.display = (!q || txt.includes(q)) ? '' : 'none';
        });
      };
    }
  }

  /* ---------- 4) Googleの初期化コールバック（グローバルに必要） ---------- */
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    }catch(_){}
    setTimeout(()=>{
      const desired = sessionStorage.getItem('gt-desired');
      if (desired){
        const sel = document.querySelector('#google_translate_element select.goog-te-combo');
        if (sel){
          sel.value = desired;
          const evt = document.createEvent('HTMLEvents'); evt.initEvent('change', true, true);
          sel.dispatchEvent(evt);
          sessionStorage.removeItem('gt-desired');
        }
      }
    }, 400);

    setTimeout(buildLangList, 600);
    const host = $('#google_translate_element');
    if (host){
      new MutationObserver(()=>setTimeout(buildLangList,0)).observe(host,{childList:true,subtree:true});
    }
  };

  /* ---------- 5) 見出しの不自然な改行抑止（既存） ---------- */
  (function fixHeroHeading(){
    function patch(el){
      if (!el || el.dataset.jpFixed) return;
      const raw = el.textContent || '';
      if (!raw) return;
      const withBreakPoints = raw.replace(/([｜|／/])/g, '$1\u200B');
      el.textContent = '';
      el.insertAdjacentText('afterbegin', withBreakPoints);
      el.classList.add('no-jp-break');
      el.dataset.jpFixed = '1';
    }
    const targets = $$('main h1, main h2');
    targets.forEach(patch);
    new MutationObserver(()=>targets.forEach(patch)).observe(document.body,{childList:true,subtree:true});
  })();

  /* ---------- 6) 為替表の横はみ出し対策（既存） ---------- */
  (function () {
    function markFxTable(){
      try{
        document.querySelectorAll('table').forEach(tbl=>{
          if (tbl.classList.contains('fx-sim')) return;
          const heads = Array.from(
            tbl.querySelectorAll('thead th, tr:first-child th, thead td, tr:first-child td')
          ).map(th => (th.textContent || '').trim());
          const need  = ['為替シナリオ','1GEL','満期残高','円換算額','損益'];
          const hit   = need.every(k => heads.some(h => h.includes(k)));
          if (!hit) return;
          tbl.classList.add('fx-sim');
          if (!tbl.parentElement || !tbl.parentElement.classList.contains('fx-wrap')) {
            const wrap = document.createElement('div'); wrap.className = 'fx-wrap';
            tbl.parentNode.insertBefore(wrap, tbl); wrap.appendChild(tbl);
          }
        });
      }catch(_){}
    }
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', markFxTable);
    }else{
      markFxTable();
    }
  })();

})();
// ===== compound calc (isolated) =====
(() => {
  const $ = (id) => document.getElementById(id);
  const root = $('calc-compound');
  if (!root) return;

  const principal = $('c_principal');
  const rate = $('c_rate');
  const years = $('c_years');
  const freq = $('c_freq');
  const ack = $('c_ack');
  const run = $('c_run');
  const clearBtn = $('c_clear');
  const result = $('c_result');
  const balance = $('c_balance');
  const multiple = $('c_multiple');

  function fmtJPY(n){
    if (Number.isNaN(n)) return '-';
    return '¥' + Math.round(n).toLocaleString('ja-JP');
  }
  function fmtX(n){
    if (Number.isNaN(n)) return '-';
    return (Math.round(n * 100) / 100).toLocaleString('ja-JP') + '倍';
  }

  run.addEventListener('click', () => {
    const P = parseFloat(principal.value);
    const r = parseFloat(rate.value) / 100;
    const t = parseFloat(years.value);
    const n = parseInt(freq.value, 10);

    if (!ack.checked) { alert('同意チェックを入れてください。'); return; }
    if (!(P > 0 && r >= 0 && t > 0 && n > 0)) { alert('入力値を確認してください。'); return; }

    // A = P * (1 + r/n)^(n*t)
    const A = P * Math.pow(1 + r / n, n * t);
    balance.textContent = fmtJPY(A);
    multiple.textContent = fmtX(A / P);
    result.hidden = false;
  });

  clearBtn.addEventListener('click', () => {
    principal.value = '';
    rate.value = '';
    years.value = '';
    freq.value = '12';
    ack.checked = false;
    result.hidden = true;
    balance.textContent = '-';
    multiple.textContent = '-';
  });
})();
