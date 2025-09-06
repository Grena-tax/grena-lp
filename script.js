/* =========================
   app.js — 完全版
   ========================= */

/* 申込フォームURL（実URLをセット） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* DOM取得（必要要素は都度参照も可） */
const scrollRoot = document.getElementById('scrollRoot');
const ctaBar     = document.getElementById('ctaBar');
const bottomSpacer = document.getElementById('bottomSpacer');

/* =========================
   1) CTA高さに応じて余白を自動調整
   ========================= */
function adjustCtaLayout(){
  if(!ctaBar || !scrollRoot) return;
  // 実測高さ
  const h = Math.ceil(ctaBar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  // バッファ（ラバーバンド対策・視覚的被り防止）
  const buffer = 28; // 必要なら 36, 44 などへ
  if (bottomSpacer) {
    bottomSpacer.style.height = (h + buffer) + 'px';
  }
}

// 初期＆リサイズで反映
window.addEventListener('load', adjustCtaLayout);
window.addEventListener('resize', adjustCtaLayout);
window.addEventListener('orientationchange', adjustCtaLayout);

/* =========================
   2) 「トップへ」：#scrollRoot の先頭へ
   ========================= */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!scrollRoot) { window.scrollTo({top:0, behavior:'smooth'}); return; }
  scrollRoot.scrollTo({ top: 0, behavior: 'smooth' });
  history.pushState(null, '', '#page-top');
});

/* =========================
   3) アンカー（#〜）は #scrollRoot 内をスムーススクロール
   ========================= */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  // # or #page-top はトップ扱い
  if (id === '#' || id === '#page-top') {
    e.preventDefault();
    scrollRoot?.scrollTo({ top: 0, behavior:'smooth' });
    history.pushState(null,'','#page-top');
    return;
  }

  const target = document.querySelector(id);
  if (!target) return; // 存在しないアンカーは素通し
  e.preventDefault();

  // #scrollRoot 内へスムース
  target.scrollIntoView({ behavior:'smooth', block:'start' });

  // 目的地に details がある場合は開いておく（#disclaimer は自動開かない）
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  history.pushState(null,'',id);
});

/* =========================
   4) 申込ボタン：必ずフォームを新規タブで開く
   ========================= */
document.getElementById('applyNow')?.addEventListener('click',(e)=>{
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* =========================
   5) ハンバーガー（開閉）
   ========================= */
const btn     = document.getElementById('menuBtn');
const drawer  = document.getElementById('menuDrawer');
const closeBt = document.getElementById('menuClose');
const overlay = document.getElementById('menuBackdrop');

const openMenu  = () => {
  document.documentElement.classList.add('menu-open');
  drawer?.setAttribute('aria-hidden','false');
  btn?.setAttribute('aria-expanded','true');
};
const closeMenu = () => {
  document.documentElement.classList.remove('menu-open');
  drawer?.setAttribute('aria-hidden','true');
  btn?.setAttribute('aria-expanded','false');
};

btn?.addEventListener('click', ()=>{
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
});
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* =========================
   6) 目次メニュー自動生成
   - section直下の details を拾う
   - plans セクションは h4 見出しを出さない（＝上の余白詰め）
   - 一部タイトルはメニューから除外（本文は残す）
   ========================= */
const groupsRoot = document.getElementById('menuGroups');
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()［\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

function buildMenu(){
  if (!groupsRoot) return;

  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach(sec=>{
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    // セクション見出し（plans は非表示）
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (sec.id === 'plans') {
      wrap.classList.add('headerless');
    } else if (title) {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach(d=>{
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      // メニューからのみ除外（本文はそのまま）
      if (excludeTitles.some(x => t.includes(x))) return;

      // details にIDが無ければ付与
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;

      a.addEventListener('click',(e)=>{
        e.preventDefault();
        closeMenu();               // 先に閉じる
        d.open = true;             // 自動で開く
        // scrollRoot 内でスムーススクロール
        document.getElementById(d.id)?.scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null,'',`#${d.id}`);
      });

      li.appendChild(a);
      ul.appendChild(li);
    });

    wrap.appendChild(ul);
    frag.appendChild(wrap);
  });

  groupsRoot.textContent = '';
  groupsRoot.appendChild(frag);
}

document.addEventListener('DOMContentLoaded', buildMenu);

/* =========================
   7) 初回レイアウト調整（フォント読み後にも）
   ========================= */
if ('fonts' in document) {
  document.fonts.addEventListener?.('loadingdone', adjustCtaLayout);
  document.fonts.ready?.then(adjustCtaLayout).catch(()=>{});
}

/* =========================
   8) スクロール末端でのラバーバンド対策（追いバッファ）
   ========================= */
/* 追加の安全策：最下部近くで常に若干の余白を確保（視覚的な“せり上がり”回避） */
let ticking = false;
scrollRoot?.addEventListener('scroll', ()=>{
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(()=>{
    const max = scrollRoot.scrollHeight - scrollRoot.clientHeight;
    const nearBottom = (scrollRoot.scrollTop > max - 24);
    if (nearBottom && bottomSpacer){
      const h = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cta-h')) || 72;
      const buffer = 28;
      bottomSpacer.style.height = (h + buffer + 12) + 'px'; // 末端だけ少し増やす
    }
    ticking = false;
  });
});
