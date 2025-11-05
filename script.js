// ===== シンプルで確実なバージョン =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('ページ読み込み完了');
  
  // 要素の取得
  const menuBtn = document.getElementById('menuBtn');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuClose = document.getElementById('menuClose');
  const menuDrawer = document.getElementById('menuDrawer');
  
  const langBtn = document.getElementById('langBtn');
  const langBackdrop = document.getElementById('langBackdrop');
  const langClose = document.getElementById('langClose');
  const langDrawer = document.getElementById('langDrawer');
  const langList = document.getElementById('langList');
  const langSearch = document.getElementById('langSearch');
  
  // メニューの開閉
  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      console.log('メニューボタンクリック');
      document.documentElement.classList.add('menu-open');
    });
  }
  
  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', function() {
      document.documentElement.classList.remove('menu-open');
    });
  }
  
  if (menuClose) {
    menuClose.addEventListener('click', function() {
      document.documentElement.classList.remove('menu-open');
    });
  }
  
  // 言語メニューの開閉
  if (langBtn) {
    langBtn.addEventListener('click', function() {
      console.log('言語ボタンクリック');
      document.documentElement.classList.add('lang-open');
      // 言語リストを構築
      buildLangList();
    });
  }
  
  if (langBackdrop) {
    langBackdrop.addEventListener('click', function() {
      document.documentElement.classList.remove('lang-open');
    });
  }
  
  if (langClose) {
    langClose.addEventListener('click', function() {
      document.documentElement.classList.remove('lang-open');
    });
  }
  
  // ESCキーで閉じる
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.documentElement.classList.remove('menu-open', 'lang-open');
    }
  });
  
  // 言語リスト構築関数
  function buildLangList() {
    console.log('言語リスト構築開始');
    
    if (!langList) return;
    
    // サンプル言語リスト（実際にはGoogle翻訳から取得）
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'ru', name: 'Russian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'it', name: 'Italian' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' }
    ];
    
    langList.innerHTML = '';
    
    languages.forEach(lang => {
      const item = document.createElement('div');
      item.className = 'ls-item';
      item.innerHTML = `
        <span>${lang.name}</span>
        <span class="ls-code">${lang.code}</span>
      `;
      
      item.addEventListener('click', function() {
        console.log('言語選択:', lang.code);
        translatePage(lang.code);
      });
      
      langList.appendChild(item);
    });
    
    // 検索機能
    if (langSearch) {
      langSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const items = langList.querySelectorAll('.ls-item');
        
        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
      });
    }
  }
  
  // ページ翻訳関数
  function translatePage(languageCode) {
    console.log('翻訳実行:', languageCode);
    
    // Google翻訳のiframeを作成
    const translateFrame = document.createElement('iframe');
    translateFrame.style.display = 'none';
    translateFrame.onload = function() {
      // 翻訳後にiframeを削除
      setTimeout(() => {
        document.body.removeChild(translateFrame);
        document.documentElement.classList.remove('lang-open');
      }, 1000);
    };
    
    // Google翻訳URL
    translateFrame.src = `https://translate.google.com/translate?hl=${languageCode}&sl=auto&tl=${languageCode}&u=${encodeURIComponent(window.location.href)}`;
    document.body.appendChild(translateFrame);
    
    // クッキーに言語設定を保存
    document.cookie = `googtrans=/ja/${languageCode}; path=/; max-age=31536000`;
    
    // ページをリロードして翻訳を適用
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
  
  // テーブルスクロール機能
  function initTableScroll() {
    document.querySelectorAll('table').forEach(table => {
      if (!table.parentElement.classList.contains('table-scroll-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-scroll-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }
  
  // 目次生成
  function buildTableOfContents() {
    const menuGroups = document.getElementById('menuGroups');
    if (!menuGroups) return;
    
    const sections = [
      { id: 'corp-setup', title: '法人設立' },
      { id: 'plans', title: '料金プラン' },
      { id: 'sole-setup', title: '個人事業主（IE/SBS）' },
      { id: 'personal-account', title: '個人口座開設（銀行）' },
      { id: 'disclaimer', title: '免責事項・キャンセル' }
    ];
    
    let html = '';
    
    sections.forEach(section => {
      const sectionEl = document.getElementById(section.id);
      if (!sectionEl) return;
      
      html += `<div class="menu-group">`;
      
      // 料金プラン以外は見出しを表示
      if (section.id !== 'plans') {
        html += `<h4>${section.title}</h4>`;
      }
      
      html += `<ul class="menu-list">`;
      
      // セクション内のアコーディオンをメニュー項目として追加
      sectionEl.querySelectorAll('details').forEach((detail, index) => {
        const summary = detail.querySelector('summary');
        if (!summary) return;
        
        let detailId = detail.id;
        if (!detailId) {
          detailId = `${section.id}-item-${index + 1}`;
          detail.id = detailId;
        }
        
        const title = summary.textContent.trim();
        html += `
          <li>
            <a href="#${detailId}" onclick="document.documentElement.classList.remove('menu-open')">
              ${title}
            </a>
          </li>
        `;
      });
      
      html += `</ul></div>`;
    });
    
    menuGroups.innerHTML = html;
  }
  
  // 初期化
  initTableScroll();
  buildTableOfContents();
  
  // Google翻訳の初期化
  window.googleTranslateElementInit = function() {
    console.log('Google翻訳初期化');
    // 実際のGoogle翻訳ウィジェットを初期化
    if (window.google && google.translate) {
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        includedLanguages: 'en,ja,ko,zh-CN,zh-TW,es,fr,de,ru,pt,it,ar,hi',
        autoDisplay: false
      }, 'google_translate_element');
    }
  };
  
  // Google翻訳スクリプトが読み込まれているか確認
  if (window.google && google.translate) {
    window.googleTranslateElementInit();
  }
});

// Google翻訳のバナーを非表示にする
setInterval(() => {
  const banners = document.querySelectorAll('.goog-te-banner-frame, .goog-te-spinner-pos');
  banners.forEach(banner => {
    banner.style.display = 'none';
  });
}, 100);
