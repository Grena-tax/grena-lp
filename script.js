/* =========================================================
   script.js — ES5互換・DOM準備後に初期化（1ファイル完結）

   対応内容：
   - ハンバーガー：各セクション自動見出し生成（※ トップ項目は生成しない）
   - 「料金プラン／2年目以降の維持・サポート／よくある質問（2年目以降）」を
     #plans の最上位 <details> から取得し、「法人設立」グループの末尾に追記
   - メニューを開いた直後に必ず先頭へスクロール（iOS対策込み）
   - Google翻訳：公式セレクトをプログラム操作（英⇄日ほか何度でも安定）
   - Google翻訳バナー抑止
   ========================================================= */

(function(){
  'use strict';

  /* ===== 0) Google 翻訳バナー抑止 ===== */
  function killGtBanner(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      var ids = ['goog-te-banner-frame','goog-gt-tt'];
      for (var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if (!el) continue;
        if (el.remove) el.remove();
        else {
          el.style.display='none';
          el.style.visibility='hidden';
          el.style.height='0';
        }
      }
    }catch(_){}
  }
  try{
    new MutationObserver(killGtBanner).observe(document.documentElement,{childList:true,subtree:true});
  }catch(_){}
  window.addEventListener('load', killGtBanner, false);
  killGtBanner();

  /* ===== 1) DOM ready ===== */
  function ready(fn){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, false);
    } else { fn(); }
  }

  ready(function(){

    /* utils */
    function $(sel, root){ return (root||document).querySelector(sel); }
    function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
    function on(el, ev, fn, opts){ if(el) el.addEventListener(ev, fn, opts||false); }
    function setAttr(el, k, v){ if(el) el.setAttribute(k, v); }
    function hasClass(el, c){ return el && (' '+el.className+' ').indexOf(' '+c+' ') > -1; }
    function addClass(el, c){ if(el && !hasClass(el,c)) el.className = (el.className?el.className+' ':'') + c; }
    function removeClass(el, c){ if(!el) return; el.className = (' '+el.className+' ').replace(' '+c+' ',' ').trim(); }

    var html = document.documentElement;

    /* ===== 2) ハンバーガー開閉 ===== */
    var menuBtn      = $('#menuBtn');
    var menuDrawer   = $('#menuDrawer');
    var menuBackdrop = $('#menuBackdrop');
    var menuClose    = $('#menuClose');

    function setMenu(open){
      if (open){
        addClass(html,'menu-open');
        setAttr(menuDrawer,'aria-hidden','false');
        setAttr(menuBtn,'aria-expanded','true');

        // 開いた直後に必ず先頭へ（iOS対策込み）
        var mg = document.getElementById('menuGroups');
        if (mg){
          var reset = function(){ mg.scrollTop = 0; };
          mg.scrollTop = 1;   // iOSの0へ戻らない癖を踏む
          reset();
          if (window.requestAnimationFrame) requestAnimationFrame(reset);
          setTimeout(reset, 240); // .menu-panel transition(.22s)後
        }
      } else {
        removeClass(html,'menu-open');
        setAttr(menuDrawer,'aria-hidden','true');
        setAttr(menuBtn,'aria-expanded','false');
      }
    }
    function toggleMenu(e){ if(e){e.preventDefault();} setMenu(!hasClass(html,'menu-open')); }
    function closeMenu(){ setMenu(false); }

    on(menuBtn, 'click', toggleMenu, false);
    on(menuBackdrop, 'click', closeMenu, false);
    on(menuClose, 'click', closeMenu, false);
    on(document, 'keydown', function(e){ if(e.key==='Escape'){ closeMenu(); }}, false);

    /* ===== 3) 言語ドロワー開閉 ===== */
    var langBtn   = $('#langBtn');
    var langWrap  = $('#langDrawer');
    var langClose = $('#langClose');
    var langBack  = $('#langBackdrop');

    function setLang(open){
      if (open){ addClass(html,'lang-open'); setAttr(langWrap,'aria-hidden','false'); setAttr(langBtn,'aria-expanded','true'); }
      else { removeClass(html,'lang-open'); setAttr(langWrap,'aria-hidden','true'); setAttr(langBtn,'aria-expanded','false'); }
    }
    on(langBtn, 'click', function(){ setLang(true); }, false);
    on(langClose,'click', function(){ setLang(false); }, false);
    on(langBack, 'click', function(){ setLang(false); }, false);

    /* ===== 4) Google翻訳：英語名リストを複製 ===== */
    var langList   = $('#langList');
    var langSearch = $('#langSearch');
    var displayNames = (window.Intl && window.Intl.DisplayNames) ? new window.Intl.DisplayNames(['en'], {type:'language'}) : null;

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
            sel.value = it.code;
            try { sel.dispatchEvent(new Event('change', {bubbles:true})); } catch(_){
              var ev = document.createEvent('HTMLEvents'); ev.initEvent('change', true, true); sel.dispatchEvent(ev);
            }
            try{
              if (/#googtrans/.test(location.hash)) {
                history.replaceState('', document.title, location.pathname + location.search);
              }
            }catch(_){}
            setLang(false);
            killGtBanner();
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

    /* ===== 5) アンカー着地処理 ===== */
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
      setTimeout(function(){
        try{ target.scrollIntoView({behavior:'smooth', block:'start'}); }catch(_){ target.scrollIntoView(true); }
        closeMenu();
      }, 0);
    }

    /* ===== 6) メニュー生成 ===== */
    var menuGroups = $('#menuGroups');
    var corpUlRef = null; // 「法人設立」グループの <ul> 参照

    if (menuGroups){
      menuGroups.innerHTML = '';

      var normalSections = [
        ['corp-setup','法人設立'],
        ['sole-setup','個人事業主（IE/SBS）'],
        ['personal-account','個人口座開設（銀行）'],
        ['disclaimer','免責事項・キャンセル']
      ];

      for (var s=0;s<normalSections.length;s++){
        var secId = normalSections[s][0], secLabel = normalSections[s][1];
        var sec = document.getElementById(secId);
        if (!sec) continue;

        var group = document.createElement('div'); group.className='menu-group';
        var h4 = document.createElement('h4'); h4.textContent = secLabel;
        var ul = document.createElement('ul'); ul.className='menu-list';

        // （※ ご要望により「トップ」リンクは生成しない）

        // セクション内の全summary
        var sums = $all('.accordion summary', sec);
        for (var i=0;i<sums.length;i++){
          var sum = sums[i];
          var det = sum.closest ? sum.closest('details') : (function(n){ while(n && n.tagName && n.tagName.toLowerCase()!=='details'){ n=n.parentElement; } return n; })(sum);
          if (!det) continue;
          var label = (sum.textContent||'').trim().replace(/\s+/g,' ');
          var id = ensureId(det, secId, label, i);

          (function(label,id){
            var li = document.createElement('li');
            var a  = document.createElement('a'); a.href='#'+id; a.textContent = label;
            on(a, 'click', function(e){ e.preventDefault(); openAndJump(id); }, false);
            li.appendChild(a); ul.appendChild(li);
          })(label,id);
        }

        group.appendChild(h4);
        group.appendChild(ul);
        menuGroups.appendChild(group);

        if (secId === 'corp-setup'){ corpUlRef = ul; }
      }

      /* ===== 7) #plans の最上位 <details> 先頭3件を「法人設立」末尾へ追記 ===== */
      (function(){
        var plansSec = document.getElementById('plans');
        if (!plansSec || !corpUlRef) return;

        function getTopSummaries(){
          var acc = plansSec.querySelector('.accordion');
          if (!acc) return [];
          var out = [];
          for (var i=0;i<acc.children.length;i++){
            var d = acc.children[i];
            if (!d || d.tagName !== 'DETAILS') continue;
            for (var j=0;j<d.children.length;j++){
              var ch = d.children[j];
              if (ch && ch.tagName === 'SUMMARY'){ out.push(ch); break; }
            }
          }
          return out; // 期待：3件＝料金プラン／2年目以降／よくある質問
        }

        var tops = getTopSummaries();
        for (var k=0;k<3 && k<tops.length;k++){
          var sum = tops[k];
          var det = sum.parentElement;
          var label = (sum.textContent||'').trim().replace(/\s+/g,' ');
          var id = ensureId(det, 'plans', label, k);

          (function(labelText, anchorId){
            var li = document.createElement('li');
            var a  = document.createElement('a');
            a.href = '#'+anchorId;
            a.textContent = labelText;
            on(a, 'click', function(e){ e.preventDefault(); openAndJump(anchorId); }, false);
            li.appendChild(a);
            corpUlRef.appendChild(li); // 「法人設立」グループの末尾へ
          })(label, id);
        }
      })();
    }

  }); // ready

  /* ===== 8) Google 翻訳 初期化フック ===== */
  window.googleTranslateElementInit = function(){
    try {
      new window.google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    } catch(_){}
  };

})();
(function(){
  var head = document.querySelector('.menu-head');
  var groups = document.querySelector('.menu-groups');
  if (!head || !groups) return;

  function applyPad(){
    var h = head.getBoundingClientRect().height || 0;
    groups.style.paddingTop = (h + 8) + 'px';
    groups.style.scrollPaddingTop = (h + 8) + 'px';
  }
  applyPad();
  window.addEventListener('resize', applyPad);
  // Webフォント読み込み後の再計算（iOSで高さが変わる場合に備えて）
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(applyPad).catch(function(){});
  }
})();
