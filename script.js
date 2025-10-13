// ===== 0) Google 翻訳バナー抑止（表示ずれ防止） =====
(function(){
  function kill(){
    try{
      document.documentElement.style.marginTop='0px';
      document.body.style.top='0px';
      ['goog-te-banner-frame','goog-gt-tt'].forEach(id=>{
        const el = document.getElementById(id);
        if (!el) return;
        if (el.remove) el.remove();
        else { el.style.display='none'; el.style.visibility='hidden'; el.style.height='0'; }
      });
    }catch(_){}
  }
  new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load', kill, {once:true});
  kill();
})();

// ===== 1) ハンバーガー開閉（再タップで閉じる/ESC/背景クリック対応） =====
(function(){
  const html     = document.documentElement;
  const btn      = document.getElementById('menuBtn');
  const drawer   = document.getElementById('menuDrawer');
  const backdrop = document.getElementById('menuBackdrop');
  const closeBtn = document.getElementById('menuClose');

  function setMenu(open){
    html.classList.toggle('menu-open', open);
    drawer?.setAttribute('aria-hidden', String(!open));
    btn?.setAttribute('aria-expanded', String(open));
  }
  function toggle(e){ if(e) e.preventDefault(); setMenu(!html.classList.contains('menu-open')); }
  function close(){ setMenu(false); }

  btn?.addEventListener('click', toggle, {passive:false});
  btn?.addEventListener('touchstart', toggle, {passive:false});
  backdrop?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
})();

// ===== 2) 言語ドロワー（開閉のみ） =====
(function () {
  const html  = document.documentElement;
  const btn   = document.getElementById('langBtn');
  const wrap  = document.getElementById('langDrawer');
  const close = document.getElementById('langClose');
  const back  = document.getElementById('langBackdrop');
  btn?.addEventListener('click', ()=>{ html.classList.add('lang-open'); wrap?.setAttribute('aria-hidden','false'); });
  close?.addEventListener('click', ()=>{ html.classList.remove('lang-open'); wrap?.setAttribute('aria-hidden','true'); });
  back?.addEventListener('click',  ()=>{ html.classList.remove('lang-open'); wrap?.setAttribute('aria-hidden','true'); });
})();

// ===== 3) Google翻訳：公式ウィジェットから英語名でリスト複製 =====
(function(){
  const list   = document.getElementById('langList');
  const search = document.getElementById('langSearch');
  const dn = (window.Intl && Intl.DisplayNames) ? new Intl.DisplayNames(['en'], {type:'language'}) : null;

  function build(){
    const sel = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!sel || !list) { setTimeout(build, 200); return; }

    const frag = document.createDocumentFragment();
    const items = [];
    for (const o of sel.options){
      const code=(o.value||'').trim();
      if (!code || code==='auto') continue;
      const name = (dn ? (dn.of(code)||'') : '') || (o.textContent||'').trim() || code;
      items.push({code,name});
    }
    items.sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));

    list.innerHTML='';
    items.forEach(({code,name})=>{
      const div=document.createElement('div');
      div.className='ls-item';
      div.setAttribute('role','option');
      div.dataset.code=code;
      div.innerHTML=`<span>${name}</span><span class="ls-code">${code}</span>`;
      div.addEventListener('click',()=>{
        sel.value=code;
        sel.dispatchEvent(new Event('change',{bubbles:true}));
        document.documentElement.classList.remove('lang-open');
        document.getElementById('langDrawer')?.setAttribute('aria-hidden','true');
        document.getElementById('langBtn')?.setAttribute('aria-expanded','false');
      });
      frag.appendChild(div);
    });
    list.appendChild(frag);

    if (search){
      search.value='';
      search.oninput=()=>{
        const q=(search.value||'').trim().toLowerCase();
        list.querySelectorAll('.ls-item').forEach(el=>{
          el.style.display = !q || (el.textContent||'').toLowerCase().includes(q) ? '' : 'none';
        });
      };
    }
  }
  setTimeout(build, 600); // 公式初期化を少し待つ
})();
window.googleTranslateElementInit = function(){
  try{ new google.translate.TranslateElement({pageLanguage:'ja',autoDisplay:false}, 'google_translate_element'); }catch(_){}
};

// ===== 4) ハンバーガーのメニュー生成（“料金プラン”見出し/トップを出さず、指定4項目だけ） =====
(function(){
  const groups = document.getElementById('menuGroups');
  if (!groups) return;

  const mkId = base => base.toLowerCase().replace(/[^\w\-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  function ensureId(det, secId, label, idx){
    if (det.id) return det.id;
    const base = mkId(`${secId}-${label||'item'}-${idx+1}`) || `${secId}-d-${idx+1}`;
    let id=base, n=2;
    while (document.getElementById(id)) id=`${base}-${n++}`;
    det.id = id;
    return id;
  }
  function openAndJump(id){
    const html = document.documentElement;
    const target = document.getElementById(id);
    if (!target) return;

    if (target.tagName.toLowerCase()==='details') target.open = true;
    let p = target.parentElement;
    while (p){
      if (p.tagName && p.tagName.toLowerCase()==='details') p.open = true;
      p = p.parentElement;
    }
    requestAnimationFrame(()=>{
      target.scrollIntoView({behavior:'smooth', block:'start'});
      html.classList.remove('menu-open');
      document.getElementById('menuDrawer')?.setAttribute('aria-hidden','true');
      document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
    });
  }

  groups.innerHTML='';

  // 通常セクション（見出し+トップ+全summary）
  [
    ['corp-setup','法人設立'],
    ['sole-setup','個人事業主（IE/SBS）'],
    ['personal-account','個人口座開設（銀行）'],
    ['disclaimer','免責事項・キャンセル']
  ].forEach(([secId, label])=>{
    const sec = document.getElementById(secId);
    if (!sec) return;

    const group = document.createElement('div');
    group.className='menu-group';

    const h4 = document.createElement('h4');
    h4.textContent = label;

    const ul = document.createElement('ul');
    ul.className='menu-list';

    const liTop = document.createElement('li');
    const aTop  = document.createElement('a');
    aTop.href = `#${secId}`;
    aTop.textContent = `${label}（トップ）`;
    aTop.addEventListener('click', (e)=>{ e.preventDefault(); openAndJump(secId); });
    liTop.appendChild(aTop);
    ul.appendChild(liTop);

    sec.querySelectorAll('.accordion summary').forEach((sum, idx)=>{
      const det = sum.closest('details'); if (!det) return;
      const text = (sum.textContent||'').trim().replace(/\s+/g,' ');
      const id   = ensureId(det, secId, text, idx);

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = text;
      a.addEventListener('click', (e)=>{ e.preventDefault(); openAndJump(id); });
      li.appendChild(a);
      ul.appendChild(li);
    });

    group.appendChild(h4);
    group.appendChild(ul);
    groups.appendChild(group);
  });

  // 料金プランは見出し/トップ無しで4項目のみ
  (function(){
    const secId = 'plans';
    const sec = document.getElementById(secId);
    if (!sec) return;

    const keep = new Set([
      '料金プラン（3つのプランから選択）',
      '追加オプション',
      '2年目以降の維持・サポート',
      'よくある質問（2年目以降）'
    ]);

    const group = document.createElement('div');
    group.className='menu-group';
    const ul = document.createElement('ul');
    ul.className='menu-list';

    sec.querySelectorAll('.accordion summary').forEach((sum, idx)=>{
      const label = (sum.textContent||'').trim().replace(/\s+/g,' ');
      if (!keep.has(label)) return;

      const det = sum.closest('details'); if (!det) return;
      const id  = ensureId(det, secId, label, idx);

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = label;
      a.addEventListener('click', (e)=>{ e.preventDefault(); openAndJump(id); });
      li.appendChild(a);
      ul.appendChild(li);
    });

    group.appendChild(ul); // 見出しは付けない＝余白も出ない
    groups.appendChild(group);
  })();
})();
