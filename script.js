/* 申込フォームURL（実URLをセット済み） */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ================================
   内部リンク：スムーススクロール
   ================================ */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 免責(#disclaimer) だけは自動オープンさせない
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* 「トップへ」 */
document.getElementById('toTop')?.addEventListener('click', (e) => {
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* 固定CTAの高さを本文に反映（被り防止） */
const adjustCtaPadding = () => {
  const bar = document.getElementById('ctaBar');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
window.addEventListener('load', adjustCtaPadding);
window.addEventListener('resize', adjustCtaPadding);

/* 申込ボタン：フォームを新規タブで開く */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ================================
   ハンバーガー開閉
   ================================ */
const btn      = document.getElementById('menuBtn');
const drawer   = document.getElementById('menuDrawer');
const closeBt  = document.getElementById('menuClose');
const overlay  = document.getElementById('menuBackdrop');

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

btn?.addEventListener('click', () => {
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
});
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/* ================================
   メニュー自動生成
   ================================ */

/* メニューに出さない（項目だけ除外。本文は表示） */
const excludeTitles = ['基本プラン', '設立＋LPパック', '設立+LPパック', 'フルサポートパック'];

/* slug 化（日本語もOK） */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()［\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

/* plans の見出し(h2)はメニューに出さない。
   さらに先頭の余白を詰めるために .compact を付与する。 */
function buildMenu() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach((sec) => {
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    // グループラッパー
    const wrap = document.createElement('div');
    wrap.className = 'menu-group';
    if (sec.id === 'plans') wrap.classList.add('compact');  // ← 余白を詰める

    // 見出し（h2）を付ける。ただし plans は非表示
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    }

    // リスト
    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach((d) => {
      const s = d.querySelector('summary');
      const t = (s?.textContent || '').trim() || '項目';

      // 指定のサブ項目はメニューから除外
      if (excludeTitles.some((x) => t.includes(x))) return;

      // details にIDが無ければ生成
      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;

      // アンカー
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', `#${d.id}`);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });

    wrap.appendChild(ul);
    frag.appendChild(wrap);
  });

  const groupsRoot = document.getElementById('menuGroups');
  if (!groupsRoot) return;
  groupsRoot.textContent = '';
  groupsRoot.appendChild(frag);

  // Safety: 旧版で誤って出た h4「plans」を念のため除去
  groupsRoot.querySelectorAll('.menu-group h4').forEach((h) => {
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}

document.addEventListener('DOMContentLoaded', buildMenu);
