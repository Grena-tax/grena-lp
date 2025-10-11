/* ===== 最小限のUI操作JS（メニュー・言語ドロワー・目次） ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // メニュー
  const menuBtn = $('#menuBtn'),
        menuDrawer = $('#menuDrawer'),
        menuBackdrop = $('#menuBackdrop'),
        menuClose = $('#menuClose');

  const openMenu = () => {
    document.documentElement.classList.add('menu-open');
    if (menuDrawer) menuDrawer.setAttribute('aria-hidden','false');
    if (menuBtn) menuBtn.setAttribute('aria-expanded','true');
  };
  const closeMenu = () => {
    document.documentElement.classList.remove('menu-open');
    if (menuDrawer) menuDrawer.setAttribute('aria-hidden','true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded','false');
  };
  if (menuBtn)     menuBtn.addEventListener('click', openMenu);
  if (menuClose)   menuClose.addEventListener('click', closeMenu);
  if (menuBackdrop)menuBackdrop.addEventListener('click', closeMenu);

  // 言語ドロワー
  const langBtn = $('#langBtn'),
        langDrawer = $('#langDrawer'),
        langBackdrop = $('#langBackdrop'),
        langClose = $('#langClose');

  const openLang = () => {
    document.documentElement.classList.add('lang-open');
    if (langDrawer) langDrawer.setAttribute('aria-hidden','false');
    if (langBtn) langBtn.setAttribute('aria-expanded','true');
  };
  const closeLang = () => {
    document.documentElement.classList.remove('lang-open');
    if (langDrawer) langDrawer.setAttribute('aria-hidden','true');
    if (langBtn) langBtn.setAttribute('aria-expanded','false');
  };
  if (langBtn)      langBtn.addEventListener('click', openLang);
  if (langClose)    langClose.addEventListener('click', closeLang);
  if (langBackdrop) langBackdrop.addEventListener('click', closeLang);

  // 目次（主要セクションのみ）
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

  // 言語検索（英語名でフィルタ）
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
})();
