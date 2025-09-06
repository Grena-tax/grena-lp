/* ===== script.js — drop-in full ===== */

/* 0) 申込フォームURL */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* 1) スムーススクロール（ページ内リンクのみ） */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  // 本文は window ではなく main#scrollRoot をスクロール（固定CTAと相性◎）
  const sc = document.getElementById('scrollRoot');
  if (sc) sc.scrollTo({ top: target.getBoundingClientRect().top + sc.scrollTop - 8, behavior: 'smooth' });
  else target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // #disclaimer 以外は最初のdetailsを自動で開く
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* 2) 「トップへ」 */
document.getElementById('toTop')?.addEventListener('click', (e) => {
  e.preventDefault();
  const sc = document.getElementById('scrollRoot');
  (sc ? sc : window).scrollTo({ top: 0, behavior: 'smooth' });
});

/* 3) CTAの高さを本文側に反映（隠れ防止） */
function adjustCtaLayout(){
  const bar = document.getElementById('ctaBar'); if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
}
window.addEventListener('load', adjustCtaLayout);
window.addEventListener('resize', adjustCtaLayout);

/* 4) 申込ボタンは必ずフォームへ */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* 5) ハンバーガー（開閉）＋メニュー自動生成 */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* メニューから除外する小項目（本文には残す） */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

/* slug */
const slug = (t) => t.toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* 5-1) 目次ビルド（① plans 直前の空きを消す＝compactクラス付与） */
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
    const title = (h2?.textContent || '').trim();

    if (sec.id === 'plans') wrap.classList.add('compact');  // ← ①

    if (title && sec.id !== 'plans') {          // plans は見出し非表示
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    }

    const ul = document.createElement('ul'); ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return; // 小項目はメニューからのみ除外
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });

    wrap.appendChild(ul); frag.appendChild(wrap);
  });

  groupsRoot.textContent = ''; groupsRoot.appendChild(frag);
}
document.addEventListener('DOMContentLoaded', buildMenu);

/* 6) 「追加オプション（トッピング）」を“料金プラン”の4つ目に強制移動（④） */
document.addEventListener('DOMContentLoaded', () => {
  const plansSec = document.getElementById('plans');
  const plansAcc = plansSec?.querySelector(':scope > .accordion');
  if (!plansAcc) return;

  // 「追加オプション」を見つける（現在どこにあってもOK）
  const addons = Array.from(document.querySelectorAll('details')).find(d => {
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    return /追加.?オプション|トッピング/i.test(t);
  });

  if (addons && !plansAcc.contains(addons)) {
    plansAcc.appendChild(addons);  // 4つ目として移動
  }
});

/* 7) 料金プランの summary テキストを軽く構造化（②の改行/③の体裁ずれ対策） */
document.addEventListener('DOMContentLoaded', () => {
  const planRows = document.querySelectorAll('#plans .accordion > details > summary');
  planRows.forEach(s => {
    if (s.dataset.enhanced) return;
    const t = (s.textContent || '').replace(/\s+/g,' ').trim();
    // 「ラベル ： 価格 （税込）」に近い見た目へ（元テキストを崩さずspan化）
    const m = t.match(/^(.*?)([：:])\s*([¥￥]?\s*[\d,]+)(.*)$/);
    if (m) {
      const label = document.createElement('span'); label.className='label'; label.textContent=m[1].trim();
      const price = document.createElement('span'); price.className='price'; price.textContent=(m[3]||'').replace(/\s+/g,'');
      const tail  = document.createElement('span'); tail.className='tax'; tail.textContent=(m[4]||'').trim();
      s.replaceChildren(label, document.createTextNode(' ： '), price, document.createTextNode(' '), tail);
      s.dataset.enhanced = '1';
    } else {
      // 少なくとも途中改行は抑止
      s.style.wordBreak = 'keep-all';
    }
  });
});
