/* ===== script.js (一発Fix版・全置換) ===== */
(() => {
  /* ---------- tiny helpers ---------- */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* =========================================================
   * 0) Google翻訳の青バナー/吹き出しの抑止（保険）
   * ======================================================= */
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const tip = $('#goog-gt-tt'); if (tip) (tip.remove ? tip.remove() : (tip.style.display='none'));
      const ifr = $('iframe.goog-te-banner-frame');
      if (ifr){ if (ifr.remove) ifr.remove(); else ifr.style.display='none'; }
      const showing = !!ifr && ifr.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* =========================================================
   * 1) ハンバーガー開閉（クリック不能はCSSのz-indexで解決済）
   * ======================================================= */
  const menuBtn      = $('#menuBtn');
  const menuDrawer   = $('#menuDrawer');
  const menuBackdrop = $('#menuBackdrop');
  const menuClose    = $('#menuClose');

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    menuDrawer?.setAttribute('aria-hidden', String(!open));
    menuBtn?.setAttribute('aria-expanded', String(open));
  }
  const toggleMenu = (e)=>{ e?.preventDefault(); setMenu(!html.classList.contains('menu-open')); };
  const closeMenu  = ()=> setMenu(false);

  menuBtn && ['click','touchstart'].forEach(ev => menuBtn.addEventListener(ev, toggleMenu, {passive:false}));
  menuBackdrop?.addEventListener('click', closeMenu);
  menuClose?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  /* =========================================================
   * 2) 目次自動生成（トップ+各summary）
   * ======================================================= */
  (function buildMenu(){
    const groups = $('#menuGroups'); if (!groups) return;

    const SECTIONS = [
      ['corp-setup',       '法人設立'],
      ['plans',            '料金プラン'],
      ['sole-setup',       '個人事業主（IE/SBS）'],
      ['personal-account', '個人口座開設（銀行）'],
      ['disclaimer',       '免責事項・キャンセル'],
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
      let cur = el?.parentElement;
      while (cur){
        if (cur.tagName?.toLowerCase() === 'details') cur.open = true;
        cur = cur.parentElement;
      }
    }

    groups.innerHTML = '';
    SECTIONS.forEach(([secId, secLabel])=>{
      const sec = document.getElementById(secId);
      if (!sec) return;

      const group = document.createElement('div'); group.className='menu-group';
      const h4    = document.createElement('h4');  h4.textContent = secLabel;
      const ul    = document.createElement('ul');  ul.className   ='menu-list';

      // セクションのトップ
      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = secLabel;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop); ul.appendChild(liTop);

      // そのセクション内の summary
      sec.querySelectorAll(':scope .accordion summary').forEach((sum, idx)=>{
        const det = sum.closest('details'); if (!det) return;
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

  /* =========================================================
   * 3) 言語ドロワー（Google公式<select>から英語名でリスト化）
   * ======================================================= */
  const langBtn      = $('#langBtn');
  const langDrawer   = $('#langDrawer');
  const langBackdrop = $('#langBackdrop');
  const langClose    = $('#langClose');
  const langList     = $('#langList');
  const langSearch   = $('#langSearch');

  function setLang(open){
    html.classList.toggle('lang-open', open);
    langDrawer?.setAttribute('aria-hidden', String(!open));
    langBtn?.setAttribute('aria-expanded', String(open));
  }
  const openLang  = ()=> setLang(true);
  const closeLang = ()=> setLang(false);

  langBtn && ['click','touchstart'].forEach(ev => langBtn.addEventListener(ev, (e)=>{ e.preventDefault(); openLang(); }, {passive:false}));
  langBackdrop?.addEventListener('click', closeLang);
  langClose?.addEventListener('click', closeLang);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeLang(); });

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

  // Google公式ウィジェット初期化（HTML側の cb 名と一致）
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

  /* =========================================================
   * 4) a[target=_blank] に安全属性追加
   * ======================================================= */
  (function enforceRel(){
    document.querySelectorAll('a[target="_blank"]').forEach(a=>{
      const need = ['noopener','noreferrer'];
      const cur  = (a.rel||'').split(/\s+/).filter(Boolean);
      need.forEach(t => { if (!cur.includes(t)) cur.push(t); });
      a.rel = cur.join(' ');
    });
  })();

  /* =========================================================
   * 5) 「重要なお知らせ」を #disclaimer の最初の details 内へ集約
   * ======================================================= */
  (function moveImportantNote(){
    const sec = document.getElementById('disclaimer'); if (!sec) return;
    let dest = sec.querySelector('details .content');
    if (!dest){
      const details = document.createElement('details');
      const sum = document.createElement('summary'); sum.textContent = '重要なお知らせ（要点・注意喚起）';
      const content = document.createElement('div'); content.className = 'content';
      details.appendChild(sum); details.appendChild(content);
      const acc = sec.querySelector('.accordion') || sec.appendChild(document.createElement('div'));
      acc.className = 'accordion'; acc.appendChild(details);
      dest = content;
    }

    let block = document.getElementById('legal-safety-note');
    const hasNoteText = el => /重要なお知らせ/.test((el?.textContent || '').replace(/\s+/g,' '));

    if (!block) {
      block = Array.from(document.querySelectorAll('section,article,aside,div'))
        .find(el => hasNoteText(el) && (el.querySelector('ul,ol,li') || el.querySelector('p')));
    }
    if (!block) {
      const heading = Array.from(document.querySelectorAll('h1,h2,h3,strong,p,div'))
        .find(el => hasNoteText(el));
      if (heading) block = heading.closest('section,article,aside,div') || heading.parentElement;
    }
    if (block && !dest.contains(block)) dest.appendChild(block);
  })();

  /* =========================================================
   * 6) FX簡易シミュレーション表：装飾・見切れ防止・数値の体裁修正
   *    - CSSは .fx-sim-scroll / .fx-sim-table に依存（既に支給のCSSと一致）
   * ======================================================= */
  (function fxTableEnhance(){
    const DASH_CLASS = '[\\u002D\\u2212\\uFF0D\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015]'; // -, −, －, ‐, –, —
    const TRAIL_BAD  = new RegExp(`([,\\uFF0C])\\s*${DASH_CLASS}\\s*$`,'u'); // 「, -」「， −」など行末
    const YEN_HEAD   = /円換算額/;

    function findTargetTables(){
      // 優先：該当summary配下
      const s = Array.from(document.querySelectorAll('summary'))
        .find(x => /リスクと為替の考え方|簡易シミュレーション/.test((x.textContent||'')));
      if (s){
        const details = s.closest('details');
        const t = details && details.querySelectorAll('table');
        if (t && t.length) return Array.from(t);
      }
      // フォールバック：ヘッダに「円換算額」があるテーブル
      return Array.from(document.querySelectorAll('table')).filter(tbl=>{
        const headTxt = (tbl.tHead?.textContent || tbl.rows[0]?.textContent || '');
        return YEN_HEAD.test(headTxt);
      });
    }

    function wrapAndClass(table){
      if (!table.classList.contains('fx-sim-table')) table.classList.add('fx-sim-table');
      const p = table.parentElement;
      if (!p || !p.classList || !p.classList.contains('fx-sim-scroll')){
        const wrap = document.createElement('div');
        wrap.className = 'fx-sim-scroll';
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      }
    }

    function lastColIndex(tbl){
      const n = (tbl.tHead ? tbl.tHead.rows[0]?.cells.length : tbl.rows[0]?.cells.length) || 0;
      return n ? n-1 : -1;
    }

    function yenColIndex(tbl){
      const headRow = (tbl.tHead && tbl.tHead.rows[0]) || Array.from(tbl.rows).find(r=>r.querySelector('th'));
      if (headRow){
        const cells = Array.from(headRow.cells);
        const idx = cells.findIndex(th => YEN_HEAD.test((th.textContent||'').replace(/\s+/g,'')));
        if (idx >= 0) return idx;
      }
      // 保険：先頭データ行を見て「¥1,234, -」型の列を推測
      const r0 = tbl.tBodies[0]?.rows?.[0];
      if (r0){
        for (let i=0;i<r0.cells.length;i++){
          const txt = (r0.cells[i].textContent||'').trim();
          if (/^[¥￥]\s*\d{1,3}(?:,\d{3})*,?\s*$/.test(txt) || TRAIL_BAD.test(txt)) return i;
        }
      }
      return -1;
    }

    function colorizePnL(tbl){
      const li = lastColIndex(tbl); if (li < 0) return;
      Array.from(tbl.tBodies[0]?.rows || []).forEach(tr=>{
        const td = tr.cells[li]; if (!td) return;
        const t  = (td.textContent||'').trim();
        if (/^[＋+]/.test(t)) td.classList.add('fx-pos');
        else if (/▲|−|-/.test(t)) td.classList.add('fx-neg');
      });
    }

    function oneLineProfit(tbl){
      const li = lastColIndex(tbl); if (li < 0) return;
      Array.from(tbl.tBodies[0]?.rows || []).forEach(tr=>{
        const td = tr.cells[li]; if (!td) return;
        td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
        const text = (td.textContent || '').replace(/\s+/g,' ').trim();
        td.textContent = text;
        td.style.whiteSpace = 'nowrap';
      });
      tbl.classList.add('sim-noline'); // CSS側の保険で下線無効化
    }

    function normalizeYenColumn(tbl){
      const col = yenColIndex(tbl); if (col < 0) return;

      function fixCell(td){
        // <br> を空白に
        td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));

        // 末尾「, -」系をツリーウォークで安全置換（a/u/ins等があってもOK）
        const walker = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
        const texts = [];
        while (walker.nextNode()) texts.push(walker.currentNode);

        let changed = false;
        texts.forEach(n=>{
          const s = n.nodeValue;
          if (TRAIL_BAD.test(s)){
            n.nodeValue = s.replace(TRAIL_BAD, '$1000');
            changed = true;
          }
        });

        if (!changed){
          const all = (td.textContent||'').trim();
          if (TRAIL_BAD.test(all)) td.textContent = all.replace(TRAIL_BAD, '$1000');
        }
      }

      Array.from(tbl.tBodies[0]?.rows || []).forEach(tr=>{
        const td = tr.cells[col]; if (td) fixCell(td);
      });
    }

    function enhanceOnce(table){
      wrapAndClass(table);
      colorizePnL(table);
      oneLineProfit(table);
      normalizeYenColumn(table);
    }

    function run(){
      const tables = findTargetTables();
      tables.forEach(enhanceOnce);
    }

    // 初回＋遅延描画/トグル/翻訳にも追従
    run();
    let n=0; const tm = setInterval(()=>{ run(); if(++n>12) clearInterval(tm); }, 300);
    document.addEventListener('toggle', e => { if (e.target.tagName === 'DETAILS' && e.target.open) run(); }, true);
    new MutationObserver(muts=>{
      for (const m of muts){ if (m.addedNodes && m.addedNodes.length){ run(); break; } }
    }).observe(document.getElementById('disclaimer') || document.body, {childList:true,subtree:true});
  })();

})();
