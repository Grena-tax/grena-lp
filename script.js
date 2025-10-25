/* ===== script.js (10/12基準・完全置換) ===== */
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
      // 出ているかの簡易判定（CSSバッファ用）
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 1) ハンバーガー開閉（クリック不能対策を整理） ---------- */
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

  /* ---------- 2) 目次（各セクション＋全summaryを自動生成） ---------- */
  (function buildMenu(){
    const groups = $('#menuGroups');
    if (!groups) return;

    const sections = [
      ['corp-setup',       '法人設立'],
      ['plans',            '料金プラン'],
      ['sole-setup',       '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer',       '免責事項・キャンセル']
    ];

    const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);
    const mkId = base => base.toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');

    function ensureId(detailsEl, secId, label, idx){
      if (detailsEl.id) return detailsEl.id;
      const base = mkId(`${secId}-${label||'item'}-${idx+1}`) || `${secId}-d-${idx+1}`;
      let id = base, n=2;
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

      const group = document.createElement('div'); group.className='menu-group';
      const h4    = document.createElement('h4');  h4.textContent = secLabel;
      const ul    = document.createElement('ul');  ul.className   ='menu-list';

      // セクションのトップ
      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = `${secLabel}（トップ）`;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop); ul.appendChild(liTop);

      // そのセクション内の summary をすべて列挙
      sec.querySelectorAll('.accordion summary').forEach((sum, idx)=>{
        const det   = sum.closest('details'); if (!det) return;
        const label = sanitize(sum.textContent);
        const id    = ensureId(det, secId, label, idx);

        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = label;
        a.addEventListener('click', ()=>{
          const t = document.getElementById(id);
          if (t){ openAncestors(t); }
          setTimeout(closeMenu, 0);
        });
        li.appendChild(a); ul.appendChild(li);
      });

      group.appendChild(h4); group.appendChild(ul); groups.appendChild(group);
    });
  })();

  /* ---------- 3) 言語ドロワー（英語名で全言語） ---------- */
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

  // Google公式 <select> から英語名で自前リストを構築
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

    // 検索
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

  // 公式ウィジェットの初期化（HTMLの cb と一致）
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    }catch(_){}
    // select が生えたらリストを作る
    setTimeout(buildLangList, 600);
    // 以後も変化を監視
    const host = $('#google_translate_element');
    if (host){
      new MutationObserver(()=>setTimeout(buildLangList,0)).observe(host,{childList:true,subtree:true});
    }
  };

})();
/* ---- Hamburger: 非クリックの見出し「料金プラン」だけを削除（append-only） ---- */
(function () {
  document.querySelectorAll('#menuGroups .menu-group h4').forEach(h => {
    if ((h.textContent || '').trim() === '料金プラン') h.remove();
  });
})();
/* ==== remove only "（トップ）" items in hamburger ==== */
(function () {
  const isTop = /（トップ）\s*$/; // 全角カッコの「（トップ）」で終わる
  document.querySelectorAll('#menuGroups .menu-list li').forEach(li => {
    const a = li.querySelector('a');
    if (!a) return;
    const label = (a.textContent || '').trim();
    if (isTop.test(label)) li.remove();
  });
})();
/* === MENU: （トップ）を消す + ネスト項目を除外して作り直す === */
(() => {
  const wrap = document.getElementById('menuGroups');
  if (!wrap) return;

  // 対象セクション（既存の並びそのまま）
  const SECTIONS = [
    ['corp-setup',       '法人設立'],
    ['plans',            '料金プラン'],
    ['sole-setup',       '個人事業主（IE/SBS）'],
    ['personal-account', '個人口座開設（銀行）'],
    ['disclaimer',       '免責事項・キャンセル'],
  ];

  const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);
  const closeMenu = () => {
    const html = document.documentElement;
    html.classList.remove('menu-open');
    document.getElementById('menuDrawer')?.setAttribute('aria-hidden','true');
    document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
  };

  /* いったん空にしてから、トップレベルだけで再構築 */
  wrap.innerHTML = '';

  SECTIONS.forEach(([secId, label]) => {
    const sec = document.getElementById(secId);
    if (!sec) return;

    const group = document.createElement('div');
    group.className = 'menu-group';

    // 「料金プラン」の見出し(h4)は出さない
    if (secId !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = label;
      group.appendChild(h4);
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    // セクションのトップ（※「（トップ）」は付けない）
    const liTop = document.createElement('li');
    const aTop = document.createElement('a');
    aTop.href = `#${secId}`;
    aTop.textContent = label;
    aTop.addEventListener('click', closeMenu);
    liTop.appendChild(aTop);
    ul.appendChild(liTop);

    // 直下の <details> だけを採用（ネストは除外）
    sec.querySelectorAll(':scope .accordion > details > summary').forEach((sum, idx) => {
      const det = sum.closest('details');
      if (!det) return;

      // idが無ければユニークidを振る（既存はそのまま）
      if (!det.id) {
        let id = `${secId}-d-${idx+1}`, n = 2;
        while (document.getElementById(id)) id = `${secId}-d-${idx+1}-${n++}`;
        det.id = id;
      }

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${det.id}`;
      a.textContent = sanitize(sum.textContent);
      a.addEventListener('click', () => { det.open = true; closeMenu(); });
      li.appendChild(a);
      ul.appendChild(li);
    });

    group.appendChild(ul);
    wrap.appendChild(group);
  });

  // 念のため：残っている「（トップ）」表記はすべて削除
  document.querySelectorAll('#menuGroups a').forEach(a => {
    a.textContent = a.textContent.replace(/（トップ）/g, '');
  });
})();
/* === hamburger cleanup: remove "(トップ)" and duplicated group-title items === */
(function () {
  const groups = document.querySelectorAll('#menuGroups .menu-group');

  groups.forEach(g => {
    const title = (g.querySelector('h4')?.textContent || '')
                    .trim().replace(/\s+/g, ' ');
    const links = g.querySelectorAll('.menu-list a');

    links.forEach(a => {
      const txt = (a.textContent || '').trim().replace(/\s+/g, ' ');
      // 末尾が（トップ）/ (トップ) の項目、または見出しと同じ文言の項目を削除
      if (/（トップ）$|\(トップ\)$/.test(txt) || (title && txt === title)) {
        a.closest('li')?.remove();
      }
    });
  });

  // 保険：h4 が「料金プラン」の見出しは非表示（既に実施済みでもOK）
  document.querySelectorAll('#menuGroups .menu-group h4').forEach(h => {
    const t = (h.textContent || '').trim().replace(/\s+/g, ' ');
    if (t === '料金プラン') h.remove();
  });
})();
/* セーフティ追記：target="_blank" には安全属性を必ず付与 */
(function(){
  document.querySelectorAll('a[target="_blank"]').forEach(a=>{
    const need = ['noopener','noreferrer'];
    const cur  = (a.rel||'').split(/\s+/).filter(Boolean);
    need.forEach(t => { if (!cur.includes(t)) cur.push(t); });
    a.rel = cur.join(' ');
  });
})();
/* 重要なお知らせを「免責事項」内へ自動移動（もう入っていれば何もしない） */
(function(){
  var note = document.getElementById('legal-safety-note');
  var dest = document.querySelector('#disclaimer details:first-of-type .content');
  if (note && dest && !dest.contains(note)) dest.appendChild(note);
})();
/* ▼「重要なお知らせ」ブロックを必ず #disclaimer 内へ移動（id無しでもOK） */
(function () {
  const dest = document.querySelector('#disclaimer details:first-of-type .content');
  if (!dest) return;

  // 1) まず id=legal-safety-note を探す
  let block = document.getElementById('legal-safety-note');

  // 2) なければテキストで推定して拾う（見出しや周辺の箱を優先）
  if (!block) {
    const hasNoteText = el => /重要なお知らせ/.test((el.textContent || '').replace(/\s+/g,' '));
    // 先に「見出しを含む箱」を探す
    block = Array.from(document.querySelectorAll('section,article,aside,div'))
      .find(el => hasNoteText(el) && (el.querySelector('ul,ol,li') || el.querySelector('p')));
    // 見つからない場合は見出し行→親箱
    if (!block) {
      const heading = Array.from(document.querySelectorAll('h1,h2,h3,strong,p,div'))
        .find(el => hasNoteText(el));
      if (heading) block = heading.closest('section,article,aside,div') || heading.parentElement;
    }
    // さらに最後の保険：箇条書きそのものを拾って包む
    if (!block) {
      const list = Array.from(document.querySelectorAll('ul,ol'))
        .find(el => hasNoteText(el.previousElementSibling || {textContent:''}) || hasNoteText(el));
      if (list) {
        const wrap = document.createElement('div');
        wrap.id = 'legal-safety-note';
        wrap.className = list.className || 'security-note';
        // 見出し行が直前にあれば一緒に移す
        const prev = list.previousElementSibling;
        if (prev && hasNoteText(prev)) wrap.appendChild(prev);
        list.parentNode.insertBefore(wrap, list);
        wrap.appendChild(list);
        block = wrap;
      }
    }
  }

  // 3) 見つかったら #disclaimer の最初のdetails内へ移動
  if (block && !dest.contains(block)) dest.appendChild(block);
})();
/* === 重要なお知らせ：内容が違う2ブロックを1つのアコーディオンに集約（append-only） === */
(() => {
  const sec = document.getElementById('disclaimer');
  if (!sec) return;

  // 既存の候補を収集（id/class または見出しテキストで検出）
  const sources = new Set();
  document.querySelectorAll('#legal-safety-note, .legal-safety-note, .legal-important-note')
    .forEach(n => sources.add(n));
  document.querySelectorAll('h1,h2,h3,h4,strong,b').forEach(h => {
    if (/重要なお知らせ/.test((h.textContent || ''))) {
      const box = h.closest('section,article,div');
      if (box) sources.add(box);
    }
  });
  if (sources.size === 0) return;

  // 免責セクション内のアコーディオン（無ければ作る）
  let acc = sec.querySelector('.accordion');
  if (!acc) { acc = document.createElement('div'); acc.className = 'accordion'; sec.appendChild(acc); }

  // すでに作成済みならそこへ追加入れ、それ以外は新規で作成
  let details = sec.querySelector('details[data-legal-note]');
  if (!details) {
    details = document.createElement('details');
    details.setAttribute('data-legal-note', '');
    const sum = document.createElement('summary');
    sum.textContent = '重要なお知らせ（要点・注意喚起）';
    const content = document.createElement('div');
    content.className = 'content';
    details.appendChild(sum);
    details.appendChild(content);
    acc.appendChild(details);
  }
  const content = details.querySelector('.content');

  // 収集したブロックを中へ移動（両方とも残す／重複作成はしない）
  [...sources].forEach(node => { if (!content.contains(node)) content.appendChild(node); });

  // まとめ終わったら、変に2箇所に残らないように、免責セクション外のダブりを掃除
  document.querySelectorAll('body > section, body > div, body > article, body > aside')
    .forEach(el => {
      if (el !== sec && el.querySelector && /重要なお知らせ/.test(el.textContent||'')) {
        // 中身は移動済みなので空の入れ物だけ消す
        if (!el.contains(details)) el.remove();
      }
    });
})();
/* ==== HOTFIX: 言語モーダルが空になる時の復旧（append-only） ==== */
(function () {
  const list   = document.getElementById('langList');
  const search = document.getElementById('langSearch');
  const btn    = document.getElementById('langBtn');
  if (!list || !btn) return;

  const dn = (window.Intl && Intl.DisplayNames)
    ? new Intl.DisplayNames(['en'], { type: 'language' })
    : null;

  // フォールバック（主要言語／Google対応コード）
  const FALLBACK = [
    'en','ja','zh-CN','zh-TW','ko','es','fr','de','it','pt','ru','ar','th','id','vi','hi','tr','uk','pl','nl','sv','fi','no','da','cs','sk','sl','hu','ro','bg','el','he','ur','fa','ms','bn','ta','te','ml','mr','gu','pa','ne','si','km','lo','my','az','kk','uz','mn','ka','hy','am','sq','bs','mk','hr','lt','lv','et','is','ga','mt','af','sw','fil'
  ];

  function codeToName(code, fallbackText) {
    try { return (dn && dn.of(code.replace('_','-'))) || fallbackText || code; }
    catch (_) { return fallbackText || code; }
  }

  function render(items) {
    list.innerHTML = '';
    const curCookie = decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '');
    items
      .filter(x => x && x.code)
      .sort((a,b)=> a.name.localeCompare(b.name,'en',{sensitivity:'base'}))
      .forEach(({code,name})=>{
        const el = document.createElement('div');
        el.className = 'ls-item' + (curCookie.endsWith('/'+code) ? ' ls-active' : '');
        el.setAttribute('role','option');
        el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
        el.addEventListener('click', ()=>{
          const sel = document.querySelector('#google_translate_element select.goog-te-combo');
          if (sel) {
            sel.value = code;
            sel.dispatchEvent(new Event('change', {bubbles:true}));
          }
          document.documentElement.classList.remove('lang-open');
        });
        list.appendChild(el);
      });

    if (search) {
      search.oninput = () => {
        const q = search.value.trim().toLowerCase();
        list.querySelectorAll('.ls-item').forEach(el=>{
          const txt = (el.textContent||'').toLowerCase();
          el.style.display = (!q || txt.includes(q)) ? '' : 'none';
        });
      };
    }
  }

  function fromSelect() {
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel || sel.options.length < 2) return false;
    const items = Array.from(sel.options)
      .filter(o => o.value && o.value !== 'auto')
      .map(o => {
        const code = o.value.trim();
        const name = codeToName(code, (o.textContent||code).trim());
        return { code, name };
      });
    render(items);
    return true;
  }

  function fallback() {
    render(FALLBACK.map(code => ({ code, name: codeToName(code) })));
  }

  function tryRebuildWithRetry() {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (fromSelect()) { clearInterval(timer); return; }
      if (tries >= 10) { fallback(); clearInterval(timer); }
    }, 300);
  }

  // モーダルを開いた時に毎回リビルド（既存の開閉処理はそのまま）
  btn.addEventListener('click', () => setTimeout(tryRebuildWithRetry, 50));

  // 念のため：初回ロード後もし空なら自動復旧
  setTimeout(() => { if (!fromSelect()) fallback(); }, 2000);
})();
/* ==== FX簡易シミュレーション表：対象検出＆ラップ（append-only） ==== */
(function () {
  // 「リスクと為替の考え方」を見つけ、その中の最初の table を装飾対象にする
  const sum = Array.from(document.querySelectorAll('#disclaimer .accordion summary'))
    .find(s => /リスクと為替の考え方/.test((s.textContent || '')));
  if (!sum) return;

  const details = sum.closest('details');
  if (!details) return;

  const table = details.querySelector('table');
  if (!table) return;

  // ラップを作って横スクロール対応＋クラス付与
  if (!table.classList.contains('fx-sim-table')) {
    const wrap = document.createElement('div');
    wrap.className = 'fx-sim-scroll';
    table.parentElement.insertBefore(wrap, table);
    wrap.appendChild(table);
    table.classList.add('fx-sim-table');
  }

  // 損益列の＋/▲を見て色クラスを付与（表示テキストは変更しない）
  const lastColIndex = table.tHead ? table.tHead.rows[0].cells.length - 1
                                   : (table.rows[0]?.cells.length || 1) - 1;
  Array.from(table.tBodies[0]?.rows || []).forEach(tr => {
    const td = tr.cells[lastColIndex];
    if (!td) return;
    const t = (td.textContent || '').trim();
    if (/^[＋+]/.test(t)) td.classList.add('fx-pos');
    if (/▲|−|-/.test(t) && !/^[＋+]/.test(t)) td.classList.add('fx-neg');
  });
})();
/* ==== FX簡易シミュレーション表：場所を問わず検出して装飾（append-only） ==== */
(function () {
  if (window.__fxSimDecorated) return; // 多重実行ガード

  function findFxTable() {
    // ①「リスクと為替の考え方」summary配下を優先
    const targetSummary = Array.from(document.querySelectorAll('summary'))
      .find(s => /リスクと為替の考え方|簡易シミュレーション/.test((s.textContent || '')));
    if (targetSummary) {
      const details = targetSummary.closest('details');
      const t1 = details && details.querySelector('table');
      if (t1) return t1;
    }
    // ② フォールバック：ヘッダー語を手掛かりに全テーブルから特定
    return Array.from(document.querySelectorAll('table')).find(tbl => {
      const headTxt = (tbl.tHead ? tbl.tHead.textContent : tbl.rows[0]?.textContent) || '';
      return /為替|シナリオ/.test(headTxt) && /損益/.test(headTxt);
    });
  }

  function decorate(table) {
    if (!table || table.classList.contains('fx-sim-table')) return;

    // 横スクロール用のラッパー
    const wrap = document.createElement('div');
    wrap.className = 'fx-sim-scroll';
    table.parentElement.insertBefore(wrap, table);
    wrap.appendChild(table);

    // 目印クラス
    table.classList.add('fx-sim-table');

    // 最終列（損益）に色クラス付与（表示テキストは変更しない）
    const lastColIndex = (table.tHead ? table.tHead.rows[0].cells.length
                                      : table.rows[0]?.cells.length) - 1;
    if (lastColIndex >= 0) {
      Array.from(table.tBodies[0]?.rows || []).forEach(tr => {
        const td = tr.cells[lastColIndex];
        if (!td) return;
        const t = (td.textContent || '').trim();
        if (/^[＋+]/.test(t)) td.classList.add('fx-pos');
        else if (/▲|−|-/.test(t)) td.classList.add('fx-neg');
      });
    }
  }

  function run() {
    const tbl = findFxTable();
    if (tbl) {
      decorate(tbl);
      window.__fxSimDecorated = true;
    }
  }

  // 初回＆少しリトライ（遅延レンダリング対策）
  run();
  let n = 0;
  const tm = setInterval(() => { if (++n > 10 || window.__fxSimDecorated) return clearInterval(tm); run(); }, 300);

  // 対象 details を開いたタイミングでも実行
  document.addEventListener('toggle', e => {
    if (e.target.tagName === 'DETAILS') run();
  }, true);
})();
/* ==== FX簡易シミュレーション：損益セルの改行を除去（1行化） ==== */
(function () {
  const tbl = document.querySelector('table.fx-sim-table');
  if (!tbl) return;

  const lastCol = (tbl.tHead ? tbl.tHead.rows[0].cells.length
                              : tbl.rows[0]?.cells.length) - 1;
  if (lastCol < 0) return;

  Array.from(tbl.tBodies[0]?.rows || []).forEach(tr => {
    const td = tr.cells[lastCol];
    if (!td) return;

    // <br> をスペースに置換
    td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));

    // 余分な改行/連続空白を整理して1行に
    const text = (td.textContent || '').replace(/\s+/g, ' ').trim();
    td.textContent = text; // 文字だけ戻す（色付けはtdのクラスfx-pos/fx-negで維持）

    // 念のため：もう一度改行禁止
    td.style.whiteSpace = 'nowrap';
  });
})();
/* ==== FX簡易シミュレーション：スクロール用ラッパを自動付与（append-only） ==== */
(function () {
  const t = document.querySelector('table.fx-sim-table');
  if (!t) return;
  if (t.parentElement && t.parentElement.classList.contains('fx-sim-scroll')) return;

  const wrap = document.createElement('div');
  wrap.className = 'fx-sim-scroll';
  t.parentNode.insertBefore(wrap, t);
  wrap.appendChild(t);
})();

/* ==== ★追加：損益列の“下線”を確実に無効化するクラスを付与（append-only） ==== */
(function () {
  function addNoLine() {
    // まず fx-sim-table を優先、なければ見出し語で推定
    var tbl = document.querySelector('table.fx-sim-table') ||
      Array.from(document.querySelectorAll('table')).find(function(t){
        var txt = (t.tHead ? t.tHead.textContent : t.textContent) || '';
        return /円換算額/.test(txt) && /損益/.test(txt);
      });
    if (tbl) tbl.classList.add('sim-noline');
  }
  addNoLine();
  // details を開いた直後や遅延描画にも対応
  document.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS') setTimeout(addNoLine, 0); }, true);
  setTimeout(addNoLine, 800);
})();
/* ==== FX簡易シミュレーション：損益列の下線を強制的に除去（append-only） ==== */
(function () {
  function stripProfitUnderline() {
    var tbl = document.querySelector('table.fx-sim-table');
    if (!tbl) return;

    var last = (tbl.tHead ? tbl.tHead.rows[0].cells.length
                          : (tbl.rows[0] ? tbl.rows[0].cells.length : 0)) - 1;
    if (last < 0) return;

    Array.from(tbl.tBodies[0] ? tbl.tBodies[0].rows : []).forEach(function (tr) {
      var td = tr.cells[last];
      if (!td) return;

      // 1) 中の <a>/<u>/<ins> などを丸ごと“テキストだけ”にする
      var text = (td.textContent || '').replace(/\s+/g, ' ').trim();
      td.textContent = text;  // クラス fx-pos/fx-neg は td 側に残るので色は維持

      // 2) 念のため style で下線を完全無効化
      td.style.setProperty('text-decoration', 'none', 'important');
      td.style.setProperty('-webkit-text-decoration-skip', 'none', 'important');
      td.style.whiteSpace = 'nowrap';
      td.style.display = 'inline-block'; // 余計な折り返し防止
    });

    // 表全体にも識別クラス（CSS側の保険）
    tbl.classList.add('sim-noline');
  }

  // 初回・遅延描画・details 開閉の各タイミングで実行
  stripProfitUnderline();
  setTimeout(stripProfitUnderline, 500);
  document.addEventListener('toggle', function (e) {
    if (e.target && e.target.tagName === 'DETAILS') setTimeout(stripProfitUnderline, 0);
  }, true);
})();
/* 円換算額の「,-」を「,000」に統一（FX表だけ・他は触らない） */
(function () {
  const tbl = document.querySelector('table.fx-sim-table');
  if (!tbl) return;

  // 見出しから「円換算額」列の位置を取得（なければ3列目を仮定）
  let col = -1;
  const heads = (tbl.tHead ? tbl.tHead.rows[0].cells : tbl.rows[0]?.cells) || [];
  [...heads].forEach((th, i) => {
    if (/円換算額/.test((th.textContent || '').trim())) col = i;
  });
  if (col < 0) col = 2; // 保険：3列目（0始まり）

  // 末尾が ",-" だけを ",000" に置換
  (tbl.tBodies[0]?.rows || []).forEach(tr => {
    const td = tr.cells[col];
    if (!td) return;
    td.textContent = (td.textContent || '').replace(/,\s*-\s*$/, ',000');
  });
})();
/* 円換算額の「,-」を「,000」に正規化（表示だけ／他は触らない） */
(function () {
  const PAT = /,\s*[−-]\s*$/u; // 末尾「,-」「, −」など（全角マイナス含む）

  function fixOneTable(tbl) {
    // ヘッダから「円換算額」列のインデックスを推定
    let col = -1;
    const headRow =
      (tbl.tHead && tbl.tHead.rows[0]) ||
      Array.from(tbl.rows).find(r => r.querySelector('th'));
    if (headRow) {
      const cells = Array.from(headRow.cells);
      col = cells.findIndex(th =>
        /円換算額/.test((th.textContent || '').replace(/\s+/g, ' '))
      );
    }
    if (col < 0) col = 2; // 保険（3列目）

    // 対象列だけ置換。既に「,000」なら何もしない
    Array.from(tbl.tBodies[0]?.rows || []).forEach(tr => {
      const td = tr.cells[col];
      if (!td) return;

      // 余計な改行があればスペースへ
      td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));

      const txt = (td.textContent || '').trim();
      if (PAT.test(txt)) {
        td.textContent = txt.replace(PAT, ',000');
      }
    });
  }

  function run() {
    // ヘッダに「円換算額」を含む表だけを対象
    document.querySelectorAll('table').forEach(tbl => {
      const headerTxt =
        (tbl.tHead ? tbl.tHead.textContent : tbl.rows[0]?.textContent) || '';
      if (/円換算額/.test(headerTxt)) fixOneTable(tbl);
    });
  }

  // 即時実行＋遅延描画対策（数回リトライ）＋detailsオープン時
  run();
  let tries = 0;
  const tm = setInterval(() => { run(); if (++tries > 10) clearInterval(tm); }, 300);
  document.addEventListener('toggle', e => {
    if (e.target.tagName === 'DETAILS' && e.target.open) run();
  }, true);

  // 免責セクション内でDOMが後から差し替わっても再実行
  const host = document.getElementById('disclaimer') || document.body;
  new MutationObserver(run).observe(host, { childList: true, subtree: true });
})();
