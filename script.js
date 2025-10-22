/* ===== 10/12ベース：全言語を英語名で表示／選択後もバナー非表示を徹底 ===== */
(function(){
  'use strict';
  var html = document.documentElement;

  /* ---- 共通ユーティリティ ---- */
  function $(s, r){ return (r||document).querySelector(s); }
  function $all(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function on(el, ev, fn, opt){ if(el) el.addEventListener(ev, fn, opt||false); }
  function setAttr(el, k, v){ if (el) el.setAttribute(k, v); }
  function hasClass(el, c){ return el && (' '+el.className+' ').indexOf(' '+c+' ')>-1; }
  function addClass(el, c){ if (el && !hasClass(el,c)) el.className = (el.className?el.className+' ':'')+c; }
  function removeClass(el, c){ if (el) el.className = (' '+el.className+' ').replace(' '+c+' ',' ').trim(); }

  /* ---- Google翻訳：青バナー完全抑止 ---- */
  function hideGtBannerHard(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      var ids = ['goog-te-banner-frame','goog-gt-tt'];
      for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (el){ if (el.remove) el.remove(); else { el.style.display='none'; el.style.visibility='hidden'; el.style.height='0'; } }
      }
      // フレーム要素（idなし）も全消し
      $all('iframe.goog-te-banner-frame').forEach(function(f){
        if (f.remove) f.remove(); else { f.style.display='none'; f.style.visibility='hidden'; f.style.height='0'; }
      });
    }catch(_){}
  }
  try{ new MutationObserver(hideGtBannerHard).observe(document.documentElement,{childList:true,subtree:true}); }catch(_){}
  window.addEventListener('load', hideGtBannerHard, false);
  hideGtBannerHard();

  /* ---- ハンバーガー開閉（10/12どおり） ---- */
  var menuBtn      = $('#menuBtn');
  var menuDrawer   = $('#menuDrawer');
  var menuBackdrop = $('#menuBackdrop');
  var menuClose    = $('#menuClose');

  function setMenu(open){
    if (open){ addClass(html,'menu-open'); setAttr(menuDrawer,'aria-hidden','false'); setAttr(menuBtn,'aria-expanded','true'); }
    else { removeClass(html,'menu-open'); setAttr(menuDrawer,'aria-hidden','true');  setAttr(menuBtn,'aria-expanded','false'); }
  }
  function toggleMenu(e){ if(e){e.preventDefault();} setMenu(!hasClass(html,'menu-open')); }
  function closeMenu(){ setMenu(false); }

  on(menuBtn, 'click', toggleMenu);
  on(menuBackdrop, 'click', closeMenu);
  on(menuClose, 'click', closeMenu);
  on(document, 'keydown', function(e){ if(e.key==='Escape'){ closeMenu(); }});

  /* ---- 言語ドロワー開閉（10/12どおり） ---- */
  var langBtn   = $('#langBtn');
  var langWrap  = $('#langDrawer');
  var langClose = $('#langClose');
  var langBack  = $('#langBackdrop');

  function setLang(open){
    if (open){ addClass(html,'lang-open'); setAttr(langWrap,'aria-hidden','false'); setAttr(langBtn,'aria-expanded','true'); }
    else { removeClass(html,'lang-open'); setAttr(langWrap,'aria-hidden','true'); setAttr(langBtn,'aria-expanded','false'); }
  }
  on(langBtn, 'click', function(e){ e.preventDefault(); setLang(!hasClass(html,'lang-open')); });
  on(langClose,'click', function(){ setLang(false); });
  on(langBack, 'click', function(){ setLang(false); });

  /* ---- Google翻訳：全言語を英語名で表示して“確実に”切替 ---- */
  var langList   = $('#langList');
  var langSearch = $('#langSearch');

  // 公式<select>取得（&hl=en をHTMLで付けているため、optionは英語名）
  function gtSelect(){ var host = $('#google_translate_element'); return host ? host.querySelector('select.goog-te-combo') : null; }

  // 表示：ロード中プレースホルダ（部分リストは出さず“全言語”揃うまで待つ）
  function showLoading(){
    if (!langList) return;
    langList.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'ls-item';
    div.setAttribute('aria-disabled','true');
    div.style.opacity = '0.7';
    div.innerHTML = '<span>Loading languages…</span><span class="ls-code">…</span>';
    langList.appendChild(div);
  }

  function writeGoogTransCookie(val){
    try{
      var host = location.hostname.replace(/^www\./,'');
      var opts = [
        'googtrans='+encodeURIComponent(val)+'; path=/',
        'googtrans='+encodeURIComponent(val)+'; path=/; domain=.'+host,
        'googtrans='+encodeURIComponent(val)+'; path=/; domain='+host
      ];
      for (var i=0;i<opts.length;i++) document.cookie = opts[i];
    }catch(_){}
  }
  function clearGoogHash(){
    if (/#googtrans/.test(location.hash)) {
      try{ history.replaceState('', document.title, location.pathname + location.search); }catch(_){}
    }
  }

  // 公式初期化待機（全optionが揃うまで待つ）
  function waitForGt(cb, tries){
    tries = tries || 0;
    var sel = gtSelect();
    if (sel && sel.options && sel.options.length > 1) { cb(sel); return; }
    if (tries > 60) { cb(null); return; } // 約18秒でタイムアウト
    setTimeout(function(){ waitForGt(cb, tries+1); }, 300);
  }

  function setGoogleLanguage(code){
    // cookie 先行（公式が遅延でも保持）
    var v = '/ja/'+code; if (code==='ja') v = '/ja/ja';
    writeGoogTransCookie(v);

    // 公式<select>があれば change を正規発火
    waitForGt(function(sel){
      if (sel){
        sel.value = code;
        sel.dispatchEvent(new Event('change', {bubbles:true}));
      }
      // バナー抑止＆ハッシュ除去
      clearGoogHash();
      hideGtBannerHard();
    });
  }

  function buildLanguageList(){
    showLoading();
    waitForGt(function(sel){
      if (!langList) return;
      langList.innerHTML = ''; // ここから実描画

      var items = [];
      if (sel){
        for (var i=0;i<sel.options.length;i++){
          var o = sel.options[i];
          var code = (o.value||'').trim();
          if (!code || code==='auto') continue;
          var label = (o.textContent||'').trim() || code; // 既に英語名（&hl=en）
          items.push({code:code, name:label});
        }
        // 英語名でソート（大文字小文字無視）
        items.sort(function(a,b){ return a.name.localeCompare(b.name,'en',{sensitivity:'base'}); });
      }else{
        // タイムアウト時：最低限の安全策（ただし通常は到達しない）
        items = [{code:'en',name:'English'},{code:'ja',name:'Japanese'}];
      }

      var frag = document.createDocumentFragment();
      items.forEach(function(it){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ls-item';
        btn.setAttribute('role','option');
        btn.dataset.code = it.code;
        btn.innerHTML = '<span>'+it.name+'</span><span class="ls-code">'+it.code+'</span>';
        on(btn, 'click', function(e){
          e.preventDefault();
          setGoogleLanguage(it.code);
          setLang(false);
        }, {passive:false});
        frag.appendChild(btn);
      });
      langList.appendChild(frag);

      if (langSearch){
        langSearch.value = '';
        on(langSearch,'input', function(){
          var q = (langSearch.value||'').trim().toLowerCase();
          $all('.ls-item', langList).forEach(function(el){
            var t = (el.textContent||'').toLowerCase();
            el.style.display = (!q || t.indexOf(q)>-1) ? '' : 'none';
          });
        });
      }
    });
  }
  // 初回構築を遅延呼び出し
  setTimeout(buildLanguageList, 600);

  // GoogleのUI変化を監視してバナー抑止・リスト再構築（言語追加・順序変化のケア）
  try{
    new MutationObserver(function(){
      hideGtBannerHard();
      // 公式<select>の内容が変わったら再描画
      buildLanguageList();
    }).observe(document.documentElement, {childList:true,subtree:true});
  }catch(_){}

  /* ---- ハンバーガー：メニュー自動生成（既存どおり） ---- */
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

    function mkId(s){ return (s||'').toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
    function ensureId(det, secId, label, idx){
      if (det.id) return det.id;
      var base = mkId(secId+'-'+(label||'item')+'-'+(idx+1)) || (secId+'-d-'+(idx+1));
      var id = base, n=2; while (document.getElementById(id)) id = base+'-'+(n++);
      det.id = id; return id;
    }
    function openAncestors(el){
      var p = el ? el.parentElement : null;
      while (p){ if (p.tagName && p.tagName.toLowerCase()==='details') p.open = true; p = p.parentElement; }
    }
    function openAndJump(id){
      var target = document.getElementById(id);
      if (!target) return;
      if (target.tagName && target.tagName.toLowerCase()==='details') target.open = true;
      openAncestors(target);
      closeMenu(); // 先に閉じてからスクロール → ヘッダ被り無し
      try{ target.scrollIntoView({behavior:'smooth',block:'start'}); }catch(_){ target.scrollIntoView(true); }
    }

    sections.forEach(function(pair){
      var secId = pair[0], secLabel = pair[1];
      var sec = document.getElementById(secId); if (!sec) return;

      var group = document.createElement('div'); group.className='menu-group';
      var h4 = document.createElement('h4'); h4.textContent = secLabel;
      var ul = document.createElement('ul'); ul.className='menu-list';

      $all('.accordion summary', sec).forEach(function(sum, idx){
        var det = sum.closest ? sum.closest('details') : null;
        if (!det) return;
        var label = (sum.textContent||'').trim().replace(/\s+/g,' ');
        var id = ensureId(det, secId, label, idx);

        var li = document.createElement('li');
        var a  = document.createElement('a'); a.href = '#'+id; a.textContent = label;
        on(a, 'click', function(e){ e.preventDefault(); openAndJump(id); });
        li.appendChild(a); ul.appendChild(li);
      });

      group.appendChild(h4); group.appendChild(ul); menuGroups.appendChild(group);
    });

    // 料金プランの最上位3件を確実に追加（重複排除）
    (function(){
      var secId = 'plans';
      var sec = document.getElementById(secId); if (!sec) return;

      function getTopSummaries(){
        var acc = sec.querySelector('.accordion'); if (!acc) return [];
        var out = [];
        for (var i=0;i<acc.children.length;i++){
          var d = acc.children[i]; if (!d || d.tagName !== 'DETAILS') continue;
          for (var j=0;j<d.children.length;j++){
            var ch = d.children[j]; if (ch && ch.tagName === 'SUMMARY'){ out.push(ch); break; }
          }
        }
        return out;
      }
      function existsHref(href){
        return $all('.menu-list a', menuGroups).some(function(a){ return a.getAttribute('href')===href; });
      }

      var tops = getTopSummaries();
      var picks = [0,1,2];
      var group = document.createElement('div'); group.className='menu-group';
      var ul = document.createElement('ul'); ul.className='menu-list';

      picks.forEach(function(idx){
        var sum = tops[idx]; if (!sum) return;
        var det = sum.parentElement; var label = (sum.textContent||'').trim().replace(/\s+/g,' ');
        if (!det.id) det.id = secId+'-pick-'+(idx+1);
        var href = '#'+det.id;
        if (existsHref(href)) return;

        var li = document.createElement('li');
        var a  = document.createElement('a'); a.href = href; a.textContent = label;
        on(a,'click', function(e){ e.preventDefault(); openAndJump(det.id); });
        li.appendChild(a); ul.appendChild(li);
      });

      if (ul.children.length){ group.appendChild(ul); menuGroups.appendChild(group); }
    })();
  }

  /* ---- Googleバナー状態に応じて安全余白クラスを更新 ---- */
  function detectGoogleBar(){
    try{
      var bar = document.querySelector('iframe.goog-te-banner-frame');
      var showing = bar && bar.offsetHeight > 0;
      html.classList.toggle('gtbar', !!showing);
      if (showing) hideGtBannerHard();
    }catch(_){}
  }
  setInterval(detectGoogleBar, 1200);

  /* ---- Google 翻訳 初期化（公式コールバック） ---- */
  window.googleTranslateElementInit = function(){
    try{
      // HTMLのscriptに ?hl=en を付けているため、optionは英語名で投入される
      new window.google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false}, 'google_translate_element');
    }catch(_){}
  };
})();
