/* ===== 申込フォームURL（先頭で定義） ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

/* === 追加①：ページ本体をスクロール容器に移す === */
(function mountScrollRoot(){
  if (document.getElementById('scroll-root')) return;

  const body = document.body;
  const cta  = document.querySelector('.fixed-cta, .cta-bar, #ctaBar');
  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');
  const langBtn = document.getElementById('langBtn');
  const langDrawer = document.getElementById('langDrawer');

  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  if (cta) body.insertBefore(wrap, cta);
  else body.appendChild(wrap);

  const keep = new Set([cta, menuBtn, menuDrawer, langBtn, langDrawer, wrap]);
  Array.from([...body.childNodes]).forEach(n => {
    if (!keep.has(n)) wrap.appendChild(n);
  });
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

/* ===== 固定CTAの高さを本文余白に反映 ===== */
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

const openMenu  = () => {
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
  setTimeout(() => closeBt?.focus(), 0);
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
  btn?.focus();
};

btn?.addEventListener('click', () => {
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
});
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* ===== メニュー自動生成 ===== */
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

/* ===== 重複ブロック除去（免責/キャンセルを #disclaimer に集約） ===== */
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

/* ===== CTAのbottomはJSで触らない（iOS対策：transformで相殺） ===== */
(function lockCtaToBottomFreeze(){
  const bar =
    document.querySelector('.fixed-cta') ||
    document.querySelector('.cta-bar')   ||
    document.getElementById('ctaBar');

  if (!bar || !window.visualViewport) return;

  const scroller = document.getElementById('scroll-root') || document.documentElement;

  let stable = 0;
  const apply = () => {
    const vv  = window.visualViewport;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const maxScroll = Math.max(0, (scroller.scrollHeight || 0) - (scroller.clientHeight || 0));

    let y = 0;
    if (scroller === document.documentElement || scroller === document.body) {
      y = window.scrollY || document.documentElement.scrollTop || 0;
    } else {
      y = scroller.scrollTop || 0;
    }

    const isBouncingBottom = y > maxScroll + 1;
    if (!isBouncingBottom) stable = uiGap;

    const use = isBouncingBottom ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize',  apply);
  visualViewport.addEventListener('scroll',  apply);

  if (scroller && scroller.addEventListener) {
    scroller.addEventListener('scroll', apply, { passive: true });
  } else {
    window.addEventListener('scroll', apply, { passive: true });
  }

  window.addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* ===== 言語スイッチ（開閉） ===== */
const langBtn     = document.getElementById('langBtn');
const langDrawer  = document.getElementById('langDrawer');
const langClose   = document.getElementById('langClose');
const langBackdrop= document.getElementById('langBackdrop');

const openLang = () => {
  document.documentElement.classList.add('lang-open');
  langDrawer?.setAttribute('aria-hidden','false');
  langBtn?.setAttribute('aria-expanded','true');
  setTimeout(() => langClose?.focus(), 0);
};
const closeLang = () => {
  document.documentElement.classList.remove('lang-open');
  langDrawer?.setAttribute('aria-hidden','true');
  langBtn?.setAttribute('aria-expanded','false');
  langBtn?.focus();
};

langBtn?.addEventListener('click', ()=>{
  document.documentElement.classList.contains('lang-open') ? closeLang() : openLang();
});
langClose?.addEventListener('click', closeLang);
langBackdrop?.addEventListener('click', closeLang);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeLang(); });

/* メニューと同時開きを避ける */
document.addEventListener('click', (e)=>{
  if (e.target.closest('#menuBtn')) closeLang();
  if (e.target.closest('#langBtn')) closeMenu();
});

/* ===== 言語リスト（Google Translate連携） ===== */
const LANGS = [
  ['af','Afrikaans'],['sq','Albanian'],['am','Amharic'],['ar','Arabic'],['hy','Armenian'],['az','Azerbaijani'],
  ['eu','Basque'],['be','Belarusian'],['bn','Bengali'],['bs','Bosnian'],['bg','Bulgarian'],
  ['my','Burmese'],['ca','Catalan'],['ceb','Cebuano'],['ny','Chichewa'],['zh-CN','Chinese (Simplified)'],['zh-TW','Chinese (Traditional)'],
  ['co','Corsican'],['hr','Croatian'],['cs','Czech'],
  ['da','Danish'],['nl','Dutch'],
  ['en','English'],['eo','Esperanto'],['et','Estonian'],
  ['tl','Filipino'],['fi','Finnish'],['fr','French'],['fy','Frisian'],
  ['gl','Galician'],['ka','Georgian'],['de','German'],['el','Greek'],['gu','Gujarati'],
  ['ht','Haitian Creole'],['ha','Hausa'],['haw','Hawaiian'],['iw','Hebrew'],['hi','Hindi'],['hmn','Hmong'],['hu','Hungarian'],
  ['is','Icelandic'],['ig','Igbo'],['id','Indonesian'],['ga','Irish'],['it','Italian'],
  ['ja','Japanese'],['jw','Javanese'],
  ['kn','Kannada'],['kk','Kazakh'],['km','Khmer'],['rw','Kinyarwanda'],['ko','Korean'],['ku','Kurdish'],['ky','Kyrgyz'],
  ['lo','Lao'],['la','Latin'],['lv','Latvian'],['lt','Lithuanian'],['lb','Luxembourgish'],
  ['mk','Macedonian'],['mg','Malagasy'],['ms','Malay'],['ml','Malayalam'],['mt','Maltese'],['mi','Maori'],['mr','Marathi'],['mn','Mongolian'],
  ['ne','Nepali'],['no','Norwegian'],['or','Odia'],['ps','Pashto'],['fa','Persian'],['pl','Polish'],['pt','Portuguese'],
  ['pa','Punjabi'],['ro','Romanian'],['ru','Russian'],
  ['sm','Samoan'],['gd','Scots Gaelic'],['sr','Serbian'],['st','Sesotho'],['sn','Shona'],['sd','Sindhi'],['si','Sinhala'],
  ['sk','Slovak'],['sl','Slovenian'],['so','Somali'],['es','Spanish'],['su','Sundanese'],['sw','Swahili'],['sv','Swedish'],
  ['tg','Tajik'],['ta','Tamil'],['tt','Tatar'],['te','Telugu'],['th','Thai'],['tr','Turkish'],['tk','Turkmen'],
  ['uk','Ukrainian'],['ur','Urdu'],['ug','Uyghur'],['uz','Uzbek'],
  ['vi','Vietnamese'],['cy','Welsh'],['xh','Xhosa'],['yi','Yiddish'],['yo','Yoruba'],['zu','Zulu']
];

/* 公式<select>取得（遅延） */
let gtSelect = null;
function grabGoogleSelect(retry = 20){
  gtSelect = document.querySelector('#google_translate_element select.goog-te-combo');
  if (gtSelect) return;
  if (retry>0) setTimeout(()=>grabGoogleSelect(retry-1), 250);
}
grabGoogleSelect();

const langListEl = document.getElementById('langList');
const searchEl   = document.getElementById('langSearch');

function renderLangList(filter = ''){
  if (!langListEl) return;
  const q = (filter || '').trim().toLowerCase();
  langListEl.textContent = '';

  const frag = document.createDocumentFragment();
  LANGS
    .filter(([code,name]) => !q || name.toLowerCase().includes(q) || code.toLowerCase().includes(q))
    .forEach(([code,name])=>{
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'ls-item';
      item.setAttribute('role','option');
      item.dataset.code = code;

      const label = document.createElement('span');
      label.textContent = name;

      const codeEl = document.createElement('span');
      codeEl.className = 'ls-code';
      codeEl.textContent = code;

      item.appendChild(label);
      item.appendChild(codeEl);

      item.addEventListener('click', () => {
        if (!gtSelect) gtSelect = document.querySelector('#google_translate_element select.goog-te-combo');
        if (!gtSelect) return;

        gtSelect.value = code;
        gtSelect.dispatchEvent(new Event('change'));
        langListEl.querySelectorAll('.ls-item').forEach(x=>x.classList.toggle('ls-active', x===item));
      });

      frag.appendChild(item);
    });

  langListEl.appendChild(frag);
}
renderLangList();
searchEl?.addEventListener('input', (e)=>renderLangList(e.target.value));

function highlightCurrent(code){
  langListEl?.querySelectorAll('.ls-item').forEach(x=>{
    x.classList.toggle('ls-active', x.dataset.code === code);
  });
}
highlightCurrent('ja');

/* === Original / 日本語 (Reset) ボタン === */
(function addOriginalReset(){
  const head = document.querySelector('.lang-head');
  if (!head || document.getElementById('gtReset')) return;

  const btn = document.createElement('button');
  btn.id = 'gtReset';
  btn.textContent = 'Original / 日本語 (Reset)';
  btn.setAttribute('type','button');
  Object.assign(btn.style, {
    fontWeight:'700', padding:'8px 10px', borderRadius:'8px',
    border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer'
  });

  btn.addEventListener('click', () => {
    const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const host = location.hostname.replace(/^www\./,'');
    document.cookie = 'googtrans=; expires='+expire+'; path=/';
    document.cookie = 'googtrans=; expires='+expire+'; path=/; domain=.'+host;
    document.cookie = 'googtrans=; expires='+expire+'; path=/; domain='+host;
    if (location.hash.includes('googtrans')) {
      history.replaceState('', document.title, location.pathname + location.search);
    }
    location.reload();
  });

  head.insertBefore(btn, head.firstChild);
})();
