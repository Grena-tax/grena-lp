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
