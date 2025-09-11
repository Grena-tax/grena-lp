/* ===== 申込フォームURL（実URL） ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* ===== 初期UI（無ければ自動注入） ===== */
function injectUI(){
  // page-top
  if(!document.getElementById('page-top')){
    const top = document.createElement('div'); top.id='page-top'; top.setAttribute('aria-hidden','true');
    document.body.prepend(top);
  }
  // 固定CTA
  if(!document.getElementById('ctaBar')){
    const tpl = `
      <div class="row">
        <a class="btn neutral" id="toTop" href="#page-top" aria-label="ページ上部へ">トップへ</a>
        <a class="btn secondary" href="https://line.me/R/ti/p/@georgia-tax" target="_blank" rel="noopener">相談はこちら</a>
        <a class="btn success" id="applyNow" href="#" rel="noopener">今すぐ申し込み</a>
      </div>`;
    const cta = document.createElement('div');
    cta.className = 'fixed-cta'; cta.id = 'ctaBar'; cta.setAttribute('role','region'); cta.setAttribute('aria-label','お申込みと相談の操作バー');
    cta.innerHTML = tpl;
    document.body.appendChild(cta);
  }
  // ハンバーガー（右上）
  if(!document.getElementById('menuBtn')){
    const btn = document.createElement('button');
    btn.className = 'menu-button'; btn.id='menuBtn'; btn.setAttribute('aria-controls','menuDrawer'); btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-label','メニューを開閉');
    btn.innerHTML = '<span class="bars"><span></span></span>';
    document.body.appendChild(btn);
  }
  if(!document.getElementById('menuDrawer')){
    const nav = document.createElement('nav'); nav.className='menu-wrap'; nav.id='menuDrawer'; nav.setAttribute('aria-hidden','true');
    nav.innerHTML = `
      <div class="menu-backdrop" id="menuBackdrop"></div>
      <aside class="menu-panel" role="dialog" aria-modal="true" aria-label="目次（各セクションへ移動）">
        <div class="menu-head">
          <strong class="menu-title">目次（各セクションへ移動）</strong>
          <button class="menu-close" id="menuClose" aria-label="閉じる">×</button>
        </div>
        <div class="menu-groups" id="menuGroups"></div>
      </aside>`;
    document.body.appendChild(nav);
  }
  // 翻訳ボタン（地球儀）
  if(!document.getElementById('lang-button')){
    const b = document.createElement('button');
    b.id='lang-button'; b.className='lang-button'; b.type='button'; b.setAttribute('aria-label','言語を選択');
    b.innerHTML='🌐';
    document.body.appendChild(b);
  }
  if(!document.getElementById('lang-panel')){
    const p = document.createElement('div');
    p.id='lang-panel'; p.className='lang-panel'; p.innerHTML=`
      <div class="lang-head">言語</div>
      <div id="google_translate_element"></div>
      <div class="lang-foot">※ 自動翻訳です。表示が崩れる場合があります。</div>
    `;
    document.body.appendChild(p);
  }
}

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
function bindToTop(){
  document.getElementById('toTop')?.addEventListener('click', (e)=>{
    if (!document.querySelector('#page-top')) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

/* ===== 固定CTAの高さ → 本文余白に反映（旧CTA互換） ===== */
const adjustCtaPadding = () => {
  const bar = document.getElementById('ctaBar');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン ===== */
function bindApply(){
  document.getElementById('applyNow')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
    window.open(FORM_URL, '_blank', 'noopener');
  });
}

/* ===== ハンバーガー開閉 ===== */
let btn, drawer, closeBt, overlay, groupsRoot;
function bindMenu(){
  btn        = document.getElementById('menuBtn');
  drawer     = document.getElementById('menuDrawer');
  closeBt    = document.getElementById('menuClose');
  overlay    = document.getElementById('menuBackdrop');
  groupsRoot = document.getElementById('menuGroups');

  const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
  const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

  btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
  closeBt?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

  // 自動メニュー
  buildMenu();
  addEventListener('load', killPlansHeading);
  if (groupsRoot) new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });
}

/* ===== メニュー（ハンバーガー内）自動生成 ===== */
/* サブ項目で除外（本文は表示のまま） */
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

    // ★ #plans は見出し(h4)を出さない（= 英字 "plans" を見せない）
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
      if (excludeTitles.some(x => t.includes(x))) return;     // 料金サブ項目は出さない
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        document.documentElement.classList.remove('menu-open');
        drawer?.setAttribute('aria-hidden','true');
        btn?.setAttribute('aria-expanded','false');
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

  groupsRoot && (groupsRoot.textContent = '', groupsRoot.appendChild(frag));
}

/* ===== “plans の見出し” を常に抹消（安全網） ===== */
function killPlansHeading(){
  if (!groupsRoot) return;
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}

/* ===== 重複している“最下部の免責(details)”だけを確実に除去 ===== */
function removeDupDisclaimer(){
  // 1) 直接ID指定のブロックを除去
  const extra = document.getElementById('site-disclaimer');
  if (extra && !extra.closest('#disclaimer')) extra.remove();

  // 2) #disclaimer の外側にある「免責事項（必ずお読みください）」の stray details を保険で除去
  document.querySelectorAll('details').forEach(d=>{
    const s = d.querySelector('summary');
    const t = (s?.textContent || '').trim();
    if (!t) return;
    const isDisclaimerLike = t.includes('免責事項') && t.includes('必ずお読みください');
    if (isDisclaimerLike && !d.closest('#disclaimer')) d.remove();
  });
}

/* ===== 免責：初期は閉じる／#site-disclaimer で来たら開く ===== */
function controlDisclaimer(){
  // 本文側
  const firstOpen = document.querySelector('#disclaimer details[open]');
  firstOpen && firstOpen.removeAttribute('open');

  // 末尾の site-disclaimer（古い一括ブロックが残っている場合の保険）
  const d = document.getElementById('site-disclaimer');
  if (!d) return;

  d.open = false;
  const hashOpen = () => {
    if (location.hash.replace('#','') === 'site-disclaimer') {
      d.open = true;
      setTimeout(() => d.scrollIntoView({behavior:'smooth', block:'start'}), 30);
    }
  };
  hashOpen();
  addEventListener('hashchange', hashOpen);
  d.querySelector('.disclaimer__close')?.addEventListener('click', () => {
    d.open = false;
    history.replaceState(null, '', location.pathname + location.search);
  });
}

/* ===== Google Translate（地球儀） ===== */
function bindTranslate(){
  const btn = document.getElementById('lang-button');
  const panel = document.getElementById('lang-panel');
  if (!btn || !panel) return;

  let opened = false;
  const openP = () => { panel.classList.add('open'); opened = true; };
  const closeP = () => { panel.classList.remove('open'); opened = false; };

  btn.addEventListener('click', (e)=>{ e.stopPropagation(); opened ? closeP() : openP(); });
  document.addEventListener('click', (e)=>{ if(opened && !panel.contains(e.target)) closeP(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeP(); });

  // 既に読み込み済みならそのまま
  if (window.google && window.google.translate) return;

  window.googleTranslateElementInit = function(){
    new google.translate.TranslateElement({
      pageLanguage: 'ja',
      includedLanguages: 'ja,en,zh-CN,zh-TW,ko,ru,de,fr,es,th,ar',
      autoDisplay: false
    }, 'google_translate_element');
  };
  const s = document.createElement('script');
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.defer = true;
  document.head.appendChild(s);
}

/* ===== KYC→料金プランの“間延び”対策（JS側の保険） ===== */
function tightenGap(){
  const corp = document.getElementById('corp-setup');
  const plans = document.getElementById('plans');
  if (!corp || !plans) return;

  // 末尾 details の不要な下マージンを潰す
  const lastDetails = corp.querySelector('.accordion > details:last-of-type');
  lastDetails && lastDetails.style.setProperty('margin-bottom', '0.35rem', 'important');

  // plans 先頭 details の上マージンを詰める
  const firstDetails = plans.querySelector('.accordion > details:first-of-type');
  firstDetails && firstDetails.style.setProperty('margin-top', '0.35rem', 'important');
}

/* ===== 起動シーケンス ===== */
document.addEventListener('DOMContentLoaded', () => {
  injectUI();
  bindToTop();
  bindApply();
  bindMenu();
  controlDisclaimer();
  removeDupDisclaimer();
  bindTranslate();
  tightenGap();
});
addEventListener('load', adjustCtaPadding);
