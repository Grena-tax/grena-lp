/* ===== script.js (修正完了版) ===== */
(function(){
  'use strict';
  
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google翻訳バナー対策 ---------- */
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const ids = ['goog-gt-tt','google_translate_element'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && id === 'goog-gt-tt'){ 
          if (el.remove) el.remove(); 
          else el.style.display = 'none'; 
        }
      });
      const ifr = document.querySelector('iframe.goog-te-banner-frame');
      if (ifr){ 
        if (ifr.remove) ifr.remove(); 
        else ifr.style.display = 'none'; 
      }
    }catch(e){}
  }

  // Google翻訳バナー監視
  new MutationObserver(killGoogleBar).observe(document.documentElement, {
    childList: true, 
    subtree: true
  });
  window.addEventListener('load', killGoogleBar, {once: true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 1) ハンバーガーメニュー ---------- */
  const menuBtn = $('#menuBtn');
  const menuDrawer = $('#menuDrawer');
  const menuBackdrop = $('#menuBackdrop');
  const menuClose = $('#menuClose');

  function setMenu(open){
    if(open){
      html.classList.add('menu-open');
      menuDrawer?.setAttribute('aria-hidden', 'false');
      menuBtn?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      html.classList.remove('menu-open');
      menuDrawer?.setAttribute('aria-hidden', 'true');
      menuBtn?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  function toggleMenu(e){
    if(e){ 
      e.preventDefault(); 
      e.stopPropagation();
    }
    setMenu(!html.classList.contains('menu-open'));
  }

  function closeMenu(){ 
    setMenu(false); 
  }

  // イベントリスナー登録（touchstart削除）
  if(menuBtn){
    menuBtn.addEventListener('click', toggleMenu);
    // touchstart 削除
  }
  if(menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);
  if(menuClose) menuClose.addEventListener('click', closeMenu);
  
  // ESCキーで閉じる
  document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape') closeMenu(); 
  });

  /* ---------- 2) 言語選択メニュー ---------- */
  const langBtn = $('#langBtn');
  const langDrawer = $('#langDrawer');
  const langBackdrop = $('#langBackdrop');
  const langClose = $('#langClose');
  const langList = $('#langList');
  const langSearch = $('#langSearch');

  function setLang(open){
    if(open){
      html.classList.add('lang-open');
      langDrawer?.setAttribute('aria-hidden', 'false');
      langBtn?.setAttribute('aria-expanded', 'true');
    } else {
      html.classList.remove('lang-open');
      langDrawer?.setAttribute('aria-hidden', 'true');
      langBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  function openLang(e){
    if(e){ 
      e.preventDefault(); 
      e.stopPropagation();
    }
    setLang(true);
  }

  function closeLang(){ 
    setLang(false); 
  }

  // イベントリスナー登録（touchstart削除）
  if(langBtn){
    langBtn.addEventListener('click', openLang);
    // touchstart 削除
  }
  if(langBackdrop) langBackdrop.addEventListener('click', closeLang);
  if(langClose) langClose.addEventListener('click', closeLang);
  
  // ESCキーで閉じる
  document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape') closeLang(); 
  });

  /* ---------- 3) 言語リスト構築 ---------- */
  function buildLangList(){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel || !langList){ setTimeout(buildLangList, 400); return; }
    // 言語が少ない間は再試行（目安：50未満）
    if (sel.options.length < 50){ setTimeout(buildLangList, 400); return; }

    const curCookie = decodeURIComponent(
      (document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/) || [])[1] || ''
    );

    // すべての言語オプションを取得
    const items = Array.from(sel.options)
      .filter(o => o.value && o.value !== 'auto')
      .map(o => {
        const code = o.value.trim();
        const name = (o.textContent || code).trim();
        return {code, name};
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));

    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    
    items.forEach(({code, name}) => {
      const el = document.createElement('div');
      el.className = 'ls-item' + (curCookie.endsWith('/' + code) ? ' ls-active' : '');
      el.setAttribute('role', 'option');
      el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
      
      el.addEventListener('click', () => {
        const select = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!select) return;
        
        select.value = code;
        select.dispatchEvent(new Event('change', {bubbles: true}));
        closeLang();
        killGoogleBar();
        
        setTimeout(() => {
          window.location.reload();
        }, 100);
      });
      
      frag.appendChild(el);
    });
    
    langList.appendChild(frag);

    // 検索機能
    if(langSearch){
      langSearch.value = '';
      langSearch.oninput = () => {
        const q = langSearch.value.trim().toLowerCase();
        $$('.ls-item', langList).forEach(el => {
          const txt = (el.textContent || '').toLowerCase();
          el.style.display = (!q || txt.includes(q)) ? '' : 'none';
        });
      };
    }
  }

  /* ---------- 4) Google翻訳初期化 ---------- */
  window.googleTranslateElementInit = function(){
    try{
      if(window.google && google.translate){
        new google.translate.TranslateElement({
          pageLanguage: 'ja',
          autoDisplay: false,
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
      }
    }catch(e){}
    
    // 初回ビルド
    setTimeout(buildLangList, 800);
    // 以後、select の子が増えたら自動で再ビルド
    (function observeTranslateSelect(){
      const sel = document.querySelector('#google_translate_element select.goog-te-combo');
      if(!sel){ setTimeout(observeTranslateSelect, 500); return; }
      new MutationObserver(()=> buildLangList())
        .observe(sel, {childList:true, subtree:false});
    })();
  };

  /* ---------- 5) 目次自動生成（二層対応＋重複排除） ---------- */
  function buildMenu(){
    const groups = $('#menuGroups'); if(!groups) return;
    const sections = [
      ['corp-setup','法人設立'],
      ['plans','料金プラン'],
      ['sole-setup','個人事業主（IE/SBS）'],
      ['personal-account','個人口座開設（銀行）'],
      ['disclaimer','免責事項・キャンセル']
    ];
    const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);
    groups.innerHTML='';
    sections.forEach(([secId,secLabel])=>{
      const sec = document.getElementById(secId); if(!sec) return;
      const group = document.createElement('div'); group.className='menu-group';
      const h4=document.createElement('h4'); h4.textContent=secLabel;
      const ul=document.createElement('ul'); ul.className='menu-list';
      const seen = new Set();

      // 直下の <details> を列挙
      sec.querySelectorAll(':scope .accordion > details').forEach((topDet, tIdx)=>{
        const childSums = topDet.querySelectorAll(':scope .content > details > summary');
        const addItem = (det, sum, idSeed) => {
          if(!det.id){
            let id = `${secId}-d-${idSeed}`; let n=2;
            while(document.getElementById(id)) id = `${secId}-d-${idSeed}-${n++}`;
            det.id=id;
          }
          const title = sanitize(sum.textContent);
          if(seen.has(title)) return; seen.add(title);
          const a=document.createElement('a'); a.href=`#${det.id}`; a.textContent=title;
          a.addEventListener('click', ()=>{
            // 自分と祖先のdetailsをすべてopen
            let p=det; while(p){ if(p.tagName==='DETAILS') p.open=true; p=p.parentElement; }
            closeMenu();
          });
          const li=document.createElement('li'); li.appendChild(a); ul.appendChild(li);
        };
        if(childSums.length){
          // 親はスキップして子を並べる（例：料金プランの下位アイテム）
          childSums.forEach((sum, cIdx)=> addItem(sum.parentElement, sum, `${tIdx+1}-${cIdx+1}`));
        }else{
          const sum = topDet.querySelector(':scope > summary'); if(sum) addItem(topDet, sum, `${tIdx+1}`);
        }
      });

      group.appendChild(h4); group.appendChild(ul); groups.appendChild(group);
    });
  }

  /* ---------- 6) テーブル横スクロール ---------- */
  function wrapTablesForScroll() {
    document.querySelectorAll('table').forEach(table => {
      if (table.parentElement.classList.contains('table-scroll-wrapper')) return;
      
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  /* ---------- 7) 初期化 ---------- */
  document.addEventListener('DOMContentLoaded', function() {
    buildMenu();
    wrapTablesForScroll();
    
    // メニュー内のリンククリックで閉じる
    document.querySelectorAll('#menuGroups a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  });

  window.addEventListener('load', function() {
    wrapTablesForScroll();
    killGoogleBar();
  });

})();
