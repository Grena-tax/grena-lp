/* ===== script.js (only JS変更：独立"plans/予定"項目の削除＋空白対策) ===== */
(function () {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* --- 0) Google 翻訳バナー/吹き出しを抑止 --- */
  function killBanner(){
    try{
      html.style.marginTop='0px';
      document.body.style.top='0px';
      ['goog-te-banner-frame','goog-gt-tt'].forEach(id=>{
        const el = document.getElementById(id);
        if (!el) return;
        if (el.remove) el.remove();
        else { el.style.display='none'; el.style.visibility='hidden'; el.style.height='0'; }
      });
    }catch(_){}
  }
  new MutationObserver(killBanner).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killBanner, {once:true});
  killBanner();

  /* --- 1) ハンバーガー開閉 --- */
  const menuBtn      = $('#menuBtn');
  const menuDrawer   = $('#menuDrawer');
  const menuBackdrop = $('#menuBackdrop');
  const menuCloseBtn = $('#menuClose');

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    menuDrawer?.setAttribute('aria-hidden', String(!open));
    menuBtn?.setAttribute('aria-expanded', String(open));
  }
  function toggleMenu(e){ if(e) e.preventDefault(); setMenu(!html.classList.contains('menu-open')); }
  function closeMenu(){ setMenu(false); }

  menuBtn?.addEventListener('click', toggleMenu, {passive:false});
  menuBtn?.addEventListener('touchstart', toggleMenu, {passive:false});
  menuBackdrop?.addEventListener('click', closeMenu);
  menuCloseBtn?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  /* --- 2) 目次ビルド：各セクション + セクション内のすべての <summary> --- */
  function buildMenu(){
    const groups = $('#menuGroups');
    if (!groups) return;

    const sections = [
      ['corp-setup',       '法人設立'],
      ['plans',            '料金プラン'],
      ['sole-setup',       '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer',       '免責事項・キャンセル']
    ];

    const sanitize = s => (s || '').trim().replace(/\s+/g,' ').slice(0,120);
    const mkId = base => base.toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');

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
        if (cur.tagName && cur.tagName.toLowerCase()==='details') cur.open = true;
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

      // セクション内の .accordion summary（ネスト含む）
      sec.querySelectorAll('.accordion summary').forEach((sum, idx)=>{
        const det = sum.closest('details');
        if (!det) return;
        const label = sanitize(sum.textContent);
        const id = ensureId(det, secId, label, idx);

        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = label;
        a.addEventListener('click', ()=>{
          const target = document.getElementById(id);
          if (target) openAncestors(target);
          setTimeout(closeMenu, 0);
        });
        li.appendChild(a);
        ul.appendChild(li);
      });

      group.appendChild(h4);
      group.appendChild(ul);
      groups.appendChild(group);
    });

    // 「plans/予定」単独ラベルだけを除去 → 余白も掃除
    pruneStandalonePlans();
  }

  /* --- 3) 「plans/予定/計画/計劃/计划」だけ表示の項目を削除し、空白を確実に消す --- */
  function pruneStandalonePlans(){
    const wrap = $('#menuGroups');
    if (!wrap) return;

    const banned = new Set(['plans','予定','計画','計劃','计划']);

    // ① ターゲット項目を削除
    wrap.querySelectorAll('.menu-list li').forEach(li=>{
      const a = li.querySelector('a');
      if (!a) return;
      const text = (a.textContent || '').trim().toLowerCase();
      if (banned.has(text)) li.remove();
    });

    // ② アンカーがなくなった空liや空白だけのliも除去（念のため）
    wrap.querySelectorAll('.menu-list li').forEach(li=>{
      if (!li.querySelector('a') || !li.textContent.trim()) li.remove();
    });

    // ③ 各グループのリストに要素がない場合、見た目の段落空きが出ないよう最小化
    wrap.querySelectorAll('.menu-group').forEach(group=>{
      const ul = group.querySelector('.menu-list');
      if (!ul) return;
      if (ul.children.length === 0) {
        // 完全空ならUL自体を非表示（見出しは残す）
        ul.style.display = 'none';
      } else {
        ul.style.display = '';
      }
    });
  }

  // 初回ビルド
  buildMenu();
  // 再生成があっても毎回掃除（空白防止）
  const mg = $('#menuGroups');
  if (mg){
    new MutationObserver(()=> pruneStandalonePlans()).observe(mg, {childList:true,subtree:true});
  }

  /* --- 4) 言語ドロワー --- */
  const langBtn      = $('#langBtn');
  const langDrawer   = $('#langDrawer');
  const langBackdrop = $('#langBackdrop');
  const langCloseBtn = $('#langClose');

  function setLang(open){
    html.classList.toggle('lang-open', open);
    langDrawer?.setAttribute('aria-hidden', String(!open));
    langBtn?.setAttribute('aria-expanded', String(open));
  }
  function toggleLang(e){ if(e) e.preventDefault(); setLang(!html.classList.contains('lang-open')); }
  function closeLang(){ setLang(false); }

  langBtn?.addEventListener('click', toggleLang, {passive:false});
  langBtn?.addEventListener('touchstart', toggleLang, {passive:false});
  langBackdrop?.addEventListener('click', closeLang);
  langCloseBtn?.addEventListener('click', closeLang);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeLang(); });

  /* --- 5) Google翻訳セレクトから英語名リストを生成（検索付き） --- */
  const langList   = $('#langList');
  const langSearch = $('#langSearch');

  function buildLangListFromGoogle(){
    const host = $('#google_translate_element');
    const sel  = host ? host.querySelector('select.goog-te-combo') : null;
    if (!sel || !langList){ setTimeout(buildLangListFromGoogle, 200); return; }

    const items = Array.from(sel.options)
      .map(o => ({code:o.value, name:(o.textContent||'').trim()}))
      .filter(x => x.code && x.code !== 'auto')
      .sort((a,b)=> a.name.localeCompare(b.name,'en',{sensitivity:'base'}));

    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(({code,name})=>{
      const el = document.createElement('div');
      el.className = 'ls-item';
      el.setAttribute('role','option');
      el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
      el.addEventListener('click', ()=>{
        sel.value = code;
        sel.dispatchEvent(new Event('change', {bubbles:true}));
        closeLang();
        killBanner();
      });
      frag.appendChild(el);
    });
    langList.appendChild(frag);

    if (langSearch){
      langSearch.value = '';
      langSearch.oninput = () => {
        const q = langSearch.value.trim().toLowerCase();
        $$('.ls-item', langList).forEach(it=>{
          const t = (it.textContent||'').toLowerCase();
          it.style.display = !q || t.includes(q) ? '' : 'none';
        });
      };
    }
  }

  (function watchGt(){
    const host = $('#google_translate_element');
    if (!host){ setTimeout(watchGt, 200); return; }
    new MutationObserver(buildLangListFromGoogle).observe(host,{childList:true,subtree:true});
    buildLangListFromGoogle();
  })();

  /* --- 6) Google翻訳の初期化関数（外部スクリプトから呼ばれる） --- */
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    }catch(_){}
  };

})();
