/* script.js — 完全版（HTML/CSSは一切変更不要） */
(function(){
  'use strict';
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  /* ========================
     1) 右上メニュー（目次）
  ======================== */
  const menuBtn = $('#menuBtn'),
        menuDrawer = $('#menuDrawer'),
        menuBackdrop = $('#menuBackdrop'),
        menuClose = $('#menuClose');

  const openMenu  = () => { document.documentElement.classList.add('menu-open');  menuDrawer?.setAttribute('aria-hidden','false'); menuBtn?.setAttribute('aria-expanded','true'); };
  const closeMenu = () => { document.documentElement.classList.remove('menu-open'); menuDrawer?.setAttribute('aria-hidden','true');  menuBtn?.setAttribute('aria-expanded','false'); };

  if (menuBtn)     menuBtn.addEventListener('click', openMenu);
  if (menuClose)   menuClose.addEventListener('click', closeMenu);
  if (menuBackdrop)menuBackdrop.addEventListener('click', closeMenu);

  // 目次を自動生成
  const groups = $('#menuGroups');
  if (groups){
    const secMap = [
      ['corp-setup','法人設立'],
      ['plans','料金プラン'],
      ['sole-setup','個人事業主（IE/SBS）'],
      ['personal-account','個人口座開設（銀行）'],
      ['disclaimer','免責事項・キャンセル']
    ];
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

  /* =========================
     2) 言語ドロワー（UIだけ）
  ========================= */
  const langBtn = $('#langBtn'),
        langDrawer = $('#langDrawer'),
        langBackdrop = $('#langBackdrop'),
        langClose = $('#langClose');

  const openLang  = () => { document.documentElement.classList.add('lang-open');  langDrawer?.setAttribute('aria-hidden','false'); langBtn?.setAttribute('aria-expanded','true'); };
  const closeLang = () => { document.documentElement.classList.remove('lang-open'); langDrawer?.setAttribute('aria-hidden','true');  langBtn?.setAttribute('aria-expanded','false'); };

  if (langBtn)      langBtn.addEventListener('click', openLang);
  if (langClose)    langClose.addEventListener('click', closeLang);
  if (langBackdrop) langBackdrop.addEventListener('click', closeLang);

  // ESCキーで閉じる
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape'){ closeMenu(); closeLang(); }
  });

  // 言語検索（英語名/コードで部分一致）
  const listEl   = $('#langList');
  const searchEl = $('#langSearch');
  if (searchEl && listEl){
    searchEl.addEventListener('input', function(){
      const q = this.value.trim().toLowerCase();
      $$('.ls-item', listEl).forEach(it=>{
        const t = (it.textContent||'').toLowerCase();
        it.style.display = (!q || t.includes(q)) ? '' : 'none';
      });
    });
  }

  /* =========================
     3) Google翻訳 連携
     （公式<select>を裏で操作）
  ========================= */
  const hostEl = $('#google_translate_element');
  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  // 青バナー/吹き出しの無効化（常時）
  function killBanner(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      ['goog-te-banner-frame','goog-gt-tt'].forEach(id=>{
        const el=document.getElementById(id);
        if(el){
          if (el.remove) el.remove();
          else { el.style.display='none'; el.style.visibility='hidden'; el.style.height='0'; }
        }
      });
    }catch(_){}
  }
  new MutationObserver(killBanner).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killBanner, {once:true});
  killBanner();

  // ▼ 英語名A→Zで安定ソートして描画（※ここが今回の修正点）
  function buildList(){
    if (!hostEl || !listEl) return;
    const sel = hostEl.querySelector('select.goog-te-combo');
    if (!sel){ setTimeout(buildList,150); return; }

    const cookie = (document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '';
    const cur = decodeURIComponent(cookie||'');

    // options → [{code,name}] にして英語名でソート
    const items = [];
    for (let i=0;i<sel.options.length;i++){
      const o = sel.options[i];
      const code = (o.value||'').trim();
      if (!code || code==='auto') continue;
      const name = (dn ? (dn.of(code)||'') : '') || (o.textContent||'').trim() || code;
      items.push({code,name});
    }
    items.sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));

    // 描画
    const frag = document.createDocumentFragment();
    items.forEach(it=>{
      const div = document.createElement('div');
      div.className = 'ls-item' + (cur.endsWith('/'+it.code) ? ' ls-active' : '');
      div.setAttribute('role','option');
      div.dataset.code = it.code;
      div.innerHTML = `<span class="ls-name">${it.name}</span><span class="ls-code">${it.code}</span>`;
      frag.appendChild(div);
    });
    listEl.innerHTML = '';
    listEl.appendChild(frag);
  }

  // 初期化＆監視（公式UIが挿入されたら反映）
  buildList();
  if (hostEl){
    new MutationObserver(buildList).observe(hostEl, {childList:true,subtree:true});
  }

  // 言語クリック → 公式<select>を直接ドライブ（リロード不要）
  document.addEventListener('click', function(e){
    const t = e.target.closest('.ls-item[data-code]');
    if(!t) return;

    const sel = hostEl && hostEl.querySelector('select.goog-te-combo');
    if(!sel) return;

    e.preventDefault();
    sel.value = t.dataset.code;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    killBanner(); // 念のため

    // アクティブ表示更新 & ドロワーを閉じる
    if (listEl) $$('.ls-item', listEl).forEach(el=>el.classList.toggle('ls-active', el===t));
    closeLang();
  }, true);
})();
