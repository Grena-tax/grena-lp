/* ===== v20250914-02 stable ===== */
/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === 本文用スクロール容器（HTML無改変） === */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;
  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';
  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);

  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

/* === ページ内リンク（スムース） === */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* === 「トップへ」 === */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    const scroller = document.getElementById('scroll-root') || window;
    scroller.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
});

/* === CTA高さ → 余白反映 === */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  const scroller = document.getElementById('scroll-root');
  (scroller || document.body).classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* === 申込ボタン === */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* === ハンバーガー === */
const btn        = document.getElementById('menuBtn');
const drawer     = document.getElementById('menuDrawer');
const closeBt    = document.getElementById('menuClose');
const overlay    = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };
btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* === メニュー自動生成 === */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
function buildMenu(){
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;
  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'menu-group';
    const h2 = sec.querySelector('h2');
    if (h2 && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = (h2.textContent || '').trim();
      wrap.appendChild(h4);
    } else { wrap.classList.add('no-title'); }
    const ul = document.createElement('ul'); ul.className = 'menu-list';
    details.forEach(d=>{
      const s = d.querySelector('summary'); const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;
      const li = document.createElement('li'); const a  = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{ e.preventDefault(); closeMenu(); d.open = true; d.scrollIntoView({behavior:'smooth', block:'start'}); history.pushState(null,'',`#${d.id}`); });
      li.appendChild(a); ul.appendChild(li);
    });
    wrap.appendChild(ul); frag.appendChild(wrap);
  });
  if (!groupsRoot) return;
  groupsRoot.textContent = ''; groupsRoot.appendChild(frag); killPlansHeading();
}
function killPlansHeading(){ if (!groupsRoot) return; groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{ if (h.textContent.trim().toLowerCase() === 'plans') h.remove(); }); }
addEventListener('DOMContentLoaded', buildMenu);
addEventListener('load', killPlansHeading);
if (groupsRoot) new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });

/* === 重複ブロック除去 === */
function cutOnlyBottomDup() {
  document.getElementById('site-disclaimer')?.remove();
  document.querySelectorAll('details.disclaimer').forEach(d => d.remove());
  document.querySelectorAll('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });
  const cancels = Array.from(document.querySelectorAll('details')).filter(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    return /キャンセルポリシー/.test(t);
  });
  if (cancels.length > 1) {
    const keep = cancels.find(d => d.closest('#disclaimer')) || cancels[0];
    cancels.forEach(d => { if (d !== keep) d.remove(); });
  }
}
document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);
window.addEventListener('load', cutOnlyBottomDup);

/* === CTAはbottomをJSで触らない（transform相殺のみ） === */
(function lockCtaToBottomFreeze(){
  const bar = document.querySelector('.fixed-cta') || document.querySelector('.cta-bar') || document.getElementById('ctaBar');
  if (!bar || !window.visualViewport) return;
  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const doc = document.documentElement;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
    if (maxScroll < 0) maxScroll = 0;
    const sc = (document.getElementById('scroll-root') || window);
    const y = sc.scrollY || window.scrollY || 0;
    const isBouncingBottom = y > maxScroll + 1;
    if (!isBouncingBottom) stable = uiGap;
    const use = isBouncingBottom ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };
  apply();
  visualViewport.addEventListener('resize',  apply);
  visualViewport.addEventListener('scroll',  apply);
  window.addEventListener('scroll',          apply, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* ==========================================================
   言語UI：コンパクトなドロップダウン（重複/はみ出し防止）
   成功→その場切替 / 失敗→Google翻訳版ページを新規タブ
   ========================================================== */
(function mountLanguageUI(){
  if (window.__langUIInited) return; window.__langUIInited = true;

  // 残骸掃除（重複ボタン/旧パネル）
  document.querySelectorAll('#langPanel, .lang-panel, #langFab, .lang-fab,[data-role="lang-fab"]').forEach((el,i)=>{ if (i>0 || el.id !== 'menuBtn') el.remove?.(); });

  const langs = [
    ['en','English'],['zh-CN','中文(简)'],['zh-TW','中文(繁)'],['ko','한국어'],['fr','Français'],
    ['es','Español'],['de','Deutsch'],['ru','Русский'],['ar','العربية'],['hi','हिन्दी'],
    ['th','ไทย'],['vi','Tiếng Việt'],['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],
    ['pt','Português'],['it','Italiano'],['uk','Українська'],['pl','Polski'],['fil','Filipino'],['tr','Türkçe']
  ];

  // ===== FAB（ハンバーガーの下）=====
  let fab = document.getElementById('langFab');
  if (!fab) {
    fab = document.createElement('button');
    fab.id = 'langFab'; fab.dataset.role = 'lang-fab'; fab.type = 'button';
    fab.textContent = 'Translate / 言語';
    Object.assign(fab.style, {
      position:'fixed', right:'12px', zIndex:'10001',
      padding:'8px 12px', borderRadius:'12px',
      border:'1px solid rgba(0,0,0,.08)', background:'rgba(33,37,45,.86)', color:'#fff',
      fontWeight:'700', fontSize:'12px', boxShadow:'0 12px 28px rgba(0,0,0,.24)',
      backdropFilter:'saturate(140%) blur(6px)', cursor:'pointer'
    });
    document.body.appendChild(fab);
  }
  const anchorBtn = document.getElementById('menuBtn');
  const placeFab = () => {
    const r = anchorBtn?.getBoundingClientRect();
    fab.style.top = r ? `${Math.round(r.bottom + 8)}px` : '78px';
  };
  placeFab(); addEventListener('resize', placeFab);

  // ===== ドロップダウン本体 =====
  let open = false, panel = null, backdrop = null, content = null, selectEl = null;

  const layoutToFab = () => {
    const rect = fab.getBoundingClientRect();
    const right = Math.max(12, window.innerWidth - rect.right + 12);
    if (panel) {
      panel.style.right = right + 'px';
      panel.style.top   = Math.round(rect.bottom + 8) + 'px';
    }
  };

  const buildPanel = () => {
    if (panel) return;

    // backdrop（外クリックで閉じる）
    backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
      position:'fixed', inset:'0', background:'transparent',
      zIndex:'10000'
    });
    backdrop.addEventListener('click', closePanel);

    // panel
    panel = document.createElement('div');
    panel.id = 'langPanel'; panel.className = 'lang-panel';
    Object.assign(panel.style, {
      position:'fixed', right:'12px', top:'84px',
      width:'min(560px, 92vw)', maxHeight:'60vh', overflow:'auto',
      background:'#fff', color:'#0b1220',
      border:'1px solid #e5e7eb', borderRadius:'14px',
      boxShadow:'0 24px 60px rgba(0,0,0,.22)', zIndex:'10002'
    });

    // header
    const head = document.createElement('div');
    Object.assign(head.style,{fontWeight:'800',padding:'10px 12px',borderBottom:'1px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'space-between'});
    head.textContent = '言語 / Language';
    const close = document.createElement('button');
    close.type='button'; close.textContent='Close';
    Object.assign(close.style,{border:'1px solid #e5e7eb',background:'#fff',borderRadius:'10px',padding:'6px 10px',cursor:'pointer'});
    close.addEventListener('click', closePanel);
    head.appendChild(close);

    // content
    content = document.createElement('div');
    Object.assign(content.style,{ padding:'12px' });

    panel.appendChild(head); panel.appendChild(content);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    layoutToFab();
  };

  // チップ描画（必ず panel 内に入れる）
  const renderQuickChips = () => {
    if (!content || content.querySelector('[data-quick]')) return;
    const wrap = document.createElement('div');
    wrap.dataset.quick = '1';
    Object.assign(wrap.style,{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'8px' });

    const clickChip = (code) => {
      const sel = selectEl || document.querySelector('select.goog-te-combo');
      if (sel) {
        sel.value = code;
        sel.dispatchEvent(new Event('change', { bubbles:true }));
      } else {
        const u = location.href;
        const url = `https://translate.google.com/translate?sl=ja&tl=${encodeURIComponent(code)}&u=${encodeURIComponent(u)}`;
        window.open(url, '_blank', 'noopener');
      }
    };

    langs.forEach(([code,label])=>{
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      Object.assign(b.style,{
        padding:'8px 10px', borderRadius:'10px',
        background:'#f3f4f6', border:'1px solid #e5e7eb', color:'#334155',
        fontWeight:'700', fontSize:'13px', whiteSpace:'nowrap', cursor:'pointer'
      });
      b.addEventListener('click', ()=> clickChip(code));
      wrap.appendChild(b);
    });
    content.appendChild(wrap);
  };

  // Google翻訳（あれば利用）
  let gtLoaded = false;
  const tryMountGoogle = async () => {
    if (gtLoaded) return !!selectEl;
    try{
      await new Promise((resolve)=>{
        if (window.google?.translate?.TranslateElement) return resolve(true);
        const s = document.createElement('script');
        s.src = 'https://translate.google.com/translate_a/element.js?cb=__gtReady';
        s.async = true;
        window.__gtReady = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });
      if (!window.google?.translate?.TranslateElement) return false;

      // ダミーコンテナに生成→selectだけ抜き出して panel 内に移植（「Powered by〜」を持ち込まない）
      const holder = document.createElement('div'); holder.id = 'google_translate_element'; holder.style.display='block';
      document.body.appendChild(holder);
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        autoDisplay: false,
        includedLanguages: langs.map(l=>l[0]).join(','),
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');

      await new Promise(r=>{
        const timer = setInterval(()=>{
          const sel = holder.querySelector('select.goog-te-combo');
          if (sel) { selectEl = sel; clearInterval(timer); r(true); }
        }, 50);
        setTimeout(()=>{ clearInterval(timer); r(false); }, 2000);
      });

      holder.remove();
      if (selectEl) {
        const row = document.createElement('div');
        Object.assign(row.style,{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'});
        const lab = document.createElement('strong');
        lab.textContent = 'Select / 言語を選択'; lab.style.fontSize = '13px';
        selectEl.style.minWidth = '220px';
        row.appendChild(lab); row.appendChild(selectEl);
        content.prepend(row);
      }
      gtLoaded = true;
      return !!selectEl;
    }catch(_){ return false; }
  };

  function openPanel(){
    if (open) return;
    buildPanel(); renderQuickChips(); tryMountGoogle();
    open = true; layoutToFab();
    addEventListener('resize', layoutToFab);
    addEventListener('keydown', onKey);
  }
  function closePanel(){
    if (!open) return;
    panel?.remove(); backdrop?.remove();
    panel = backdrop = content = null;
    open = false;
    removeEventListener('resize', layoutToFab);
    removeEventListener('keydown', onKey);
  }
  function onKey(e){ if (e.key === 'Escape') closePanel(); }

  fab.addEventListener('click', ()=> open ? closePanel() : openPanel());
})();
