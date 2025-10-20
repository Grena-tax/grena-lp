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
<!-- script.js の末尾に追記（ES5 / クリック復旧パッチ） -->
<script>
(function(){
  'use strict';
  // 安全なユーティリティ（ES5）
  function $(id){ return document.getElementById(id); }
  function on(el, ev, fn){ if(el && el.addEventListener){ el.addEventListener(ev, fn, false); } }

  var html = document.documentElement;

  /* ========== ハンバーガー開閉（ES5） ========== */
  var menuBtn      = $('menuBtn');      // 右上ハンバーガー
  var menuDrawer   = $('menuDrawer');   // <nav id="menuDrawer" class="menu-wrap">
  var menuBackdrop = $('menuBackdrop'); // .menu-backdrop
  var menuClose    = $('menuClose');    // .menu-close（×ボタン）

  function hasClass(el, c){ return el && (' '+el.className+' ').indexOf(' '+c+' ') > -1; }
  function addClass(el, c){ if(el && !hasClass(el,c)){ el.className = (el.className?el.className+' ':'') + c; } }
  function removeClass(el, c){ if(!el) return; el.className = (' '+el.className+' ').replace(' '+c+' ',' ').trim(); }

  function setMenu(open){
    if (open){
      addClass(html,'menu-open');
      if (menuDrawer){ menuDrawer.setAttribute('aria-hidden','false'); }
      if (menuBtn){ menuBtn.setAttribute('aria-expanded','true'); }
    } else {
      removeClass(html,'menu-open');
      if (menuDrawer){ menuDrawer.setAttribute('aria-hidden','true'); }
      if (menuBtn){ menuBtn.setAttribute('aria-expanded','false'); }
    }
  }
  function toggleMenu(e){ if(e){ e.preventDefault(); } setMenu(!hasClass(html,'menu-open')); }

  on(menuBtn,      'click',  toggleMenu);
  on(menuBackdrop, 'click',  function(){ setMenu(false); });
  on(menuClose,    'click',  function(){ setMenu(false); });
  on(document,     'keydown', function(e){
    var key = e.key || e.keyCode;
    if (key === 'Escape' || key === 27){ setMenu(false); setLang(false); }
  });

  /* ========== 言語ドロワー開閉（ES5） ========== */
  var langBtn   = $('langBtn');     // 右上の地球儀
  var langWrap  = $('langDrawer');  // .lang-wrap のルート
  var langClose = $('langClose');   // .lang-close（×）
  var langBack  = $('langBackdrop');// .lang-backdrop

  function setLang(open){
    if (open){
      addClass(html,'lang-open');
      if (langWrap){ langWrap.setAttribute('aria-hidden','false'); }
      if (langBtn){  langBtn.setAttribute('aria-expanded','true'); }
    } else {
      removeClass(html,'lang-open');
      if (langWrap){ langWrap.setAttribute('aria-hidden','true'); }
      if (langBtn){  langBtn.setAttribute('aria-expanded','false'); }
    }
  }

  on(langBtn,  'click', function(e){ e.preventDefault(); setLang(true);  });
  on(langClose,'click', function(){ setLang(false); });
  on(langBack, 'click', function(){ setLang(false); });

  // 既に他のスクリプトがあっても、ここは ES5 なので文法エラーで止まりません。
  // クリック不能だった環境でも、これで最低限の開閉が動きます。
})();
</script>
