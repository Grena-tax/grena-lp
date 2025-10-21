<script>
/* ===== ハンバーガー＆目次生成・翻訳トリガ 一式（ES5） ===== */
(function(){
  /* util */
  function on(t,ev,fn,opt){ t && t.addEventListener(ev,fn,opt||false); }
  function qs(s,c){ return (c||document).querySelector(s); }
  function qsa(s,c){ return (c||document).querySelectorAll(s); }
  function ready(fn){ if(document.readyState!=='loading') fn(); else on(document,'DOMContentLoaded',fn); }
  function norm(t){ return (t||'').replace(/\s+/g,' ').trim(); }

  /* スクロール→ターゲットへ。<details>や祖先も開く */
  function openAncestors(el){
    var p = el && el.parentElement;
    while(p){ if(p.tagName && p.tagName.toLowerCase()==='details') p.open = true; p = p.parentElement; }
  }
  function openAndJump(target){
    if(!target) return;
    if(target.tagName && target.tagName.toLowerCase()==='details') target.open = true;
    openAncestors(target);
    try{ target.scrollIntoView({behavior:'smooth',block:'start'}); }catch(_){ target.scrollIntoView(true); }
  }
  function ensureId(el, base){
    if(!el) return '';
    if(el.id) return el.id;
    var i=1, id = base || ('sec-' + Math.random().toString(36).slice(2,8));
    var cand = id;
    while(document.getElementById(cand)){ i++; cand = id + '-' + i; }
    el.id = cand; return cand;
  }

  /* ドロワーUI構築（存在しなければ作る） */
  function ensureMenuUI(){
    var btn = qs('.menu-button');
    if(!btn){
      btn = document.createElement('button');
      btn.className = 'menu-button'; btn.type='button';
      btn.innerHTML = '<span class="bars"><span></span></span>';
      document.body.appendChild(btn);
    }
    var langBtn = qs('.lang-button');
    if(!langBtn){
      langBtn = document.createElement('button');
      langBtn.className='lang-button'; langBtn.type='button';
      langBtn.innerHTML = '<span class="globe">🌐</span>';
      document.body.appendChild(langBtn);
    }
    var wrap = qs('.menu-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className='menu-wrap';
      wrap.innerHTML =
        '<div class="menu-backdrop"></div>'+
        '<aside class="menu-panel" role="dialog" aria-modal="true">'+
          '<div class="menu-head"><div class="menu-title">目次（各セクションへ移動）</div>'+
          '<button class="menu-close" type="button" aria-label="Close">×</button></div>'+
          '<div class="menu-groups" id="menuGroups"></div>'+
        '</aside>';
      document.body.appendChild(wrap);
    }
    var lwrap = qs('.lang-wrap');
    if(!lwrap){
      lwrap = document.createElement('div');
      lwrap.className='lang-wrap';
      lwrap.innerHTML =
        '<div class="lang-backdrop"></div>'+
        '<section class="lang-panel">'+
          '<div class="lang-head"><div class="lang-title">Select language</div>'+
          '<button class="lang-close" type="button" aria-label="Close">×</button></div>'+
          '<div class="lang-body"><div id="google_translate_element"></div></div>'+
        '</section>';
      document.body.appendChild(lwrap);
    }
  }

  /* 開閉 */
  function setMenu(open){
    document.documentElement.classList[open?'add':'remove']('menu-open');
    if(open){ fixMenuTopGap(); setTimeout(fixMenuTopGap, 50); }
  }
  function setLang(open){
    document.documentElement.classList[open?'add':'remove']('lang-open');
  }

  /* === ヘッダー高さに合わせて上余白を調整（被り防止） === */
  function fixMenuTopGap(){
    var head = qs('.menu-head'), groups = qs('.menu-groups');
    if(!head || !groups) return;
    var h = (head.getBoundingClientRect? head.getBoundingClientRect().height : head.offsetHeight) || 56;
    var gap = Math.max(48, Math.round(h + 8));
    groups.style.setProperty('--menu-top-gap', gap+'px');
  }

  /* 目次生成：各 .accordion の直下 <details> の <summary> を集める */
  function collectSections(){
    var list = [];
    qsa('.accordion').forEach(function(acc){
      var t = 'セクション';
      /* 直前の見出し（h2/h3）をタイトル採用 */
      var prev = acc.previousElementSibling;
      while(prev && !/H2|H3/.test(prev.tagName)) prev = prev.previousElementSibling;
      if(prev) t = norm(prev.textContent);
      list.push({title:t, acc:acc});
    });
    return list;
  }

  /* メニューへ描画（「（トップ）」はメニューだけ除外） */
  function buildMenu(){
    var groups = qs('#menuGroups'); if(!groups) return;
    groups.innerHTML = '';
    var secs = collectSections();

    secs.forEach(function(sec){
      var g = document.createElement('div'); g.className='menu-group';
      var h = document.createElement('h4'); h.textContent = sec.title; g.appendChild(h);
      var ul = document.createElement('ul'); ul.className='menu-list'; g.appendChild(ul);

      Array.prototype.forEach.call(sec.acc.children, function(child){
        if(!child || child.tagName !== 'DETAILS') return;
        var sum = qs('summary', child); if(!sum) return;
        var label = norm(sum.textContent);
        /* メニューでは（トップ）を除外 */
        if(/（\s*トップ\s*）|\(\s*Top\s*\)/i.test(label)) return;
        var id = ensureId(child, 'sec');
        var li = document.createElement('li');
        var a = document.createElement('a'); a.href = '#'+id; a.textContent = label;
        a.addEventListener('click', function(e){ e.preventDefault(); setMenu(false); openAndJump(child); });
        li.appendChild(a); ul.appendChild(li);
      });

      groups.appendChild(g);
    });

    /* --- 必ず表示：3項目を KYC の下へ差し込み（部分一致） --- */
    forceInsertPlansTriplet(groups);
  }

  /* 3項目の抽出（ページ全体から部分一致で拾う） */
  function findDetailsByTextLike(regex){
    var hits=[];
    qsa('.accordion details').forEach(function(d){
      var s = qs('summary', d); if(!s) return; var txt = norm(s.textContent);
      if(regex.test(txt)) hits.push(d);
    });
    return hits;
  }

  function forceInsertPlansTriplet(groups){
    if(!groups) return;

    /* 候補（日本語/英語 ざっくりパターン） */
    var rPlan   = /(料金|価格|プラン|plan)/i;
    var rYear2  = /(2年目|二年目|year ?2|second)/i;
    var rSupport= /(維持|サポート|support|maintenance)/i;
    var rFaq    = /(よくある質問|FAQ)/i;

    /* 法人設立グループを特定（見出しに「法人設立」を含むもの） */
    var corpGroup;
    qsa('.menu-group', groups).forEach(function(g){
      var t = norm(qs('h4', g).textContent||'');
      if(/法人設立/i.test(t) && !corpGroup) corpGroup = g;
    });
    if(!corpGroup) return;

    var ul = qs('.menu-list', corpGroup);
    if(!ul) return;

    /* 既存 KYC の位置（KYC/監査/FMS を部分一致） */
    var insertIndex = -1;
    var items = qsa('li', ul);
    Array.prototype.forEach.call(items, function(li, idx){
      var txt = norm(li.textContent);
      if(insertIndex<0 && /(KYC|FMS|監査)/i.test(txt)) insertIndex = idx + 1;
    });
    if(insertIndex<0) insertIndex = items.length; // なければ末尾

    /* 対象 <details> をページから取得 */
    var plan  = findDetailsByTextLike(rPlan)[0] || null;
    var y2sup = findDetailsByTextLike(new RegExp(rYear2.source+'.*'+rSupport.source,'i'))[0] ||
                findDetailsByTextLike(rSupport)[0] || null;
    var faq   = findDetailsByTextLike(new RegExp(rFaq.source+'.*'+rYear2.source,'i'))[0] ||
                findDetailsByTextLike(rFaq)[0] || null;

    var triples = [plan, y2sup, faq].filter(Boolean);

    /* 既にメニューに存在するかチェック（id or テキストで重複防止） */
    function existsByIdOrText(target){
      if(!target) return true;
      var id = ensureId(target,'sec');
      var text = norm((qs('summary',target)||{}).textContent||'');
      var found = false;
      qsa('a', ul).forEach(function(a){
        if(a.getAttribute('href')==='#'+id || norm(a.textContent)===text) found = true;
      });
      return found;
    }

    var frag = document.createDocumentFragment();
    triples.forEach(function(d){
      if(!d || existsByIdOrText(d)) return;
      var id = ensureId(d,'sec');
      var label = norm((qs('summary',d)||{}).textContent||'');
      var li = document.createElement('li');
      var a  = document.createElement('a'); a.href = '#'+id; a.textContent = label;
      a.addEventListener('click', function(e){ e.preventDefault(); setMenu(false); openAndJump(d); });
      li.appendChild(a); frag.appendChild(li);
    });

    /* 指定位置へ差し込み */
    var ref = qsa('li', ul)[insertIndex] || null;
    ul.insertBefore(frag, ref);
  }

  /* イベント配線 */
  function wire(){
    var menuBtn = qs('.menu-button');
    var closeBtn= qs('.menu-close');
    var mback   = qs('.menu-backdrop');
    var langBtn = qs('.lang-button');
    var lclose  = qs('.lang-close');
    var lback   = qs('.lang-backdrop');

    on(menuBtn,'click',function(){ setMenu(true); });
    on(closeBtn,'click',function(){ setMenu(false); });
    on(mback,'click',function(){ setMenu(false); });

    on(langBtn,'click',function(){ setLang(true); });
    on(lclose,'click',function(){ setLang(false); });
    on(lback,'click',function(){ setLang(false); });

    on(window,'resize',fixMenuTopGap);
    on(window,'orientationchange',fixMenuTopGap);
  }

  /* 起動 */
  ready(function(){
    ensureMenuUI();
    buildMenu();
    wire();
  });
})();
</script>
