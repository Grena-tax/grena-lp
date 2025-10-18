/* =========================================================
   script.js — 最小修正版（2点のみ）
   ① #plans の3項目を必ずメニュー最上段に追加（翻訳に非依存）
   ② 言語リストを必ず表示＆何度でも切替反映（既存維持）
   ========================================================= */

(function(){
  'use strict';

  /* ===== 0) Google 翻訳バナー抑止 ===== */
  function killGtBanner(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      var ids=['goog-te-banner-frame','goog-gt-tt'];
      for(var i=0;i<ids.length;i++){
        var el=document.getElementById(ids[i]);
        if(!el) continue;
        if(el.remove) el.remove();
        else { el.style.display='none'; el.style.visibility='hidden'; el.style.height='0'; }
      }
    }catch(_){}
  }
  try{ new MutationObserver(killGtBanner).observe(document.documentElement,{childList:true,subtree:true}); }catch(_){}
  window.addEventListener('load', killGtBanner, false);
  killGtBanner();

  /* ===== 1) DOM 準備 ===== */
  function ready(fn){
    if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', fn, false); }
    else{ fn(); }
  }

  ready(function(){

    /* ユーティリティ */
    function $(sel,root){ return (root||document).querySelector(sel); }
    function $all(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
    function on(el,ev,fn,opts){ if(el) el.addEventListener(ev,fn,opts||false); }
    function setAttr(el,k,v){ if(el) el.setAttribute(k,v); }
    function hasClass(el,c){ return el && (' '+el.className+' ').indexOf(' '+c+' ')>-1; }
    function addClass(el,c){ if(el && !hasClass(el,c)) el.className=(el.className?el.className+' ':'')+c; }
    function removeClass(el,c){ if(!el) return; el.className=(' '+el.className+' ').replace(' '+c+' ',' ').trim(); }

    var html=document.documentElement;

    /* ===== 2) ハンバーガー開閉 ===== */
    var menuBtn=$('#menuBtn'), menuDrawer=$('#menuDrawer'), menuBackdrop=$('#menuBackdrop'), menuClose=$('#menuClose');
    function setMenu(open){
      if(open){ addClass(html,'menu-open'); setAttr(menuDrawer,'aria-hidden','false'); setAttr(menuBtn,'aria-expanded','true'); }
      else{ removeClass(html,'menu-open'); setAttr(menuDrawer,'aria-hidden','true'); setAttr(menuBtn,'aria-expanded','false'); }
    }
    function toggleMenu(e){ if(e){e.preventDefault();} setMenu(!hasClass(html,'menu-open')); }
    function closeMenu(){ setMenu(false); }
    on(menuBtn,'click',toggleMenu,false);
    on(menuBackdrop,'click',closeMenu,false);
    on(menuClose,'click',closeMenu,false);
    on(document,'keydown',function(e){ if(e.key==='Escape'){ closeMenu(); }},false);

    /* ===== 3) 言語ドロワー開閉 ===== */
    var langBtn=$('#langBtn'), langWrap=$('#langDrawer'), langClose=$('#langClose'), langBack=$('#langBackdrop');
    function setLang(open){
      if(open){ addClass(html,'lang-open'); setAttr(langWrap,'aria-hidden','false'); setAttr(langBtn,'aria-expanded','true'); }
      else{ removeClass(html,'lang-open'); setAttr(langWrap,'aria-hidden','true'); setAttr(langBtn,'aria-expanded','false'); }
    }
    on(langBtn,'click',function(){ setLang(true); },false);
    on(langClose,'click',function(){ setLang(false); },false);
    on(langBack,'click',function(){ setLang(false); },false);

    /* ===== 4) Google翻訳：リスト生成（必ず出す＆確実反映） ===== */
    var langList=$('#langList');
    var langSearch=$('#langSearch');
    var displayNames=(window.Intl && window.Intl.DisplayNames)? new window.Intl.DisplayNames(['en'],{type:'language'}) : null;

    function setGoogTransCookie(code){
      try{
        var host=location.hostname.replace(/^www\./,'');
        var val=encodeURIComponent('/ja/'+code);
        if(code==='ja'){ val=encodeURIComponent('/ja/ja'); }
        var exp=new Date(); exp.setFullYear(exp.getFullYear()+1);
        var eStr=exp.toUTCString();
        document.cookie='googtrans='+val+'; expires='+eStr+'; path=/';
        document.cookie='googtrans='+val+'; expires='+eStr+'; path=/; domain=.'+host;
        document.cookie='googtrans='+val+'; expires='+eStr+'; path=/; domain='+host;
        if(/#googtrans/i.test(location.hash)){
          history.replaceState('',document.title,location.pathname+location.search);
        }
      }catch(_){}
    }

    function buildLangListOnce(){
      var selHost=$('#google_translate_element');
      var sel= selHost ? selHost.querySelector('select.goog-te-combo') : null;
      if(!sel || !langList) return false;
      if(langList.getAttribute('data-ready')==='1') return true;

      var items=[], opts=sel.options;
      for(var i=0;i<opts.length;i++){
        var o=opts[i]; var code=(o.value||'').trim();
        if(!code || code==='auto') continue;
        var name=(displayNames?(displayNames.of(code)||''):'') || (o.textContent||'').trim() || code;
        items.push({code:code,name:name});
      }
      if(!items.length) return false;

      items.sort(function(a,b){ var A=a.name.toLowerCase(),B=b.name.toLowerCase(); return A<B?-1:A>B?1:0; });

      langList.innerHTML='';
      var frag=document.createDocumentFragment();
      for(var j=0;j<items.length;j++){
        (function(it){
          var div=document.createElement('div');
          div.className='ls-item';
          div.setAttribute('role','option');
          div.setAttribute('data-code',it.code);
          div.innerHTML='<span>'+it.name+'</span><span class="ls-code">'+it.code+'</span>';
          div.addEventListener('click',function(){
            setGoogTransCookie(it.code);
            sel.value=it.code;
            try{ var ev=document.createEvent('HTMLEvents'); ev.initEvent('change',true,true); sel.dispatchEvent(ev);}catch(_){}
            setTimeout(function(){ try{ sel.dispatchEvent(new Event('change',{bubbles:true})); }catch(_){} killGtBanner(); },120);
            setLang(false); killGtBanner();
          },false);
          frag.appendChild(div);
        })(items[j]);
      }
      langList.appendChild(frag);
      langList.setAttribute('data-ready','1');

      if(langSearch && !langSearch.getAttribute('data-bound')){
        langSearch.value='';
        langSearch.setAttribute('data-bound','1');
        langSearch.addEventListener('input',function(){
          var q=(langSearch.value||'').trim().toLowerCase();
          var nodes=$all('.ls-item',langList);
          for(var k=0;k<nodes.length;k++){
            var t=(nodes[k].textContent||'').toLowerCase();
            nodes[k].style.display=(!q || t.indexOf(q)>-1)? '' : 'none';
          }
        },false);
      }
      return true;
    }

    (function ensureLangList(){
      var host=$('#google_translate_element');
      try{
        var obs=new MutationObserver(function(){ if(buildLangListOnce()){ obs.disconnect(); } });
        if(host) obs.observe(host,{childList:true,subtree:true});
      }catch(_){}
      var tries=0, timer=setInterval(function(){ if(buildLangListOnce() || ++tries>40){ clearInterval(timer); } },500);
    })();

    /* ===== 5) スクロール補助 ===== */
    function mkId(base){ return (base||'').toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
    function ensureId(det,secId,label,idx){
      if(det.id) return det.id;
      var base=mkId(secId+'-'+(label||'item')+'-'+(idx+1)) || (secId+'-d-'+(idx+1));
      var id=base, n=2; while(document.getElementById(id)){ id=base+'-'+(n++); }
      det.id=id; return id;
    }
    function openAncestors(el){
      var p=el?el.parentElement:null;
      while(p){ if(p.tagName && p.tagName.toLowerCase()==='details') p.open=true; p=p.parentElement; }
    }
    function openAndJump(id){
      var target=document.getElementById(id);
      if(!target) return;
      if(target.tagName && target.tagName.toLowerCase()==='details') target.open=true;
      openAncestors(target);
      setTimeout(function(){
        try{ target.scrollIntoView({behavior:'smooth',block:'start'}); }catch(_){ target.scrollIntoView(true); }
        closeMenu();
      },0);
    }

    /* ===== 6) メニュー生成：通常セクション（トップ+全summary） ===== */
    var menuGroups=$('#menuGroups');
    if(menuGroups){
      menuGroups.innerHTML='';

      var normalSections=[
        ['corp-setup','法人設立'],
        ['sole-setup','個人事業主（IE/SBS）'],
        ['personal-account','個人口座開設（銀行）'],
        ['disclaimer','免責事項・キャンセル']
      ];

      for(var s=0;s<normalSections.length;s++){
        var secId=normalSections[s][0], secLabel=normalSections[s][1];
        var sec=document.getElementById(secId);
        if(!sec) continue;

        var group=document.createElement('div'); group.className='menu-group';
        var h4=document.createElement('h4'); h4.textContent=secLabel;
        var ul=document.createElement('ul'); ul.className='menu-list';

        (function(){
          var li=document.createElement('li');
          var a=document.createElement('a'); a.href='#'+secId; a.textContent=secLabel+'（トップ）';
          a.addEventListener('click',function(e){ e.preventDefault(); openAndJump(secId); },false);
          li.appendChild(a); ul.appendChild(li);
        })();

        var sums=$all('.accordion summary',sec);
        for(var i=0;i<sums.length;i++){
          var sum=sums[i];
          var det=sum.closest? sum.closest('details') : (function(n){ while(n && n.tagName && n.tagName.toLowerCase()!=='details'){ n=n.parentElement; } return n; })(sum);
          if(!det) continue;
          var label=(sum.textContent||'').trim().replace(/\s+/g,' ');
          var id=ensureId(det,secId,label,i);

          (function(label,id){
            var li=document.createElement('li');
            var a=document.createElement('a'); a.href='#'+id; a.textContent=label;
            a.addEventListener('click',function(e){ e.preventDefault(); openAndJump(id); },false);
            li.appendChild(a); ul.appendChild(li);
          })(label,id);
        }

        group.appendChild(h4);
        group.appendChild(ul);
        menuGroups.appendChild(group);
      }

      /* ===== 7) #plans の最上位 <details> 先頭3件を“必ず”メニューの最上段に追加 ===== */
      (function(){
        var secId='plans';
        var sec=document.getElementById(secId);
        if(!sec) return;

        // 直下の .accordion > details > summary を厳密取得（翻訳文言・ネストに非依存）
        var sumsTop = sec.querySelectorAll('.accordion > details > summary');
        var group=document.createElement('div'); group.className='menu-group';
        var ul=document.createElement('ul'); ul.className='menu-list';

        for(var i=0;i<3;i++){
          var sum=sumsTop[i];
          if(!sum) continue;
          var det=sum.parentElement;
          var label=(sum.textContent||'').trim().replace(/\s+/g,' ');
          var id=ensureId(det,secId,label,i);

          (function(labelText,anchorId){
            var li=document.createElement('li');
            var a=document.createElement('a');
            a.href='#'+anchorId;
            a.textContent=labelText;
            a.addEventListener('click',function(e){ e.preventDefault(); openAndJump(anchorId); },false);
            li.appendChild(a);
            ul.appendChild(li);
          })(label,id);
        }

        group.appendChild(ul);

        // ★ 最上段に挿入（必ず目に入る位置）
        var first = menuGroups.firstElementChild;
        if(first){ menuGroups.insertBefore(group, first); }
        else{ menuGroups.appendChild(group); }
      })();
    }

  }); // ready

  /* ===== 8) Google 翻訳 初期化フック ===== */
  window.googleTranslateElementInit=function(){
    try{
      new window.google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false},'google_translate_element');
    }catch(_){}
  };

})();
