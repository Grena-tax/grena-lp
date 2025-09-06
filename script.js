/* === app.js（丸ごと） ======================================= */
(function(){
  const scrollRoot   = document.getElementById('scrollRoot');
  const ctaBar       = document.getElementById('ctaBar');
  const bottomSpacer = document.getElementById('bottomSpacer');
  const toTop        = document.getElementById('toTop');
  const applyNow     = document.getElementById('applyNow');

  /* ====== CTA高さに合わせて本文下を自動調整（せり上がり防止） ====== */
  function adjustCtaLayout(bufferPx = 28){
    if(!ctaBar) return;
    const h = ctaBar.offsetHeight;
    const pad = h + bufferPx;
    scrollRoot.style.paddingBottom = pad + 'px';
    if(bottomSpacer) bottomSpacer.style.height = pad + 'px';
  }
  const adj = () => adjustCtaLayout(28);
  window.addEventListener('load', adj, {passive:true});
  window.addEventListener('resize', adj, {passive:true});
  window.addEventListener('orientationchange', adj, {passive:true});

  /* details 開閉でも高さが変わるので随時補正 */
  scrollRoot.addEventListener('toggle', e=>{
    if(e.target.tagName === 'DETAILS') requestAnimationFrame(adj);
  }, true);

  /* ====== 「トップへ」：本文スクロールを制御 ====== */
  if(toTop){
    toTop.addEventListener('click', (ev)=>{
      ev.preventDefault();
      scrollRoot.scrollTo({top:0, behavior:'smooth'});
    });
  }

  /* ====== 申込み先（必要ならURL差し替え） ====== */
  // const FORM_URL = 'https://your-google-form-url';
  // if(applyNow) { applyNow.href = FORM_URL; applyNow.target = '_blank'; }

  /* ====== ハンバーガー（ドロワー目次） ====== */
  const menuBtn   = document.getElementById('menuBtn');
  const menuWrap  = document.getElementById('menuDrawer');
  const menuPanel = menuWrap?.querySelector('.menu-panel');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuClose = document.getElementById('menuClose');
  const menuGroups = document.getElementById('menuGroups');

  function openMenu(){
    menuWrap.classList.add('open');
    menuBtn.setAttribute('aria-expanded','true');
    menuWrap.setAttribute('aria-hidden','false');
  }
  function closeMenu(){
    menuWrap.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
    menuWrap.setAttribute('aria-hidden','true');
  }
  menuBtn?.addEventListener('click', ()=> menuWrap.classList.contains('open') ? closeMenu() : openMenu());
  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);

  /* ====== 目次を自動生成 ====== */
  function slugify(s){
    return 's_' + s.trim()
      .replace(/[\s　]+/g,'-')
      .replace(/[^\w\u3040-\u30ff\u3400-\u9fff\-]/g,'')
      .toLowerCase();
  }
  function ensureId(el, base){
    if(!el.id){ el.id = slugify(base); }
    return el.id;
  }

  function buildMenu(){
    if(!menuGroups) return;
    menuGroups.innerHTML = '';

    // ページ内の各 section を走査
    document.querySelectorAll('main section').forEach(section=>{
      const titleEl = section.querySelector('h2');
      if(!titleEl) return;
      const secId = ensureId(section, titleEl.textContent);

      const group = document.createElement('div');
      group.className = 'menu-group';

      const gTitle = document.createElement('div');
      gTitle.className = 'g-title';
      const gLink = document.createElement('a');
      gLink.href = '#'+secId;
      gLink.textContent = titleEl.textContent;
      gLink.addEventListener('click', (e)=>{ e.preventDefault(); jumpToId(secId); closeMenu(); });
      gTitle.appendChild(gLink);
      group.appendChild(gTitle);

      const list = document.createElement('ul');
      list.className = 'menu-list';

      // セクション直下のアコーディオン（details）を目次に
      section.querySelectorAll(':scope .accordion > details > summary').forEach((sum, idx)=>{
        const txt = sum.textContent.trim();
        const details = sum.parentElement;
        const detId = ensureId(details, titleEl.textContent + '-' + txt + '-' + idx);

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#'+detId;
        a.textContent = txt;
        a.addEventListener('click', (e)=>{ e.preventDefault(); jumpToId(detId); closeMenu(); });
        li.appendChild(a);
        list.appendChild(li);
      });

      if(list.children.length){ group.appendChild(list); menuGroups.appendChild(group); }
    });
  }

  function jumpToId(id){
    const target = document.getElementById(id);
    if(!target) return;

    // details の中なら親を開く
    const d = target.closest('details');
    if(d && !d.open){ d.open = true; }

    // scrollRoot 基準で座標計算
    const r = target.getBoundingClientRect();
    const rootR = scrollRoot.getBoundingClientRect();
    const y = r.top - rootR.top + scrollRoot.scrollTop - 8; // 少しだけ上に余白
    scrollRoot.scrollTo({top:y, behavior:'smooth'});
    requestAnimationFrame(adj);
  }

  buildMenu();

  /* ====== 初期レイアウト確定後の補正 ====== */
  window.addEventListener('load', ()=>{
    // 料金プラン「だけ形が違う」→全 details に同じスタイルが付くように class を外部依存にしない
    // （HTMLのままでOK。ここでは高さ補正だけ）
    adj();
  }, {passive:true});
})();
