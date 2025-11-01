/* ===== script.js (2025-11-01 完全版／文言は不変更) ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google青バー/吹き出しの抑止（二重対策） ---------- */
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const tip = document.getElementById('goog-gt-tt');
      if (tip) tip.remove ? tip.remove() : (tip.style.display='none');
      const ifr = document.querySelector('iframe#goog-te-banner-frame, .goog-te-banner-frame');
      if (ifr) ifr.remove ? ifr.remove() : (ifr.style.display='none');
      const sk = document.querySelector('body > .skiptranslate'); if (sk) sk.style.display='none';
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 1) ハンバーガー開閉（右ドロワー） ---------- */
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
  menuBackdrop && menuBackdrop.addEventListener('click', closeMenu, {passive:true});
  menuClose && menuClose.addEventListener('click', closeMenu, {passive:true});
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); }, {passive:true});

  /* ---------- 2) 目次（各セクション＋直下summaryだけ自動生成） ---------- */
  (function buildMenu(){
    const groups = $('#menuGroups');
    if (!groups) return;

    const SECTIONS = [
      ['corp-setup',       '法人設立'],
      ['plans',            '料金プラン'],
      ['sole-setup',       '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer',       '免責事項・キャンセル'],
    ];

    const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);

    function ensureId(detailsEl, secId, idx){
      if (detailsEl.id) return detailsEl.id;
      let base = `${secId}-d-${idx+1}`, id = base, n=2;
      while (document.getElementById(id)) id = `${base}-${n++}`;
      detailsEl.id = id; return id;
    }
    function openAncestors(el){ let cur = el && el.parentElement; while (cur){ if (cur.tagName==='DETAILS') cur.open = true; cur = cur.parentElement; } }

    groups.innerHTML = '';
    SECTIONS.forEach(([secId, secLabel])=>{
      const sec = document.getElementById(secId);
      if (!sec) return;

      const group = document.createElement('div'); group.className='menu-group';
      const h4    = document.createElement('h4');  h4.textContent = secLabel;
      const ul    = document.createElement('ul');  ul.className   ='menu-list';

      // セクション先頭
      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`; aTop.textContent = secLabel;
      aTop.addEventListener('click', closeMenu, {passive:true});
      liTop.appendChild(aTop); ul.appendChild(liTop);

      // 直下 details のみ（ネスト除外）
      sec.querySelectorAll('.accordion').forEach(acc=>{
        Array.from(acc.children).forEach((child, idx)=>{
          if (!(child.tagName==='DETAILS')) return;
          const det = child;
          const sum = det.querySelector(':scope > summary') || det.querySelector('summary'); // 保険
          if (!sum) return;
          const id = ensureId(det, secId, idx);
          const li = document.createElement('li');
          const a  = document.createElement('a');
          a.href = `#${id}`; a.textContent = sanitize(sum.textContent);
          a.addEventListener('click', ()=>{ const t=document.getElementById(id); if (t){ openAncestors(t); } closeMenu(); }, {passive:true});
          li.appendChild(a); ul.appendChild(li);
        });
      });

      group.appendChild(h4); group.appendChild(ul); groups.appendChild(group);
    });
  })();

  /* ---------- 3) 言語ドロワー（Google Translate 連携） ---------- */
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
  langBackdrop && langBackdrop.addEventListener('click', closeLang, {passive:true});
  langClose && langClose.addEventListener('click', closeLang, {passive:true});
  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeLang(); }, {passive:true});

  function buildLangList(){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo') || document.querySelector('select.goog-te-combo');
    if (!sel || !langList){ setTimeout(buildLangList, 300); return; }

    const curCookie = decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '');
    const items = Array.from(sel.options).filter(o => o.value && o.value !== 'auto')
      .map(o => ({ code: o.value.trim(), name: (o.textContent||o.value).trim() }))
      .sort((a,b)=> a.name.localeCompare(b.name,'en',{sensitivity:'base'}));

    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(({code,name})=>{
      const el = document.createElement('div');
      el.className = 'ls-item' + (curCookie.endsWith('/'+code) ? ' ls-active' : '');
      el.setAttribute('role','option');
      el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
      el.addEventListener('click', ()=>{
        const sel2 = document.querySelector('#google_translate_element select.goog-te-combo') || document.querySelector('select.goog-te-combo');
        if (sel2){
          sel2.value = code;
          sel2.dispatchEvent(new Event('change', {bubbles:true}));
        }else{
          setLangCookie(code); location.reload();
        }
        closeLang();
        killGoogleBar();
      }, {passive:true});
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

  // 公式ウィジェット初期化コールバック（HTMLの cb と一致）
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({
        pageLanguage:'ja',
        includedLanguages:'ar,de,en,es,fr,id,it,ja,ko,pt,ru,th,tr,vi,zh-CN,zh-TW',
        autoDisplay:false,
        multilanguagePage:true,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
    }catch(_){}
    setTimeout(buildLangList, 600);
    const host = $('#google_translate_element');
    if (host){
      new MutationObserver(()=>setTimeout(buildLangList,0)).observe(host,{childList:true,subtree:true});
    }
  };

  function setLangCookie(code){
    try{
      const host = location.hostname.replace(/^www\./,'');
      const val  = '/ja/'+code;
      const exp  = new Date(Date.now()+365*24*60*60*1000).toUTCString();
      document.cookie = 'googtrans='+encodeURIComponent(val)+'; expires='+exp+'; path=/';
      document.cookie = 'googtrans='+encodeURIComponent(val)+'; expires='+exp+'; path=/; domain=.'+host;
      document.cookie = 'googtrans='+encodeURIComponent(val)+'; expires='+exp+'; path=/; domain='+host;
    }catch(_){}
  }

  // 文字だけの English / 日本語 ボタンも拾う保険
  document.addEventListener('click', function(e){
    const t = (e.target.textContent || '').trim();
    if (t === 'English'){ e.preventDefault(); setLangCookie('en'); location.reload(); }
    if (t === '日本語'){  e.preventDefault(); setLangCookie('ja'); location.reload(); }
  }, {capture:true});

  /* ---------- 4) 重要なお知らせ：#disclaimer 内へ移動し <details> 化 ---------- */
  (function mountImportant(){
    const host=$('#disclaimer')||document.body, src=$('#important-notice'); if(!host||!src) return;
    if($('#important-notice-details')) return;
    const det=document.createElement('details'); det.id='important-notice-details'; det.open=true;
    const sum=document.createElement('summary'); sum.textContent='重要なお知らせ';
    const content=document.createElement('div'); content.className='content';
    while(src.firstChild) content.appendChild(src.firstChild);
    det.append(sum,content);
    let acc=host.querySelector('.accordion'); if(!acc){ acc=document.createElement('div'); acc.className='accordion'; host.appendChild(acc); }
    acc.appendChild(det); src.remove?.();
  })();

  /* ---------- 5) 画面回転・復帰時の競合回避（自動で閉じる） ---------- */
  const closeAll = ()=>{ try{
    if (html.classList.contains('menu-open')) {
      html.classList.remove('menu-open');
      menuDrawer?.setAttribute('aria-hidden','true');
      menuBtn?.setAttribute('aria-expanded','false');
    }
    if (html.classList.contains('lang-open')) {
      html.classList.remove('lang-open');
      langDrawer?.setAttribute('aria-hidden','true');
      langBtn?.setAttribute('aria-expanded','false');
    }
  }catch(_{}); };
  let t; const debounce = fn => { clearTimeout(t); t=setTimeout(fn,150); };
  ['resize','orientationchange','pageshow','visibilitychange'].forEach(ev=>{
    addEventListener(ev, ()=>debounce(closeAll), {passive:true});
  });

})();
