/* ===== Global i18n via Google Translate (drop-in, layout safe) ===== */
(() => {
  // 設置する対象言語：必要に応じて増減可
  const LANGS = [
    ['ja','日本語'],
    ['en','English'],
    ['zh-CN','简体中文'],
    ['zh-TW','繁體中文'],
    ['ko','한국어'],
    ['th','ไทย'],
    ['es','Español'],
    ['fr','Français'],
    ['de','Deutsch'],
    ['ru','Русский'],
    ['ar','العربية'],
    ['vi','Tiếng Việt'],
    ['pt','Português'],
    ['it','Italiano'],
    ['id','Indonesia'],
    ['hi','हिन्दी']
  ];
  const DEFAULT = 'ja';

  // 1) ウィジェット用コンテナとUIを注入
  function injectUI(){
    if (document.getElementById('langBtn')) return;

    // Google公式コンテナ（非表示だが内部の<select>を使う）
    const g = document.createElement('div');
    g.id = 'google_translate_element';
    document.body.appendChild(g);

    // ボタン
    const btn = document.createElement('button');
    btn.id = 'langBtn';
    btn.className = 'lang-button';
    btn.type = 'button';
    btn.setAttribute('aria-label','Language');
    btn.textContent = '🌐';
    document.body.appendChild(btn);

    // カスタムパネル
    const panel = document.createElement('div');
    panel.id = 'langPanel';
    panel.className = 'lang-panel';
    panel.hidden = true;

    const row = document.createElement('div');
    row.className = 'row';
    LANGS.forEach(([code, name])=>{
      const chip = document.createElement('button');
      chip.className = 'lang-chip';
      chip.type = 'button';
      chip.dataset.lang = code;
      chip.textContent = name;
      row.appendChild(chip);
    });
    panel.appendChild(row);

    // クレジット（Powered by Google Translate）
    const small = document.createElement('small');
    small.style.display = 'block';
    small.style.marginTop = '6px';
    small.style.color = '#64748b';
    small.textContent = 'Powered by Google Translate';
    panel.appendChild(small);

    document.body.appendChild(panel);

    // 位置合わせ
    const positionPanel = () => {
      const r = btn.getBoundingClientRect();
      panel.style.top  = Math.round(r.bottom + 8 + window.scrollY) + 'px';
      panel.style.left = Math.round(r.right - panel.offsetWidth + window.scrollX) + 'px';
    };

    btn.addEventListener('click', ()=>{
      panel.hidden = !panel.hidden;
      positionPanel();
    });
    document.addEventListener('click', (e)=>{
      if (e.target.closest('#langBtn') || e.target.closest('#langPanel')) return;
      panel.hidden = true;
    });
    addEventListener('resize', positionPanel);

    // 選択状態の同期
    const setCurrent = (code) => {
      panel.querySelectorAll('.lang-chip').forEach(el=>{
        el.dataset.current = (el.dataset.lang === code) ? 'true' : 'false';
      });
    };

    // クリック時：Googleの<select>に反映
    panel.addEventListener('click', (e)=>{
      const chip = e.target.closest('.lang-chip');
      if (!chip) return;
      const code = chip.dataset.lang;
      translateTo(code);
      setCurrent(code);
      panel.hidden = true;
    });

    // 初期言語
    const saved = localStorage.getItem('i18n.lang') || DEFAULT;
    setCurrent(saved);
  }

  // 2) Google翻訳スクリプトを読み込み、ウィジェットを初期化
  function loadGoogle(){
    if (window.google && window.google.translate) return; // 既に有効
    const initName = 'googleTranslateElementInit_' + Math.random().toString(36).slice(2);

    window[initName] = function(){
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        includedLanguages: LANGS.map(x=>x[0]).join(','),
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');

      // 初期適用（保存があれば）
      const saved = localStorage.getItem('i18n.lang');
      if (saved && saved !== 'ja') {
        // 少し遅延して<select>が生成されてから適用
        setTimeout(()=>translateTo(saved), 150);
      }
    };

    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=' + initName;
    s.async = true;
    document.head.appendChild(s);
  }

  // 3) 実際の切替：隠れている<select.goog-te-combo>を操作
  function translateTo(langCode){
    try{
      const combo = document.querySelector('select.goog-te-combo');
      if (!combo) return; // まだ生成前
      combo.value = langCode === 'ja' ? '' : langCode;
      combo.dispatchEvent(new Event('change'));

      // 保存
      localStorage.setItem('i18n.lang', langCode);

      // RTL言語対応（アラビア語など）
      const rtl = ['ar','fa','he','ur'];
      if (rtl.includes(langCode)) {
        document.documentElement.setAttribute('dir','rtl');
      } else {
        document.documentElement.removeAttribute('dir');
      }

      // メニュー再生成（要約タイトル等は翻訳後のテキストに基づく）
      try { buildMenu && buildMenu(); } catch(e){}
      try { killPlansHeading && killPlansHeading(); } catch(e){}
    }catch(err){}
  }

  // 起動
  document.addEventListener('DOMContentLoaded', () => {
    injectUI();   // UI だけ先に
    loadGoogle(); // 翻訳本体ロード
  });
})();
