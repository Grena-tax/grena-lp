/* ===== script.js (10/12基準・完全置換) ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google青バナー/吹き出しの抑止（二重対策） ---------- */
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const ids = ['goog-gt-tt','google_translate_element'];
      ids.forEach(id=>{
        const el = document.getElementById(id);
        if (el && id==='goog-gt-tt'){ if (el.remove) el.remove(); else el.style.display='none'; }
      });
      const ifr = document.querySelector('iframe.goog-te-banner-frame');
      if (ifr){ if (ifr.remove) ifr.remove(); else ifr.style.display='none'; }
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 1) ハンバーガー開閉 ---------- */
  const menuBtn      = $('#menuBtn');
  const menuDrawer   = $('#menuDrawer');
  const menuBackdrop = $('#menuBackdrop');
  const menuClose    = $('#menuClose');

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    if (menuDrawer) menuDrawer.setAttribute('aria-hidden', String(!open));
    if (menuBtn)    menuBtn.setAttribute('aria-expanded', String(open));
  }
  const toggleMenu = (e)=>{ if(e){e.preventDefault();} setMenu(!html.classList.contains('menu-open')); };
  const closeMenu  = ()=> setMenu(false);

  menuBtn && ['click','touchstart'].forEach(ev=>menuBtn.addEventListener(ev, toggleMenu, {passive:false}));
  menuBackdrop && menuBackdrop.addEventListener('click', closeMenu);
  menuClose && menuClose.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  /* ---------- 2) 目次（各セクション＋全summaryを自動生成） ---------- */
  (function buildMenu(){
    const groups = $('#menuGroups');
    if (!groups) return;

    const sections = [
      ['corp-setup',       '法人設立'],
      ['plans',            '料金プラン'],
      ['sole-setup',       '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer',       '免責事項・キャンセル']
    ];

    const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);
    const mkId = base => base.toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');

    function ensureId(detailsEl, secId, label, idx){
      if (detailsEl.id) return detailsEl.id;
      const base = mkId(`${secId}-${label||'item'}-${idx+1}`) || `${secId}-d-${idx+1}`;
      let id = base, n=2;
      while (document.getElementById(id)) id = `${base}-${n++}`;
      detailsEl.id = id;
      return id;
    }
    function openAncestors(el){
      let cur = el && el.parentElement;
      while (cur){
        if (cur.tagName && cur.tagName.toLowerCase()==='details') cur.open = true;
        cur = cur.parentElement;
      }
    }

    groups.innerHTML = '';
    sections.forEach(([secId, secLabel])=>{
      const sec = document.getElementById(secId);
      if (!sec) return;

      const group = document.createElement('div'); group.className='menu-group';
      const h4    = document.createElement('h4');  h4.textContent = secLabel;
      const ul    = document.createElement('ul');  ul.className   ='menu-list';

      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = `${secLabel}（トップ）`;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop); ul.appendChild(liTop);

      sec.querySelectorAll('.accordion summary').forEach((sum, idx)=>{
        const det   = sum.closest('details'); if (!det) return;
        const label = sanitize(sum.textContent);
        const id    = ensureId(det, secId, label, idx);

        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = label;
        a.addEventListener('click', ()=>{
          const t = document.getElementById(id);
          if (t){ openAncestors(t); }
          setTimeout(closeMenu, 0);
        });
        li.appendChild(a); ul.appendChild(li);
      });

      group.appendChild(h4); group.appendChild(ul); groups.appendChild(group);
    });
  })();

  /* ---------- 3) 言語ドロワー（フォールバック付き） ---------- */
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
  const openLang  = ()=> setLang(true);
  const closeLang = ()=> setLang(false);

  langBtn && ['click','touchstart'].forEach(ev=>langBtn.addEventListener(ev, (e)=>{ e.preventDefault(); openLang(); }, {passive:false}));
  langBackdrop && langBackdrop.addEventListener('click', closeLang);
  langClose && langClose.addEventListener('click', closeLang);
  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeLang(); });

  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  // ▼ フォールバック用リスト（最低限＋主要言語）
  const FALLBACK_LANGS = [
    {code:'en',name:'English'},
    {code:'ja',name:'Japanese'},
    {code:'zh-CN',name:'Chinese (Simplified)'},
    {code:'zh-TW',name:'Chinese (Traditional)'},
    {code:'ko',name:'Korean'},
    {code:'es',name:'Spanish'},
    {code:'fr',name:'French'},
    {code:'de',name:'German'},
    {code:'it',name:'Italian'},
    {code:'pt',name:'Portuguese'},
    {code:'ru',name:'Russian'},
    {code:'ar',name:'Arabic'},
    {code:'hi',name:'Hindi'},
    {code:'id',name:'Indonesian'},
    {code:'vi',name:'Vietnamese'},
    {code:'th',name:'Thai'},
    {code:'tr',name:'Turkish'},
    {code:'ms',name:'Malay'},
    {code:'fil',name:'Filipino'},
    {code:'bn',name:'Bengali'},
    {code:'uk',name:'Ukrainian'},
    {code:'pl',name:'Polish'},
    {code:'nl',name:'Dutch'},
    {code:'sv',name:'Swedish'},
    {code:'fi',name:'Finnish'},
    {code:'no',name:'Norwegian'},
    {code:'da',name:'Danish'},
    {code:'cs',name:'Czech'},
    {code:'ro',name:'Romanian'},
    {code:'hu',name:'Hungarian'},
    {code:'he',name:'Hebrew'},
    {code:'el',name:'Greek'}
  ];

  // ▼ 言語適用（select が無い場合はクッキー直書き→再読込）
  function applyLang(code){
    try{
      const sel = document.querySelector('#google_translate_element select.goog-te-combo');
      if (sel && sel.options && sel.options.length){
        sel.value = code;
        sel.dispatchEvent(new Event('change', {bubbles:true}));
        closeLang();
        killGoogleBar();
        return;
      }
    }catch(_){}
    document.cookie = 'googtrans=' + encodeURIComponent('/auto/' + code) + '; path=/';
    location.reload();
  }

  let buildTries = 0;
  function buildLangList(forceFallback){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');

    // selectが未生成/空ならリトライ、一定回数超でフォールバック
    if ((!sel || !sel.options || sel.options.length <= 1) && !forceFallback){
      if (buildTries++ < 60){        // ≒ 60 * 300ms = 最大18秒待つ
        setTimeout(buildLangList, 300);
        return;
      }else{
        forceFallback = true;
      }
    }

    let items;
    if (!forceFallback && sel){
      items = Array.from(sel.options)
        .filter(o => o.value && o.value !== 'auto')
        .map(o => {
          const code = o.value.trim();
          const name = (dn && dn.of(code.replace('_','-'))) || (o.textContent||code).trim();
          return {code, name};
        })
        .sort((a,b)=> a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
    }else{
      items = FALLBACK_LANGS.slice();
    }

    if (!langList) return;
    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    const curCookie = decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '');

    items.forEach(({code,name})=>{
      const el = document.createElement('div');
      el.className = 'ls-item' + (curCookie.endsWith('/'+code) ? ' ls-active' : '');
      el.setAttribute('role','option');
      el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
      el.addEventListener('click', ()=> applyLang(code));
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

  // Google公式ウィジェットの初期化（HTMLの cb と一致）
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    }catch(_){}
    setTimeout(buildLangList, 600);
    const host = $('#google_translate_element');
    if (host){
      new MutationObserver(()=>setTimeout(buildLangList,0)).observe(host,{childList:true,subtree:true});
    }
  };

})();
/* ---- Hamburger: 非クリックの見出し「料金プラン」だけを削除（append-only） ---- */
(function () {
  document.querySelectorAll('#menuGroups .menu-group h4').forEach(h => {
    if ((h.textContent || '').trim() === '料金プラン') h.remove();
  });
})();
/* ==== remove only "（トップ）" items in hamburger ==== */
(function () {
  const isTop = /（トップ）\s*$/;
  document.querySelectorAll('#menuGroups .menu-list li').forEach(li => {
    const a = li.querySelector('a');
    if (!a) return;
    const label = (a.textContent || '').trim();
    if (isTop.test(label)) li.remove();
  });
})();
/* === MENU: （トップ）を消す + ネスト項目を除外して作り直す === */
(() => {
  const wrap = document.getElementById('menuGroups');
  if (!wrap) return;

  const SECTIONS = [
    ['corp-setup',       '法人設立'],
    ['plans',            '料金プラン'],
    ['sole-setup',       '個人事業主（IE/SBS）'],
    ['personal-account', '個人口座開設（銀行）'],
    ['disclaimer',       '免責事項・キャンセル'],
  ];

  const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);
  const closeMenu = () => {
    const html = document.documentElement;
    html.classList.remove('menu-open');
    document.getElementById('menuDrawer')?.setAttribute('aria-hidden','true');
    document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
  };

  wrap.innerHTML = '';

  SECTIONS.forEach(([secId, label]) => {
    const sec = document.getElementById(secId);
    if (!sec) return;

    const group = document.createElement('div');
    group.className = 'menu-group';

    if (secId !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = label;
      group.appendChild(h4);
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    const liTop = document.createElement('li');
    const aTop = document.createElement('a');
    aTop.href = `#${secId}`;
    aTop.textContent = label;
    aTop.addEventListener('click', closeMenu);
    liTop.appendChild(aTop);
    ul.appendChild(liTop);

    sec.querySelectorAll(':scope .accordion > details > summary').forEach((sum, idx) => {
      const det = sum.closest('details');
      if (!det) return;

      if (!det.id) {
        let id = `${secId}-d-${idx+1}`, n = 2;
        while (document.getElementById(id)) id = `${secId}-d-${idx+1}-${n++}`;
        det.id = id;
      }

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${det.id}`;
      a.textContent = sanitize(sum.textContent);
      a.addEventListener('click', () => { det.open = true; closeMenu(); });
      li.appendChild(a);
      ul.appendChild(li);
    });

    group.appendChild(ul);
    wrap.appendChild(group);
  });

  document.querySelectorAll('#menuGroups a').forEach(a => {
    a.textContent = a.textContent.replace(/（トップ）/g, '');
  });
})();

/* === 最後：為替表だけを横スクロールに隔離（他へは非干渉） === */
(function () {
  function markFxTable(){
    try{
      document.querySelectorAll('table').forEach(tbl=>{
        if (tbl.classList.contains('fx-sim')) return;

        const heads = Array.from(
          tbl.querySelectorAll('thead th, tr:first-child th, thead td, tr:first-child td')
        ).map(th => (th.textContent || '').trim());

        const need = ['為替シナリオ','1GEL','満期残高','円換算額','損益'];
        const hit  = need.every(k => heads.some(h => h.includes(k)));
        if (!hit) return;

        tbl.classList.add('fx-sim');

        if (!tbl.parentElement || !tbl.parentElement.classList.contains('fx-wrap')) {
          const wrap = document.createElement('div');
          wrap.className = 'fx-wrap';
          tbl.parentNode.insertBefore(wrap, tbl);
          wrap.appendChild(tbl);
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
