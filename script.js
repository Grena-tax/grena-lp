/* ===== script.js (2025-11-10 final) ===== */
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
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 0.5) 見出しの不自然な改行を抑止（オンライ↵ン等） ---------- */
  (function fixHeroHeading(){
    function patch(el){
      if (!el || el.dataset.jpFixed) return;
      const raw = el.textContent || '';
      if (!raw) return;
      const withBreakPoints = raw.replace(/([｜|／/])/g, '$1\u200B');
      el.textContent = '';
      el.insertAdjacentText('afterbegin', withBreakPoints);
      el.classList.add('no-jp-break');
      el.dataset.jpFixed = '1';
    }
    const targets = $$('main h1, main h2');
    targets.forEach(patch);
    new MutationObserver(()=>targets.forEach(patch)).observe(document.body,{childList:true,subtree:true});
  })();

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

  /* ---------- 2) 目次（トップ項目は作らない＝重複解消） ---------- */
  (function buildMenuNoTop(){
    const wrap = $('#menuGroups');
    if (!wrap) return;

    const SECTIONS = [
      ['corp-setup',       '法人設立'],
      ['plans',            '料金プラン'],
      ['sole-setup',       '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer',       '免責事項・キャンセル']
    ];

    const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);

    function ensureId(detailsEl, secId, label, idx){
      if (detailsEl.id) return detailsEl.id;
      const base = (secId + '-' + (label||'item') + '-' + (idx+1))
                    .toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
      let id = base || `${secId}-d-${idx+1}`, n=2;
      while (document.getElementById(id)) id = `${base}-${n++}`;
      detailsEl.id = id;
      return id;
    }

    function closeMenuSoft(){
      html.classList.remove('menu-open');
      menuDrawer && menuDrawer.setAttribute('aria-hidden','true');
      menuBtn && menuBtn.setAttribute('aria-expanded','false');
    }

    wrap.innerHTML = '';

    SECTIONS.forEach(([secId, label])=>{
      const sec = document.getElementById(secId);
      if (!sec) return;

      const group = document.createElement('div');
      group.className = 'menu-group';

      // 「料金プラン」は見出しを表示しない（既存仕様を維持）
      if (secId !== 'plans') {
        const h4 = document.createElement('h4');
        h4.textContent = label;
        group.appendChild(h4);
      }

      const ul = document.createElement('ul');
      ul.className = 'menu-list';

      // :scopeフォールバック
      const scopeOK = (window.CSS && CSS.supports && CSS.supports('selector(:scope)'));
      const selector = (scopeOK ? ':scope ' : '') + '.accordion > details > summary';

      // トップ項目は作らず、サマリーのみ列挙
      sec.querySelectorAll(selector).forEach((sum, idx)=>{
        const det = sum.closest('details'); if (!det) return;
        const id  = ensureId(det, secId, sum.textContent, idx);

        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = sanitize(sum.textContent);
        a.addEventListener('click', ()=>{ det.open = true; closeMenuSoft(); });
        li.appendChild(a);
        ul.appendChild(li);
      });

      group.appendChild(ul);
      wrap.appendChild(group);
    });
  })();

  /* ---------- 3) 言語ドロワー ---------- */
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
      // ★キーボード操作を保証
      el.tabIndex = 0;
      el.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); el.click(); } });

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

  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    }catch(_){}
    setTimeout(buildLangList, 600);
    const host = $('#google_translate_element');
    if (host){
      new MutationObserver(()=>setTimeout(buildLangList,0)).observe(host,{childList:true,subtree:true});
    }
  };

})();

/* === 追加: フォーカストラップ（menu/lang）=== */
(function(){
  const html = document.documentElement;
  const FOCUS = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
  let releaseMenu=null, releaseLang=null;

  const trap = (root) =>{
    const prev = document.activeElement;
    const onKey = (e)=>{
      if(e.key!=='Tab') return;
      const list = Array.from(root.querySelectorAll(FOCUS))
        .filter(el=>!el.disabled && el.offsetParent!==null);
      if(!list.length) return;
      const first=list[0], last=list[list.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    };
    root.addEventListener('keydown', onKey);
    (root.querySelector(FOCUS)||root).focus();
    return ()=>{ root.removeEventListener('keydown', onKey); prev && prev.focus(); };
  };

  const obs = new MutationObserver(()=>{
    const menuOpen = html.classList.contains('menu-open');
    const langOpen = html.classList.contains('lang-open');

    const menuPanel = document.getElementById('menuDrawer');
    const langPanel = document.getElementById('langDrawer');

    if(menuOpen && !releaseMenu && menuPanel) releaseMenu = trap(menuPanel);
    if(!menuOpen && releaseMenu){ releaseMenu(); releaseMenu=null; }

    if(langOpen && !releaseLang && langPanel) releaseLang = trap(langPanel);
    if(!langOpen && releaseLang){ releaseLang(); releaseLang=null; }
  });
  obs.observe(html, { attributes:true, attributeFilter:['class'] });
})();

/* === 為替表の横はみ出し対策（既存） === */
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
/* ===== patch-lang.js（翻訳UI復旧：暗転だけ問題の根治＋一度だけ初期化） ===== */
(function(){
  if (window.__langPatchInit) return;
  window.__langPatchInit = true;

  // 1) 必要ノードが無ければ生成
  function ensureNode(sel, html) {
    let el = document.querySelector(sel);
    if (!el) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html.trim();
      el = tmp.firstElementChild;
      document.body.appendChild(el);
    }
    return el;
  }

  // オーバーレイ（暗転と外側クリックで閉じる）
  const wrap = ensureNode('.lang-wrap', '<div class="lang-wrap" translate="no"><div class="lang-backdrop"></div></div>');
  const backdrop = wrap.querySelector('.lang-backdrop');

  // Google翻訳コンテナ（存在しなければ作成）
  ensureNode('#google_translate_element', '<div id="google_translate_element" translate="no" aria-hidden="false"></div>');

  // 2) Google翻訳スクリプトを一度だけ読み込み
  function loadGoogleTranslate(cb){
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      cb && cb(); return;
    }
    if (window.__gtLoading) { // 二重読込防止：読込済みなら待たずに続行
      cb && cb(); return;
    }
    window.__gtLoading = true;
    window.googleTranslateElementInit = function(){
      try{
        new google.translate.TranslateElement({
          pageLanguage: 'ja',
          includedLanguages: 'en,ko,zh-CN,zh-TW,fr,de,es,id,th,vi,ar,ru,hi,pt,it,nl',
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google_translate_element');
      }catch(e){}
      cb && cb();
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  }

  // 3) 開閉制御（html/body の両方に .lang-open を付与：CSSの両対応）
  function openLang(){
    document.documentElement.classList.add('lang-open');
    document.body.classList.add('lang-open');
    loadGoogleTranslate(function(){
      // 表示はCSSで制御（位置・Z-indexはpatch.cssで最前面に）
      // ここでは何もしない（自動で #google_translate_element が操作可能になる）
    });
  }
  function closeLang(){
    document.documentElement.classList.remove('lang-open');
    document.body.classList.remove('lang-open');
  }

  // 4) イベント：地球儀ボタン／暗転クリック／ESC
  function bindOnce(){
    if (window.__langBindDone) return;
    window.__langBindDone = true;

    // 地球儀ボタンは .lang-button または [data-lang-button]
    const btn = document.querySelector('.lang-button, [data-lang-button]');
    if (btn) {
      btn.addEventListener('click', function(e){
        e.preventDefault();
        // トグル：開いていれば閉じる
        if (document.documentElement.classList.contains('lang-open') || document.body.classList.contains('lang-open')){
          closeLang();
        } else {
          openLang();
        }
      }, { passive:false });
    }

    // 暗転クリックで閉じる
    backdrop.addEventListener('click', function(){ closeLang(); });

    // Escで閉じる
    window.addEventListener('keydown', function(ev){
      if (ev.key === 'Escape') closeLang();
    });
  }

  // 5) DOM準備後にバインド
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindOnce, { once: true });
  } else {
    bindOnce();
  }
})();
