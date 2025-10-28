<!-- script.js（全置換） -->
<script>
(() => {
  'use strict';
  if (window.__PATCH_INITED__) return; // 多重実行ガード
  window.__PATCH_INITED__ = true;

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* =========================================================
   * 0) Google青バナー抑止（翻訳本体は触らない）
   * ========================================================= */
  function killGoogleBar(){
    try{
      document.body.style.top = '0px';
      const tt  = $('#goog-gt-tt'); if (tt) tt.style.display = 'none';
      const ifr = $('iframe.goog-te-banner-frame');
      if (ifr){ ifr.style.display = 'none'; }
      html.classList.toggle('gtbar', !!(ifr && ifr.offsetHeight > 0));
    }catch(_){}
  }
  new MutationObserver(()=>killGoogleBar()).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', killGoogleBar, {once:true});
  setInterval(killGoogleBar, 1500);

  /* =========================================================
   * 1) ハンバーガー（クリック不能対策含む）
   * ========================================================= */
  function initMenu(){
    try{
      const btn = $('#menuBtn');
      const drawer = $('#menuDrawer');
      const backdrop = $('#menuBackdrop');
      const close = $('#menuClose');

      function set(open){
        html.classList.toggle('menu-open', open);
        drawer?.setAttribute('aria-hidden', String(!open));
        btn?.setAttribute('aria-expanded', String(open));
      }
      function toggle(e){ e?.preventDefault(); set(!html.classList.contains('menu-open')); }

      btn && ['click','touchstart'].forEach(ev=>btn.addEventListener(ev, toggle, {passive:false}));
      backdrop && backdrop.addEventListener('click', ()=>set(false));
      close && close.addEventListener('click', ()=>set(false));
      document.addEventListener('keydown', e=>{ if(e.key==='Escape') set(false); });

      // 目次をトップレベルだけで生成（重複/（トップ）削除）
      const wrap = $('#menuGroups');
      if (wrap){
        const SECTIONS = [
          ['corp-setup','法人設立'],
          ['plans','料金プラン'],
          ['sole-setup','個人事業主（IE/SBS）'],
          ['personal-account','個人口座開設（銀行）'],
          ['disclaimer','免責事項・キャンセル'],
        ];
        const sanitize = s => (s||'').trim().replace(/\s+/g,' ').slice(0,120);
        wrap.innerHTML = '';
        SECTIONS.forEach(([secId,label])=>{
          const sec = document.getElementById(secId);
          if (!sec) return;
          const group = document.createElement('div'); group.className='menu-group';
          if (secId!=='plans'){ const h4=document.createElement('h4'); h4.textContent=label; group.appendChild(h4); }
          const ul = document.createElement('ul'); ul.className='menu-list';
          // セクショントップ
          const liTop = document.createElement('li');
          const aTop  = document.createElement('a');
          aTop.href = `#${secId}`; aTop.textContent = label;
          aTop.addEventListener('click', ()=>set(false));
          liTop.appendChild(aTop); ul.appendChild(liTop);
          // 直下のdetailsのみ
          sec.querySelectorAll(':scope .accordion > details > summary').forEach((sum,idx)=>{
            const det = sum.closest('details'); if (!det) return;
            if (!det.id){
              let id = `${secId}-d-${idx+1}`, n=2;
              while (document.getElementById(id)) id = `${secId}-d-${idx+1}-${n++}`;
              det.id = id;
            }
            const li = document.createElement('li');
            const a  = document.createElement('a');
            a.href = `#${det.id}`;
            a.textContent = sanitize(sum.textContent);
            a.addEventListener('click', ()=>{ det.open = true; set(false); });
            li.appendChild(a); ul.appendChild(li);
          });
          group.appendChild(ul); wrap.appendChild(group);
        });
        // 最後の保険：見出しと同名/（トップ）は消す
        $$('#menuGroups .menu-group').forEach(g=>{
          const title = (g.querySelector('h4')?.textContent||'').trim();
          g.querySelectorAll('.menu-list a').forEach(a=>{
            const t=(a.textContent||'').trim();
            if (/（トップ）$|\(トップ\)$/.test(t) || (title && t===title)) a.closest('li')?.remove();
          });
          g.querySelectorAll('h4').forEach(h=>{ if((h.textContent||'').trim()==='料金プラン') h.remove(); });
        });
      }
    }catch(_){}
  }

  /* =========================================================
   * 2) 言語ドロワー + Google翻訳 連携
   * ========================================================= */
  function ensureGTranslateLoaded(cb){
    if (window.google && google.translate && google.translate.TranslateElement) return cb();
    // 既にロード中なら少し待つ
    if (window.__GT_LOADING__) {
      let t=0; const tm=setInterval(()=>{ if (window.google?.translate?.TranslateElement || ++t>20){ clearInterval(tm); cb(); } }, 200);
      return;
    }
    window.__GT_LOADING__ = true;
    window.googleTranslateElementInit = function(){
      try{
        new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
      }catch(_){}
      cb();
    };
    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true; document.head.appendChild(s);
  }

  function initLang(){
    try{
      const btn = $('#langBtn');
      const drawer = $('#langDrawer');
      const backdrop = $('#langBackdrop');
      const close = $('#langClose');
      const list = $('#langList');
      const search = $('#langSearch');

      function set(open){
        html.classList.toggle('lang-open', open);
        drawer?.setAttribute('aria-hidden', String(!open));
        btn?.setAttribute('aria-expanded', String(open));
      }
      btn && ['click','touchstart'].forEach(ev=>btn.addEventListener(ev, e=>{ e.preventDefault(); set(true); buildLangList(); }, {passive:false}));
      backdrop && backdrop.addEventListener('click', ()=>set(false));
      close && close.addEventListener('click', ()=>set(false));
      document.addEventListener('keydown', e=>{ if(e.key==='Escape') set(false); });

      const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

      function currentCookie(){
        try{
          return decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1]||'');
        }catch(_){ return ''; }
      }

      function doTranslate(code){
        const sel = $('#google_translate_element select.goog-te-combo');
        if (!sel) return;
        sel.value = code;                       // 公式selectに値をセット
        sel.dispatchEvent(new Event('change', {bubbles:true}));
        // cookie直接書きも併用（戻す時の反映が速い）
        const exp = new Date(Date.now()+365*24*3600*1000).toUTCString();
        document.cookie = `googtrans=/auto/${code};expires=${exp};path=/`;
        document.cookie = `googtrans=/ja/${code};expires=${exp};path=/`;
        // “日本語に戻す” など即時反映が鈍い端末向けに軽く再発火
        setTimeout(()=> sel.dispatchEvent(new Event('change', {bubbles:true})), 150);
        // 翻訳でDOMが差し替わる→表の補正を再実行
        setTimeout(runFxFix, 250);
      }

      function buildLangList(){
        ensureGTranslateLoaded(()=>{
          const sel = $('#google_translate_element select.goog-te-combo');
          if (!sel || !list) return;

          const cur = currentCookie();
          const items = Array.from(sel.options)
            .filter(o=>o.value && o.value!=='auto')
            .map(o=>{
              const code = o.value.trim();
              const name = (dn && dn.of(code.replace('_','-'))) || (o.textContent||code).trim();
              return {code, name};
            })
            .sort((a,b)=> a.name.localeCompare(b.name,'en',{sensitivity:'base'}));

          list.innerHTML='';
          items.forEach(({code,name})=>{
            const el = document.createElement('div');
            el.className = 'ls-item' + (cur.endsWith('/'+code) ? ' ls-active' : '');
            el.setAttribute('role','option');
            el.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
            el.addEventListener('click', ()=>{ doTranslate(code); set(false); });
            list.appendChild(el);
          });

          if (search){
            search.value = '';
            search.oninput = ()=>{
              const q = search.value.trim().toLowerCase();
              $$('.ls-item', list).forEach(el=>{
                const t=(el.textContent||'').toLowerCase();
                el.style.display = (!q || t.includes(q)) ? '' : 'none';
              });
            };
          }
        });
      }
    }catch(_){}
  }

  /* =========================================================
   * 3) 重要なお知らせを #disclaimer の最下に1つのアコーディオンへ
   * ========================================================= */
  function ensureImportantNotice(){
    try{
      const sec = $('#disclaimer'); if (!sec) return;
      let acc = sec.querySelector('.accordion'); if (!acc){ acc=document.createElement('div'); acc.className='accordion'; sec.appendChild(acc); }
      let box = sec.querySelector('details[data-legal-note]');
      if (!box){
        box = document.createElement('details'); box.setAttribute('data-legal-note','');
        const sum = document.createElement('summary'); sum.textContent = '重要なお知らせ（要点・注意喚起）';
        const content = document.createElement('div'); content.className='content';
        box.appendChild(sum); box.appendChild(content); acc.appendChild(box);
      }
      const dest = box.querySelector('.content');
      const candidates = new Set();
      // 明示ID/クラス
      $$('#legal-safety-note, .legal-safety-note, .legal-important-note').forEach(n=>candidates.add(n));
      // テキスト検出
      $$('h1,h2,h3,h4,strong,b,p,div').forEach(el=>{
        if (/重要なお知らせ/.test(el.textContent||'')){
          const wrap = el.closest('section,article,div') || el.parentElement;
          wrap && candidates.add(wrap);
        }
      });
      [...candidates].forEach(n=>{ if (n && !dest.contains(n)) dest.appendChild(n); });
    }catch(_){}
  }

  /* =========================================================
   * 4) FX表：「¥1,547, -」→「¥1,547,000」補正（この表だけ）
   * ========================================================= */
  function runFxFix(){
    try{
      // 対象テーブル判定：見出しに「円換算額」かつ「損益」
      function isFxTable(tbl){
        const head = (tbl.tHead?.textContent || tbl.rows[0]?.textContent || '').replace(/\s+/g,'');
        return head.includes('円換算額') && head.includes('損益');
      }
      const YEN  = '[¥￥]';
      const COM  = '[,，]';
      const DASH = '[\\-\\u2212\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u30FC\\uFF0D]';
      const RE_END = new RegExp('^('+YEN+'\\s*\\d{1,3}(?:'+COM+'\\d{3})*),\\s*(?:'+DASH+')\\s*$', 'u');

      function yenColIndex(tbl){
        const row = (tbl.tHead?.rows[0] || tbl.rows[0]); if (!row) return -1;
        const cells = Array.from(row.cells||[]);
        return cells.findIndex(c => /円換算額/.test((c.textContent||'').replace(/\s+/g,'')));
      }
      function fixCell(td){
        if (!td) return;
        td.querySelectorAll && td.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode(' ')));
        const before = (td.textContent||'').trim();
        if (!RE_END.test(before)) return;
        const after = before.replace(RE_END, (_,a)=> a+'000');
        if (after!==before) td.textContent = after;
      }

      $$('table').forEach(tbl=>{
        if (!isFxTable(tbl)) return;
        // 横スクロールラップ & 装飾クラス（既にあればスキップ）
        if (!tbl.parentElement.classList.contains('fx-sim-scroll')){
          const wrap=document.createElement('div'); wrap.className='fx-sim-scroll';
          tbl.parentNode.insertBefore(wrap, tbl); wrap.appendChild(tbl);
          tbl.classList.add('fx-sim-table','sim-noline');
        }else{
          tbl.classList.add('fx-sim-table','sim-noline');
        }
        // 末尾改行の整理
        const ycol = yenColIndex(tbl);
        if (ycol>=0){
          const rows = (tbl.tBodies[0]?.rows && Array.from(tbl.tBodies[0].rows)) || [];
          rows.forEach(tr=>{
            const td = tr.cells[ycol];
            if (!td) return;
            fixCell(td);
          });
        }
        // 損益列の +/▲ に色
        const last = (tbl.tHead ? tbl.tHead.rows[0].cells.length : (tbl.rows[0]?.cells.length||1)) - 1;
        if (last>=0){
          Array.from(tbl.tBodies[0]?.rows||[]).forEach(tr=>{
            const td = tr.cells[last]; if (!td) return;
            const t = (td.textContent||'').trim();
            if (/^[＋+]/.test(t)) td.classList.add('fx-pos');
            else if (/▲|−|-/.test(t)) td.classList.add('fx-neg');
          });
        }
      });
    }catch(_){}
  }

  /* =========================================================
   * 5) target="_blank" 安全属性 & その他軽い保守
   * ========================================================= */
  function hardenExternalLinks(){
    try{
      $$('a[target="_blank"]').forEach(a=>{
        const need = ['noopener','noreferrer'];
        const cur = (a.rel||'').split(/\s+/).filter(Boolean);
        need.forEach(t=>{ if(!cur.includes(t)) cur.push(t); });
        a.rel = cur.join(' ');
      });
    }catch(_){}
  }

  /* =========================================================
   * 起動シーケンス
   * ========================================================= */
  function boot(){
    initMenu();
    initLang();
    ensureImportantNotice();
    runFxFix();
    hardenExternalLinks();

    // details開閉 & 翻訳等のDOM差し替えに追従
    document.addEventListener('toggle', e=>{
      if (e.target.tagName==='DETAILS' && e.target.open){
        setTimeout(()=>{ runFxFix(); ensureImportantNotice(); }, 0);
      }
    }, true);

    // 遅延描画/翻訳での差し替えを監視
    const obs = new MutationObserver((muts)=>{
      // 変化が大きい時だけ再実行（パフォーマンス節約）
      let heavy=false;
      for (const m of muts){ if (m.addedNodes && m.addedNodes.length){ heavy=true; break; } }
      if (heavy){ setTimeout(()=>{ runFxFix(); ensureImportantNotice(); }, 0); }
    });
    obs.observe(document.body, {childList:true,subtree:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
</script>
