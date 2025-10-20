<script>
/* =========================
   Drawer / Lang / Menu JS
   ========================= */
(function(){
  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  /* ---------- 開閉：ハンバーガー ---------- */
  const menuBtn = $('.menu-button');
  const menuWrap = $('.menu-wrap');
  const menuBackdrop = $('.menu-backdrop');
  const menuPanel = $('.menu-panel');
  const menuClose = $('.menu-close');
  const menuGroups = $('.menu-groups');

  function openMenu(){
    if(!menuWrap) return;
    document.documentElement.classList.add('menu-open');
    menuWrap.setAttribute('aria-hidden','false');
  }
  function closeMenu(){
    if(!menuWrap) return;
    document.documentElement.classList.remove('menu-open');
    menuWrap.setAttribute('aria-hidden','true');
  }
  window.openMenu = openMenu;  // 既存から呼べるように
  window.closeMenu = closeMenu;

  menuBtn && menuBtn.addEventListener('click', openMenu, false);
  menuBackdrop && menuBackdrop.addEventListener('click', closeMenu, false);
  menuClose && menuClose.addEventListener('click', closeMenu, false);

  /* ESCで閉じる */
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      closeMenu(); closeLang();
    }
  });

  /* ---------- 開閉：言語パネル ---------- */
  const langBtn = $('.lang-button');
  const langWrap = $('.lang-wrap');
  const langBackdrop = $('.lang-backdrop');
  const langCloseBtn = $('.lang-close');

  function openLang(){
    if(!langWrap) return;
    document.documentElement.classList.add('lang-open');
    langWrap.setAttribute('aria-hidden','false');
  }
  function closeLang(){
    if(!langWrap) return;
    document.documentElement.classList.remove('lang-open');
    langWrap.setAttribute('aria-hidden','true');
  }
  window.openLang = openLang;
  window.closeLang = closeLang;

  langBtn && langBtn.addEventListener('click', openLang, false);
  langBackdrop && langBackdrop.addEventListener('click', closeLang, false);
  langCloseBtn && langCloseBtn.addEventListener('click', closeLang, false);

  /* ---------- クリックで対象にスクロール ---------- */
  function openAncestors(el){
    let p = el && el.parentElement;
    while(p){
      if(p.tagName && p.tagName.toLowerCase()==='details'){ p.open = true; }
      p = p.parentElement;
    }
  }
  function onMenuLinkClick(e){
    e.preventDefault();
    const id = this.getAttribute('href')?.replace('#','');
    if(!id) return;
    const target = document.getElementById(id);
    if(!target) return;
    if(target.tagName && target.tagName.toLowerCase()==='details'){ target.open = true; }
    openAncestors(target);
    /* ヘッダーなどを考慮して少し上にオフセット */
    const offset = 70;
    const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({top:y, behavior:'smooth'});
    closeMenu();
  }
  function wireMenuLinks(ctx=document){
    $$('#menuGroups .menu-list a', ctx).forEach(a=>{
      a.removeEventListener('click', onMenuLinkClick, false);
      a.addEventListener('click', onMenuLinkClick, false);
    });
  }

  /* ---------- ハンバーガー内の不要“（トップ）”を除去 ---------- */
  const TOP_GROUPS = ['法人設立','個人事業主','個人口座開設','免責事項・キャンセル'];
  function stripTopItems(){
    $$('#menuGroups .menu-group').forEach(group=>{
      const title = $('.menu-section, h4', group)?.textContent?.trim() || '';
      const target = TOP_GROUPS.some(k => title.includes(k));
      if(!target) return;
      $$('.menu-list li', group).forEach(li=>{
        const txt = (li.textContent || '').replace(/\s+/g,'');
        if(/[（(]トップ[)）]/.test(txt)){ li.remove(); }
      });
    });
  }

  /* ---------- 「KYC」の直後に“3つのプラン”を必ず挿入 ---------- */
  function ensurePlansAfterKYC(){
    const corpGroup = $$('#menuGroups .menu-group').find(g=>{
      const t = $('.menu-section, h4', g)?.textContent || '';
      return /法人設立/.test(t);
    }) || $('.menu-group'); // 最初のグループにフォールバック

    if(!corpGroup) return;

    const list = $('.menu-list', corpGroup);
    if(!list) return;

    /* KYCを部分一致で探す（表記ゆれ対応） */
    let kycLi = $$('.menu-list li', corpGroup).find(li=>{
      const t = (li.textContent || '').replace(/\s+/g,'');
      return /(KYC|FMS|監査|審査)/i.test(t);
    });

    /* #plans の最上位 <details> 先頭3件を取得 */
    const acc = $('#plans .accordion');
    if(!acc) return;

    const tops = Array.from(acc.children).filter(ch => ch && ch.tagName === 'DETAILS').slice(0,3);
    let anchorAfter = kycLi;

    tops.forEach((det, i)=>{
      const sum = $('summary', det);
      if(!sum) return;

      if(!det.id){
        let base = 'plans-pick-' + (i+1);
        let id = base, n = 2;
        while(document.getElementById(id)) id = base + '-' + (n++);
        det.id = id;
      }
      const id = det.id;
      const label = (sum.textContent || '').trim().replace(/\s+/g,' ');

      /* 既に同じアンカーがあるなら追加しない */
      if($$('.menu-list a', corpGroup).some(a => a.getAttribute('href') === '#'+id)) return;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = '#'+id;
      a.textContent = label;
      a.addEventListener('click', onMenuLinkClick, false);
      li.appendChild(a);

      if(anchorAfter && anchorAfter.nextSibling){
        list.insertBefore(li, anchorAfter.nextSibling);
      }else{
        list.appendChild(li);
      }
      anchorAfter = li; // 連続挿入で順序を維持
    });
  }

  /* ---------- 初期化 ---------- */
  function init(){
    stripTopItems();
    ensurePlansAfterKYC();
    wireMenuLinks();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }

})();
</script>
