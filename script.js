// ========== script.js v20251031-fixA ==========
(() => {
  'use strict';
  if (window.__GRN_BUILD__) return;
  window.__GRN_BUILD__ = 'R7-fixA';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* Google翻訳の邪魔オーバーレイ対策（クリック阻害防止） */
  (function killGTOverlays(){
    const fixTop = () => { try { if (document.body && document.body.style.top) document.body.style.top = '0px'; } catch(_){} };
    window.addEventListener('load', fixTop, {once:true});
    setInterval(fixTop, 1500);
  })();

  /* 目次ハンバーガー */
  function initMenu(){
    const btn = $('#menuBtn'), drawer = $('#menuDrawer');
    const backdrop = $('#menuBackdrop'), close = $('#menuClose');
    const set = (open)=>{ html.classList.toggle('menu-open', open); drawer?.setAttribute('aria-hidden', String(!open)); btn?.setAttribute('aria-expanded', String(open)); };
    const toggle = (e)=>{ e?.preventDefault(); set(!html.classList.contains('menu-open')); };

    btn?.addEventListener('click', toggle);
    btn?.addEventListener('touchstart', toggle, {passive:false});
    backdrop?.addEventListener('click', ()=>set(false));
    close?.addEventListener('click', ()=>set(false));
    document.addEventListener('keydown', e=>{ if (e.key === 'Escape') set(false); });

    // 被さり対策：pointer-events が none になっていたら復帰
    setInterval(()=>{ if (btn && getComputedStyle(btn).pointerEvents === 'none') btn.style.pointerEvents = 'auto'; }, 1200);
  }

  /* 言語ドロワー（Google公式セレクトを操作） */
  function ensureGTranslateLoaded(cb){
    if (window.google?.translate?.TranslateElement) return cb();
    if (window.__GT_LOADING__){
      let t=0; const tm=setInterval(()=>{ if (window.google?.translate?.TranslateElement || ++t>25){ clearInterval(tm); cb(); } }, 200);
      return;
    }
    window.__GT_LOADING__ = true;
    window.googleTranslateElementInit = function(){
      try { new google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element'); } catch(_){}
      cb();
    };
  }
  function initLang(){
    const btn=$('#langBtn'), drawer=$('#langDrawer'), backdrop=$('#langBackdrop'), close=$('#langClose');
    const list=$('#langList'), search=$('#langSearch');
    const set=(open)=>{ html.classList.toggle('lang-open', open); drawer?.setAttribute('aria-hidden', String(!open)); btn?.setAttribute('aria-expanded', String(open)); };

    function doTranslate(code){
      const sel = $('#google_translate_element select.goog-te-combo');
      if (!sel) return;
      sel.value = code; sel.dispatchEvent(new Event('change', {bubbles:true}));
      const exp = new Date(Date.now()+365*24*3600*1000).toUTCString();
      document.cookie = `googtrans=/ja/${code};expires=${exp};path=/`;
      // テキスト差し替え後にFX表の保険再適用
      setTimeout(runFxFinalFix, 250);
    }

    function buildList(){
      ensureGTranslateLoaded(()=>{
        const sel = $('#google_translate_element select.goog-te-combo'); if (!sel || !list) return;
        const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;
        const items = Array.from(sel.options).filter(o=>o.value && o.value!=='auto').map(o=>{
          const code=o.value.trim(); const name=(dn && dn.of(code.replace('_','-'))) || (o.textContent||code).trim(); return {code,name};
        }).sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
        list.innerHTML=''; items.forEach(({code,name})=>{
          const el=document.createElement('div'); el.className='ls-item'; el.setAttribute('role','option');
          el.innerHTML=`<span>${name}</span><span class="ls-code">${code}</span>`;
          el.addEventListener('click', ()=>{ doTranslate(code); set(false); });
          list.appendChild(el);
        });
        if (search){ search.value=''; search.oninput=()=>{ const q=search.value.trim().toLowerCase(); $$('.ls-item',list).forEach(el=>{ el.style.display = (!q || (el.textContent||'').toLowerCase().includes(q)) ? '' : 'none'; }); }; }
      });
    }

    const open = (e)=>{ e?.preventDefault(); set(true); buildList(); };
    btn?.addEventListener('click', open);
    btn?.addEventListener('touchstart', open, {passive:false});
    backdrop?.addEventListener('click', ()=>set(false));
    close?.addEventListener('click', ()=>set(false));
    document.addEventListener('keydown', e=>{ if (e.key==='Escape') set(false); });

    // 被さり対策
    setInterval(()=>{ if (btn && getComputedStyle(btn).pointerEvents === 'none') btn.style.pointerEvents = 'auto'; }, 1200);
  }

  /* ① 数値の“ , - ”崩れに対する最終保険（HTMLは修正済みだが翻訳干渉に備え） */
  function runFxFinalFix(){
    try{
      const tables = $$('table');
      tables.forEach(tbl=>{
        const headText = (tbl.tHead?.textContent || tbl.rows[0]?.textContent || '').replace(/\s+/g,'');
        if (!(headText.includes('円換算額') && headText.includes('損益'))) return;

        // 円換算額の列Indexを取得
        const row = (tbl.tHead?.rows[0] || tbl.rows[0]); if (!row) return;
        const idx = Array.from(row.cells||[]).findIndex(c=>/円換算額/.test((c.textContent||'').replace(/\s+/g,'')));
        if (idx < 0) return;

        // “¥1,547, -” 等を “¥1,547,000” に修正
        const RE = /^([¥￥]\s*\d{1,3}(?:[,，]\d{3})*)\s*,\s*(?:[\-\u2212\u2010-\u2015\u30FC\uFF0D])\s*$/u;
        Array.from(tbl.tBodies[0]?.rows||[]).forEach(tr=>{
          const td = tr.cells[idx]; if (!td) return;
          const raw = (td.textContent||'').replace(/\u00A0/g,' ').replace(/\s+/g,' ').trim();
          const m = raw.match(RE);
          if (m){ td.textContent = `${m[1]}000`; }
        });
      });
    }catch(_){}
  }

  function boot(){
    initMenu();
    initLang();
    runFxFinalFix();
    // details開閉後や翻訳後にも保険を再適用
    document.addEventListener('toggle', e=>{ if (e.target.tagName==='DETAILS' && e.target.open){ setTimeout(runFxFinalFix, 0); }}, true);
    const mo = new MutationObserver(()=> setTimeout(runFxFinalFix, 0));
    mo.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
