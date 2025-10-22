/* ===== 10/12ベース：余計な改変なし／必要箇所のみ強化 ===== */
(function(){
  'use strict';
  var html = document.documentElement;

  /* 0) Google 翻訳バナー抑止（表示ずれ防止） */
  function killGtBanner(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      var ids = ['goog-te-banner-frame','goog-gt-tt'];
      for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (!el) continue;
        if (el.remove) el.remove();
        else { el.style.display='none'; el.style.visibility='hidden'; el.style.height='0'; }
      }
    }catch(_){}
  }
  try{ new MutationObserver(killGtBanner).observe(document.documentElement,{childList:true,subtree:true}); }catch(_){}
  window.addEventListener('load', killGtBanner, false);
  killGtBanner();

  /* ユーティリティ */
  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts){ if(el) el.addEventListener(ev, fn, opts||false); }
  function setAttr(el, k, v){ if(el) el.setAttribute(k, v); }
  function hasClass(el, c){ return el && (' '+el.className+' ').indexOf(' '+c+' ') > -1; }
  function addClass(el, c){ if(el && !hasClass(el,c)) el.className = (el.className?el.className+' ':'') + c; }
  function removeClass(el, c){ if(!el) return; el.className = (' '+el.className+' ').replace(' '+c+' ',' ').trim(); }

  /* ===== 1) ハンバーガー開閉（再タップ/×/背景/ESC対応） ===== */
  var menuBtn      = $('#menuBtn');
  var menuDrawer   = $('#menuDrawer');
  var menuBackdrop = $('#menuBackdrop');
  var menuClose    = $('#menuClose');

  function setMenu(open){
    if (open){ addClass(html,'menu-open'); setAttr(menuDrawer,'aria-hidden','false'); setAttr(menuBtn,'aria-expanded','true'); }
    else { removeClass(html,'menu-open'); setAttr(menuDrawer,'aria-hidden','true'); setAttr(menuBtn,'aria-expanded','false'); }
  }
  function toggleMenu(e){ if(e){e.preventDefault();} setMenu(!hasClass(html,'menu-open')); }
  function closeMenu(){ setMenu(false); }

  on(menuBtn, 'click', toggleMenu, false);
  on(menuBackdrop, 'click', closeMenu, false);
  on(menuClose, 'click', closeMenu, false);
  on(document, 'keydown', function(e){ if(e.key==='Escape'){ closeMenu(); }}, false);

  /* ===== 2) 言語ドロワー開閉 ===== */
  var langBtn   = $('#langBtn');
  var langWrap  = $('#langDrawer');
  var langClose = $('#langClose');
  var langBack  = $('#langBackdrop');

  function setLang(open){
    if (open){ addClass(html,'lang-open'); setAttr(langWrap,'aria-hidden','false'); setAttr(langBtn,'aria-expanded','true'); }
    else { removeClass(html,'lang-open'); setAttr(langWrap,'aria-hidden','true'); setAttr(langBtn,'aria-expanded','false'); }
  }
  on(langBtn, 'click', function(e){ e.preventDefault(); setLang(!hasClass(html,'lang-open')); }, false);
  on(langClose,'click', function(){ setLang(false); }, false);
  on(langBack, 'click', function(){ setLang(false); }, false);

  /* ===== 3) Google翻訳：リスト生成＆確実切替（何度でも英↔日OK） ===== */
  var langList   = $('#langList');
  var langSearch = $('#langSearch');
  var displayNames = (window.Intl && window.Intl.DisplayNames) ? new window.Intl.DisplayNames(['en'], {type:'language'}) : null;

  // cookieを全ドメイン/パスで設定
  function writeGoogTransCookie(val){
    try{
      var host = location.hostname.replace(/^www\./,'');
      var pairs = [
        'googtrans='+encodeURIComponent(val)+'; path=/',
        'googtrans='+encodeURIComponent(val)+'; path=/; domain=.'+host,
        'googtrans='+encodeURIComponent(val)+'; path=/; domain='+host
      ];
      var exp = ''; // セッションCookieで十分。必要なら expires 付与も可
      for (var i=0;i<pairs.length;i++){ document.cookie = pairs[i]+exp; }
    }catch(_){}
  }
  function clearGoogHash(){
    if (/#googtrans/.test(location.hash)) {
      try{ history.replaceState('', document.title, location.pathname + location.search); }catch(_){}
    }
  }
  function setGoogleLanguage(code){
    // 公式<select>を駆動
    var selHost = $('#google_translate_element');
    var sel = selHost ? selHost.querySelector('select.goog-te-combo') : null;
    if (sel){
      sel.value = code;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    }
    // cookieも明示（原文=ja → 目標言語=code）
    var val = '/ja/'+code;
    if (code==='ja') val = '/ja/ja';
    writeGoogTransCookie(val);
    clearGoogHash();
    killGtBanner();
  }

  function buildLangList(){
    var selHost = $('#google_translate_element');
    var sel = selHost ? selHost.querySelector('select.goog-te-combo') : null;
    if (!sel || !langList){ setTimeout(buildLangList, 300); return; }

    var items = [];
    for (var i=0;i<sel.options.length;i++){
      var o = sel.options[i];
      var code = (o.value||'').trim();
      if (!code || code==='auto') continue;
      var name = (displayNames ? (displayNames.of(code)||'') : '') || (o.textContent||'').trim() || code;
      items.push({code:code, name:name});
    }
    items.sort(function(a,b){ return a.name.toLowerCase()<b.name.toLowerCase()? -1 : a.name.toLowerCase()>b.name.toLowerCase()? 1 : 0; });

    langList.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var j=0;j<items.length;j++){
      (function(it){
        var div = document.createElement('div');
        div.className = 'ls-item';
        div.setAttribute('role','option');
        div.setAttribute('data-code', it.code);
        div.innerHTML = '<span>'+it.name+'</span><span class="ls-code">'+it.code+'</span>';
        on(div,'click', function(){
          setGoogleLanguage(it.code);
          setLang(false);
        }, false);
        frag.appendChild(div);
      })(items[j]);
    }
    langList.appendChild(frag);

    if (langSearch){
      langSearch.value = '';
      on(langSearch,'input', function(){
        var q = (langSearch.value||'').trim().toLowerCase();
        var nodes = $all('.ls-item', langList);
        for (var k=0;k<nodes.length;k++){
          var t = (nodes[k].textContent||'').toLowerCase();
          nodes[k].style.display = (!q || t.indexOf(q)>-1) ? '' : 'none';
        }
      }, false);
    }
  }
  setTimeout(buildLangList, 700);

  /* ===== 4) ハンバーガー：メニュー自動生成 =====
     - 各セクションの全summaryを列挙（ネストもOK）
     - 「トップ」項目は入れない（ご要望の挙動）
     - #plans の“最上位 <details> 先頭3件”は必ず追加（翻訳・表記ゆれ無関係）
  */
  var menuGroups = $('#menuGroups');
  if (menuGroups){
    menuGroups.innerHTML = '';
    var sections = [
      ['corp-setup','法人設立'],
      ['plans','料金プラン'],
      ['sole-setup','個人事業主（IE/SBS）'],
      ['personal-account','個人口座開設（銀行）'],
      ['disclaimer','免責事項・キャンセル']
    ];

    function mkId(base){
      return (base||'').toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    }
    function ensureId(det, secId, label, idx){
      if (det.id) return det.id;
      var base = mkId(secId+'-'+(label||'item')+'-'+(idx+1)) || (secId+'-d-'+(idx+1));
      var id = base, n = 2;
      while (document.getElementById(id)) { id = base+'-'+(n++); }
      det.id = id; return id;
    }
    function openAncestors(el){
      var p = el ? el.parentElement : null;
      while (p){
        if (p.tagName && p.tagName.toLowerCase()==='details') p.open = true;
        p = p.parentElement;
      }
    }
    function openAndJump(id){
      var target = document.getElementById(id);
      if (!target) return;
      if (target.tagName && target.tagName.toLowerCase()==='details') target.open = true;
      openAncestors(target);
      // 先に閉じてからスクロール（被り防止）
      closeMenu();
      try{ target.scrollIntoView({behavior:'smooth', block:'start'}); }catch(_){ target.scrollIntoView(true); }
    }

    // 1) 各セクション：全summaryを列挙
    for (var s=0;s<sections.length;s++){
      var secId = sections[s][0], secLabel = sections[s][1];
      var sec = document.getElementById(secId);
      if (!sec) continue;

      var group = document.createElement('div'); group.className='menu-group';
      var h4 = document.createElement('h4'); h4.textContent = secLabel;
      var ul = document.createElement('ul'); ul.className='menu-list';

      var sums = $all('.accordion summary', sec);
      for (var i=0;i<sums.length;i++){
        var sum = sums[i];
        var det = sum.closest ? sum.closest('details') : (function(n){ while(n && n.tagName && n.tagName.toLowerCase()!=='details'){ n=n.parentElement; } return n; })(sum);
        if (!det) continue;
        var label = (sum.textContent||'').trim().replace(/\s+/g,' ');
        var id = ensureId(det, secId, label, i);

        (function(labelText,idRef){
          var li = document.createElement('li');
          var a  = document.createElement('a'); a.href='#'+idRef; a.textContent = labelText;
          on(a,'click', function(e){ e.preventDefault(); openAndJump(idRef); }, false);
          li.appendChild(a); ul.appendChild(li);
        })(label,id);
      }

      group.appendChild(h4);
      group.appendChild(ul);
      menuGroups.appendChild(group);
    }

    // 2) #plans の“最上位 <details> 先頭3件”を末尾に確実追加（重複は無視）
    (function(){
      var secId = 'plans';
      var sec = document.getElementById(secId);
      if (!sec) return;

      function getTopSummaries(){
        var acc = sec.querySelector('.accordion');
        if (!acc) return [];
        var out = [];
        for (var i=0;i<acc.children.length;i++){
          var d = acc.children[i];
          if (!d || d.tagName !== 'DETAILS') continue; // 最上位のみ
          for (var j=0;j<d.children.length;j++){
            var ch = d.children[j];
            if (ch && ch.tagName === 'SUMMARY'){ out.push(ch); break; }
          }
        }
        return out; // 期待：先頭3件＝料金プラン／2年目以降／よくある質問
      }

      var tops = getTopSummaries();
      var picks = [0,1,2]; // 3つだけ
      var group = document.createElement('div'); group.className='menu-group';
      var ul = document.createElement('ul'); ul.className='menu-list';

      function existsHref(href){
        var as = $all('.menu-list a', menuGroups);
        for (var i=0;i<as.length;i++){ if (as[i].getAttribute('href')===href) return true; }
        return false;
      }

      for (var k=0;k<picks.length;k++){
        var sum = tops[picks[k]];
        if (!sum) continue;
        var det = sum.parentElement;
        var label = (sum.textContent||'').trim().replace(/\s+/g,' ');
        var id = det.id || (function(){
          var tmp = document.createElement('span');
          det.id = det.id || (secId+'-pick-'+(k+1));
          return det.id;
        })();

        var href = '#'+id;
        if (existsHref(href)) continue; // 既に入っていれば二重追加しない

        (function(labelText, anchorId){
          var li = document.createElement('li');
          var a  = document.createElement('a');
          a.href = '#'+anchorId;
          a.textContent = labelText;
          on(a,'click', function(e){ e.preventDefault(); openAndJump(anchorId); }, false);
          li.appendChild(a); ul.appendChild(li);
        })(label, id);
      }

      if (ul.children.length){
        // 見出しは付けない（余計な余白を出さない）
        group.appendChild(ul);
        menuGroups.appendChild(group);
      }
    })();
  }

  /* ===== 5) Googleバー検知 → かぶり回避クラス付与 ===== */
  function detectGoogleBar() {
    try{
      var bar = document.querySelector('iframe.goog-te-banner-frame');
      var showing = bar && bar.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
    }catch(_){}
  }
  setInterval(detectGoogleBar, 1200);

  /* ===== 6) Google 翻訳 初期化フック（グローバル関数） ===== */
  window.googleTranslateElementInit = function(){
    try {
      new window.google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    } catch(_){}
  };

})();
