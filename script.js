/* ===== 最小JS。フォント・本文は一切変更しない ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* 0) Google 翻訳 “青バナー/吹き出し” を常時抑止 */
  function killBanner(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      ['goog-te-banner-frame','goog-gt-tt'].forEach(id=>{
        const el = document.getElementById(id);
        if (el){
          if (el.remove) el.remove();
          else { el.style.display='none'; el.style.visibility='hidden'; el.style.height='0'; }
        }
      });
    }catch(_){}
  }
  new MutationObserver(killBanner).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killBanner, {once:true});
  killBanner();

  /* 1) メニュー（ハンバーガー） */
  const menuBtn = $('#menuBtn'), menuDrawer = $('#menuDrawer'), menuBackdrop = $('#menuBackdrop'), menuClose = $('#menuClose');
  const openMenu  = () => { document.documentElement.classList.add('menu-open');  menuDrawer?.setAttribute('aria-hidden','false'); menuBtn?.setAttribute('aria-expanded','true');  };
  const closeMenu = () => { document.documentElement.classList.remove('menu-open'); menuDrawer?.setAttribute('aria-hidden','true');  menuBtn?.setAttribute('aria-expanded','false'); };
  menuBtn?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);

  /* 2) 言語ドロワー */
  const langBtn = $('#langBtn'), langDrawer = $('#langDrawer'), langBackdrop = $('#langBackdrop'), langClose = $('#langClose');
  const openLang  = () => { document.documentElement.classList.add('lang-open');  langDrawer?.setAttribute('aria-hidden','false'); langBtn?.setAttribute('aria-expanded','true');  };
  const closeLang = () => { document.documentElement.classList.remove('lang-open'); langDrawer?.setAttribute('aria-hidden','true');  langBtn?.setAttribute('aria-expanded','false'); };
  langBtn?.addEventListener('click', openLang);
  langClose?.addEventListener('click', closeLang);
  langBackdrop?.addEventListener('click', closeLang);

  /* 3) 目次（主要セクションのみ） */
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

  /* 4) 言語検索（英語名でフィルタ） */
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

  /* 5) Google Translate：公式ウィジェット → 全言語を英語名で複製＆クリック即反映 */
  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  function buildLangList(){
    const host = $('#google_translate_element');
    const sel  = host ? host.querySelector('select.goog-te-combo') : null;
    if(!sel || !list){ setTimeout(buildLangList, 150); return; }

    // 現在言語（cookie）
    const cookie = (document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '';
    const cur = decodeURIComponent(cookie||'');

    // option → 配列化して英語名でソート
    const items = [];
    for(let i=0;i<sel.options.length;i++){
      const o = sel.options[i];
      const code = (o.value||'').trim();
      if(!code || code==='auto') continue;
      const name = (dn ? (dn.of(code)||'') : '') || (o.textContent||'').trim() || code;
      items.push({code, name});
    }
    items.sort((a,b)=> a.name.localeCompare(b.name,'en',{sensitivity:'base'}));

    // 描画
    const frag = document.createDocumentFragment();
    items.forEach(({code,name})=>{
      const item = document.createElement('div');
      item.className = 'ls-item' + (cur.endsWith('/'+code) ? ' ls-active':'');
      item.setAttribute('role','option');
      item.dataset.code = code;
      item.innerHTML = `<span class="ls-name">${name}</span><span class="ls-code">${code}</span>`;
      frag.appendChild(item);
    });
    list.innerHTML=''; list.appendChild(frag);
  }

  // クリック → 公式<select>を直接ドライブ
  document.addEventListener('click', function(e){
    const t = e.target.closest('.ls-item[data-code]');
    if(!t) return;
    e.preventDefault(); e.stopPropagation();

    const sel  = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel) return;
    sel.value = t.dataset.code;
    sel.dispatchEvent(new Event('change',{bubbles:true}));

    // アクティブ表示更新 & ドロワーを閉じる
    list.querySelectorAll('.ls-item').forEach(el=>el.classList.toggle('ls-active', el===t));
    document.documentElement.classList.remove('lang-open');
    langDrawer?.setAttribute('aria-hidden','true');
    langBtn?.setAttribute('aria-expanded','false');

    // 念のためバナー殺し
    killBanner();
  }, true);

  // 公式が初期化されたら反映
  function watchGt(){
    const host = $('#google_translate_element');
    if (!host){ setTimeout(watchGt, 150); return; }
    new MutationObserver(buildLangList).observe(host,{childList:true,subtree:true});
    buildLangList();
  }
  watchGt();

  /* 6) グローバル：Googleの初期化関数（翻訳スクリプトから呼ばれる） */
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false}, 'google_translate_element');
    }catch(_){}
  };

})();
