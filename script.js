/* =========================================================
   script.js — ES5互換・DOM準備後に初期化（2点のみ修正）
   ① #plans の3項目を “最上位detailsの先頭3件” から確実に生成
   ② すべての言語で何度でも翻訳が確実に反映
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
        else { el.style.display='none'; el.style.visibility='hidden'; el.style.height='0'; }
      }
    }catch(_){}
  }
  try{ new MutationObserver(killGtBanner).observe(document.documentElement,{childList:true,subtree:true}); }catch(_){}
  window.addEventListener('load', killGtBanner, false);
  killGtBanner();

  /* ===== 1) DOM 準備 ===== */
  function ready(fn){
    if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn, false); }
    else { fn(); }
  }

  ready(function(){

    /* ユーティリティ */
    function $(sel, root){ return (root||document).querySelector(sel); }
    function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
    function on(el, ev, fn, opts){ if(el) el.addEventListener(ev, fn, opts||false); }
    function setAttr(el, k, v){ if(el) el.setAttribute(k, v); }
    function hasClass(el, c){ return el && (' '+el.className+' ').indexOf(' '+c+' ') > -1; }
    function addClass(el, c){ if(el && !hasClass(el,c)) el.className = (el.className?el.className+' ':'') + c; }
    function removeClass(el, c){ if(!el) return; el.className = (' '+el.className+' ').replace(' '+c+' ',' ').trim(); }

    var html = document.documentElement;

    /* ===== 2) ハンバーガー開閉（再タップ/×/背景/ESC対応） ===== */
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

    /* ===== 4) Google翻訳：リスト生成（何度でも反映する切替） ===== */
    var langList   = $('#langList');
    var langSearch = $('#langSearch');
    var displayNames = (window.Intl && window.Intl.DisplayNames) ? new window.Intl.DisplayNames(['en'], {type:'language'}) : null;

    // ② 確実反映：googtrans クッキーを毎回上書き + 公式selectに2段階 change
    function setGoogTransCookie(code){
      try{
        var host = location.hostname.replace(/^www\./,'');
        var val  = encodeURIComponent('/ja/'+code); // 原文 ja 固定
        var exp  = new Date(); exp.setFullYear(exp.getFullYear()+1);
        var eStr = exp.toUTCString();
        document.cookie = 'googtrans='+val+'; expires='+eStr+'; path=/';
        document.cookie = 'googtrans='+val+'; expires='+eStr+'; path=/; domain=.'+host;
        document.cookie = 'googtrans='+val+'; expires='+eStr+'; path=/; domain='+host;
        if (/#googtrans/i.test(location.hash)) {
          history.replaceState('', document.title, location.pathname + location.search);
        }
      }catch(_){}
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
            setGoogTransCookie(it.code);                 // クッキー更新
            sel.value = it.code;                         // 公式select更新
            try{
              var ev = document.createEvent('HTMLEvents');
              ev.initEvent('change', true, true);
              sel.dispatchEvent(ev);
            }catch(_){}
            // 端末・回線での取りこぼし対策リトライ
            setTimeout(function(){
              try{ sel.dispatchEvent(new Event('change', {bubbles:true})); }catch(_){}
              killGtBanner();
            }, 120);

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

    /* ===== 5) スクロール補助 ===== */
    function mkId(base){ return (base||'').toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
    function ensureId(det, secId, label, idx){
      if (det.id) return det.id;
      var base = mkId(secId+'-'+(label||'item')+'-'+(idx+1)) || (secId+'-d-'+(idx+1));
      var id = base, n = 2; while (document.getElementById(id)) { id = base+'-'+(n++); }
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
      setTimeout(function(){
        try{ target.scrollIntoView({behavior:'smooth', block:'start'}); }catch(_){ target.scrollIntoView(true); }
        closeMenu();
      }, 0);
    }

    /* ===== 6) メニュー生成：通常セクション（トップ+全summary） ===== */
    var menuGroups = $('#menuGroups');
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

        // トップ
        (function(){
          var li = document.createElement('li');
          var a  = document.createElement('a'); a.href = '#'+secId; a.textContent = secLabel+'（トップ）';
          on(a,'click', function(e){ e.preventDefault(); openAndJump(secId); }, false);
          li.appendChild(a); ul.appendChild(li);
        })();

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
      }

      /* ===== 7) メニュー生成：#plans は“最上位detailsの先頭3件のみ” ===== */
      (function(){
        var secId = 'plans';
        var sec = document.getElementById(secId);
        if (!sec) return;

        // 子ノード走査で .accordion 直下の最上位 <details> の <summary> を厳密取得（:scope非依存・翻訳文言に非依存）
        function topLevelSummaries(){
          var result = [];
          var acc = null;
          for (var i=0;i<sec.children.length;i++){
            var ch = sec.children[i];
            if (ch.classList && ch.classList.contains('accordion')) { acc = ch; break; }
          }
          if (!acc) return result;
          for (var j=0;j<acc.children.length;j++){
            var el = acc.children[j];
            if (!el || el.tagName !== 'DETAILS') continue;
            for (var k=0;k<el.children.length;k++){
              if (el.children[k].tagName === 'SUMMARY'){ result.push(el.children[k]); break; }
            }
          }
          return result;
        }

        var sumsTop = topLevelSummaries(); // 期待：3件（料金プラン／2年目以降／よくある質問）
        var picks = [0,1,2];

        var group = document.createElement('div'); group.className='menu-group';
        var ul = document.createElement('ul'); ul.className='menu-list';

        for (var i=0;i<picks.length;i++){
          var sum = sumsTop[picks[i]];
          if (!sum) continue;

          var label = (sum.textContent || '').trim().replace(/\s+/g,' ');
          var det = sum.parentElement; // summary の直親は details
          var id = ensureId(det, secId, label, i);

          (function(labelText, anchorId){
            var li = document.createElement('li');
            var a  = document.createElement('a');
            a.href = '#'+anchorId;
            a.textContent = labelText;
            on(a,'click', function(e){ e.preventDefault(); openAndJump(anchorId); }, false);
            li.appendChild(a);
            ul.appendChild(li);
          })(label, id);
        }

        group.appendChild(ul); // 見出しは付けない（既存仕様）
        menuGroups.appendChild(group);
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
