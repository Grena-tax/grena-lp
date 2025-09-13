/* =========================================
   script.js — iOS Chrome/Safari 固定CTA 安定版
   2025-09-13
   ========================================= */

/* ===== 申込フォームURL ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const slug = (t) => (t || '')
  .toLowerCase()
  .replace(/[（）()\[\]【】]/g, ' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '');

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ===== 固定CTAの高さ → 本文余白に反映 ===== */
const adjustCtaPadding = () => {
  // .cta-bar（新）優先、なければ .fixed-cta
  const bar = document.querySelector('.cta-bar, .fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
  document.body.classList.add('has-cta');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン ===== */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー開閉 ＋ メニュー自動生成 ===== */
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

    // #plans は見出し(h4)を出さない
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

  // 念のため "plans" 見出しが生成されても即削除
  const killPlansHeading = () => {
    groupsRoot.querySelectorAll('.menu-group h4').forEach(h=>{
      if (h.textContent.trim().toLowerCase() === 'plans') h.remove();
    });
  };
  killPlansHeading();
  new MutationObserver(killPlansHeading).observe(groupsRoot, { childList:true, subtree:true });
}
addEventListener('DOMContentLoaded', buildMenu);

/* ===== 免責/キャンセルの重複を保険で除去（#disclaimer 以外） ===== */
function removeDupBlocks(){
  document.getElementById('site-disclaimer')?.remove();
  document.querySelectorAll('details.disclaimer').forEach(d => d.remove());
  document.querySelectorAll('details').forEach(d=>{
    const t = (d.querySelector('summary')?.textContent || '').replace(/\s+/g,'');
    if ((t.includes('免責事項') || t.includes('キャンセルポリシー')) && !d.closest('#disclaimer')) d.remove();
  });
}
document.addEventListener('DOMContentLoaded', removeDupBlocks);
addEventListener('load', removeDupBlocks);
addEventListener('pageshow', removeDupBlocks);

/* ===== iOS ラバーバンド対策：最下部で CTA が浮かないよう“上方向への移動だけ禁止” =====
   ポイント：
   - 画面下 UI（ホームインジケータ/ツールバー）の分だけ bottom を補正（uiGap）
   - 末尾付近では「uiGap が増える方向」への更新を抑止（= CTA が上がらない）
   - 末尾から離れたら通常更新に戻す
============================================================================ */
(function lockCtaToBottom(){
  const bar = document.querySelector('.cta-bar');
  if (!bar || !window.visualViewport) return;

  let stableGap = 0; // 末尾以外で観測した直近の安定ギャップ値

  const compute = () => {
    const vv  = window.visualViewport;
    const doc = document.documentElement;

    // アドレスバー等の UI による下側のギャップ
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    // 「ほぼ最下部」判定（端末差/丸め誤差のため ±2px のゆとり）
    const y = window.scrollY || doc.scrollTop || 0;
    const maxY = Math.max(0, doc.scrollHeight - (vv.height + vv.offsetTop));
    const nearBottom = y >= (maxY - 2);

    // 末尾で“上がる（= uiGap が増える）”更新は抑止
    if (!nearBottom) {
      stableGap = uiGap;
      bar.style.bottom = uiGap + 'px';
    } else {
      const frozen = Math.min(uiGap, stableGap);
      bar.style.bottom = frozen + 'px';
    }
  };

  // 初期 & 各イベント
  compute();
  visualViewport.addEventListener('resize',  compute);
  visualViewport.addEventListener('scroll',  compute);
  window.addEventListener('scroll',          compute, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(compute, 60));
  window.addEventListener('pageshow', compute);
})();

/* ===== 既存 #disclaimer が open で始まる場合のクローズ ===== */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#disclaimer details[open]')?.removeAttribute('open');
});
