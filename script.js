/* =========================================================
   script.js — ES5互換・DOM準備後に初期化（1ファイル完結）
   - 右上ハンバーガー / 地球儀の開閉（ES5）
   - Google翻訳：言語リスト（英語名）生成と選択
   - メニュー生成：通常セクション＋ #plans 先頭3件を KYC の直後へ差し込み
   - ハンバーガー内の「（トップ）」リンクは除去
   - 余計なUI/文言変更なし
   ========================================================= */

(function(){
  'use strict';

  /* ===== 0) Google 翻訳バナー抑止（表示ずれ防止） ===== */
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

  /* ===== 1) DOM 準備後に初期化 ===== */
  function ready(fn){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, false);
    } else { fn(); }
  }

  ready(function(){

    /* ユーティリティ */
    function $(sel, root){ return (root||document).querySelector(sel); }
    function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
    function on(el, ev, fn, opts){ if(el && el.addEventListener){ el.addEventListener(ev, fn, opts||false); } }
    function setAttr(el, k, v){ if(el) el.setAttribute(k, v); }
    function hasClass(el, c){ return el && (' '+el.className+' ').indexOf(' '+c+' ') > -1; }
    function addClass(el, c){ if(el && !hasClass(el,c)) el.className = (el.className?el.className+' ':'') + c; }
    function removeClass(el, c){ if(!el) return; el.className = (' '+el.className+' ').replace(' '+c+' ',' ').trim(); }

    var html = document.documentElement;

    /* ===== 2) ハンバーガー開閉（ES5・再タップ/×/背景/ESC対応） ===== */
    var menuBtn      = $('#menuBtn');
    var menuDrawer   = $('#menuDrawer');
    var menuBackdrop = $('#menuBackdrop');
    var menuClose    = $('#menuClose');

    function setMenu(open){
      if (open){
        addClass(html,'menu-open');
        setAttr(menuDrawer,'aria-hidden','false');
        setAttr(menuBtn,'aria-expanded','true');
        // ラップの pointer-events を同期（閉じている時は拾わない）
        var mw = $('.menu-wrap'); if (mw) mw.style.pointerEvents = 'auto';
        document.body.style.overflow = 'hidden';
      } else {
        removeClass(html,'menu-open');
        setAttr(menuDrawer,'aria-hidden','true');
        setAttr(menuBtn,'aria-expanded','false');
        var mw2 = $('.menu-wrap'); if (mw2) mw2.style.pointerEvents = 'none';
        // 言語ドロワーも閉じていればスクロール解放
        if (!hasClass(html,'lang-open')) document.body.style.overflow = '';
      }
    }
    function toggleMenu(e){ if(e){e.preventDefault();} setMenu(!hasClass(html,'menu-open')); }
    function closeMenu(){ setMenu(false); }

    on(menuBtn, 'click', toggleMenu, false);
    on(menuBackdrop, 'click', closeMenu, false);
    on(menuClose, 'click', closeMenu, false);

    /* ===== 3) 言語ドロワー開閉（ES5・開閉のみ） ===== */
    var langBtn   = $('#langBtn');
    var langWrap  = $('#langDrawer');
    var langClose = $('#langClose');
    var langBack  = $('#langBackdrop');

    function setLang(open){
      if (open){
        addClass(html,'lang-open');
        setAttr(langWrap,'aria-hidden','false');
        setAttr(langBtn,'aria-expanded','true');
        var lw = $('.lang-wrap'); if (lw) lw.style.pointerEvents = 'auto';
        // 片方だけ開く（メニューは閉じる）
        setMenu(false);
        document.body.style.overflow = 'hidden';
      } else {
        removeClass(html,'lang-open');
        setAttr(langWrap,'aria-hidden','true');
        setAttr(langBtn,'aria-expanded','false');
        var lw2 = $('.lang-wrap'); if (lw2) lw2.style.pointerEvents = 'none';
        if (!hasClass(html,'menu-open')) document.body.style.overflow = '';
      }
    }
    function closeLang(){ setLang(false); }

    on(langBtn,  'click', function(e){ e.preventDefault(); setLang(true);  }, false);
    on(langClose,'click', function(){ setLang(false); }, false);
    on(langBack, 'click', function(){ setLang(false); }, false);

    // ESCでどちらかを閉じる
    on(document, 'keydown', function(e){
      var k = e.key || e.keyCode;
      if (k === 'Escape' || k === 27){
        if (hasClass(html,'lang-open')) closeLang();
        else if (hasClass(html,'menu-open')) closeMenu();
      }
    }, false);

    /* ===== 4) Google翻訳：英語名リストを複製（機能維持・ES5イベント） ===== */
    var langList   = $('#langList');
    var langSearch = $('#langSearch');
    var displayNames = null;
    try{
      if (window.Intl && window.Intl.DisplayNames){
        displayNames = new window.Intl.DisplayNames(['en'], {type:'language'});
      }
    }catch(_){}

    function clearGoogTransIfJa(code){
      if (!code) return;
      // 日本語選択時はクッキーを /ja/ja に戻す（戻らない不具合の回避）
      if (code === 'ja' || code === 'ja-JP'){
        try{
          var host = location.hostname.replace(/^www\./,'');
          var exp='Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie='googtrans=; expires='+exp+'; path=/';
          document.cookie='googtrans=; expires='+exp+'; path=/; domain=.'+host;
          document.cookie='googtrans=; expires='+exp+'; path=/; domain='+host;
        }catch(_){}
      }
    }

    function buildLangList(){
      var selHost = $('#google_translate_element');
      var sel = selHost ? selHost.querySelector('select.goog-te-combo') : null;
      if (!sel || !langList){ setTimeout(buildLangList, 300); return; }

      var items = [];
      var i;
      for (i=0;i<sel.options.length;i++){
        var o = sel.options[i];
        var code = (o.value||'').trim();
        if (!code || code==='auto') continue;
        var name = (displayNames ? (displayNames.of(code)||'') : '') || (o.textContent||'').trim() || code;
        items.push({code:code, name:name});
      }
      items.sort(function(a,b){
        var A=a.name.toLowerCase(), B=b.name.toLowerCase();
        return A<B? -1 : A>B? 1 : 0;
      });

      langList.innerHTML = '';
      var frag = document.createDocumentFragment();
      for (i=0;i<items.length;i++){
        (function(it){
          var div = document.createElement('div');
          div.className = 'ls-item';
          div.setAttribute('role','option');
          div.setAttribute('data-code', it.code);
          div.innerHTML = '<span>'+it.name+'</span><span class="ls-code">'+it.code+'</span>';
          on(div,'click', function(){
            // 日本語に戻す時のクッキー掃除（戻らない問題の回避）
            clearGoogTransIfJa(it.code);

            // 公式 select を操作（ES5イベントで対応）
            try{
              sel.value = it.code;
              var ev = document.createEvent('HTMLEvents');
              ev.initEvent('change', true, true);
              sel.dispatchEvent(ev);
            }catch(_){}

            setLang(false);
            killGtBanner();
          }, false);
          frag.appendChild(div);
        })(items[i]);
      }
      langList.appendChild(frag);

      if (langSearch){
        langSearch.value = '';
        on(langSearch,'input', function(){
          var q = (langSearch.value||'').toLowerCase();
          var nodes = $all('.ls-item', langList);
          var k;
          for (k=0;k<nodes.length;k++){
            var t = (nodes[k].textContent||'').toLowerCase();
            nodes[k].style.display = (!q || t.indexOf(q)>-1) ? '' : 'none';
          }
        }, false);
      }
    }
    setTimeout(buildLangList, 700);

    /* ===== 5) ハンバーガー：ジャンプ時に対象<details>をopenして着地 ===== */
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

      var s, i;
      for (s=0;s<normalSections.length;s++){
        var secId = normalSections[s][0], secLabel = normalSections[s][1];
        var sec = document.getElementById(secId);
        if (!sec) continue;

        var group = document.createElement('div'); group.className='menu-group';
        var h4 = document.createElement('h4'); h4.textContent = secLabel;
        var ul = document.createElement('ul'); ul.className='menu-list';

        // セクションのトップ
        (function(){
          var li = document.createElement('li');
          var a  = document.createElement('a'); a.href = '#'+secId; a.textContent = secLabel+'（トップ）';
          on(a,'click', function(e){ e.preventDefault(); openAndJump(secId); }, false);
          li.appendChild(a); ul.appendChild(li);
        })();

        // セクション内の全summary
        var sums = $all('.accordion summary', sec);
        for (i=0;i<sums.length;i++){
          var sum = sums[i];
          // 直親 details を辿る
          var det = sum.closest ? sum.closest('details') : (function(n){ while(n && n.tagName && n.tagName.toLowerCase()!=='details'){ n=n.parentElement; } return n; })(sum);
          if (!det) continue;
          var label = (sum.textContent||'').trim().replace(/\s+/g,' ');
          var id = ensureId(det, secId, label, i);

          (function(labelText,idVal){
            var li = document.createElement('li');
            var a  = document.createElement('a'); a.href='#'+idVal; a.textContent = labelText;
            on(a, 'click', function(e){ e.preventDefault(); openAndJump(idVal); }, false);
            li.appendChild(a); ul.appendChild(li);
          })(label,id);
        }

        group.appendChild(h4);
        group.appendChild(ul);
        menuGroups.appendChild(group);
      }

      /* --- （トップ）リンクはハンバーガー内から除去（本文は無変更） --- */
      (function pruneTop(){
        var anchors = $all('#menuGroups .menu-list a');
        var j;
        for (j=0;j<anchors.length;j++){
          var t = (anchors[j].textContent||'').replace(/\s+/g,'');
          if (/（トップ）$/.test(t) || /\(Top\)$/.test(t)) {
            var li = anchors[j].parentNode;
            if (li && li.parentNode) li.parentNode.removeChild(li);
          }
        }
      })();

      /* ===== 7) #plans：最上位<details>の先頭3件を「KYC…」の直後へ差し込み ===== */
      (function(){
        var secId = 'plans';
        var sec = document.getElementById(secId);
        if (!sec) return;

        function getTopSummaries(){
          var acc = sec.querySelector('.accordion');
          if (!acc) return [];
          var out = [];
          var x, y;
          for (x=0;x<acc.children.length;x++){
            var d = acc.children[x];
            if (!d || d.tagName !== 'DETAILS') continue;
            // 直下の <summary> を手動で取得（:scope 非依存）
            var sum = null;
            for (y=0;y<d.children.length;y++){
              if (d.children[y] && d.children[y].tagName === 'SUMMARY'){ sum = d.children[y]; break; }
            }
            if (!sum) continue;
            out.push({details:d, summary:sum});
            if (out.length>=3) break;
          }
          return out;
        }

        function ensureIdSimple(el, base){
          if (el.id) return el.id;
          var id = base, n=2;
          while(document.getElementById(id)) id = base+'-'+(n++);
          el.id = id; return id;
        }

        function makeLi(label, targetId){
          var li = document.createElement('li');
          li.setAttribute('data-injected','plans');
          var a  = document.createElement('a'); a.href = '#'+targetId; a.textContent = label;
          on(a,'click', function(e){
            e.preventDefault();
            var tgt = document.getElementById(targetId);
            if (tgt){
              if (tgt.tagName && tgt.tagName.toLowerCase()==='details') tgt.open = true;
              openAncestors(tgt);
              try{ tgt.scrollIntoView({behavior:'smooth',block:'start'}); }catch(_){ tgt.scrollIntoView(true); }
            }
            closeMenu();
          }, false);
          li.appendChild(a); return li;
        }

        var picks = getTopSummaries();
        if (!picks.length) return;

        // ハンバーガーの KYC を部分一致で探す
        var listUl = null, refLi = null;
        var links = $all('#menuGroups .menu-list a');
        var k;
        for (k=0;k<links.length;k++){
          var txt = (links[k].textContent||'').replace(/\s+/g,'');
          if (/KYC/i.test(txt)){ refLi = links[k].parentNode; listUl = refLi ? refLi.parentNode : null; break; }
        }
        if (!listUl){
          // 見つからない場合は最初の .menu-list に追加
          listUl = $('#menuGroups .menu-list');
        }
        if (!listUl) return;

        // すでに挿入済みならスキップ
        if ($('#menuGroups [data-injected="plans"]')) return;

        var idx;
        for (idx=0; idx<picks.length; idx++){
          var label = (picks[idx].summary.textContent||'').trim().replace(/\s+/g,' ');
          var id = ensureIdSimple(picks[idx].details, 'plans-pick-'+(idx+1));
          var li = makeLi(label, id);
          if (refLi && refLi.nextSibling){
            listUl.insertBefore(li, refLi.nextSibling);
            refLi = li;
          } else {
            listUl.appendChild(li);
            refLi = li;
          }
        }
      })();
    }

  }); // ready

  /* ===== 8) Google 翻訳 初期化フック（グローバル関数） ===== */
  window.googleTranslateElementInit = function(){
    try {
      new window.google.translate.TranslateElement({pageLanguage:'ja', autoDisplay:false}, 'google_translate_element');
    } catch(_){}
  };

})();
