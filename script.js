/* ===== script.js (10/12基準・完全置換) ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google青バナー/吹き出しの抑止（二重対策） ---------- */
  // FIX: バナーiframeを remove() しない。DOMに残したまま不可視化だけに変更。
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const tip = document.getElementById('goog-gt-tt');
      if (tip){ tip.style.display='none'; tip.style.visibility='hidden'; }

      const ifr = document.querySelector('iframe.goog-te-banner-frame');
      if (ifr){
        // 消さない。見えなくするだけ
        ifr.style.opacity = '0';
        ifr.style.pointerEvents = 'none';
        ifr.style.height = '0px';
        ifr.style.maxHeight = '0px';
        ifr.style.border = '0';
      }
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ---------- 1) ハンバーガー開閉 ---------- */
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

  /* ---------- 2) 目次自動生成 ---------- */
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
      aTop.addEventListener('click', closeMenu);
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

  /* ---------- 3) 言語ドロワー ---------- */
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

  // FIX: 確実に翻訳を適用する関数（cookie更新 + combo change + リロード保険）
  function applyLanguage(code){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');

    // cookie を両方（ドメイン/パス）に設定
    function setCookie(val){
      document.cookie = `googtrans=${encodeURIComponent(val)}; path=/`;
      document.cookie = `googtrans=${encodeURIComponent(val)}; domain=.${location.hostname}; path=/`;
    }
    function clearCookie(){
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=.${location.hostname}; path=/`;
    }

    // 日本語へ戻す時は cookie を消す or /auto/ja に
    if (/^ja(-JP)?$/i.test(code)){
      clearCookie();
      if (sel){ sel.value = 'ja'; sel.dispatchEvent(new Event('change', {bubbles:true})); }
      // Safari 保険：短い遅延でリロード
      setTimeout(()=>location.reload(), 200);
      return;
    }

    // 翻訳適用
    setCookie(`/auto/${code}`);
    if (sel){
      sel.value = code;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    }
    // Safari/iOS 保険：適用されない時のみリロード
    setTimeout(()=>{
      const translated = document.documentElement.classList.contains('translated-ltr') ||
                         document.querySelector('.goog-te-combo')?.value === code;
      if (!translated) location.reload();
    }, 500);
  }

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
        applyLanguage(code); // FIX: ここで確実適用
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

  // 公式ウィジェットの初期化（HTML側の cb と一致）
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
    document.getElementById('menuDrawer')?.setAttribute('aria-hidden','true');
    document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
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
/* === hamburger cleanup === */
(function () {
  const groups = document.querySelectorAll('#menuGroups .menu-group');
  groups.forEach(g => {
    const title = (g.querySelector('h4')?.textContent || '').trim().replace(/\s+/g, ' ');
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
/* target=_blank の安全属性 */
(function(){
  document.querySelectorAll('a[target="_blank"]').forEach(a=>{
    const need = ['noopener','noreferrer'];
    const cur  = (a.rel||'').split(/\s+/).filter(Boolean);
    need.forEach(t => { if (!cur.includes(t)) cur.push(t); });
    a.rel = cur.join(' ');
  });
})();

/* 重要なお知らせを #disclaimer へ移動・集約 */
(function(){
  var note = document.getElementById('legal-safety-note');
  var dest = document.querySelector('#disclaimer details:first-of-type .content');
  if (note && dest && !dest.contains(note)) dest.appendChild(note);
})();
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
        .find(el => /重要なお知らせ/.test((el.previousElementSibling || {textContent:''}).textContent || '') || /重要なお知らせ/.test(el.textContent||''));
      if (list) {
        const wrap = document.createElement('div');
        wrap.id = 'legal-safety-note';
        wrap.className = list.className || 'security-note';
        const prev = list.previousElementSibling;
        if (prev && /重要なお知らせ/.test(prev.textContent||'')) wrap.appendChild(prev);
        list.parentNode.insertBefore(wrap, list);
        wrap.appendChild(list);
        block = wrap;
      }
    }
  }
  if (block && !dest.contains(block)) dest.appendChild(block);
})();
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

/* ==== 以下：FX表 装飾＆整形（元のまま） ==== */
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
  document.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS') run(); }, true);
})();
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
(function () {
  const t = document.querySelector('table.fx-sim-table');
  if (!t) return;
  if (t.parentElement && t.parentElement.classList.contains('fx-sim-scroll')) return;
  const wrap = document.createElement('div');
  wrap.className = 'fx-sim-scroll';
  t.parentNode.insertBefore(wrap, t);
  wrap.appendChild(t);
})();
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
      if (PAT.test(txt)) td.textContent = txt.replace(PAT, ',000');
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
<script>
/* ==== FX表の「¥1,547, -」→「¥1,547,000」だけを直す最小パッチ（翻訳・メニュー無関係） ==== */
(function(){
  'use strict';
  // ¥/￥、半角/全角カンマ、あらゆるダッシュ（‐-–—―ー−FF0D）に対応
  const YEN  = '[¥￥]';
  const COM  = '[,，]';
  const DASH = '[\\-\\u2212\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u30FC\\uFF0D]';
  const RE_END = new RegExp('(' + YEN + '\\s*\\d{1,3}(?:' + COM + '\\d{3})*),\\s*(?:' + DASH + ')\\s*$', 'u');

  function fixCell(td){
    if (!td) return;
    // <br> をスペースに統一（見た目そのまま）
    td.querySelectorAll && td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
    const before = (td.textContent || '').replace(/\s+/g,' ').trim();
    if (!RE_END.test(before)) return;                 // 対象以外は触らない
    const after = before.replace(RE_END, (_,a)=> a + '000');
    if (after !== before) td.textContent = after;     // マークアップ壊さない範囲でテキストだけ更新
  }

  function run(root){
    (root || document).querySelectorAll('table td, table th').forEach(fixCell);
  }

  // 初回 & 遅延描画・アコーディオン開閉に追従（翻訳コードには一切フックしない）
  run();
  let tries = 0;
  const tm = setInterval(() => { run(); if (++tries > 12) clearInterval(tm); }, 300);
  document.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS' && e.target.open) setTimeout(run, 0); }, true);
})();
</script>
