/* =========================
   Minimal UI & Translate glue
   ========================= */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* --- メニュー --- */
  const menuBtn = $('#menuBtn'), menuDrawer = $('#menuDrawer'),
        menuBackdrop = $('#menuBackdrop'), menuClose = $('#menuClose');
  const openMenu  = () => { document.documentElement.classList.add('menu-open'); menuDrawer?.setAttribute('aria-hidden','false'); menuBtn?.setAttribute('aria-expanded','true'); };
  const closeMenu = () => { document.documentElement.classList.remove('menu-open'); menuDrawer?.setAttribute('aria-hidden','true'); menuBtn?.setAttribute('aria-expanded','false'); };
  menuBtn?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);

  /* --- 言語ドロワー --- */
  const langBtn = $('#langBtn'), langDrawer = $('#langDrawer'),
        langBackdrop = $('#langBackdrop'), langClose = $('#langClose');
  const openLang  = () => { document.documentElement.classList.add('lang-open'); langDrawer?.setAttribute('aria-hidden','false'); langBtn?.setAttribute('aria-expanded','true'); };
  const closeLang = () => { document.documentElement.classList.remove('lang-open'); langDrawer?.setAttribute('aria-hidden','true'); langBtn?.setAttribute('aria-expanded','false'); };
  langBtn?.addEventListener('click', openLang);
  langClose?.addEventListener('click', closeLang);
  langBackdrop?.addEventListener('click', closeLang);

  /* --- 目次（主要セクションのみ） --- */
  const secMap = [
    ['corp-setup','法人設立'],
    ['plans','料金プラン'],
    ['sole-setup','個人事業主（IE/SBS）'],
    ['personal-account','個人口座開設（銀行）'],
    ['disclaimer','免責事項・キャンセル']
  ];
  const groups = $('#menuGroups');
  if (groups) {
    const ul = document.createElement('ul'); ul.className = 'menu-list';
    secMap.forEach(([id,label])=>{
      const li=document.createElement('li');
      const a=document.createElement('a'); a.href='#'+id; a.textContent=label;
      a.addEventListener('click', closeMenu);
      li.appendChild(a); ul.appendChild(li);
    });
    const g=document.createElement('div'); g.className='menu-group';
    const h=document.createElement('h4'); h.textContent='セクション';
    g.appendChild(h); g.appendChild(ul); groups.appendChild(g);
  }

  /* --- 翻訳バナー殺し（押し下げ防止） --- */
  function killBanner(){
    try{
      document.documentElement.style.marginTop = '0px';
      document.body.style.top = '0px';
      ['goog-te-banner-frame','goog-gt-tt'].forEach(id=>{
        const el=document.getElementById(id);
        if(el){ if(el.remove) el.remove(); else { el.style.display='none'; el.style.visibility='hidden'; } }
      });
    }catch(_){}
  }
  new MutationObserver(killBanner).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killBanner, {once:true});
  killBanner();

  /* --- 言語検索（英語名/コードで部分一致） --- */
  const langSearch = $('#langSearch'), list = $('#langList');
  if (langSearch && list){
    langSearch.addEventListener('input', ()=>{
      const q = langSearch.value.trim().toLowerCase();
      $$('.ls-item', list).forEach(it=>{
        const label = (it.textContent||'').toLowerCase();
        it.style.display = !q || label.includes(q) ? '' : 'none';
      });
    });
  }

  /* --- 公式<select>→カスタムリスト生成 --- */
  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;
  function buildList(){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if(!sel || !list){ setTimeout(buildList, 150); return; }
    const cookie = (document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '';
    const cur = decodeURIComponent(cookie||'');
    const frag = document.createDocumentFragment();

    for(let i=0;i<sel.options.length;i++){
      const o = sel.options[i];
      const code = (o.value||'').trim();
      if(!code || code==='auto') continue;
      const name = (dn ? (dn.of(code)||'') : '') || (o.textContent||'').trim() || code;
      const item = document.createElement('div');
      item.className = 'ls-item' + (cur.endsWith('/'+code) ? ' ls-active':'');
      item.setAttribute('role','option');
      item.dataset.code = code;
      item.innerHTML = `<span class="ls-name">${name}</span><span class="ls-code">${code}</span>`;
      frag.appendChild(item);
    }
    list.innerHTML='';
    list.appendChild(frag);
  }
  buildList();
  const host = $('#google_translate_element');
  if (host) new MutationObserver(buildList).observe(host,{childList:true,subtree:true});

  /* --- 言語クリックで即適用 --- */
  document.addEventListener('click', function(e){
    const t = e.target.closest('.ls-item[data-code]');
    if(!t) return;
    e.preventDefault(); e.stopPropagation();

    const code = t.dataset.code;
    const sel  = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel) return;

    sel.value = code;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    killBanner();

    list.querySelectorAll('.ls-item').forEach(el=>el.classList.toggle('ls-active', el===t));
    document.documentElement.classList.remove('lang-open');
    langDrawer?.setAttribute('aria-hidden','true');
    langBtn?.setAttribute('aria-expanded','false');
  }, true);

})();

/* --- Google公式コールバック（global） --- */
function googleTranslateElementInit(){
  new google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false}, 'google_translate_element');
}
