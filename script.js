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
/* ===== Hamburger menu: include ALL <summary> (top-level + nested) in each section ===== */
(function(){
  const groups = document.getElementById('menuGroups');
  if (!groups) return;

  // セクションの順序と見出し（本文は変更しない）
  const sections = [
    ['corp-setup',       '法人設立'],
    ['plans',            '料金プラン'],
    ['sole-setup',       '個人事業主（IE/SBS）'],
    ['personal-account', '個人口座開設（銀行）'],
    ['disclaimer',       '免責事項・キャンセル']
  ];

  const sanitize = s => (s || '').trim().replace(/\s+/g,' ').slice(0,120);
  const mkId = base => base.toLowerCase()
    .replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');

  function closeMenu(){
    document.documentElement.classList.remove('menu-open');
    const drawer = document.getElementById('menuDrawer');
    const btn    = document.getElementById('menuBtn');
    if (drawer) drawer.setAttribute('aria-hidden','true');
    if (btn)    btn.setAttribute('aria-expanded','false');
  }

  function ensureId(detailsEl, secId, label, idx){
    if (detailsEl.id) return detailsEl.id;
    const base = mkId(`${secId}-${label || 'item'}-${idx+1}`) || `${secId}-d-${idx+1}`;
    let id = base, n = 2;
    while (document.getElementById(id)) id = `${base}-${n++}`;
    detailsEl.id = id;
    return id;
  }

  function openAncestors(el){
    let cur = el && el.parentElement;
    while (cur){
      if (cur.tagName && cur.tagName.toLowerCase() === 'details') cur.open = true;
      cur = cur.parentElement;
    }
  }

  groups.innerHTML = '';

  sections.forEach(([secId, secLabel])=>{
    const sec = document.getElementById(secId);
    if (!sec) return;

    const group = document.createElement('div');
    group.className = 'menu-group';

    const h4 = document.createElement('h4');
    h4.textContent = secLabel;

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    // セクションのトップ
    const liTop = document.createElement('li');
    const aTop  = document.createElement('a');
    aTop.href = `#${secId}`;
    aTop.textContent = `${secLabel}（トップ）`;
    aTop.addEventListener('click', closeMenu);
    liTop.appendChild(aTop);
    ul.appendChild(liTop);

    // そのセクション内の **全て** の <summary>（ネスト分も含む）
    const summaries = sec.querySelectorAll('.accordion summary');
    summaries.forEach((sum, idx)=>{
      const det = sum.closest('details');
      if (!det) return;

      const label = sanitize(sum.textContent);
      const id = ensureId(det, secId, label, idx);

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = label; // 文言はそのまま

      a.addEventListener('click', ()=>{
        const target = document.getElementById(id);
        if (target){
          openAncestors(target);   // 親<details>も開く（ネスト対応）
          setTimeout(closeMenu, 0);
        } else {
          closeMenu();
        }
      });

      li.appendChild(a);
      ul.appendChild(li);
    });

    group.appendChild(h4);
    group.appendChild(ul);
    groups.appendChild(group);
  });
})();
