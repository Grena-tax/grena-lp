/* -----------------------------------------------------------
   app.js  —  メニュー/言語ドロワー/目次 + Google翻訳制御（英語UI）
----------------------------------------------------------- */

/* 0) 初期英語化の防止：/ja/ja 以外の googtrans を除去（可能ならハッシュ残骸も除去） */
(function precleanGoogTrans(){
  try{
    var host = location.hostname.replace(/^www\./,'');
    var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (m) {
      var v = decodeURIComponent(m[1]||'');
      if (v && v !== '/ja/ja') {
        var exp='Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie='googtrans=; expires='+exp+'; path=/';
        document.cookie='googtrans=; expires='+exp+'; path=/; domain=.'+host;
        document.cookie='googtrans=; expires='+exp+'; path=/; domain='+host;
        if (/#googtrans/.test(location.hash)) {
          history.replaceState('', document.title, location.pathname + location.search);
        }
      }
    }
  }catch(_){}
})();

/* 1) Google Translate 公式コールバック（UIは英語、基準言語は日本語） */
window.googleTranslateElementInit = function(){
  new google.translate.TranslateElement(
    { pageLanguage: 'ja', autoDisplay: false },
    'google_translate_element'
  );
};

/* 2) 青バナー/ツールチップを常時無効化（見た目も押し下げも殺す） */
(function bannerKiller(){
  function kill(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      ['goog-gt-tt','goog-gt-toolbar-frame','goog-te-banner-frame'].forEach(function(id){
        var el = document.getElementById(id);
        if (!el) return;
        if (el.remove) el.remove();
        else { el.style.display='none'; el.style.visibility='hidden'; }
      });
    }catch(_){}
  }
  new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', kill, {once:true});
  kill();
})();

/* 3) ユーティリティ */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* 4) メニュー（右側スライド） */
(function menu(){
  const menuBtn = $('#menuBtn'), menuDrawer = $('#menuDrawer'),
        menuBackdrop = $('#menuBackdrop'), menuClose = $('#menuClose');
  const openMenu = () => { document.documentElement.classList.add('menu-open'); menuDrawer?.setAttribute('aria-hidden','false'); menuBtn?.setAttribute('aria-expanded','true'); };
  const closeMenu = () => { document.documentElement.classList.remove('menu-open'); menuDrawer?.setAttribute('aria-hidden','true'); menuBtn?.setAttribute('aria-expanded','false'); };
  menuBtn?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);

  // 目次（主要セクション）
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
})();

/* 5) 言語ドロワー（英語UI） */
(function languageDrawer(){
  const langBtn = $('#langBtn'), langDrawer = $('#langDrawer'),
        langBackdrop = $('#langBackdrop'), langClose = $('#langClose');

  const openLang = () => { document.documentElement.classList.add('lang-open'); langDrawer?.setAttribute('aria-hidden','false'); langBtn?.setAttribute('aria-expanded','true'); };
  const closeLang = () => { document.documentElement.classList.remove('lang-open'); langDrawer?.setAttribute('aria-hidden','true'); langBtn?.setAttribute('aria-expanded','false'); };

  langBtn?.addEventListener('click', openLang);
  langClose?.addEventListener('click', closeLang);
  langBackdrop?.addEventListener('click', closeLang);

  // 検索（英語名・コードで部分一致）
  const langSearch = $('#langSearch'), listEl = $('#langList');
  if (langSearch && listEl){
    langSearch.addEventListener('input', ()=>{
      const q = langSearch.value.trim().toLowerCase();
      $$('.ls-item', listEl).forEach(it=>{
        const label = (it.textContent||'').toLowerCase();
        it.style.display = !q || label.includes(q) ? '' : 'none';
      });
    });
  }
})();

/* 6) 言語リストの構築（公式<select>から全言語を複製し、英語名で表示） */
(function buildLanguageList(){
  const listEl = $('#langList');
  const host   = $('#google_translate_element');
  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  function currentCookie(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    return decodeURIComponent((m && m[1])||'');
  }

  function render(){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel || !listEl) return false;

    const cur = currentCookie();
    const frag = document.createDocumentFragment();

    for (let i=0; i<sel.options.length; i++){
      const o = sel.options[i];
      const code = (o.value||'').trim();
      if (!code || code==='auto') continue;

      const name = (dn ? (dn.of(code)||'') : '') || (o.textContent||'').trim() || code;
      const item = document.createElement('div');
      item.className = 'ls-item' + (cur.endsWith('/'+code) ? ' ls-active' : '');
      item.setAttribute('role','option');
      item.dataset.code = code;
      item.innerHTML = `<span class="ls-name">${name}</span><span class="ls-code">${code}</span>`;
      frag.appendChild(item);
    }
    listEl.innerHTML = '';
    listEl.appendChild(frag);
    return true;
  }

  // 公式UIの挿入完了を監視して構築
  function tryRenderUntilReady(){
    let tries=0;
    const iv = setInterval(()=>{
      if (render()){ clearInterval(iv); }
      else if (++tries > 60){ clearInterval(iv); } // ~9秒で打切り
    },150);
  }
  tryRenderUntilReady();

  if (host){
    new MutationObserver(()=>{ render(); })
      .observe(host, {childList:true,subtree:true});
  }

  // クリック→公式<select>へ指示→即翻訳（リロード不要）
  document.addEventListener('click', function(e){
    const t = e.target.closest('.ls-item[data-code]');
    if (!t) return;
    e.preventDefault(); e.stopPropagation();

    const code = t.dataset.code;
    const sel  = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel) return;

    sel.value = code;
    sel.dispatchEvent(new Event('change', {bubbles:true}));

    // 表示更新＆ドロワーを閉じる
    $$('.ls-item', listEl).forEach(el=>el.classList.toggle('ls-active', el===t));
    document.documentElement.classList.remove('lang-open');
    const drawer = $('#langDrawer'); if (drawer) drawer.setAttribute('aria-hidden','true');
    const btn = $('#langBtn'); if (btn) btn.setAttribute('aria-expanded','false');
  }, true);
})();

/* 7) ページ上部へ（フッターCTAの「トップへ」） */
(function toTopLink(){
  const a = document.getElementById('toTop');
  if (!a) return;
  a.addEventListener('click', function(e){
    if (a.getAttribute('href') === '#page-top'){
      e.preventDefault();
      window.scrollTo({top:0,behavior:'smooth'});
    }
  });
})();
