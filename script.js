/* ===== script.js (翻訳機能完全修正版) ===== */
(function(){
  'use strict';
  
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google翻訳バナー対策 ---------- */
  function killGoogleBar(){
    try{
      // ボディの位置をリセット
      if(document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      
      // Google翻訳の不要な要素を削除
      const elementsToRemove = [
        'goog-gt-tt',
        'goog-te-spinner-pos',
        'goog-te-banner-frame'
      ];
      
      elementsToRemove.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
          el.remove();
        }
      });
      
      // iframeも削除
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if(iframe.src && iframe.src.includes('translate.google')) {
          iframe.remove();
        }
      });
      
    }catch(e){
      console.log('Google bar cleanup error:', e);
    }
  }

  // Google翻訳バナー監視
  const observer = new MutationObserver(function(mutations) {
    let shouldClean = false;
    mutations.forEach(function(mutation) {
      if(mutation.addedNodes && mutation.addedNodes.length > 0) {
        for(let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if(node.nodeType === 1 && (
            node.id === 'goog-gt-tt' || 
            node.classList && (
              node.classList.contains('goog-te-banner-frame') ||
              node.classList.contains('goog-te-spinner-pos')
            ) ||
            (node.tagName === 'IFRAME' && node.src && node.src.includes('translate.google'))
          )) {
            shouldClean = true;
            break;
          }
        }
      }
    });
    if(shouldClean) {
      setTimeout(killGoogleBar, 100);
    }
  });

  observer.observe(document.documentElement, {
    childList: true, 
    subtree: true
  });

  window.addEventListener('load', function() {
    killGoogleBar();
    // 読み込み後も定期的にクリーンアップ
    setInterval(killGoogleBar, 2000);
  }, {once: true});

  /* ---------- 1) ハンバーガーメニュー ---------- */
  const menuBtn = $('#menuBtn');
  const menuDrawer = $('#menuDrawer');
  const menuBackdrop = $('#menuBackdrop');
  const menuClose = $('#menuClose');

  function setMenu(open){
    if(open){
      html.classList.add('menu-open');
      if(menuDrawer) menuDrawer.setAttribute('aria-hidden', 'false');
      if(menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    } else {
      html.classList.remove('menu-open');
      if(menuDrawer) menuDrawer.setAttribute('aria-hidden', 'true');
      if(menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
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
    menuBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      toggleMenu(e);
    }, {passive: false});
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
      if(langDrawer) langDrawer.setAttribute('aria-hidden', 'false');
      if(langBtn) langBtn.setAttribute('aria-expanded', 'true');
    } else {
      html.classList.remove('lang-open');
      if(langDrawer) langDrawer.setAttribute('aria-hidden', 'true');
      if(langBtn) langBtn.setAttribute('aria-expanded', 'false');
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
    langBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      openLang(e);
    }, {passive: false});
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
    if (!sel || !langList){ 
      // Google翻訳がまだ読み込まれていない場合、再試行
      setTimeout(buildLangList, 500); 
      return; 
    }

    console.log('Building language list from Google Translate');
    
    const curCookie = decodeURIComponent(
      (document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/) || [])[1] || ''
    );

    const items = Array.from(sel.options)
      .filter(o => o.value && o.value !== 'auto')
      .map(o => {
        const code = o.value.trim();
        let name = o.textContent || code;
        
        // 英語名を取得（可能な場合）
        try {
          if(window.Intl && Intl.DisplayNames) {
            const displayNames = new Intl.DisplayNames(['en'], {type: 'language'});
            const englishName = displayNames.of(code.replace('_','-'));
            if(englishName && englishName !== code) {
              name = englishName;
            }
          }
        } catch(e) {}
        
        return {code, name: name.trim()};
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));

    langList.innerHTML = '';
    const frag = document.createDocumentFragment();
    
    items.forEach(({code, name}) => {
      const el = document.createElement('div');
      const isActive = curCookie.endsWith('/' + code);
      el.className = 'ls-item' + (isActive ? ' ls-active' : '');
      el.setAttribute('role', 'option');
      el.setAttribute('data-lang', code);
      el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
      
      el.addEventListener('click', function() {
        console.log('Language selected:', code);
        
        const select = document.querySelector('#google_translate_element select.goog-te-combo');
        if (select) {
          select.value = code;
          const event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
          console.log('Dispatched change event for language:', code);
        }
        
        closeLang();
        
        // クッキーを設定（直接設定）
        document.cookie = `googtrans=/ja/${code}; path=/; max-age=31536000`;
        document.cookie = `googtrans=/ja/${code}; path=/; domain=.${window.location.hostname}; max-age=31536000`;
        
        // ページをリロードして翻訳を適用
        setTimeout(() => {
          window.location.reload();
        }, 300);
      });
      
      // タッチイベントもサポート
      el.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.click();
      }, {passive: false});
      
      frag.appendChild(el);
    });
    
    langList.appendChild(frag);

    // 検索機能
    if(langSearch){
      langSearch.value = '';
      langSearch.placeholder = 'Search languages...';
      langSearch.oninput = function() {
        const q = this.value.trim().toLowerCase();
        $$('.ls-item', langList).forEach(el => {
          const txt = (el.textContent || '').toLowerCase();
          el.style.display = (!q || txt.includes(q)) ? '' : 'none';
        });
      };
      
      // 検索ボックスにフォーカス
      setTimeout(() => {
        langSearch.focus();
      }, 300);
    }
    
    console.log('Language list built with', items.length, 'languages');
  }

  /* ---------- 4) Google翻訳初期化 ---------- */
  window.googleTranslateElementInit = function(){
    console.log('Google Translate Element Init called');
    
    try{
      if(window.google && google.translate && google.translate.TranslateElement){
        new google.translate.TranslateElement({
          pageLanguage: 'ja',
          includedLanguages: 'en,ja,ko,zh-CN,zh-TW,ru,fr,de,es,pt,it,ar,hi,th,vi',
          autoDisplay: false,
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
        
        console.log('Google Translate initialized successfully');
      } else {
        console.log('Google Translate API not available yet');
      }
    }catch(e){
      console.log('Google Translate init error:', e);
    }
    
    // 言語リスト構築（遅延実行）
    setTimeout(buildLangList, 1000);
    
    // 変更監視
    const host = $('#google_translate_element');
    if(host){
      new MutationObserver(function() {
        setTimeout(buildLangList, 100);
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
      
      // 「料金プラン」以外は見出しを表示
      if(secId !== 'plans') {
        const h4 = document.createElement('h4');
        h4.textContent = secLabel;
        group.appendChild(h4);
      }
      
      const ul = document.createElement('ul');
      ul.className = 'menu-list';

      // 詳細リンク
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
        a.addEventListener('click', () => {
          // 親detailsを開く
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
    console.log('DOM Content Loaded - Initializing');
    buildMenu();
    wrapTablesForScroll();
    killGoogleBar();
    
    // 言語ボタンの確認
    if(langBtn) {
      console.log('Language button found:', langBtn);
    } else {
      console.log('Language button NOT found');
    }
  });

  window.addEventListener('load', function() {
    console.log('Window Loaded - Final initialization');
    wrapTablesForScroll();
    killGoogleBar();
    
    // Google翻訳が自動で読み込まれるのを待つ
    setTimeout(() => {
      if(!window.google) {
        console.log('Google Translate not loaded, manual init');
        if(window.googleTranslateElementInit) {
          window.googleTranslateElementInit();
        }
      }
    }, 2000);
  });

})();

/* === メニュークリーニング === */
(function(){
  document.addEventListener('DOMContentLoaded', function() {
    // 「（トップ）」を削除
    setTimeout(() => {
      document.querySelectorAll('#menuGroups a').forEach(a => {
        a.textContent = a.textContent.replace(/（トップ）\s*$/g, '');
      });
    }, 1000);
  });
})();
