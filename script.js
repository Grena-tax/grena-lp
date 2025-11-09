/* ===== script.js (11/09 SAFE・完全置換) ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google青バナー/吹き出しの抑止（非破壊：非表示のみ） ---------- */
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const tt = document.getElementById('goog-gt-tt');
      if (tt){ tt.style.display = 'none'; }
      const ifr = document.querySelector('iframe.goog-te-banner-frame');
      if (ifr){ ifr.style.display = 'none'; }
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 1) ハンバーガー開閉 ---------- */
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

  /* ---------- 2) 目次（各セクション＋全summaryを自動生成｜削除は一切しない） ---------- */
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

      // セクション先頭リンク（「（トップ）」は付けず、テキスト変更もしない）
      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = `${secLabel}`;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop); ul.appendChild(liTop);

      // 各アコーディオン項目
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

  /* ---------- 3) 言語ドロワー（ウィジェット不在時はフォールバック） ---------- */
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

  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;
  const LANG_FALLBACK = ['en','zh-CN','zh-TW','ko','es','fr','de','pt','ru','id','hi','ar','tr','th','vi'];

  function currentHost(){
    try{ return location.hostname.replace(/^www\./,''); }catch(_){ return ''; }
  }
  function setGoogTransCookie(dst){
    const host = currentHost();
    const val  = `/ja/${dst}`;
    const attrs = `; path=/`;
    document.cookie = `googtrans=${val}${attrs}`;
    if (host){
      document.cookie = `googtrans=${val}${attrs}; domain=.${host}`;
      document.cookie = `googtrans=${val}${attrs}; domain=${host}`;
    }
  }
  function applyLanguage(code){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (sel){
      sel.value = code;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
      killGoogleBar();
      closeLang();
      return;
    }
    // フォールバック：cookie→再読込で適用
    setGoogTransCookie(code);
    location.reload();
  }

  function fillList(items){
    if (!langList) return;
    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    const curCookie = decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '');
    const curCode = (curCookie.split('/').pop() || '').toLowerCase();

    items.forEach(({code,name})=>{
      const el = document.createElement('div');
      el.className = 'ls-item' + (curCode === code.toLowerCase() ? ' ls-active' : '');
      el.setAttribute('role','option');
      el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
      el.addEventListener('click', ()=> applyLanguage(code));
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

  function buildFromSelect(){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel) return false;
    const items = Array.from(sel.options)
      .filter(o => o.value && o.value !== 'auto')
      .map(o => {
        const code = o.value.trim();
        const name = (dn && dn.of(code.replace('_','-'))) || (o.textContent||code).trim();
        return {code, name};
      })
      .sort((a,b)=> a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
    fillList(items);
    return true;
  }
  function buildFallback(){
    const items = LANG_FALLBACK.map(code=>{
      const name = (dn && dn.of(code)) || code;
      return {code, name};
    });
    fillList(items);
  }
  function buildLangList(){
    let tries = 0;
    const tmr = setInterval(()=>{
      tries++;
      if (buildFromSelect()){ clearInterval(tmr); return; }
      if (tries >= 10){ clearInterval(tmr); buildFallback(); }
    }, 300);
  }

  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    }catch(_){}
    setTimeout(buildLangList, 300);
    const host = $('#google_translate_element');
    if (host){
      new MutationObserver(()=>setTimeout(buildLangList,0)).observe(host,{childList:true,subtree:true});
    }
  };

  /* ---------- 4) 為替表の横はみ出し対策（非破壊） ---------- */
  (function () {
    function markFxTable(){
      try{
        document.querySelectorAll('table').forEach(tbl=>{
          if (tbl.classList.contains('fx-sim')) return;

          const heads = Array.from(
            tbl.querySelectorAll('thead th, tr:first-child th, thead td, tr:first-child td')
          ).map(th => (th.textContent || '').trim());

          const need = ['為替シナリオ','1GEL','満期残高','円換算額','損益'];
          const hit  = need.every(k => heads.some(h => h.includes(k)));
          if (!hit) return;

          tbl.classList.add('fx-sim');

          if (!tbl.parentElement || !tbl.parentElement.classList.contains('fx-wrap')) {
            const wrap = document.createElement('div');
            wrap.className = 'fx-wrap';
            tbl.parentNode.insertBefore(wrap, tbl);
            wrap.appendChild(tbl);
          }
        });
      }catch(_){}
    }
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', markFxTable);
    }else{
      markFxTable();
    }
  })();

})();
