/* =========================================================
   言語UI（埋め込み翻訳が最優先／失敗時のみ新規タブにフォールバック）
   ========================================================= */
(function languageUI(){
  // 既存をクリーンアップ
  document.getElementById('siteTranslateBtn')?.remove();
  document.getElementById('langPanel')?.remove();
  document.getElementById('lang-ui-inline-style')?.remove();

  // スタイル（半透明の濃いグレー、LPに合わせて控えめ）
  const css = document.createElement('style');
  css.id = 'lang-ui-inline-style';
  css.textContent = `
    .lang-fab{
      position:fixed; top:calc(64px + var(--safe-top,0px)); right:calc(10px + var(--safe-right,0px)); z-index:10000;
      display:inline-flex; align-items:center; gap:.45rem; height:36px; padding:0 .8rem;
      border-radius:10px; background:rgba(28,28,28,.88); color:#fff;
      border:1px solid rgba(255,255,255,.12); backdrop-filter: blur(2px);
      font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,.18);
    }
    .lang-fab:hover{ opacity:.97 }
    .lang-fab .globe{ font-size:15px; line-height:1 }

    #langPanel{
      position:fixed; top:calc(104px + var(--safe-top,0px)); right:10px; width:min(420px, 92vw);
      background:rgba(20,20,20,.94); color:#fff; border:1px solid rgba(255,255,255,.14);
      border-radius:12px; padding:12px; z-index:10001; display:none; box-shadow:0 10px 40px rgba(0,0,0,.35);
      backdrop-filter: blur(8px);
    }
    #langPanel.open{ display:block; }
    #langPanel h3{ margin:0 0 8px; font-size:14px; font-weight:800; letter-spacing:.01em; display:flex; justify-content:space-between; align-items:center; }
    #langPanel .close{ background:transparent; border:1px solid rgba(255,255,255,.35); color:#fff; border-radius:8px; padding:4px 10px; cursor:pointer; }
    #langPanel .row{ display:flex; gap:.5rem; align-items:center; }
    #langPanel .hint{ margin:6px 0 0; font-size:12px; opacity:.8 }
    #langPanel .fail{ display:none; margin-top:8px; }
    #langPanel .fail.show{ display:block; }
    #langPanel .fail a{ color:#cfe1ff; text-decoration:underline; text-underline-offset:2px; }
    #langPanel .quick{ margin-top:10px; display:flex; flex-wrap:wrap; gap:6px; }
    #langPanel .chip{
      display:inline-flex; align-items:center; padding:6px 10px; border-radius:999px;
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); color:#e6edff; cursor:pointer;
    }
    /* Google のバーを非表示にしてレイアウトずれを防止 */
    iframe.goog-te-banner-frame{ display:none!important; }
    body{ top:0!important; }
    /* 「Powered by Google」等は非表示（ドロップダウンは残す） */
    #google_translate_element .goog-logo-link,
    #google_translate_element span:not(:has(select)){ display:none!important; }
    #google_translate_element .goog-te-gadget{ font-size:0!important; }
    #google_translate_element select.goog-te-combo{ font-size:14px!important; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; }
  `;
  document.head.appendChild(css);

  // 言語ボタン
  const fab = document.createElement('button');
  fab.id = 'siteTranslateBtn';
  fab.className = 'lang-fab';
  fab.innerHTML = `<span class="globe">🌐</span><span>言語 / Language</span>`;
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn && menuBtn.parentNode) menuBtn.insertAdjacentElement('afterend', fab);
  else document.body.appendChild(fab);

  // パネル
  const panel = document.createElement('div');
  panel.id = 'langPanel';
  panel.innerHTML = `
    <h3>🌐 言語 / Language <button class="close" data-close>Close</button></h3>
    <div id="google_translate_element"></div>
    <div class="hint">ページを再読み込みせずに翻訳されます。</div>
    <div class="quick" id="gt-quick">
      <span class="chip" data-tl="en">English</span>
      <span class="chip" data-tl="zh-CN">中文(简)</span>
      <span class="chip" data-tl="zh-TW">中文(繁)</span>
      <span class="chip" data-tl="ko">한국어</span>
      <span class="chip" data-tl="fr">Français</span>
      <span class="chip" data-tl="es">Español</span>
      <span class="chip" data-tl="de">Deutsch</span>
      <span class="chip" data-tl="ru">Русский</span>
      <span class="chip" data-tl="ar">العربية</span>
      <span class="chip" data-tl="hi">हिन्दी</span>
      <span class="chip" data-tl="th">ไทย</span>
      <span class="chip" data-tl="vi">Tiếng Việt</span>
      <span class="chip" data-tl="id">Bahasa Indonesia</span>
      <span class="chip" data-tl="ms">Bahasa Melayu</span>
      <span class="chip" data-tl="pt">Português</span>
      <span class="chip" data-tl="it">Italiano</span>
      <span class="chip" data-tl="tr">Türkçe</span>
      <span class="chip" data-tl="uk">Українська</span>
      <span class="chip" data-tl="pl">Polski</span>
      <span class="chip" data-tl="fil">Filipino</span>
    </div>
    <div class="fail" id="gt-fail">翻訳モジュールを読み込めませんでした。
      <a href="#" id="gt-open">Google翻訳タブで開く</a>
    </div>
  `;
  document.body.appendChild(panel);

  // Google 翻訳 Element を遅延ロード
  let loaded = false, failed = false, initializing = false;
  const ensureScript = () => new Promise((resolve) => {
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      loaded = true; return resolve(true);
    }
    if (initializing) { // 2重リクエスト防止
      const t = setInterval(()=>{
        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          clearInterval(t); loaded = true; resolve(true);
        }
      }, 100);
      setTimeout(()=>{ clearInterval(t); resolve(false); }, 4000);
      return;
    }
    initializing = true;
    // コールバックで ready フラグ
    window.__gtReady = function(){
      loaded = true;
    };
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=__gtReady';
    s.async = true; s.onerror = () => { failed = true; resolve(false); };
    document.head.appendChild(s);

    const t = setInterval(()=>{
      if (window.google && window.google.translate && window.google.translate.TranslateElement){
        clearInterval(t); loaded = true; resolve(true);
      }
    }, 120);
    setTimeout(()=>{ clearInterval(t); resolve(loaded); }, 4000);
  });

  const initElement = () => {
    try{
      // 全言語表示したいので includedLanguages は指定しない
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');

      // 不要な要素を掃除（ドロップダウン以外）
      const gadget = document.querySelector('#google_translate_element .goog-te-gadget');
      if (gadget){
        // Powered by などのリンク/テキスト除去
        gadget.querySelectorAll('a, img, .goog-logo-link').forEach(n=>n.remove());
        // 文字ノードの掃除
        gadget.childNodes.forEach(n => { if (n.nodeType===3 && n.nodeValue.trim()) n.remove(); });
      }

      // クイック切替
      const setLang = (tl)=>{
        const sel = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!sel) return;
        sel.value = tl;
        sel.dispatchEvent(new Event('change'));
      };
      panel.querySelectorAll('.chip[data-tl]').forEach(chip=>{
        chip.addEventListener('click', e=>{ e.preventDefault(); setLang(chip.getAttribute('data-tl')); });
      });

    }catch(err){
      failed = true;
      document.getElementById('gt-fail')?.classList.add('show');
    }
  };

  // フォールバック：新規タブで翻訳
  const openProxy = (tl='en')=>{
    const u = location.href.replace(/#.*$/,'');
    const url = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(tl)}&u=${encodeURIComponent(u)}`;
    window.open(url, '_blank', 'noopener');
  };
  panel.querySelector('#gt-open')?.addEventListener('click', (e)=>{
    e.preventDefault();
    const last = (document.documentElement.getAttribute('lang') || 'en');
    openProxy(last || 'en');
  });

  // 開閉
  fab.addEventListener('click', async (e)=>{
    e.preventDefault();
    panel.classList.add('open');
    if (!loaded && !failed){
      const ok = await ensureScript();
      if (ok) initElement();
      else document.getElementById('gt-fail')?.classList.add('show');
    }
  });
  panel.addEventListener('click',(e)=>{
    if (e.target.matches('[data-close]')){ e.preventDefault(); panel.classList.remove('open'); }
  });
})();
