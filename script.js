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
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 1) ハンバーガー開閉（クリック不能対策を整理） ---------- */
  // ★FIX: IDが無くても .menu-button/.menu-wrap で動作。遅延挿入にも効く“イベント委譲”
  const menuBtnSel      = '#menuBtn, .menu-button';      /* ★FIX */
  const menuDrawerSel   = '#menuDrawer, .menu-wrap';     /* ★FIX */
  const menuBackdropSel = '#menuBackdrop, .menu-backdrop';/* ★FIX */
  const menuCloseSel    = '#menuClose, .menu-close';     /* ★FIX */

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    const menuDrawer = $(menuDrawerSel);
    const menuBtn    = $(menuBtnSel);
    if (menuDrawer) menuDrawer.setAttribute('aria-hidden', String(!open));
    if (menuBtn)    menuBtn.setAttribute('aria-expanded', String(open));
  }
  const toggleMenu = (e)=>{ if(e){e.preventDefault();} setMenu(!html.classList.contains('menu-open')); };
  const closeMenu  = ()=> setMenu(false);

  // ★FIX: ゴーストクリック抑止しつつ、委譲で click/touchstart を拾う
  let __lastTouch = 0;                                     /* ★FIX */
  ['touchstart','click'].forEach(type => {                 /* ★FIX */
    document.addEventListener(type, (e) => {               /* ★FIX */
      if (type === 'click' && Date.now() - __lastTouch < 500) return;
      if (type === 'touchstart') __lastTouch = Date.now();

      const t = e.target;
      if (t && t.closest(menuBtnSel))      { e.preventDefault(); toggleMenu(e); }
      if (t && t.closest(menuBackdropSel)) { e.preventDefault(); closeMenu(); }
      if (t && t.closest(menuCloseSel))    { e.preventDefault(); closeMenu(); }
    }, {passive:false});
  });                                                      /* ★FIX */

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

      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = `${secLabel}（トップ）`;
      aTop.addEventListener('click', ()=> setTimeout(closeMenu,0));
      liTop.appendChild(aTop); ul.appendChild(liTop);

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
  // ★FIX: IDが無くても .lang-button/.lang-wrap で動作。遅延挿入にも効く“委譲”
  const langBtnSel      = '#langBtn, .lang-button';        /* ★FIX */
  const langDrawerSel   = '#langDrawer, .lang-wrap';       /* ★FIX */
  const langBackdropSel = '#langBackdrop, .lang-backdrop'; /* ★FIX */
  const langCloseSel    = '#langClose, .lang-close';       /* ★FIX */

  function setLang(open){
    html.classList.toggle('lang-open', open);
    const langDrawer = $(langDrawerSel);
    const langBtn    = $(langBtnSel);
    if (langDrawer) langDrawer.setAttribute('aria-hidden', String(!open));
    if (langBtn)    langBtn.setAttribute('aria-expanded', String(open));
  }
  const openLang  = ()=> setLang(true);
  const closeLang = ()=> setLang(false);

  ['touchstart','click'].forEach(type => {                 /* ★FIX */
    document.addEventListener(type, (e) => {               /* ★FIX */
      if (type === 'click' && Date.now() - __lastTouch < 500) return;
      if (type === 'touchstart') __lastTouch = Date.now();

      const t = e.target;
      if (t && t.closest(langBtnSel))      { e.preventDefault(); openLang(); }
      if (t && t.closest(langBackdropSel)) { e.preventDefault(); closeLang(); }
      if (t && t.closest(langCloseSel))    { e.preventDefault(); closeLang(); }
    }, {passive:false});
  });                                                      /* ★FIX */

  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeLang(); });

  // Google公式 <select> から英語名で自前リストを構築
  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  function buildLangList(){
    const langList   = $('#langList');
    const langSearch = $('#langSearch');
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

  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    }catch(_){}
    setTimeout(buildLangList, 600);
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
  const isTop = /（トップ）\s*$/;
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
    document.querySelector('#menuDrawer, .menu-wrap')?.setAttribute('aria-hidden','true');
    document.querySelector('#menuBtn, .menu-button')?.setAttribute('aria-expanded','false');
  };

  wrap.innerHTML = '';

  SECTIONS.forEach(([secId, label]) => {
    const sec = document.getElementById(secId);
    if (!sec) return;

    const group = document.createElement('div');
    group.className = 'menu-group';

    if (secId !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = label;
      group.appendChild(h4);
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    const liTop = document.createElement('li');
    const aTop = document.createElement('a');
    aTop.href = `#${secId}`;
    aTop.textContent = label;
    aTop.addEventListener('click', closeMenu);
    liTop.appendChild(aTop);
    ul.appendChild(liTop);

    sec.querySelectorAll(':scope .accordion > details > summary').forEach((sum, idx) => {
      const det = sum.closest('details');
      if (!det) return;

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
      if (/（トップ）$|\(トップ\)$/.test(txt) || (title && txt === title)) {
        a.closest('li')?.remove();
      }
    });
  });

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

  let block = document.getElementById('legal-safety-note');

  if (!block) {
    const hasNoteText = el => /重要なお知らせ/.test((el.textContent || '').replace(/\s+/g,' '));
    block = Array.from(document.querySelectorAll('section,article,aside,div'))
      .find(el => hasNoteText(el) && (el.querySelector('ul,ol,li') || el.querySelector('p')));
    if (!block) {
      const heading = Array.from(document.querySelectorAll('h1,h2,h3,strong,p,div'))
        .find(el => hasNoteText(el));
      if (heading) block = heading.closest('section,article,aside,div') || heading.parentElement;
    }
    if (!block) {
      const list = Array.from(document.querySelectorAll('ul,ol'))
        .find(el => hasNoteText(el.previousElementSibling || {textContent:''}) || hasNoteText(el));
      if (list) {
        const wrap = document.createElement('div');
        wrap.id = 'legal-safety-note';
        wrap.className = list.className || 'security-note';
        const prev = list.previousElementSibling;
        if (prev && hasNoteText(prev)) wrap.appendChild(prev);
        list.parentNode.insertBefore(wrap, list);
        wrap.appendChild(list);
        block = wrap;
      }
    }
  }

  if (block && !dest.contains(block)) dest.appendChild(block);
})();
/* === 重要なお知らせ：内容が違う2ブロックを1つのアコーディオンに集約（append-only） === */
(() => {
  const sec = document.getElementById('disclaimer');
  if (!sec) return;

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

  let acc = sec.querySelector('.accordion');
  if (!acc) { acc = document.createElement('div'); acc.className = 'accordion'; sec.appendChild(acc); }

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

  [...sources].forEach(node => { if (!content.contains(node)) content.appendChild(node); });

  document.querySelectorAll('body > section, body > div, body > article, body > aside')
    .forEach(el => {
      if (el !== sec && el.querySelector && /重要なお知らせ/.test(el.textContent||'')) {
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

  btn.addEventListener('click', () => setTimeout(tryRebuildWithRetry, 50));
  setTimeout(() => { if (!fromSelect()) fallback(); }, 2000);
})();
/* ==== FX簡易シミュレーション表：対象検出＆ラップ（append-only） ==== */
(function () {
  const sum = Array.from(document.querySelectorAll('#disclaimer .accordion summary'))
    .find(s => /リスクと為替の考え方/.test((s.textContent || '')));
  if (!sum) return;

  const details = sum.closest('details');
  if (!details) return;

  const table = details.querySelector('table');
  if (!table) return;

  if (!table.classList.contains('fx-sim-table')) {
    const wrap = document.createElement('div');
    wrap.className = 'fx-sim-scroll';
    table.parentElement.insertBefore(wrap, table);
    wrap.appendChild(table);
    table.classList.add('fx-sim-table');
  }

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
  if (window.__fxSimDecorated) return;

  function findFxTable() {
    const targetSummary = Array.from(document.querySelectorAll('summary'))
      .find(s => /リスクと為替の考え方|簡易シミュレーション/.test((s.textContent || '')));
    if (targetSummary) {
      const details = targetSummary.closest('details');
      const t1 = details && details.querySelector('table');
      if (t1) return t1;
    }
    return Array.from(document.querySelectorAll('table')).find(tbl => {
      const headTxt = (tbl.tHead ? tbl.tHead.textContent : tbl.rows[0]?.textContent) || '';
      return /為替|シナリオ/.test(headTxt) && /損益/.test(headTxt);
    });
  }

  function decorate(table) {
    if (!table || table.classList.contains('fx-sim-table')) return;

    const wrap = document.createElement('div');
    wrap.className = 'fx-sim-scroll';
    table.parentElement.insertBefore(wrap, table);
    wrap.appendChild(table);

    table.classList.add('fx-sim-table');

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

  run();
  let n = 0;
  const tm = setInterval(() => { if (++n > 10 || window.__fxSimDecorated) return clearInterval(tm); run(); }, 300);

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

    td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));

    const text = (td.textContent || '').replace(/\s+/g, ' ').trim();
    td.textContent = text;

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
    var tbl = document.querySelector('table.fx-sim-table') ||
      Array.from(document.querySelectorAll('table')).find(function(t){
        var txt = (t.tHead ? t.tHead.textContent : t.textContent) || '';
        return /円換算額/.test(txt) && /損益/.test(txt);
      });
    if (tbl) tbl.classList.add('sim-noline');
  }
  addNoLine();
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

      var text = (td.textContent || '').replace(/\s+/g, ' ').trim();
      td.textContent = text;

      td.style.setProperty('text-decoration', 'none', 'important');
      td.style.setProperty('-webkit-text-decoration-skip', 'none', 'important');
      td.style.whiteSpace = 'nowrap';
      td.style.display = 'inline-block';
    });

    tbl.classList.add('sim-noline');
  }

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

  let col = -1;
  const heads = (tbl.tHead ? tbl.tHead.rows[0].cells : tbl.rows[0]?.cells) || [];
  [...heads].forEach((th, i) => {
    if (/円換算額/.test((th.textContent || '').trim())) col = i;
  });
  if (col < 0) col = 2;

  (tbl.tBodies[0]?.rows || []).forEach(tr => {
    const td = tr.cells[col];
    if (!td) return;
    td.textContent = (td.textContent || '').replace(/,\s*-\s*$/, ',000');
  });
})();
/* 円換算額の「,-」を「,000」に正規化（表示だけ／他は触らない） */
(function () {
  const PAT = /,\s*[−-]\s*$/u;

  function fixOneTable(tbl) {
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
    if (col < 0) col = 2;

    Array.from(tbl.tBodies[0]?.rows || []).forEach(tr => {
      const td = tr.cells[col];
      if (!td) return;

      td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));

      const txt = (td.textContent || '').trim();
      if (PAT.test(txt)) {
        td.textContent = txt.replace(PAT, ',000');
      }
    });
  }

  function run() {
    document.querySelectorAll('table').forEach(tbl => {
      const headerTxt =
        (tbl.tHead ? tbl.tHead.textContent : tbl.rows[0]?.textContent) || '';
      if (/円換算額/.test(headerTxt)) fixOneTable(tbl);
    });
  }

  run();
  let tries = 0;
  const tm = setInterval(() => { run(); if (++tries > 10) clearInterval(tm); }, 300);
  document.addEventListener('toggle', e => {
    if (e.target.tagName === 'DETAILS' && e.target.open) run();
  }, true);

  const host = document.getElementById('disclaimer') || document.body;
  new MutationObserver(run).observe(host, { childList: true, subtree: true });
})();
/* 円換算額の末尾「, - / , − / , － …」を「,000」に統一（他は触らない） */
(function () {
  const TRAIL = /([,\uFF0C])\s*[‐-‒–—\-−－]\s*$/u;

  function normalizeCell(td) {
    if (!td || td.dataset.fxFixed) return;

    td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));

    const before = (td.textContent || '').trim();
    if (TRAIL.test(before)) {
      td.textContent = before.replace(TRAIL, '$1000');
      td.dataset.fxFixed = '1';
    }
  }

  function targetColIndex(tbl) {
    const heads = tbl.querySelectorAll('thead th, tr:first-child th');
    for (let i = 0; i < heads.length; i++) {
      const t = (heads[i].textContent || '').replace(/\s+/g,'');
      if (t.includes('円換算額')) return i;
    }
    const r0 = tbl.tBodies[0]?.rows?.[0];
    if (r0) {
      for (let i = 0; i < r0.cells.length; i++) {
        const txt = (r0.cells[i].textContent || '').trim();
        if (/^¥/.test(txt) && TRAIL.test(txt)) return i;
      }
    }
    return -1;
  }

  function fixTable(tbl) {
    const col = targetColIndex(tbl);
    if (col < 0) return;
    Array.from(tbl.tBodies[0]?.rows || []).forEach(tr => normalizeCell(tr.cells[col]));
  }

  function run() {
    document.querySelectorAll('table').forEach(tbl => {
      const headTxt = (tbl.tHead?.textContent || tbl.rows[0]?.textContent || '');
      if (/円換算額/.test(headTxt)) fixTable(tbl);
    });
  }

  run();
  let n = 0; const tm = setInterval(() => { run(); if (++n > 10) clearInterval(tm); }, 300);
  document.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS' && e.target.open) run(); }, true);
  new MutationObserver(run).observe(document.getElementById('disclaimer') || document.body, { childList:true, subtree:true });
})();
/* ==== FX表：円換算額の「, -」を「,000」に正規化（この表だけ） ==== */
(function () {
  function isTargetTable(tbl) {
    const headTxt = ((tbl.tHead && tbl.tHead.textContent) || (tbl.rows[0] && tbl.rows[0].textContent) || '')
      .replace(/\s+/g, '');
    return headTxt.includes('円換算額') && (headTxt.includes('損益') || headTxt.includes('満期残高'));
  }

  function getYenCol(tbl) {
    const cells = Array.from((tbl.tHead && tbl.tHead.rows[0].cells) || (tbl.rows[0] && tbl.rows[0].cells) || []);
    return cells.findIndex(th => /円換算額/.test((th.textContent || '').replace(/\s+/g, '')));
  }

  const DASH = '[-\\u2212\\uFF0D\\u2012\\u2013\\u2014]';
  const RE_BAD = new RegExp('^¥\\s*([0-9]{1,3}(?:,[0-9]{3})*),\\s*(?:' + DASH + ')?\\s*$');

  function fixTable(tbl) {
    const col = getYenCol(tbl);
    if (col < 0) return;

    const rows = (tbl.tBodies && tbl.tBodies[0] && tbl.tBodies[0].rows) ? Array.from(tbl.tBodies[0].rows)
                 : Array.from(tbl.rows).slice(1);

    rows.forEach(tr => {
      const td = tr.cells[col];
      if (!td) return;
      const txt = (td.textContent || '').trim();
      const m = txt.match(RE_BAD);
      if (m) td.textContent = `¥${m[1]}000`;
    });
  }

  function run() {
    document.querySelectorAll('table').forEach(tbl => { if (isTargetTable(tbl)) fixTable(tbl); });
  }

  run();
  let tries = 0;
  const timer = setInterval(() => { run(); if (++tries > 12) clearInterval(timer); }, 300);
  document.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS') run(); }, true);
  new MutationObserver(() => run()).observe(document.body, { childList: true, subtree: true });
})();

/* ★FIX: “重要なお知らせ”の details を #disclaimer のアコーディオン末尾に必ず配置（最終ガード） */
(function(){                                                                /* ★FIX */
  const sec = document.getElementById('disclaimer'); if (!sec) return;      /* ★FIX */
  let acc = sec.querySelector('.accordion');                                 /* ★FIX */
  if (!acc){ acc=document.createElement('div'); acc.className='accordion'; sec.appendChild(acc); } /* ★FIX */
  let det = acc.querySelector('details[data-legal-note]');                   /* ★FIX */
  if (!det){                                                                 /* ★FIX */
    det=document.createElement('details'); det.setAttribute('data-legal-note','');/* ★FIX */
    const sum=document.createElement('summary'); sum.textContent='重要なお知らせ（要点・注意喚起）';/* ★FIX */
    const content=document.createElement('div'); content.className='content';/* ★FIX */
    det.appendChild(sum); det.appendChild(content);                          /* ★FIX */
  }                                                                          /* ★FIX */
  acc.appendChild(det);                                                      /* ★FIX */
  const content = det.querySelector('.content');                             /* ★FIX */
  document.querySelectorAll('#legal-safety-note, .legal-safety-note, .legal-important-note') /* ★FIX */
    .forEach(n=>{ if (n && !content.contains(n)) content.appendChild(n); });/* ★FIX */
})();                                                                        /* ★FIX */
/* === FIX: Google翻訳 強制ロード + クッキー方式フォールバック（append-only） === */
(function(){
  // 1) Googleのelement.jsが未読込なら注入
  function ensureGTE(){
    if (window.google && window.google.translate && window.google.translate.TranslateElement) return;
    if (document.getElementById('gt-script')) return;
    var s = document.createElement('script');
    s.id = 'gt-script';
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  }
  ensureGTE();

  // 2) サイト側に書けるクッキーで翻訳を指示（/ja/xx）
  function setCookie(name, value, days){
    var d = new Date(); d.setTime(d.getTime() + (days||365)*864e5);
    var exp = '; expires=' + d.toUTCString();
    var path = '; path=/';
    var host = location.hostname;

    document.cookie = name + '=' + encodeURIComponent(value) + exp + path;

    // サブドメイン対策（example.co.jp のようにドットが2つ以上ならトップ2階層にも）
    var parts = host.split('.');
    if (parts.length >= 3){
      var root = '.' + parts.slice(-2).join('.');
      document.cookie = name + '=' + encodeURIComponent(value) + exp + '; path=/; domain=' + root;
    }
  }
  function forceTranslateTo(code){
    var src = 'ja';
    var val = '/' + src + '/' + code;
    setCookie('googtrans', val);

    // 既存の select があれば change を飛ばし、それでも無理ならリロード
    try{
      var sel = document.querySelector('#google_translate_element select.goog-te-combo');
      if (sel){
        sel.value = code;
        sel.dispatchEvent(new Event('change', {bubbles:true}));
        return;
      }
    }catch(_){}
    location.reload();
  }

  // 3) 言語モーダルのクリックを監視：既存処理→0.6秒様子見→未翻訳なら強制適用
  document.addEventListener('click', function(e){
    var el = e.target.closest('.ls-item');
    if (!el) return;
    var codeEl = el.querySelector('.ls-code');
    var code = codeEl && codeEl.textContent && codeEl.textContent.trim();
    if (!code) return;

    // 既存のハンドラに任せたあと、翻訳されたか判定
    setTimeout(function(){
      var translated = document.querySelector('html.translated-ltr, html.translated-rtl') ||
                       /\btranslated\b/.test(document.body.className);
      if (!translated) forceTranslateTo(code);
    }, 600);
  }, true);

  // 4) ページ読込時：googtrans クッキーがあるのに未適用なら、初期化を促す
  window.addEventListener('load', function(){
    var ck = decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1]||'');
    var applied = document.querySelector('html.translated-ltr, html.translated-rtl');
    if (ck && !applied){
      ensureGTE();
      // 念のため再初期化を呼ぶ（cbが未発火のケース向け）
      setTimeout(function(){
        if (window.googleTranslateElementInit) window.googleTranslateElementInit();
      }, 800);
    }
  }, {once:true});
})();
/* === FIX v2: 日本語へ戻す時に確実に復元（フリック不要・append-only） === */
(function(){
  function delCookie(name){
    var past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    var host = location.hostname, parts = host.split('.');
    // 現在ドメイン
    document.cookie = name + '=; expires=' + past + '; path=/';
    // ルートドメイン（sub.example.co.jp → .example.co.jp）にも
    if (parts.length >= 3){
      var root = '.' + parts.slice(-2).join('.');
      document.cookie = name + '=; expires=' + past + '; path=/; domain=' + root;
    }
  }
  function isTranslated(){
    var html = document.documentElement;
    return html.classList.contains('translated-ltr') ||
           html.classList.contains('translated-rtl') ||
           /\btranslated\b/.test(document.body.className || '');
  }

  // ① 言語モーダル（.ls-item）クリック時：日本語が選ばれたら強制復元
  document.addEventListener('click', function(e){
    var item = e.target.closest('.ls-item'); if(!item) return;
    var codeEl = item.querySelector('.ls-code');
    var code = codeEl && codeEl.textContent ? codeEl.textContent.trim() : '';
    if(!code) return;

    // “ja” 系は Google翻訳ではなく「原文復元」扱いにする
    if (/^ja(\b|[-_]|$)/i.test(code)){
      delCookie('googtrans'); // 翻訳指示クッキーを削除
      // 公式 select があれば原文に戻すイベントだけ発火
      try{
        var sel = document.querySelector('#google_translate_element select.goog-te-combo');
        if (sel){ sel.value = ''; sel.dispatchEvent(new Event('change', {bubbles:true})); }
      }catch(_){}
      // まだ翻訳状態ならハードに復元（ページ更新）
      setTimeout(function(){ if (isTranslated()) location.reload(); }, 250);
    }
  }, true);

  // ② 公式の隠し <select> 操作時にも同じ復元を適用（保険）
  document.addEventListener('change', function(e){
    var sel = e.target;
    if (!sel || !sel.matches('#google_translate_element select.goog-te-combo')) return;
    var code = (sel.value || '').trim();
    if (/^ja(\b|[-_]|$)/i.test(code)){
      delCookie('googtrans');
      setTimeout(function(){ if (isTranslated()) location.reload(); }, 250);
    }
  }, true);

  // ③ 読み込み時：万一 googtrans=/ja/ja が残ってたら消す（保険）
  window.addEventListener('load', function(){
    var ck = decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1]||'');
    if (ck && /\/ja\/ja$/.test(ck)) delCookie('googtrans');
  }, {once:true});
})();
/* === FIX v3: Google翻訳を確実に起動 + 失敗時の強制適用（append-only） === */
(function(){
  // 既存のコールバックが無い環境でも動くように保険
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = function(){
      try{
        new google.translate.TranslateElement(
          { pageLanguage: 'ja', autoDisplay: false },
          'google_translate_element'
        );
      }catch(_){}
    };
  }

  // ホスト要素を必ず用意（無ければ自動作成）
  function ensureHost(){
    if (!document.getElementById('google_translate_element')){
      var d=document.createElement('div');
      d.id='google_translate_element';
      d.style.cssText='position:fixed;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';
      (document.body||document.documentElement).appendChild(d);
    }
  }

  // 翻訳スクリプトが無ければ注入
  function ensureScript(cb){
    var id='__gt_script__';
    if (document.getElementById(id)) return true;
    var s=document.createElement('script');
    s.id=id;
    s.src='https://translate.google.com/translate_a/element.js?cb='+(cb||'googleTranslateElementInit');
    s.async=true; s.defer=true;
    (document.head||document.documentElement).appendChild(s);
    return false;
  }

  // ルートドメイン推定（cookie用）
  function rootDomain(){
    var h=location.hostname.split('.');
    return (h.length>=3) ? ('.'+h.slice(-2).join('.')) : location.hostname;
  }
  function setCookie(name,val,days){
    var exp=''; if(days){ var t=new Date(); t.setTime(t.getTime()+days*864e5); exp='; expires='+t.toUTCString(); }
    document.cookie = name+'='+encodeURIComponent(val)+'; path=/; domain='+rootDomain()+exp;
  }
  function delCookie(name){
    document.cookie = name+'=; path=/; domain='+rootDomain()+'; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // 言語適用：selectが無くてもcookie経由で確実適用→必要ならリロード
  function applyLang(code){
    ensureHost();
    ensureScript('googleTranslateElementInit');

    if (/^ja(\b|[-_]|$)/i.test(code)){
      delCookie('googtrans'); // 原文に戻す
    } else {
      setCookie('googtrans','/ja/'+code,7); // 翻訳指示
    }

    var setSelect = function(c){
      var sel=document.querySelector('#google_translate_element select.goog-te-combo');
      if (!sel) return false;
      sel.value=c;
      sel.dispatchEvent(new Event('change',{bubbles:true}));
      return true;
    };

    if (setSelect(code)) return;

    // 少し待っても<select>が出ない＝スクリプト遅延時は最終手段でリロード
    var tries=0, tm=setInterval(function(){
      if (setSelect(code)){ clearInterval(tm); return; }
      if (++tries>=8){ clearInterval(tm); location.reload(); } // 2秒後に再起動
    },250);
  }

  // 自前の言語リスト(.ls-item)クリックを横取りして確実に適用
  document.addEventListener('click', function(e){
    var item=e.target.closest('.ls-item'); if(!item) return;
    var code=(item.querySelector('.ls-code')?.textContent||'').trim();
    if(!code) return;
    e.preventDefault();

    if (/^ja(\b|[-_]|$)/i.test(code)){
      // 日本語に戻す：クッキー消して翻訳状態なら軽くリロード（フリック不要）
      delCookie('googtrans');
      setTimeout(function(){ location.reload(); }, 150);
    } else {
      applyLang(code);
    }
  }, true);

  // 公式<select>経由でもcookieを同期（保険）
  document.addEventListener('change', function(e){
    var sel=e.target;
    if (!sel || !sel.matches('#google_translate_element select.goog-te-combo')) return;
    var code=(sel.value||'').trim();
    if (/^ja(\b|[-_]|$)/i.test(code)) delCookie('googtrans');
    else setCookie('googtrans','/ja/'+code,7);
  }, true);

  // 初回起動
  window.addEventListener('load', function(){
    ensureHost();
    ensureScript('googleTranslateElementInit');
  }, {once:true});
})();
<script>
/* FX表の「円換算額」で ",000" が落ちて見える行だけ補う（他は一切変更しない） */
(function () {
  // 対象テーブル：ヘッダに「円換算額」があるものだけ
  const tbl = Array.from(document.querySelectorAll('table')).find(t => {
    const h = (t.tHead?.textContent || t.rows[0]?.textContent || '').replace(/\s+/g,'');
    return /円換算額/.test(h);
  });
  if (!tbl) return;

  // 「円換算額」列のインデックス
  let col = -1;
  const headRow = (tbl.tHead?.rows[0] || tbl.rows[0]);
  Array.from(headRow?.cells || []).forEach((th,i)=>{
    const txt = (th.textContent || '').replace(/\s+/g,'');
    if (txt.includes('円換算額')) col = i;
  });
  if (col < 0) return;

  // 末尾が「円」で、カンマが1回以下（= 1,547円 など）だけ 「,000円」に補正
  const ROWS = (tbl.tBodies[0]?.rows?.length ? Array.from(tbl.tBodies[0].rows)
                                              : Array.from(tbl.rows).slice(1));
  ROWS.forEach(tr => {
    const td = tr.cells[col];
    if (!td) return;
    const raw = (td.textContent || '').trim();

    // 既に「,000」が入っている/カンマ2回以上の桁数はスキップ
    const commaCount = (raw.match(/,/g)||[]).length;
    if (!/円\s*$/.test(raw) || commaCount >= 2 || /,000円\s*$/.test(raw)) return;

    // 「1,547円」や「1547円」→ 「1,547,000円」にだけ置換（￥記号は残す）
    const fixed = raw
      .replace(/(¥|￥)?\s*(\d{1,3})(?:,(\d{3}))?\s*円\s*$/u, (m, yen, a, b) => {
        const head = (yen ? yen : '') + (b ? `${a},${b}` : a);
        return `${head},000円`;
      });

    td.textContent = fixed;
  });
})();
</script>
