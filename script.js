/* ===== script.js (drop-in) ===== */
(() => {
  'use strict';
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google青バナー抑止（表示は消すが翻訳は生かす） ---------- */
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const tip = $('#goog-gt-tt'); if (tip) tip.style.display = 'none';
      const ifr = $('iframe.goog-te-banner-frame');
      if (ifr) ifr.style.display = 'none';
      html.classList.toggle('gtbar', !!(ifr && ifr.offsetHeight>0));
    }catch(_){}
  }
  new MutationObserver(killGoogleBar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1200);

  /* ---------- 1) ハンバーガー ---------- */
  const menuBtn      = $('#menuBtn');
  const menuDrawer   = $('#menuDrawer');
  const menuBackdrop = $('#menuBackdrop');
  const menuClose    = $('#menuClose');

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    menuDrawer?.setAttribute('aria-hidden', String(!open));
    menuBtn?.setAttribute('aria-expanded', String(open));
  }
  const toggleMenu = (e)=>{ e?.preventDefault?.(); setMenu(!html.classList.contains('menu-open')); };
  const closeMenu  = ()=> setMenu(false);

  menuBtn && ['click','touchend'].forEach(ev=>menuBtn.addEventListener(ev, toggleMenu, {passive:false}));
  menuBackdrop?.addEventListener('click', closeMenu);
  menuClose?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e=>{ if (e.key==='Escape') closeMenu(); });

  /* ---------- 2) 目次の自動生成（トップ項目・重複・「料金プラン」見出し除外） ---------- */
  (function buildMenu(){
    const wrap = $('#menuGroups'); if (!wrap) return;
    const SECTIONS = [
      ['corp-setup','法人設立'],
      ['plans','料金プラン'],
      ['sole-setup','個人事業主（IE/SBS）'],
      ['personal-account','個人口座開設（銀行）'],
      ['disclaimer','免責事項・キャンセル'],
    ];

    const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);
    wrap.innerHTML = '';

    SECTIONS.forEach(([secId, label])=>{
      const sec = document.getElementById(secId); if (!sec) return;

      const group = document.createElement('div'); group.className='menu-group';
      if (secId!=='plans'){ const h4=document.createElement('h4'); h4.textContent=label; group.appendChild(h4); }

      const ul = document.createElement('ul'); ul.className='menu-list';

      // セクショントップ（ラベルをそのまま、（トップ）は付けない）
      const liTop=document.createElement('li'); const aTop=document.createElement('a');
      aTop.href = `#${secId}`; aTop.textContent = label; aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop); ul.appendChild(liTop);

      // 直下の details の summary を列挙（ネスト除外）
      sec.querySelectorAll(':scope .accordion > details > summary').forEach((sum,idx)=>{
        const det = sum.closest('details'); if (!det) return;
        if (!det.id){ let id=`${secId}-d-${idx+1}`,n=2; while(document.getElementById(id)) id=`${secId}-d-${idx+1}-${n++}`; det.id=id; }
        const li=document.createElement('li'); const a=document.createElement('a');
        a.href=`#${det.id}`; a.textContent = sanitize(sum.textContent);
        a.addEventListener('click', ()=>{ det.open = true; closeMenu(); });
        li.appendChild(a); ul.appendChild(li);
      });

      group.appendChild(ul); wrap.appendChild(group);
    });
  })();

  /* ---------- 3) Google翻訳：正式スクリプトの読み込み保証 ---------- */
  window.googleTranslateElementInit = function(){
    try{ new google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false}, 'google_translate_element'); }
    catch(_){}
  };
  // もし未読込ならここで読み込む
  if (!(window.google && google.translate && google.translate.TranslateElement)) {
    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(s);
  }

  /* ---------- 4) 言語ドロワー（英語名リスト） ---------- */
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

  langBtn && ['click','touchend'].forEach(ev=>langBtn.addEventListener(ev, e=>{ e.preventDefault(); openLang(); }, {passive:false}));
  langBackdrop?.addEventListener('click', closeLang);
  langClose?.addEventListener('click', closeLang);
  document.addEventListener('keydown', e=>{ if (e.key==='Escape') closeLang(); });

  // 選択適用：select があれば change、無ければ cookie + reload
  function applyLanguage(code){
    const sel = $('#google_translate_element select.goog-te-combo');
    // “元の日本語に戻す”は select の空値が正解
    const val = (code==='ja') ? '' : code;
    if (sel){
      sel.value = val;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
      setTimeout(killGoogleBar, 50);
      return;
    }
    // フォールバック（cookie を設定して再読み込み）
    const host = location.hostname.replace(/^www\./,'');
    const cookieVal = (code==='ja') ? '/auto/ja' : '/ja/'+code;
    const set = (d='')=> document.cookie = 'googtrans='+encodeURIComponent(cookieVal)+';path=/'+d;
    set(); set(`;domain=${host}`); set(`;domain=.${host}`);
    location.reload();
  }

  // リスト構築
  (function buildLangList(){
    if (!langList) return;
    const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

    function fromSelect(){
      const sel = $('#google_translate_element select.goog-te-combo'); if (!sel) return false;
      const items = Array.from(sel.options)
        .filter(o=>o.value && o.value!=='auto')
        .map(o=>({code:o.value.trim(), name:(dn && dn.of(o.value.replace('_','-'))) || (o.textContent||o.value).trim()}))
        .sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
      render(items); return true;
    }
    function fallback(){
      const list = ['en','zh-CN','zh-TW','ko','fr','de','es','it','pt','ru','th','vi','id','tr','uk','pl','nl','sv','fi','da','no','ar','hi','ms','ka','el'];
      render(list.map(code=>({code, name:(dn && dn.of(code)) || code})));
    }
    function render(items){
      langList.innerHTML='';
      const curCookie = decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1] || '');
      items.forEach(({code,name})=>{
        const div = document.createElement('div');
        div.className = 'ls-item' + (curCookie.endsWith('/'+code) ? ' ls-active':'');
        div.setAttribute('role','option');
        // code が ja の場合は「Japanese (Original)」の扱いにする
        const display = (code==='ja') ? 'Japanese (Original)' : name;
        div.innerHTML = `<span>${display}</span><span class="ls-code">${code}</span>`;
        div.addEventListener('click', ()=>{ applyLanguage(code); closeLang(); });
        langList.appendChild(div);
      });

      if (langSearch){
        langSearch.value='';
        langSearch.oninput = ()=>{
          const q = langSearch.value.trim().toLowerCase();
          $$('.ls-item', langList).forEach(el=>{
            const txt = (el.textContent||'').toLowerCase();
            el.style.display = (!q || txt.includes(q)) ? '' : 'none';
          });
        };
      }
    }

    // モーダルオープンのたびに最新化
    langBtn && langBtn.addEventListener('click', ()=> setTimeout(()=>{ if (!fromSelect()) fallback(); }, 80));
    // 初期化遅延にも対応
    setTimeout(()=>{ if (!fromSelect()) fallback(); }, 1200);
  })();

  /* ---------- 5) target=_blank の安全属性 ---------- */
  (function(){ $$('a[target="_blank"]').forEach(a=>{
    const need = ['noopener','noreferrer'];
    const cur  = (a.rel||'').split(/\s+/).filter(Boolean);
    need.forEach(t=>{ if(!cur.includes(t)) cur.push(t); });
    a.rel = cur.join(' ');
  }); })();

  /* ---------- 6) 「重要なお知らせ」を #disclaimer 内アコーディオンへ集約 ---------- */
  (function(){
    const sec = $('#disclaimer'); if (!sec) return;
    let acc = sec.querySelector('.accordion'); if (!acc){ acc=document.createElement('div'); acc.className='accordion'; sec.appendChild(acc); }
    let box = sec.querySelector('details[data-legal-note]');
    if (!box){
      box = document.createElement('details'); box.setAttribute('data-legal-note','');
      const sum = document.createElement('summary'); sum.textContent='重要なお知らせ（要点・注意喚起）';
      const content = document.createElement('div'); content.className='content';
      box.appendChild(sum); box.appendChild(content); acc.appendChild(box);
    }
    const content = box.querySelector('.content');
    const candidates = new Set();
    $('#legal-safety-note') && candidates.add($('#legal-safety-note'));
    $$('.legal-safety-note, .legal-important-note').forEach(n=>candidates.add(n));
    // 外側にある「重要なお知らせ」らしき塊も拾う
    document.querySelectorAll('h1,h2,h3,strong,b,p').forEach(h=>{
      if (/重要なお知らせ/.test(h.textContent||'')){
        const wrap = h.closest('section,article,div') || h.parentElement;
        if (wrap) candidates.add(wrap);
      }
    });
    [...candidates].forEach(n=>{ if (n && !content.contains(n)) content.appendChild(n); });
  })();

  /* ---------- 7) FX表：装飾＆「, -」→「,000」正規化＆損益色 ---------- */
  (function(){
    function targetTable(){
      return Array.from(document.querySelectorAll('table')).find(t=>{
        const head = (t.tHead?.textContent || t.rows[0]?.textContent || '').replace(/\s+/g,'');
        return head.includes('円換算額') && (head.includes('損益') || head.includes('満期残高'));
      });
    }
    function decorate(tbl){
      if (!tbl) return;
      // 横スクロールラップ
      if (!tbl.parentElement.classList.contains('fx-sim-scroll')){
        const wrap = document.createElement('div'); wrap.className='fx-sim-scroll';
        tbl.parentElement.insertBefore(wrap, tbl); wrap.appendChild(tbl);
      }
      tbl.classList.add('fx-sim-table');

      // 円換算額列の「, -」等を「,000」に
      const heads = (tbl.tHead?.rows[0]?.cells) || (tbl.rows[0]?.cells) || [];
      let yenCol = -1;
      Array.from(heads).forEach((th,i)=>{ if (/円換算額/.test((th.textContent||''))) yenCol=i; });
      if (yenCol<0) yenCol = 2; // 保険

      const DASH = /([,\uFF0C])\s*[‐\-‒–—−－]\s*$/u;
      const rows = (tbl.tBodies[0]?.rows?.length ? Array.from(tbl.tBodies[0].rows) : Array.from(tbl.rows).slice(1));
      rows.forEach(tr=>{
        const td = tr.cells[yenCol]; if (!td) return;
        td.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode(' ')));
        const txt = (td.textContent||'').trim();
        if (DASH.test(txt)) td.textContent = txt.replace(DASH, '$1000');
      });

      // 最終列（損益）に色
      const last = (tbl.tHead ? tbl.tHead.rows[0].cells.length : (tbl.rows[0]?.cells.length || 1)) - 1;
      rows.forEach(tr=>{
        const td = tr.cells[last]; if (!td) return;
        const t = (td.textContent||'').trim();
        if (/^[＋+]/.test(t)) td.classList.add('fx-pos');
        else if (/▲|−|-/.test(t)) td.classList.add('fx-neg');
        td.style.whiteSpace='nowrap';
      });
    }
    function run(){ const t = targetTable(); if (t) decorate(t); }
    run();
    let n=0; const tm=setInterval(()=>{ run(); if(++n>10) clearInterval(tm); }, 300);
    document.addEventListener('toggle', e=>{ if (e.target.tagName==='DETAILS') run(); }, true);
  })();

})();
