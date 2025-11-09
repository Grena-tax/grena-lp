/* ===== script.js (11/09 安定版・完全置換用) ===== */
(function(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- 0) Google青バナー/吹き出しの抑止（自動停止つき） ---------- */
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
  /* 12秒後に監視タイマーを停止（CPU節約） */
  window.__gtBarTmr = setInterval(killGoogleBar, 1500);
  setTimeout(()=>{ try{ clearInterval(window.__gtBarTmr); }catch(_){ } }, 12000);
  document.addEventListener('visibilitychange', ()=>{ if (!document.hidden) killGoogleBar(); });

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

      /* セクショントップ */
      const liTop = document.createElement('li');
      const aTop  = document.createElement('a');
      aTop.href = `#${secId}`;
      aTop.textContent = `${secLabel}`;
      aTop.addEventListener('click', closeMenu);
      liTop.appendChild(aTop); ul.appendChild(liTop);

      /* アコーディオン見出しを項目化 */
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

      if (secId !== 'plans') group.appendChild(h4);
      group.appendChild(ul);
      groups.appendChild(group);
    });

    /* 余分な "(トップ)" と重複タイトルの削除＋「料金プラン」の見出し非表示 */
    (function cleanup(){
      const groups = document.querySelectorAll('#menuGroups .menu-group');
      groups.forEach(g => {
        const title = (g.querySelector('h4')?.textContent || '')
                        .trim().replace(/\s+/g, ' ');
        g.querySelectorAll('.menu-list a').forEach(a => {
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

  /* === A11y & 微最適化（append-only, safe） ============================= */
  (function(){
    /* ダイアログARIA（HTMLに既にある場合は上書きせず） */
    const menuPanel = document.getElementById('menuDrawer')?.querySelector('.menu-panel');
    const langPanel = document.getElementById('langDrawer')?.querySelector('.lang-panel');
    if (menuPanel){
      if (!menuPanel.getAttribute('role')) menuPanel.setAttribute('role','dialog');
      menuPanel.setAttribute('aria-modal','true');
      if (!menuPanel.getAttribute('aria-label')) menuPanel.setAttribute('aria-label','目次（各セクションへ移動）');
    }
    if (langPanel){
      if (!langPanel.getAttribute('role')) langPanel.setAttribute('role','dialog');
      langPanel.setAttribute('aria-modal','true');
      if (!langPanel.getAttribute('aria-label')) langPanel.setAttribute('aria-label','Select language');
    }

    /* フォーカストラップ（開いている間だけTab移動をパネル内に限定） */
    let lastFocus = null;
    function getFocusable(root){
      return Array.from(root.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null);
    }
    function enableTrap(panel){
      if (!panel) return;
      const list = getFocusable(panel);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      panel.__trapHandler = (e)=>{
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      };
      panel.addEventListener('keydown', panel.__trapHandler);
      if (!panel.contains(document.activeElement)) first.focus();
    }
    function disableTrap(panel){
      if (panel && panel.__trapHandler){
        panel.removeEventListener('keydown', panel.__trapHandler);
        delete panel.__trapHandler;
      }
    }
    function syncTrap(){
      const mOpen = html.classList.contains('menu-open');
      const lOpen = html.classList.contains('lang-open');
      if (mOpen){ lastFocus = document.activeElement; enableTrap(menuPanel); }
      else { disableTrap(menuPanel); if (lastFocus) try{ lastFocus.focus(); }catch(_){} }
      if (lOpen){ lastFocus = document.activeElement; enableTrap(langPanel); }
      else { disableTrap(langPanel); if (lastFocus) try{ lastFocus.focus(); }catch(_){} }
    }
    new MutationObserver(syncTrap).observe(html, {attributes:true, attributeFilter:['class']});
    window.addEventListener('load', syncTrap, {once:true});

    /* 画像の遅延読込（LCP回避のため最初の1枚は対象外） */
    try{
      const imgs = document.querySelectorAll('img');
      imgs.forEach((img, i)=>{
        if (i === 0) return;                       // 最初の画像はLCP配慮で除外
        if (!img.hasAttribute('loading'))  img.setAttribute('loading','lazy');
        if (!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
      });
    }catch(_){}

    /* iOSのダーク切替で配色が崩れないよう宣言を追加（ライト固定） */
    try{
      if (!document.querySelector('meta[name="color-scheme"]')){
        const m = document.createElement('meta');
        m.name = 'color-scheme'; m.content = 'light';
        document.head.appendChild(m);
      }
    }catch(_){}
  })();

  /* === 4) 法務系“文言”の自動挿入（本文に軽く追記／二重挿入防止） === */
  (function legalPatches(){
    function insertOnceBefore(target, key, node){
      if (!target) return;
      const parent = target.parentNode;
      if (!parent || parent.dataset[key]) return;
      parent.insertBefore(node, target);
      parent.dataset[key] = '1';
    }
    function makeNote(htmlStr){
      const p = document.createElement('p');
      p.className = 'text-sm muted';
      p.style.margin = '6px 0';
      p.innerHTML = htmlStr;
      return p;
    }

    /* a) 為替シミュレーション表の直上に非勧誘ディスクレーマを自動追記 */
    $$('#personal-account details').forEach(det=>{
      const sumTxt = (det.querySelector('summary')?.textContent || '').trim();
      if (/リスクと為替の考え方/.test(sumTxt)){
        const firstTable = det.querySelector('.content table');
        if (firstTable){
          const p = makeNote('<strong>※重要：</strong> 下表は特定条件に基づく仮定例であり、金融商品の勧誘・媒介・助言ではありません。金利・為替・税制は変動し、将来の成果は保証されません。');
          insertOnceBefore(firstTable, 'disc_fx_once', p);
        }
      }
      if (/複利の力/.test(sumTxt)){
        const firstTable = det.querySelector('.content table');
        if (firstTable){
          const p = makeNote('<strong>※参考：</strong> 以下は単純計算の目安です。税・為替・商品条件により実績は異なります。投資判断はご自身で行い、必要に応じて有資格者へご相談ください。');
          insertOnceBefore(firstTable, 'disc_comp_once', p);
        }
      }
    });

    /* b) フッターに「やらないことリスト」を1行だけ追記（存在チェック） */
    const foot = document.querySelector('footer.site-foot');
    if (foot && !foot.querySelector('.foot-policyline')){
      const line = document.createElement('small');
      line.className = 'foot-policyline';
      line.style.display = 'block';
      line.style.marginTop = '6px';
      line.innerHTML = '【やらないこと】銀行口座の<strong>代理開設</strong>・<strong>送金指示</strong>・<strong>投資助言</strong>は行いません。';
      foot.appendChild(line);
    }
  })();

})();
