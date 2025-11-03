/* ===== script.js (完全修正版) ===== */
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
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    } else {
      html.classList.remove('menu-open');
      menuDrawer?.setAttribute('aria-hidden', 'true');
      menuBtn?.setAttribute('aria-expanded', 'false');
      // スクロールを再有効化
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

  // イベントリスナー登録
  if(menuBtn){
    menuBtn.addEventListener('click', toggleMenu);
    menuBtn.addEventListener('touchstart', toggleMenu, {passive: true});
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

  // イベントリスナー登録
  if(langBtn){
    langBtn.addEventListener('click', openLang);
    langBtn.addEventListener('touchstart', openLang, {passive: true});
  }
  if(langBackdrop) langBackdrop.addEventListener('click', closeLang);
  if(langClose) langClose.addEventListener('click', closeLang);
  
  // ESCキーで閉じる
  document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape') closeLang(); 
  });

  /* ---------- 3) 言語リスト構築 ---------- */
  const dn = (window.Intl && Intl.DisplayNames) ? 
    new Intl.DisplayNames(['en'], {type: 'language'}) : null;

  function buildLangList(){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel || !langList){ 
      setTimeout(buildLangList, 500);
      return; 
    }

    const curCookie = decodeURIComponent(
      (document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/) || [])[1] || ''
    );

    // すべての言語オプションを取得（auto以外）
    const items = Array.from(sel.options)
      .filter(o => o.value && o.value !== 'auto')
      .map(o => {
        const code = o.value.trim();
        let name = '';
        
        try {
          if (dn) {
            const langCode = code.split('_')[0];
            name = dn.of(langCode) || o.textContent || code;
          } else {
            name = o.textContent || code;
          }
        } catch (e) {
          name = o.textContent || code;
        }
        
        return {code, name: name.trim()};
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));

    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    
    items.forEach(({code, name}) => {
      const el = document.createElement('div');
      el.className = 'ls-item' + (curCookie.endsWith('/' + code) ? ' ls-active' : '');
      el.setAttribute('role', 'option');
      el.setAttribute('data-lang', code);
      el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
      
      el.addEventListener('click', () => {
        const select = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!select) return;
        
        select.value = code;
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
        
        closeLang();
        killGoogleBar();
        
        setTimeout(() => {
          document.documentElement.lang = code.split('_')[0] || code;
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
    
    let retryCount = 0;
    const maxRetries = 10;
    
    function tryBuildList() {
      const sel = document.querySelector('#google_translate_element select.goog-te-combo');
      if (sel && sel.options.length > 1) {
        buildLangList();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryBuildList, 500);
      }
    }
    
    setTimeout(tryBuildList, 1000);
    
    const host = $('#google_translate_element');
    if(host){
      new MutationObserver(() => {
        setTimeout(buildLangList, 0);
      }).observe(host, {childList: true, subtree: true});
    }
  };

  /* ---------- 5) 目次自動生成 ---------- */
  function buildMenu(){
    const groups = $('#menuGroups');
    if (!groups) return;

    const sections = [
      ['corp-setup', '法人設立'],
      ['plans', '料金プラン'],
      ['sole-setup', '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer', '免責事項・キャンセル']
    ];

    const sanitize = s => (s || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    
    groups.innerHTML = '';
    
    sections.forEach(([secId, secLabel]) => {
      const sec = document.getElementById(secId);
      if (!sec) return;

      const group = document.createElement('div');
      group.className = 'menu-group';
      
      const h4 = document.createElement('h4');
      h4.textContent = secLabel;
      
      const ul = document.createElement('ul');
      ul.className = 'menu-list';

      // セクショントップリンク
      const liTop = document.createElement('li');
      const aTop = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = secLabel;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop);
      ul.appendChild(liTop);

      // 詳細リンク（インデント追加）
      sec.querySelectorAll('.accordion summary').forEach((sum, idx) => {
        const det = sum.closest('details');
        if (!det) return;
        
        let id = det.id;
        if (!id) {
          id = `${secId}-d-${idx + 1}`;
          let n = 2;
          while (document.getElementById(id)) id = `${secId}-d-${idx + 1}-${n++}`;
          det.id = id;
        }

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = sanitize(sum.textContent);
        a.style.paddingLeft = '20px';
        a.addEventListener('click', () => {
          let parent = det;
          while (parent) {
            if (parent.tagName === 'DETAILS') parent.open = true;
            parent = parent.parentElement;
          }
          setTimeout(closeMenu, 100);
        });
        li.appendChild(a);
        ul.appendChild(li);
      });

      if(secId !== 'plans') group.appendChild(h4);
      group.appendChild(ul);
      groups.appendChild(group);
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
    
    document.addEventListener('click', function(e) {
      if(e.target.closest('.menu-button') || e.target.closest('.lang-button')){
        e.stopPropagation();
      }
    });
  });

  window.addEventListener('load', function() {
    wrapTablesForScroll();
    killGoogleBar();
  });

})();

/* === メニュークリーニング === */
(function(){
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#menuGroups a').forEach(a => {
      a.textContent = a.textContent.replace(/（トップ）\s*$/g, '');
    });
    
    const groups = document.querySelectorAll('#menuGroups .menu-group');
    groups.forEach(g => {
      const title = (g.querySelector('h4')?.textContent || '').trim();
      const links = g.querySelectorAll('.menu-list a');
      
      links.forEach(a => {
        const txt = a.textContent.trim();
        if (txt === title) {
          a.closest('li')?.remove();
        }
      });
    });
  });
})();
