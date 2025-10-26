<!-- ===== script.js（完全貼り替え・一発Fix版）===== -->
<script>
(function () {
  "use strict";

  /* ============================== 共通ユーティリティ ============================== */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ============================== 0) 右上アイコンの“被り”絶滅 ============================== */
  (function ensureTopIconsFront() {
    const menuBtn = $('#menuBtn');
    const langBtn = $('#langBtn');
    [menuBtn, langBtn].forEach(el => {
      if (!el) return;
      el.style.position = 'fixed';
      el.style.top = 'calc(10px + env(safe-area-inset-top, 0px))';
      el.style.zIndex = '2147483647';
      el.style.pointerEvents = 'auto';
    });
  })();

  /* ============================== 1) Google青バナー/吹き出しの抑止 ============================== */
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
      const showing = !!(document.querySelector('iframe.goog-te-banner-frame'));
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* ============================== 2) ハンバーガー開閉 ============================== */
  (function hamburger(){
    const menuBtn      = $('#menuBtn');
    const menuDrawer   = $('#menuDrawer');
    const menuBackdrop = $('#menuBackdrop');
    const menuClose    = $('#menuClose');

    function setMenu(open){
      html.classList.toggle('menu-open', open);
      if (menuDrawer) menuDrawer.setAttribute('aria-hidden', String(!open));
      if (menuBtn)    menuBtn.setAttribute('aria-expanded', String(open));
    }
    const toggleMenu = (e)=>{ if(e){e.preventDefault(); e.stopPropagation();} setMenu(!html.classList.contains('menu-open')); };
    const closeMenu  = ()=> setMenu(false);

    menuBtn && ['click','touchstart'].forEach(ev=>menuBtn.addEventListener(ev, toggleMenu, {passive:false}));
    menuBackdrop && menuBackdrop.addEventListener('click', closeMenu, {passive:true});
    menuClose && menuClose.addEventListener('click', closeMenu, {passive:true});
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); }, {passive:true});
  })();

  /* ============================== 3) 目次（ハンバーガー内） ============================== */
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
    function closeMenu(){ html.classList.remove('menu-open'); $('#menuDrawer')?.setAttribute('aria-hidden','true'); $('#menuBtn')?.setAttribute('aria-expanded','false'); }

    groups.innerHTML = '';
    sections.forEach(([secId, secLabel])=>{
      const sec = document.getElementById(secId);
      if (!sec) return;

      const group = document.createElement('div'); group.className='menu-group';
      if (secId !== 'plans'){ const h4 = document.createElement('h4'); h4.textContent = secLabel; group.appendChild(h4); }

      const ul = document.createElement('ul'); ul.className='menu-list';

      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = secLabel;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop); ul.appendChild(liTop);

      sec.querySelectorAll(':scope .accordion > details > summary').forEach((sum, idx)=>{
        const det = sum.closest('details'); if (!det) return;
        const label = sanitize(sum.textContent);
        const id = ensureId(det, secId, label, idx);

        const li = document.createElement('li');
        const a  = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = label;
        a.addEventListener('click', ()=>{ const t = document.getElementById(id); if (t){ openAncestors(t); } closeMenu(); });
        li.appendChild(a); ul.appendChild(li);
      });

      group.appendChild(ul); groups.appendChild(group);
    });

    // 念のため：末尾が（トップ）の項目や重複は排除
    $$('#menuGroups .menu-list a').forEach(a=>{
      const t = (a.textContent||'').trim().replace(/\s+/g,' ');
      if (/（トップ）$|\(トップ\)$/.test(t)) a.closest('li')?.remove();
    });
  })();

  /* ============================== 4) 言語ドロワー & Google翻訳 ============================== */
  (function langDrawer(){
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
    const openLang  = (e)=>{ if(e){e.preventDefault();} setLang(true); };
    const closeLang = ()=> setLang(false);

    langBtn && ['click','touchstart'].forEach(ev=>langBtn.addEventListener(ev, openLang, {passive:false}));
    langBackdrop && langBackdrop.addEventListener('click', closeLang, {passive:true});
    langClose && langClose.addEventListener('click', closeLang, {passive:true});
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeLang(); }, {passive:true});

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

  /* ============================== 5) a[target=_blank] 安全属性 ============================== */
  (function secureBlank(){
    document.querySelectorAll('a[target="_blank"]').forEach(a=>{
      const need = ['noopener','noreferrer'];
      const cur  = (a.rel||'').split(/\s+/).filter(Boolean);
      need.forEach(t => { if (!cur.includes(t)) cur.push(t); });
      a.rel = cur.join(' ');
    });
  })();

  /* ============================== 6) 「重要なお知らせ」を免責内へ集約 ============================== */
  (function collectLegalNote(){
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
      const sum = document.createElement('summary'); sum.textContent = '重要なお知らせ（要点・注意喚起）';
      const content = document.createElement('div'); content.className = 'content';
      details.appendChild(sum); details.appendChild(content); acc.appendChild(details);
    }
    const content = details.querySelector('.content');
    [...sources].forEach(node => { if (!content.contains(node)) content.appendChild(node); });
  })();

  /* ============================== 7) FX簡易シミュレーション表：検出・装飾・改行/下線対策 ============================== */
  (function fxTable(){
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
        return /円換算額/.test(headTxt) && /損益/.test(headTxt);
      });
    }

    function decorate(table) {
      if (!table) return;

      // 横スクロール用ラッパ
      if (!table.classList.contains('fx-sim-table')) {
        const wrap = document.createElement('div');
        wrap.className = 'fx-sim-scroll';
        table.parentElement.insertBefore(wrap, table);
        wrap.appendChild(table);
        table.classList.add('fx-sim-table');
      }

      // 最終列（損益）に色クラス付与
      const lastColIndex = (table.tHead ? table.tHead.rows[0].cells.length
                                        : table.rows[0]?.cells.length) - 1;
      if (lastColIndex >= 0) {
        Array.from(table.tBodies[0]?.rows || []).forEach(tr => {
          const td = tr.cells[lastColIndex];
          if (!td) return;
          // 改行→スペース（1行化）
          td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
          const t = (td.textContent || '').trim();
          if (/^[＋+]/.test(t)) td.classList.add('fx-pos');
          else if (/▲|−|-/.test(t)) td.classList.add('fx-neg');

          // 下線除去（iOS誤検出含む）
          td.style.textDecoration = 'none';
          td.style.webkitTextDecorationSkip = 'none';
          td.style.whiteSpace = 'nowrap';
          td.querySelectorAll('*').forEach(n=>{
            if (n.nodeType === 1){
              n.style.textDecoration = 'none';
              n.style.backgroundImage = 'none';
              n.style.boxShadow = 'none';
            }
          });
          td.querySelectorAll('a[x-apple-data-detectors]').forEach(a=>{
            a.style.textDecoration='none'; a.style.color='inherit'; a.style.borderBottom='0';
          });
        });
      }
    }

    function run() {
      const tbl = findFxTable();
      if (tbl) decorate(tbl);
    }

    run();
    let n = 0;
    const tm = setInterval(() => { run(); if (++n > 10) clearInterval(tm); }, 300);
    document.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS') run(); }, true);
    new MutationObserver(run).observe(document.getElementById('disclaimer') || document.body, { childList:true, subtree:true });
  })();

  /* ============================== 8) 円換算額「, -」→「,000」へ正規化（見出し検出＋テキストノード走査） ============================== */
  (function normalizeYenTail(){
    const YEN  = '[¥￥]';
    const DASH = '[-−―ー–—]';
    const RE_NODE = new RegExp(`(${YEN}\\s*[0-9]{1,3}(?:,[0-9]{3})*),\\s*(?:${DASH})?\\s*$`);
    const RE_FULL = new RegExp(`^(${YEN}\\s*[0-9]{1,3}(?:,[0-9]{3})*),\\s*(?:${DASH})?\\s*$`);

    function isFx(tbl){
      const head = (tbl.tHead?.textContent || tbl.rows[0]?.textContent || '').replace(/\s+/g,'');
      return head.includes('円換算額') && (head.includes('損益') || head.includes('満期残高'));
    }
    function yenColIndex(tbl){
      const row = (tbl.tHead?.rows[0] || tbl.rows[0]);
      if(!row) return -1;
      const cells = Array.from(row.cells||[]);
      return cells.findIndex(c => /円換算額/.test((c.textContent||'').replace(/\s+/g,'')));
    }
    function fixCell(td){
      if (!td) return;
      td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));

      const walker = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      let replaced = false;
      nodes.forEach(n=>{
        const s = n.nodeValue;
        if (RE_NODE.test(s)) { n.nodeValue = s.replace(RE_NODE, (_,a)=> a+'000'); replaced = true; }
      });
      if (!replaced){
        const full = (td.textContent||'').trim();
        const m = full.match(RE_FULL);
        if (m) td.textContent = m[1] + '000';
      }
    }
    function run(){
      document.querySelectorAll('table').forEach(tbl=>{
        if(!isFx(tbl)) return;
        const col = yenColIndex(tbl); if (col < 0) return;
        const bodyRows = tbl.tBodies[0]?.rows || [];
        const rows = bodyRows.length ? Array.from(bodyRows) : Array.from(tbl.rows).slice(1);
        rows.forEach(tr => fixCell(tr.cells[col]));
      });
    }
    run();
    let n=0; const tm=setInterval(()=>{ run(); if(++n>12) clearInterval(tm); }, 300);
    document.addEventListener('toggle', e=>{ if(e.target.tagName==='DETAILS') run(); }, true);
    new MutationObserver(m=>{ for(const r of m){ if(r.addedNodes.length){ run(); break; } }}).observe(document.body,{childList:true,subtree:true});
  })();

  /* ============================== 9) フォントを“その場採取”でUIへ適用（推測ゼロ） ============================== */
  (function restoreFonts() {
    function doApply() {
      const probe = document.body || document.documentElement;
      const cs = window.getComputedStyle(probe);
      const ff = cs.fontFamily;
      const fs = cs.fontSize;
      const lh = cs.lineHeight;
      const fw = cs.fontWeight;

      const css = `
        :root{
          --site-font:${ff};
          --site-font-size:${fs};
          --site-line-height:${lh};
          --site-font-weight:${fw};
        }
        .menu-button, .lang-button,
        .menu-panel, .menu-panel *,
        .menu-list,  .menu-list *,
        .lang-panel, .lang-panel *,
        details > summary{
          font-family: var(--site-font) !important;
          font-size: inherit;
          line-height: inherit;
          font-weight: inherit;
        }
      `.trim();

      let tag = document.getElementById('font-restore-style');
      if (!tag) { tag = document.createElement('style'); tag.id = 'font-restore-style'; document.head.appendChild(tag); }
      tag.textContent = css;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', doApply);
    } else {
      doApply();
    }
  })();

})();
</script>
