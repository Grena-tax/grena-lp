/* ===== Google翻訳バナー抑止（本文は無改変） ===== */
(function(){
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
})();

/* ===== ハンバーガー開閉（タップで開閉／Backdrop×Escで閉じる） ===== */
(function(){
  const html     = document.documentElement;
  const btn      = document.getElementById('menuBtn');
  const drawer   = document.getElementById('menuDrawer');
  const backdrop = document.getElementById('menuBackdrop');
  const closeBtn = document.getElementById('menuClose');

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    if (drawer) drawer.setAttribute('aria-hidden', String(!open));
    if (btn)    btn.setAttribute('aria-expanded', String(open));
  }
  function toggleMenu(e){ if(e) e.preventDefault(); setMenu(!html.classList.contains('menu-open')); }
  function closeMenu(){ setMenu(false); }

  btn && btn.addEventListener('click', toggleMenu, {passive:false});
  btn && btn.addEventListener('touchstart', toggleMenu, {passive:false});
  backdrop && backdrop.addEventListener('click', closeMenu);
  closeBtn && closeBtn.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  /* ===== 目次ビルド（この一箇所のみを使用） ===== */
  const groups = document.getElementById('menuGroups');
  if (groups){
    groups.innerHTML = '';

    // セクションの順序と見出し
    const sections = [
      ['corp-setup',       '法人設立'],
      ['plans',            '料金プラン'],
      ['sole-setup',       '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer',       '免責事項・キャンセル']
    ];

    // plans内で残すsummary文言（完全一致ベース／前後空白圧縮）
    const PLANS_KEEP = new Set([
      '料金プラン（3つのプランから選択）',
      '追加オプション',
      '2年目以降の維持・サポート',
      'よくある質問（2年目以降）'
    ]);
    const norm = s => (s||'').replace(/\s+/g,' ').trim();

    const mkId = base => base.toLowerCase()
      .replace(/[^\w\-ぁ-んァ-ヴー一-龠]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');

    function ensureId(detailsEl, secId, label, idx){
      if (detailsEl.id) return detailsEl.id;
      const base = mkId(`${secId}-${label||'item'}-${idx+1}`) || `${secId}-d-${idx+1}`;
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
    function addItem(ul, href, text){
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = href; a.textContent = text;
      a.addEventListener('click', ()=> setMenu(false));
      li.appendChild(a); ul.appendChild(li);
    }

    sections.forEach(([secId, secLabel])=>{
      const sec = document.getElementById(secId);
      if (!sec) return;

      const ul = document.createElement('ul');
      ul.className = 'menu-list';

      // 「セクションのトップ」リンクは plans 以外に付ける
      if (secId !== 'plans') {
        addItem(ul, `#${secId}`, `${secLabel}（トップ）`);
      }

      // そのセクション内の <summary> を列挙
      const summaries = sec.querySelectorAll('.accordion summary');
      summaries.forEach((sum, idx)=>{
        const labelRaw = norm(sum.textContent);
        // plans の場合は指定4項目だけを残す
        if (secId === 'plans' && !PLANS_KEEP.has(labelRaw)) return;

        const det = sum.closest('details');
        if (!det) return;
        const id = ensureId(det, secId, labelRaw, idx);

        const a = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = labelRaw;
        a.addEventListener('click', ()=>{
          const target = document.getElementById(id);
          if (target){ openAncestors(target); setMenu(false); }
          else { setMenu(false); }
        });

        const li = document.createElement('li');
        li.appendChild(a);
        ul.appendChild(li);
      });

      // 項目が1つも無い場合はグループごと表示しない（空白対策）
      if (!ul.children.length) return;

      const group = document.createElement('div');
      group.className = 'menu-group';
      const h4 = document.createElement('h4'); h4.textContent = secLabel;
      group.appendChild(h4);
      group.appendChild(ul);
      groups.appendChild(group);
    });
  }
})();

/* ===== 言語ドロワー（Googleのselectを読み込んで英語名で並べ替え） ===== */
(function () {
  const $ = s => document.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, { passive:true });

  const btn   = $('#langBtn');
  const wrap  = $('#langDrawer');
  const close = $('#langClose');
  const list  = $('#langList');
  const search= $('#langSearch');

  on(btn, 'click', () => { document.documentElement.classList.add('lang-open'); wrap?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); });
  on(close,'click', () => { document.documentElement.classList.remove('lang-open'); wrap?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); });
  on($('#langBackdrop'), 'click', () => { document.documentElement.classList.remove('lang-open'); wrap?.setAttribute('aria-hidden','true'); btn?.setAttribute('aria-expanded','false'); });

  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  function buildLangList(){
    const host = $('#google_translate_element');
    const sel  = host ? host.querySelector('select.goog-te-combo') : null;
    if(!sel || !list){ setTimeout(buildLangList, 200); return; }

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
      item.className = 'ls-item';
      item.setAttribute('role','option');
      item.dataset.code = code;
      item.innerHTML = `<span class="ls-name">${name}</span><span class="ls-code">${code}</span>`;
      item.addEventListener('click', () => {
        sel.value = code;
        sel.dispatchEvent(new Event('change',{bubbles:true}));
        document.documentElement.classList.remove('lang-open');
        wrap?.setAttribute('aria-hidden','true');
        btn?.setAttribute('aria-expanded','false');
      });
      frag.appendChild(item);
    });
    list.innerHTML=''; list.appendChild(frag);

    // 検索フィルタ
    if (search) {
      search.value = '';
      search.oninput = () => {
        const q = (search.value||'').trim().toLowerCase();
        list.querySelectorAll('.ls-item').forEach(el=>{
          const txt = (el.textContent||'').toLowerCase();
          el.style.display = !q || txt.includes(q) ? '' : 'none';
        });
      };
    }
  }

  // 公式が初期化されたら反映
  function watchGt(){
    const host = $('#google_translate_element');
    if (!host){ setTimeout(watchGt, 200); return; }
    new MutationObserver(buildLangList).observe(host,{childList:true,subtree:true});
    buildLangList();
  }
  watchGt();

  // グローバル：翻訳初期化関数（Googleスクリプトから呼ばれる）
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false}, 'google_translate_element');
    }catch(_){}
  };
})();
