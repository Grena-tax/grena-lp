/* ===========================================================
   script.js — full build (CTA固定 + メニュー生成 + 重複除去)
   =========================================================== */

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

/* ===== 固定CTAの高さ → 本文余白に反映（旧 #ctaBar を参照：存在すれば反映） ===== */
const adjustCtaPadding = () => {
  const bar = document.getElementById('ctaBar'); // 旧固定CTA（CSSでは非表示）
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height || 0);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ===== 申込ボタン（旧固定CTA内の #applyNow に対応） ===== */
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

    // ★ #plans は見出し(h4)を出さない（英字 "plans" を隠す）
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
      if (excludeTitles.some(x => t.includes(x))) return; // 料金サブ項目は出さない
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

  // 念のため：どこかの古いJSが h4 "plans" を作っても即削除
  killPlansHeading();
}

/* ===== “plans の見出し” を常に抹消（安全網） ===== */
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

/* ===== 重複ブロック除去（最下部の“キャンセルポリシー”だけカット） =====
   - #disclaimer 内の正規ブロックは必ず残す
   - それ以外の「免責事項」「キャンセルポリシー」は末尾側を削除 */
function cutOnlyBottomDup() {
  // 旧スニペット由来のものを丸ごと除去（存在すれば）
  document.getElementById('site-disclaimer')?.remove();
  document.querySelectorAll('details.disclaimer').forEach(d => d.remove());

  // 「免責事項」重複（#disclaimer 外）を除去
  document.querySelectorAll('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });

  // 「キャンセルポリシー」を重複排除：#disclaimer 内の1つだけ残す
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

/* ====== 下端に残る重複「免責事項／キャンセルポリシー」を確実に削除 ====== */
(function killBottomDup(){
  const removeDups = () => {
    // 追加で貼られていた単体の免責(details#site-disclaimer 等)を削除
    document.getElementById('site-disclaimer')?.remove();
    document.querySelectorAll('details.disclaimer').forEach(d => d.remove());

    // #disclaimer の外側に出てくる「免責事項」を削除
    document.querySelectorAll('details').forEach(d=>{
      const t = (d.querySelector('summary')?.textContent || '').replace(/\s+/g,'');
      if (t.includes('免責事項') && !d.closest('#disclaimer')) d.remove();
    });

    // #disclaimer 以外に出てくる「キャンセルポリシー」も保険で削除
    document.querySelectorAll('details').forEach(d=>{
      const t = (d.querySelector('summary')?.textContent || '').replace(/\s+/g,'');
      if (t.includes('キャンセルポリシー') && !d.closest('#disclaimer')) d.remove();
    });
  };

  // 初期実行＋保険（読込完了／戻る遷移／動的追加）
  document.addEventListener('DOMContentLoaded', removeDups);
  window.addEventListener('load', removeDups);
  window.addEventListener('pageshow', removeDups);
  new MutationObserver(removeDups).observe(document.body, { childList:true, subtree:true });
})();

/* ===== iOSラバーバンド対策：最下端での過スクロール時に CTA(.cta-bar) が浮かないよう固定 =====
   - visualViewport を使い、UI表示で生じる下側ギャップ(uiGap)を計算
   - 過スクロール検出中は直前の安定値を維持して bottom を凍結 */
(function lockCtaToBottom(){
  const bar = document.querySelector('.cta-bar');
  if (!bar || !window.visualViewport) return;

  let stable = 0; // 直近の安定した bottom 値

  const calcBottom = () => {
    const vv  = window.visualViewport;
    const doc = document.documentElement;

    // アドレスバー等のUIぶんの下側ギャップ
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

    // いまの最大スクロール位置（ツールバー状態を加味）
    const maxScroll = doc.scrollHeight - (vv.height + vv.offsetTop);
    const y = window.scrollY || doc.scrollTop || 0;

    // 下側ラバーバンド（過スクロール）中は更新しない
    const isBouncingBottom = y > maxScroll + 1;

    if (!isBouncingBottom) {
      stable = uiGap; // 通常時だけ更新
    }
    bar.style.bottom = (isBouncingBottom ? stable : uiGap) + 'px';
  };

  // 初期/イベント
  calcBottom();
  visualViewport.addEventListener('resize',  calcBottom);
  visualViewport.addEventListener('scroll',  calcBottom);
  window.addEventListener('scroll',          calcBottom, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(calcBottom, 50));
})();
