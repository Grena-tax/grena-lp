/* =========================================
   LP用スクリプト（フル版）
   - アンカーのスムーススクロール
   - 「トップへ」
   - 固定CTAの高さ → 本文余白に反映
   - 申込ボタン（外部フォームへ）
   - ハンバーガー開閉
   - 目次（ハンバーガー内）自動生成
     * セクション見出しのうち #plans はメニューに出さない
     * 料金サブ項目（基本プラン / 設立＋LP / 設立+LP / フルサポート）はメニューに出さない
   ========================================= */

/* ===== 設定 ===== */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== ユーティリティ ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')                 // 丸/角カッコはスペース
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-') // 非単語・非和文はハイフン
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

/* ===== ページ内リンクだけスムーススクロール ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // #disclaimer だけは自動で開かない
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }

  history.pushState(null, '', id);
});

/* ===== 「トップへ」 ===== */
document.getElementById('toTop')?.addEventListener('click', (e) => {
  if (!document.querySelector('#page-top')) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ===== 固定CTAの高さを本文余白に反映 ===== */
const adjustCtaPadding = () => {
  const bar = document.getElementById('ctaBar');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
window.addEventListener('load', adjustCtaPadding);
window.addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン ===== */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー開閉 ===== */
const btn      = document.getElementById('menuBtn');
const drawer   = document.getElementById('menuDrawer');
const closeBt  = document.getElementById('menuClose');
const overlay  = document.getElementById('menuBackdrop');
const groupsRoot = document.getElementById('menuGroups');

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

/* ===== 目次（ハンバーガー内）自動生成 ===== */
/** メニューから除外するサブ項目（本文は表示される） */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

function buildMenu () {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const frag = document.createDocumentFragment();
  let i = 1;

  sections.forEach((sec) => {
    const details = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!details.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    // ★ セクション見出し（h2）：#plans だけはメニューに出さない
    const h2 = sec.querySelector('h2');
    const title = (h2?.textContent || '').trim();
    if (title && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = title;
      wrap.appendChild(h4);
    } else {
      // #plans は見出しを出さないので、余白を詰める調整用クラスを付与
      wrap.classList.add('no-title');
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    details.forEach((d) => {
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';

      // 料金サブ項目はメニューから除外（本文は表示）
      if (excludeTitles.some(x => t.includes(x))) return;

      if (!d.id) d.id = `acc-${i++}-${slug(t) || 'item'}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        d.open = true;
        d.scrollIntoView({ behavior:'smooth', block:'start' });
        history.pushState(null, '', `#${d.id}`);
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

  // 念のため：旧版で h4="plans" が作られてしまっても強制除去
  groupsRoot.querySelectorAll('.menu-group h4').forEach(h => {
    if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
  });
}

document.addEventListener('DOMContentLoaded', buildMenu);
