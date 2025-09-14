/* =========================================================
   script.js — 安定版（純正Google翻訳 + フォールバック）
   既存UIは崩さず、ハンバーガー直下に「Translate / 言語」ボタン。
   ========================================================= */

/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === スクロール容器 #scroll-root（本文HTMLは無改変のまま） === */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;
  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');
  const wrap = document.createElement('div'); wrap.id = 'scroll-root';
  if (cta) body.insertBefore(wrap, cta); else body.appendChild(wrap);
  const keep = new Set([cta, menuBtn, menuDrawer, wrap]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

/* ===== ページ内リンク（スムーススクロール） ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const id = a.getAttribute('href'); const target = document.querySelector(id); if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (target.id !== 'disclaimer') { const first = target.querySelector('details'); if (first && !first.open) first.open = true; }
  history.pushState(null, '', id);
});

/* ===== 「トップへ」 ===== */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  const scroller = document.getElementById('scroll-root') || window;
  scroller.scrollTo?.({ top: 0, behavior: 'smooth' });
});

/* ===== 固定CTAの高さを本文余白に反映 ===== */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.cta-bar') || document.getElementById('ctaBar') || document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  const scroller = document.getElementById('scroll-root');
  if (scroller) scroller.classList.add('has-cta'); else document.body.classList.add('has-cta');
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
  const frag = document.createDocumentFragment(); let i = 1;
  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;
    const wrap = document.createElement('div'); wrap.className = 'menu-group';
    const h2 = sec.querySelector('h2');
    if (h2 && sec.id !== 'plans') { const h4 = document.createElement('h4'); h4.textContent = (h2.textContent || '').trim(); wrap.appendChild(h4); }
    else { wrap.classList.add('no-title'); }
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
function killPlansHeading(){
  if (!groupsRoot) return;
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{ if (h.textContent.trim().toLowerCase() === 'plans') h.remove(); });
}
addEventListener('DOMContentLoaded', buildMenu);
addEventListener('load', killPlansHeading);
if (groupsRoot) new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });

/* ===== 重複ブロック除去（免責/キャンセルは下だけ残す） ===== */
function cutOnlyBottomDup() {
  document.getElementById('site-disclaimer')?.remove();
  document.querySelectorAll('details.disclaimer').forEach(d => d.remove());
  document.querySelectorAll('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });
  const cancels = Array.from(document.querySelectorAll('details')).filter(d=>/キャンセルポリシー/.test(d.querySelector('summary')?.textContent?.trim()||''));
  if (cancels.length > 1) {
    const keep = cancels.find(d => d.closest('#disclaimer')) || cancels[0];
    cancels.forEach(d => { if (d !== keep) d.remove(); });
  }
}
document.addEventListener('DOMContentLoaded', cutOnlyBottomDup);
window.addEventListener('load', cutOnlyBottomDup);

/* ===== CTA 最下部固定の保険（transformのみ触る） ===== */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');
  if (!bar || !window.visualViewport) return;
  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport; const doc = document.documentElement;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    let maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop); if (maxScroll < 0) maxScroll = 0;
    const y = (document.getElementById('scroll-root') || window).scrollY || window.scrollY || 0;
    const isBouncingBottom = y > maxScroll + 1; if (!isBouncingBottom) stable = uiGap;
    const use = isBouncingBottom ? stable : uiGap; const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };
  apply();
  visualViewport.addEventListener('resize',  apply);
  visualViewport.addEventListener('scroll',  apply);
  window.addEventListener('scroll',          apply, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* =========================================================
   ▼ 翻訳UI（純正ウィジェット / 失敗時は外部翻訳リンクへ）
   ========================================================= */
(function mountTranslateUI(){
  // スタイル
  const css = `
    .lang-fab{
      position:fixed; z-index:10000;
      top: calc(64px + env(safe-area-inset-top, 0px));
      right: calc(12px + env(safe-area-inset-right, 0px));
      display:inline-flex; align-items:center; gap:.5rem;
      background: rgba(30, 41, 59, .78); color:#fff;
      border:1px solid rgba(255,255,255,.18); border-radius:12px;
      padding:.45rem .65rem; font:600 12px/1 system-ui, -apple-system, "Noto Sans JP", sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,.22); backdrop-filter: blur(8px);
    }
    .lang-fab .dot{ width:8px; height:8px; border-radius:999px; background:#60a5fa; box-shadow:0 0 0 2px rgba(96,165,250,.35) inset }
    .lang-overlay{ position:fixed; inset:0; z-index:10000; background:rgba(15,23,42,.28); opacity:0; pointer-events:none; transition:opacity .18s ease; }
    .lang-panel{
      position:fixed; z-index:10001; left:50%; top:110px; transform:translateX(-50%) translateY(-6px); width:min(860px,92vw);
      background:#fff; color:#0b1220; border-radius:14px; border:1px solid #e5e7eb; box-shadow:0 20px 60px rgba(2,6,23,.25);
      overflow:hidden; opacity:0; pointer-events:none; transition:opacity .18s ease, transform .18s ease;
    }
    .lang-head{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 12px; border-bottom:1px solid #e5e7eb; background:#f8fafc; font-weight:800; }
    .lang-close{ background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:.35rem .6rem; }
    .lang-body{ padding:12px; min-height:56px; }
    .lang-open .lang-overlay{ opacity:1; pointer-events:auto; }
    .lang-open .lang-panel{ opacity:1; pointer-events:auto; transform:translateX(-50%) translateY(0); }
    .gt-fallback{ display:none; margin-top:8px; }
    .gt-fallback .chips{ display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; }
    .gt-fallback .chips a{ display:inline-flex; padding:.35rem .6rem; border:1px solid #e5e7eb; border-radius:999px; text-decoration:none; color:#0b1220; background:#f8fafc; }
    @media (max-width:480px){ .lang-panel{ top:90px; } }
  `;
  const st = document.createElement('style'); st.id = 'langStyles'; st.textContent = css; document.head.appendChild(st);

  // トリガー（ハンバーガーの直下）
  const fab = document.createElement('button');
  fab.type = 'button'; fab.id = 'langFab'; fab.className = 'lang-fab'; fab.setAttribute('aria-haspopup','dialog');
  fab.innerHTML = `<span class="dot" aria-hidden="true"></span><span>Translate / 言語</span>`;
  document.body.appendChild(fab);

  // モーダル骨組み
  const overlay = document.createElement('div'); overlay.id = 'langOverlay'; overlay.className = 'lang-overlay';
  const panel   = document.createElement('div'); panel.id = 'langPanel'; panel.className = 'lang-panel';
  panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-label','言語 / Language');
  panel.innerHTML = `
    <div class="lang-head">
      <strong>言語 / Language</strong>
      <button type="button" class="lang-close" id="langClose">Close</button>
    </div>
    <div class="lang-body">
      <div id="google_translate_element"></div>
      <div id="gt-fallback" class="gt-fallback">
        <div style="font-size:12px; color:#475569">翻訳モジュールの読み込みに失敗しました。下のクイック翻訳をご利用ください。</div>
        <div class="chips" id="gt-quick"></div>
      </div>
    </div>`;
  document.body.appendChild(overlay); document.body.appendChild(panel);

  const open = ()=>{ document.documentElement.classList.add('lang-open'); };
  const close = ()=>{ document.documentElement.classList.remove('lang-open'); };
  fab.addEventListener('click', () => { open(); ensureGoogleTranslateLoaded(); });
  overlay.addEventListener('click', close);
  panel.querySelector('#langClose')?.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  /* ---- 純正ウィジェット（削除・改変なし） ---- */
  let requested = false;
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({
        pageLanguage: 'ja',
        autoDisplay: false,
        includedLanguages: 'en,zh-CN,zh-TW,ko,fr,es,de,ru,ar,hi,th,vi,id,ms,pt,tl,tr,uk,pl,fil,it,nl,sv,fi,da,no,cs,ro,el,he,bg,hu,sk,sl,hr,lt,lv,et,fa,ur,bn,km,lo,si,ne,ca',
        // ドロップダウン式
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');
      // 成功したらフォールバックは隠す
      document.getElementById('gt-fallback').style.display = 'none';
    }catch(e){
      showFallback();
    }
  };

  function ensureGoogleTranslateLoaded(){
    // 既に読み込み済みなら何もしない
    if (window.google && window.google.translate && window.google.translate.TranslateElement) return;
    // 初回リクエスト
    if (!requested) {
      requested = true;
      const s = document.createElement('script');
      s.id  = 'gt-script';
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      s.onerror = showFallback;
      document.head.appendChild(s);
      // タイムアウト監視（ネットワーク/拡張機能でブロック時）
      setTimeout(()=> {
        if (!(window.google && window.google.translate && window.google.translate.TranslateElement)) {
          showFallback();
        }
      }, 3500);
    }
  }

  /* ---- 失敗時のフォールバック：外部の Google 翻訳ページで表示 ---- */
  function showFallback(){
    const hold = document.getElementById('gt-fallback'); if (!hold) return;
    const list = [
      ['English','en'], ['中文(简)','zh-CN'], ['中文(繁)','zh-TW'], ['한국어','ko'], ['Français','fr'],
      ['Español','es'], ['Deutsch','de'], ['Русский','ru'], ['العربية','ar'], ['हिन्दी','hi'],
      ['ไทย','th'], ['Tiếng Việt','vi'], ['Bahasa Indonesia','id'], ['Bahasa Melayu','ms'], ['Português','pt'],
      ['Filipino','fil'], ['Türkçe','tr'], ['Українська','uk'], ['Polski','pl'], ['Italiano','it']
    ];
    const box = document.getElementById('gt-quick'); box.textContent = '';
    const base = 'https://translate.google.com/translate?hl=auto&sl=auto';
    const u = '&u=' + encodeURIComponent(location.href);
    list.forEach(([label, code])=>{
      const a = document.createElement('a');
      a.href = `${base}&tl=${code}${u}`;
      a.target = '_blank'; a.rel = 'noopener';
      a.textContent = label;
      box.appendChild(a);
    });
    hold.style.display = 'block';
  }
})();
