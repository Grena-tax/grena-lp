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
      // 出ているかの簡易判定（CSSバッファ用）
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 1) ハンバーガー開閉（クリック不能対策を整理） ---------- */
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

      // セクションのトップ
      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = `${secLabel}（トップ）`;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop); ul.appendChild(liTop);

      // そのセクション内の summary をすべて列挙
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

  /* ---------- 3) 言語ドロワー（英語名で全言語） ---------- */
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

  // Google公式 <select> から英語名で自前リストを構築
  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

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
        const sel = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!sel) return;
        sel.value = code;
        sel.dispatchEvent(new Event('change', {bubbles:true}));
        closeLang();
        killGoogleBar();
      });
      frag.appendChild(el);
    });
    langList.appendChild(frag);

    // 検索
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

  // 公式ウィジェットの初期化（HTMLの cb と一致）
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    }catch(_){}
    // select が生えたらリストを作る
    setTimeout(buildLangList, 600);
    // 以後も変化を監視
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
  const isTop = /（トップ）\s*$/; // 全角カッコの「（トップ）」で終わる
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

  // 対象セクション（既存の並びそのまま）
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

  /* いったん空にしてから、トップレベルだけで再構築 */
  wrap.innerHTML = '';

  SECTIONS.forEach(([secId, label]) => {
    const sec = document.getElementById(secId);
    if (!sec) return;

    const group = document.createElement('div');
    group.className = 'menu-group';

    // 「料金プラン」の見出し(h4)は出さない
    if (secId !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = label;
      group.appendChild(h4);
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    // セクションのトップ（※「（トップ）」は付けない）
    const liTop = document.createElement('li');
    const aTop = document.createElement('a');
    aTop.href = `#${secId}`;
    aTop.textContent = label;
    aTop.addEventListener('click', closeMenu);
    liTop.appendChild(aTop);
    ul.appendChild(liTop);

    // 直下の <details> だけを採用（ネストは除外）
    sec.querySelectorAll(':scope .accordion > details > summary').forEach((sum, idx) => {
      const det = sum.closest('details');
      if (!det) return;

      // idが無ければユニークidを振る（既存はそのまま）
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

  // 念のため：残っている「（トップ）」表記はすべて削除
  document.querySelectorAll('#menuGroups a').forEach(a => {
    a.textContent = a.textContent.replace(/（トップ）/g, '');
  });
})();
/* === hamburger cleanup: remove "(トップ)" and duplicated group-title items === */
(function () {
  const groups = document.querySelectorAll('#menuGroups .menu-group');

  groups.forEach(g => {
    const title = (g.querySelector('h4')?.textContent || '')
                    .trim().replace(/\s+/g, ' ');
    const links = g.querySelectorAll('.menu-list a');

    links.forEach(a => {
      const txt = (a.textContent || '').trim().replace(/\s+/g, ' ');
      // 末尾が（トップ）/ (トップ) の項目、または見出しと同じ文言の項目を削除
      if (/（トップ）$|\(トップ\)$/.test(txt) || (title && txt === title)) {
        a.closest('li')?.remove();
      }
    });
  });

  // 保険：h4 が「料金プラン」の見出しは非表示（既に実施済みでもOK）
  document.querySelectorAll('#menuGroups .menu-group h4').forEach(h => {
    const t = (h.textContent || '').trim().replace(/\s+/g, ' ');
    if (t === '料金プラン') h.remove();
  });
})();
/* セーフティ追記：target="_blank" には安全属性を必ず付与 */
(function(){
  document.querySelectorAll('a[target="_blank"]').forEach(a=>{
    const need = ['noopener','noreferrer'];
    const cur  = (a.rel||'').split(/\s+/).filter(Boolean);
    need.forEach(t => { if (!cur.includes(t)) cur.push(t); });
    a.rel = cur.join(' ');
  });
})();
/* 重要なお知らせを「免責事項」内へ自動移動（もう入っていれば何もしない） */
(function(){
  var note = document.getElementById('legal-safety-note');
  var dest = document.querySelector('#disclaimer details:first-of-type .content');
  if (note && dest && !dest.contains(note)) dest.appendChild(note);
})();
/* ▼「重要なお知らせ」ブロックを必ず #disclaimer 内へ移動（id無しでもOK） */
(function () {
  const dest = document.querySelector('#disclaimer details:first-of-type .content');
  if (!dest) return;

  // 1) まず id=legal-safety-note を探す
  let block = document.getElementById('legal-safety-note');

  // 2) なければテキストで推定して拾う（見出しや周辺の箱を優先）
  if (!block) {
    const hasNoteText = el => /重要なお知らせ/.test((el.textContent || '').replace(/\s+/g,' '));
    // 先に「見出しを含む箱」を探す
    block = Array.from(document.querySelectorAll('section,article,aside,div'))
      .find(el => hasNoteText(el) && (el.querySelector('ul,ol,li') || el.querySelector('p')));
    // 見つからない場合は見出し行→親箱
    if (!block) {
      const heading = Array.from(document.querySelectorAll('h1,h2,h3,strong,p,div'))
        .find(el => hasNoteText(el));
      if (heading) block = heading.closest('section,article,aside,div') || heading.parentElement;
    }
    // さらに最後の保険：箇条書きそのものを拾って包む
    if (!block) {
      const list = Array.from(document.querySelectorAll('ul,ol'))
        .find(el => hasNoteText(el.previousElementSibling || {textContent:''}) || hasNoteText(el));
      if (list) {
        const wrap = document.createElement('div');
        wrap.id = 'legal-safety-note';
        wrap.className = list.className || 'security-note';
        // 見出し行が直前にあれば一緒に移す
        const prev = list.previousElementSibling;
        if (prev && hasNoteText(prev)) wrap.appendChild(prev);
        list.parentNode.insertBefore(wrap, list);
        wrap.appendChild(list);
        block = wrap;
      }
    }
  }

  // 3) 見つかったら #disclaimer の最初のdetails内へ移動
  if (block && !dest.contains(block)) dest.appendChild(block);
})();
