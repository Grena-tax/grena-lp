/* ==========================================
   追加スクリプト（レイアウト無改変）
   - スムーススクロール
   - 「トップへ」ボタン
   - 下部CTA高さの余白反映
   - 申込ボタン：フォームを新規タブで開く
   - ハンバーガー開閉／メニュー自動生成（本文は無改変）
   - 重複免責（site-disclaimer）除去、#disclaimer は初期は閉じる
   - Google翻訳（🌐）UI注入＋Google公式を裏で呼ぶ（多言語）
   ========================================== */
(() => {
  'use strict';

  /* ===== 設定 ===== */
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';
  const DEFAULT_LANG = 'ja';
  const LANGS = [
    ['ja','日本語'], ['en','English'], ['zh-CN','简体中文'], ['zh-TW','繁體中文'],
    ['ko','한국어'], ['th','ไทย'], ['es','Español'], ['fr','Français'],
    ['de','Deutsch'], ['ru','Русский'], ['ar','العربية'], ['vi','Tiếng Việt'],
    ['pt','Português'], ['it','Italiano'], ['id','Indonesia'], ['hi','हिन्दी']
  ];
  const RTL = ['ar','fa','he','ur'];

  /* ===== util ===== */
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const slug = (t) => (t||'').toLowerCase()
    .replace(/[（）()\[\]【】]/g,' ')
    .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
    .replace(/-+/g,'-').replace(/^-|-$/g,'');

  /* ===== スムーススクロール（ページ内リンクのみ） ===== */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // 免責(#disclaimer) だけは自動オープンしない
    if (target.id !== 'disclaimer') {
      const first = target.querySelector('details');
      if (first && !first.open) first.open = true;
    }
    history.pushState(null, '', id);
  });

  /* ===== 「トップへ」 ===== */
  $('#toTop')?.addEventListener('click', (e)=>{
    if (!document.querySelector('#page-top')) {
      e.preventDefault();
      window.scrollTo({ top:0, behavior:'smooth' });
    }
  });

  /* ===== 固定CTAの高さ → 本文余白へ反映 ===== */
  const adjustCtaPadding = () => {
    const bar = $('#ctaBar');
    if (!bar) return;
    const h = Math.ceil(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--cta-h', h + 'px');
  };
  addEventListener('load', adjustCtaPadding);
  addEventListener('resize', adjustCtaPadding);

  /* ===== 申込ボタン ===== */
  $('#applyNow')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
    window.open(FORM_URL, '_blank', 'noopener');
  });

  /* ===== ハンバーガー開閉 ===== */
  const btn        = $('#menuBtn');
  const drawer     = $('#menuDrawer');
  const closeBt    = $('#menuClose');
  const overlay    = $('#menuBackdrop');
  const groupsRoot = $('#menuGroups');

  const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
  const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

  btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
  closeBt?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

  /* ===== メニュー自動生成（本文は無改変） ===== */
  const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

  function buildMenu(){
    if (!groupsRoot) return;
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const frag = document.createDocumentFragment();
    let i = 1;

    sections.forEach(sec=>{
      const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
      if (!details.length) return;

      const wrap = document.createElement('div');
      wrap.className = 'menu-group';

      const h2 = sec.querySelector('h2');
      if (h2 && sec.id !== 'plans') {
        const h4 = document.createElement('h4');
        h4.textContent = (h2.textContent || '').trim();
        wrap.appendChild(h4);
      } else {
        wrap.classList.add('no-title');
      }

      const ul = document.createElement('ul');
      ul.className = 'menu-list';

      details.forEach(d=>{
        const s = d.querySelector('summary');
        const t = s?.textContent?.trim() || '項目';
        if (excludeTitles.some(x => t.includes(x))) return;
        if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = `#${d.id}`;
        a.textContent = t;
        a.addEventListener('click',(e)=>{
          e.preventDefault();
          closeMenu();
          d.open = true;
          d.scrollIntoView({behavior:'smooth', block:'start'});
          history.pushState(null,'',`#${d.id}`);
        });
        li.appendChild(a);
        ul.appendChild(li);
      });

      wrap.appendChild(ul);
      frag.appendChild(wrap);
    });

    groupsRoot.textContent = '';
    groupsRoot.appendChild(frag);

    // 念のため：どこかの古いJSが h4 "plans" を作っても即削除
    groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
      if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
    });
  }
  addEventListener('DOMContentLoaded', buildMenu);

  /* ===== 免責：初期は閉じる／重複免責を除去 ===== */
  addEventListener('DOMContentLoaded', () => {
    // #disclaimer 配下の <details open> を閉じる（初期開きっぱなし防止）
    document.querySelectorAll('#disclaimer details[open]')?.forEach(d=>d.removeAttribute('open'));
  });

  function removeDupDisclaimer(){
    // 1) 過去の一括貼付ブロック #site-disclaimer が本文外なら削除
    const extra = document.getElementById('site-disclaimer');
    if (extra && !extra.closest('#disclaimer')) extra.remove();

    // 2) 「免責事項（必ずお読みください）」に見える stray な details を #disclaimer 外なら削除
    document.querySelectorAll('details').forEach(d=>{
      const s = d.querySelector('summary');
      const t = (s?.textContent || '').trim();
      if (!t) return;
      const isDisclaimerLike = t.includes('免責事項') && t.includes('必ずお読みください');
      if (isDisclaimerLike && !d.closest('#disclaimer')) d.remove();
    });
  }
  document.addEventListener('DOMContentLoaded', removeDupDisclaimer);
  window.addEventListener('load', removeDupDisclaimer);
  new MutationObserver(removeDupDisclaimer).observe(document.documentElement, {childList:true, subtree:true});

  /* ===== Google 翻訳（🌐）UI ＋ 本体読込 ===== */
  function injectLangUI(){
    if (document.getElementById('langBtn')) return;

    // ボタン
    const btn = document.createElement('button');
    btn.id = 'langBtn';
    btn.className = 'lang-button';
    btn.type = 'button';
    btn.setAttribute('aria-label','Language');
    btn.textContent = '🌐';
    document.body.appendChild(btn);

    // パネル
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

    const small = document.createElement('small');
    small.style.display = 'block';
    small.style.marginTop = '6px';
    small.style.color = '#64748b';
    small.textContent = 'Powered by Google Translate';
    panel.appendChild(small);

    document.body.appendChild(panel);

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

    const setCurrent = (code) => {
      panel.querySelectorAll('.lang-chip').forEach(el=>{
        el.dataset.current = (el.dataset.lang === code) ? 'true' : 'false';
      });
    };

    panel.addEventListener('click', (e)=>{
      const chip = e.target.closest('.lang-chip');
      if (!chip) return;
      const code = chip.dataset.lang;
      translateTo(code);
      setCurrent(code);
      panel.hidden = true;
    });

    const saved = localStorage.getItem('i18n.lang') || DEFAULT_LANG;
    setCurrent(saved);
  }

  function loadGoogleTranslate(){
    if (window.google && window.google.translate) return;
    const cb = 'googleTranslateElementInit_' + Math.random().toString(36).slice(2);
    window[cb] = function(){
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        includedLanguages: LANGS.map(x=>x[0]).join(','),
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');

      // 保存済み言語の自動適用
      const saved = localStorage.getItem('i18n.lang');
      if (saved && saved !== 'ja') {
        // 後述の ensureCombo で select 生成を待ってから適用
        setTimeout(()=>translateTo(saved), 150);
      }
    };
    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=' + cb;
    s.async = true;
    document.head.appendChild(s);
  }

  // Googleの<select.goog-te-combo>が生成されるまで待ってから変更をかける
  function ensureCombo(done, tries = 0){
    const combo = document.querySelector('select.goog-te-combo');
    if (combo) { done(combo); return; }
    if (tries > 100) return; // 最大 ~10秒
    setTimeout(()=>ensureCombo(done, tries+1), 100);
  }

  function translateTo(langCode){
    ensureCombo((combo)=>{
      combo.value = (langCode === 'ja') ? '' : langCode;
      combo.dispatchEvent(new Event('change'));

      // 保存
      localStorage.setItem('i18n.lang', langCode);

      // RTL言語対応
      if (RTL.includes(langCode)) {
        document.documentElement.setAttribute('dir','rtl');
      } else {
        document.documentElement.removeAttribute('dir');
      }

      // メニュー再生成（翻訳後の見出しテキストベースで更新）
      try { buildMenu(); } catch(e){}
    });
  }

  // 起動
  document.addEventListener('DOMContentLoaded', () => {
    injectLangUI();
    loadGoogleTranslate();
  });

})();
