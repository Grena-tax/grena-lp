<script>
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const html = document.documentElement;

  /* ====== クリック不能対策：明示的にイベントを束ねる ====== */
  const menuBtn = $('.menu-button');
  const menuWrap = $('.menu-wrap');
  const menuClose = $('.menu-close');
  const menuBackdrop = $('.menu-backdrop');
  const menuGroups = $('.menu-groups');
  const langBtn = $('.lang-button');
  const langWrap = $('.lang-wrap');
  const langClose = $('.lang-close');
  const langBackdrop = $('.lang-backdrop');

  function openMenu(){
    html.classList.add('menu-open');
    // ヘッダー高さに応じて見出し下の余白を上書き（フォント遅延も吸収）
    requestAnimationFrame(fixMenuTopGap);
    setTimeout(fixMenuTopGap, 120);
  }
  function closeMenu(){ html.classList.remove('menu-open'); }
  function openLang(){ html.classList.add('lang-open'); }
  function closeLang(){ html.classList.remove('lang-open'); }

  function fixMenuTopGap(){
    const head = $('.menu-head');
    if (!head || !menuGroups) return;
    const h = Math.ceil(head.getBoundingClientRect().height) + 8; // 見出し分＋余白
    menuGroups.style.setProperty('--menu-top-gap', h + 'px');
    menuGroups.style.scrollPaddingTop = h + 'px';
    menuGroups.style.paddingTop = h + 'px';
  }

  // 安全のため、全てのクリックに stopPropagation を付けて親の透明層に奪われないように
  [menuBtn, langBtn, menuClose, langClose].forEach(el=>{
    if (!el) return;
    el.style.pointerEvents = 'auto';
    el.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); }, {capture:true});
  });

  // トグル本体
  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);
  if (menuWrap) menuWrap.addEventListener('click', (e)=>{ if(e.target === menuWrap) closeMenu(); });

  if (langBtn) langBtn.addEventListener('click', openLang);
  if (langClose) langClose.addEventListener('click', closeLang);
  if (langBackdrop) langBackdrop.addEventListener('click', closeLang);
  if (langWrap) langWrap.addEventListener('click', (e)=>{ if(e.target === langWrap) closeLang(); });

  // 画面回転やフォント読み込み後にも被りを再補正
  window.addEventListener('orientationchange', ()=>setTimeout(fixMenuTopGap, 150));
  window.addEventListener('resize', ()=>setTimeout(fixMenuTopGap, 150));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(()=>setTimeout(fixMenuTopGap, 80));

  /* ====== 目次リンクのスクロール補正（見出しに隠れない） ====== */
  $$('.menu-list a').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href')||'';
      if (!href.startsWith('#')) return;
      e.preventDefault();
      const id = href.slice(1);
      const tgt = document.getElementById(id);
      if (!tgt) return;
      // ancestorsの<details>を開く
      let p = tgt;
      while (p){ if (p.tagName && p.tagName.toLowerCase()==='details') p.open = true; p = p.parentElement; }
      tgt.scrollIntoView({behavior:'smooth', block:'start'});
      closeMenu();
    });
  });

  /* ====== CTAの誤消失を防ぐ（念のため） ====== */
  const cta = document.querySelector('.fixed-cta');
  if (cta){ cta.style.display = 'block'; cta.style.zIndex = 10030; }
})();
</script>
