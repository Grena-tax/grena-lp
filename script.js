/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === 追加①：ページ本体をスクロール容器に移す（HTMLは無改変） === */
(function mountScrollRoot(){
  try{
    if (document.getElementById('scroll-root')) return;

    const body = document.body;
    const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
    const menuBtn = document.getElementById('menuBtn');
    const menuDrawer = document.getElementById('menuDrawer');

    const wrap = document.createElement('div');
    wrap.id = 'scroll-root';

    // CTAより上にスクロール容器を挿入
    if (cta) body.insertBefore(wrap, cta);
    else body.appendChild(wrap);

    // CTA・メニューUI以外を全部 #scroll-root に移動
    const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
    Array.from(body.childNodes).forEach(n => {
      if (!keep.has(n)) wrap.appendChild(n);
    });
  }catch(e){
    // 何か起きても後段フェイルセーフで復旧
  }
})();

/* ===== ページ内リンク（スムーススクロール） ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 免責(#disclaimer) だけは自動オープンしない
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* ===== 「トップへ」 ===== */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    const scroller = document.getElementById('scroll-root') || window;
    if (scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ===== 固定CTAの高さ → 本文余白に反映（※bottomはJSで触らない） ===== */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  const scroller = document.getElementById('scroll-root');
  if (scroller) scroller.classList.add('has-cta');
  else document.body.classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン ===== */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー開閉 ===== */
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

/* ===== メニュー（ハンバーガー内）自動生成 ===== */
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
    } else {
      wrap.classList.add('no-title');
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });

    wrap.appendChild(ul);
    frag.appendChild(wrap);
  });

  if (!groupsRoot) return;
  groupsRoot.textContent = '';
  groupsRoot.appendChild(frag);
  killPlansHeading();
}

function killPlansHeading(){
  if (!groupsRoot) return;
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}
addEventListener('DOMContentLoaded', buildMenu);
addEventListener('load', killPlansHeading);
if (groupsRoot) {
  new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });
}

/* ===== 重複ブロック除去（免責/キャンセルを #disclaimer だけに揃える） ===== */
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

/* ===== ここ重要：CTAの bottom を JS では一切いじらない ===== */

/* === 追加②：保険（UI縮みの追従だけtransformで相殺。bounce中は値を凍結） === */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  let stable = 0; // 直近の安定値
  const apply = () => {
    const vv  = window.visualViewport;
    const doc = document.documentElement;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
    if (maxScroll < 0) maxScroll = 0;
    const y = (document.getElementById('scroll-root') || window).scrollY || window.scrollY || 0;

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
   言語ボタン（前回のまま・挙動は変更なし）
   ========================================================== */
(function mountLanguageUI(){
  const langs = [
    ['en','English'],['zh-CN','中文(简)'],['zh-TW','中文(繁)'],['ko','한국어'],
    ['fr','Français'],['es','Español'],['de','Deutsch'],['ru','Русский'],
    ['ar','العربية'],['hi','हिन्दी'],['th','ไทย'],['vi','Tiếng Việt'],
    ['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],['pt','Português'],
    ['it','Italiano'],['uk','Українська'],['pl','Polski'],['fil','Filipino'],
    ['tr','Türkçe']
  ];

  const fab = document.createElement('button');
  fab.id = 'langFab';
  fab.type = 'button';
  fab.textContent = 'Translate / 言語';
  Object.assign(fab.style, {
    position:'fixed', top: 'calc(62px + var(--safe-top, 0px))', right:'calc(12px + var(--safe-right, 0px))',
    zIndex: '10001',
    padding:'8px 12px', borderRadius:'12px', border:'1px solid rgba(255,255,255,.18)',
    background:'#3a3f4abf', color:'#fff', fontWeight:'700', fontSize:'12px',
    boxShadow:'0 8px 24px rgba(0,0,0,.18)', backdropFilter:'saturate(140%) blur(6px)', cursor:'pointer'
  });
  fab.setAttribute('aria-haspopup','dialog');
  fab.setAttribute('aria-controls','langPanel');
  document.body.appendChild(fab);

  let panel, header, content, closeBtn, tried = false;

  function buildPanel(){
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'langPanel';
    Object.assign(panel.style, {
      position:'fixed', top:'84px', right:'12px', width:'min(680px, 92vw)',
      background:'#fff', color:'#0b1220', border:'1px solid #e5e7eb', borderRadius:'14px',
      boxShadow:'0 20px 50px rgba(0,0,0,.18)', zIndex:'10000'
    });
    header = document.createElement('div');
    header.textContent = '言語 / Language';
    Object.assign(header.style, {
      fontWeight:'800', padding:'12px 14px', borderBottom:'1px solid #e5e7eb',
      display:'flex', alignItems:'center', justifyContent:'space-between'
    });
    closeBtn = document.createElement('button');
    closeBtn.type='button';
    closeBtn.textContent='Close';
    Object.assign(closeBtn.style,{
      border:'1px solid #e5e7eb', background:'#fff', borderRadius:'10px',
      padding:'6px 10px', cursor:'pointer'
    });
    closeBtn.addEventListener('click',()=> panel.remove());
    header.appendChild(closeBtn);

    content = document.createElement('div');
    Object.assign(content.style,{ padding:'14px', maxHeight:'60vh', overflow:'auto' });

    const holder = document.createElement('div');
    holder.id = 'google_translate_element';
    content.appendChild(holder);

    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);
  }

  function renderFallback(){
    const wrap = document.createElement('div');
    wrap.setAttribute('role','group');
    Object.assign(wrap.style,{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'4px' });
    const u = location.href;
    const langsList = [
      ['en','English'],['zh-CN','中文(简)'],['zh-TW','中文(繁)'],['ko','한국어'],
      ['fr','Français'],['es','Español'],['de','Deutsch'],['ru','Русский'],
      ['ar','العربية'],['hi','हिन्दी'],['th','ไทย'],['vi','Tiếng Việt'],
      ['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],['pt','Português'],
      ['it','Italiano'],['uk','Українська'],['pl','Polski'],['fil','Filipino'],
      ['tr','Türkçe']
    ];
    langsList.forEach(([code, label])=>{
      const a = document.createElement('a');
      a.textContent = label;
      a.href = `https://translate.google.com/translate?sl=ja&tl=${encodeURIComponent(code)}&u=${encodeURIComponent(u)}`;
      a.target = '_blank'; a.rel = 'noopener';
      Object.assign(a.style,{
        display:'inline-block', padding:'8px 12px', borderRadius:'999px',
        background:'#f3f4f6', border:'1px solid #e5e7eb', textDecoration:'none', color:'#334155',
        fontWeight:'700', fontSize:'13px', whiteSpace:'nowrap'
      });
      wrap.appendChild(a);
    });
    content.appendChild(wrap);
  }

  function loadGoogleTranslate(){
    return new Promise((resolve)=>{
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        resolve(true); return;
      }
      const s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=__gtReady';
      s.async = true;
      window.__gtReady = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  function initTranslateElement(){
    try{
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        autoDisplay: false,
        includedLanguages: langs.map(l=>l[0]).join(','),
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
      const pad = document.createElement('div'); pad.style.height='6px'; content.appendChild(pad);
    }catch(_){ renderFallback(); }
  }

  fab.addEventListener('click', async ()=>{
    buildPanel();
    if (!tried){
      tried = true;
      const ok = await loadGoogleTranslate();
      if (ok && window.google?.translate?.TranslateElement) initTranslateElement();
      else {
        const msg = document.createElement('div');
        msg.textContent = 'Translation module didn’t load. Quick language:';
        Object.assign(msg.style,{ margin:'6px 0 10px', color:'#64748b', fontSize:'13px' });
        content.appendChild(msg);
        renderFallback();
      }
    }
  });
})();

/* ==========================================================
   フェイルセーフ：スクロール/クリック不能の自己修復
   ========================================================== */
(function failSafe(){
  // 1) メニューが誤って開きっぱなしなら閉じる
  document.documentElement.classList.remove('menu-open');

  // 2) #scroll-root が無い/効いてない場合は、windowスクロールに復旧
  const scroller = document.getElementById('scroll-root');
  const unlockWindowScroll = () => {
    try{
      document.documentElement.style.setProperty('overflow','auto','important');
      document.documentElement.style.removeProperty('height');
      document.body.style.setProperty('overflow','auto','important');
      document.body.style.removeProperty('height');
    }catch(_){}
  };

  if (!scroller) { unlockWindowScroll(); return; }

  // 3) 形はあるがスクロールできない場合（高さが足りない等）も復旧
  try{
    const tooShort = scroller.scrollHeight <= scroller.clientHeight + 1;
    const hasOverflow = getComputedStyle(scroller).overflowY;
    if (tooShort || hasOverflow === 'hidden') unlockWindowScroll();
    // 念のためクリック阻害になりそうな透明要素を削除
    document.querySelectorAll('[data-overlay], .menu-backdrop[style*="opacity: 0"]').forEach(x=>x.remove());
  }catch(_){
    unlockWindowScroll();
  }
})();
