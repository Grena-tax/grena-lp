/* ===== 最小JS：バグ修正のみ（本文や文言は無改変） ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* 0) Google 翻訳 “青バナー/吹き出し” の常時抑止＋検知余白 */
  function killBanner(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      ['goog-gt-tt','goog-te-banner-frame'].forEach(id=>{
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

  // Googleバー可視判定 → html に .gtbar を付与（被り時の自動余白）
  function detectGoogleBar() {
    const bar = document.querySelector('iframe.goog-te-banner-frame');
    const showing = bar && bar.offsetHeight > 0;
    html.classList.toggle('gtbar', !!showing);
  }
  setInterval(detectGoogleBar, 1200);

  /* 1) ハンバーガー開閉（単一のトグル実装に統一） */
  const menuBtn = $('#menuBtn');
  const menuDrawer = $('#menuDrawer');
  const menuBackdrop = $('#menuBackdrop');
  const menuClose = $('#menuClose');

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    menuDrawer?.setAttribute('aria-hidden', String(!open));
    menuBtn?.setAttribute('aria-expanded', String(open));
  }
  function toggleMenu(e){ if (e) e.preventDefault(); setMenu(!html.classList.contains('menu-open')); }
  function closeMenu(){ setMenu(false); }

  if (menuBtn){
    menuBtn.addEventListener('click', toggleMenu, {passive:false});
    menuBtn.addEventListener('touchstart', toggleMenu, {passive:false});
  }
  menuBackdrop?.addEventListener('click', closeMenu);
  menuClose?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  /* 2) 目次（ハンバーガー）自動生成：各セクションの <summary> をすべて掲載 */
  (function buildMenu() {
    const wrap = $('#menuGroups');
    if (!wrap) return;
    wrap.innerHTML = '';

    const sections = $$('section[id]');
    sections.forEach(sec=>{
      const secId = sec.id;
      const secTitle = (sec.querySelector('h2')?.textContent || secId).trim().replace(/\s+/g,' ');
      const group = document.createElement('div');
      group.className = 'menu-group';

      const h4 = document.createElement('h4');
      h4.textContent = secTitle;

      const ul = document.createElement('ul');
      ul.className = 'menu-list';

      // セクションのトップ
      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = `${secTitle}（トップ）`;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop);
      ul.appendChild(liTop);

      // そのセクション内の <summary>（ネストも含め全件）
      const summaries = sec.querySelectorAll('summary');
      summaries.forEach((sum, idx)=>{
        const det = sum.closest('details');
        if (!det) return;

        // idが無ければ付与
        if (!det.id){
          const nm = (sum.textContent || 'item').trim().replace(/\s+/g,' ').slice(0,120);
          let base = `${secId}-${nm}`.toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
          if (!base) base = `${secId}-d-${idx+1}`;
          let id = base, n=2;
          while (document.getElementById(id)) id = `${base}-${n++}`;
          det.id = id;
        }

        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = `#${det.id}`;
        a.textContent = (sum.textContent || '').trim().replace(/\s+/g,' ').slice(0,160);

        a.addEventListener('click', ()=>{
          // ネストしている場合、親detailsも開く
          let cur = det.parentElement;
          while (cur){
            if (cur.tagName && cur.tagName.toLowerCase() === 'details') cur.open = true;
            cur = cur.parentElement;
          }
          closeMenu();
        });

        li.appendChild(a);
        ul.appendChild(li);
      });

      group.appendChild(h4);
      group.appendChild(ul);
      wrap.appendChild(group);
    });
  })();

  /* 3) 言語ドロワー（単一の実装に統一） */
  const langBtn = $('#langBtn');
  const langDrawer = $('#langDrawer');
  const langBackdrop = $('#langBackdrop');
  const langClose = $('#langClose');
  const langList = $('#langList');
  const langSearch = $('#langSearch');

  function setLang(open){
    html.classList.toggle('lang-open', open);
    langDrawer?.setAttribute('aria-hidden', String(!open));
    langBtn?.setAttribute('aria-expanded', String(open));
  }
  function toggleLang(e){ if (e) e.preventDefault(); setLang(!html.classList.contains('lang-open')); }
  function closeLang(){ setLang(false); }

  if (langBtn){
    langBtn.addEventListener('click', toggleLang, {passive:false});
    langBtn.addEventListener('touchstart', toggleLang, {passive:false});
  }
  langBackdrop?.addEventListener('click', closeLang);
  langClose?.addEventListener('click', closeLang);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeLang(); });

  // Googleの隠し<select>から自前リストを作る（英語名でソート）
  function buildLangListFromGoogle() {
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel || !langList) { setTimeout(buildLangListFromGoogle, 200); return; }

    const items = Array.from(sel.options)
      .filter(o => o.value && o.value !== '')
      .map(o => ({ code:o.value, label:(o.textContent||'').trim() }))
      .sort((a,b)=> a.label.localeCompare(b.label, 'en', {sensitivity:'base'}));

    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(({code,label})=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ls-item';
      btn.setAttribute('role','option');
      btn.innerHTML = `<span>${label}</span><span class="ls-code">${code}</span>`;
      btn.addEventListener('click', ()=>{
        sel.value = code;
        sel.dispatchEvent(new Event('change', {bubbles:true}));
        closeLang();
        killBanner();
      });
      frag.appendChild(btn);
    });
    langList.appendChild(frag);

    if (langSearch){
      langSearch.value = '';
      langSearch.oninput = () => {
        const q = langSearch.value.trim().toLowerCase();
        $$('.ls-item', langList).forEach(el=>{
          const t = (el.textContent||'').toLowerCase();
          el.style.display = !q || t.includes(q) ? '' : 'none';
        });
      };
    }
  }

  // 公式が初期化されたら反映
  function watchGt(){
    const host = $('#google_translate_element');
    if (!host){ setTimeout(watchGt, 150); return; }
    new MutationObserver(buildLangListFromGoogle).observe(host,{childList:true,subtree:true});
    buildLangListFromGoogle();
  }
  watchGt();

  /* 4) Google公式初期化（グローバル関数：翻訳スクリプトから呼ばれる） */
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false}, 'google_translate_element');
    }catch(_){}
  };

})();
