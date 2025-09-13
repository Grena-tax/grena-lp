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
  const keep = new Set([cta, menuBtn, menuDrawer, wrap, document.getElementById('langBtn'), document.getElementById('langWrap')]);
  Array.from(body.childNodes).forEach(n => {
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
    // スクロール対象は #scroll-root
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

  // 余白を付けるのは実際にスクロールする要素（#scroll-root）
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

  // 念のため：どこかの古いJSが h4 "plans" を作っても即削除
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
// 何も書かない（ラバーバンド時に誤検知で浮くのを根絶）

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

/* === 追加③：言語モーダル（ハンバーガーの外、下に置くボタンから起動） === */
(function languageModal(){
  const $btn   = document.getElementById('langBtn');
  const $wrap  = document.getElementById('langWrap');
  const $close = document.getElementById('langClose');
  const $back  = document.getElementById('langBackdrop');

  if(!$btn || !$wrap) return;

  const open = () => {
    $wrap.setAttribute('aria-hidden','false');
    $btn.setAttribute('aria-expanded','true');
    loadGoogleTranslateOnce();
  };
  const close = () => {
    $wrap.setAttribute('aria-hidden','true');
    $btn.setAttribute('aria-expanded','false');
  };

  $btn.addEventListener('click', open);
  $close?.addEventListener('click', close);
  $back?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });

  // Google Translate ローダ（1回だけ）
  function loadGoogleTranslateOnce(){
    if (window.__gt_loaded) return;
    window.__gt_loaded = true;

    window.googleTranslateElementInit = function(){
      /* includedLanguages未指定＝全世界（Google側の対応言語） */
      new google.translate.TranslateElement(
        {pageLanguage: 'ja', autoDisplay: false},
        'google_translate_element'
      );
    };

    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  }
})();
/* === その一文だけを除去（他要素は残す） ======================== */
(function removeOnlyThatNote(){
  const JA = '※ 自分の国を調べてください。';
  const EN1 = "Please check your country's rules and information.";
  const EN2 = "Please check your country’s rules and information."; // 角/曲アポ両対応

  // 3パターンのいずれかを含むテキストだけを対象にする
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const PATTERN = new RegExp(`${escape(JA)}|${escape(EN1)}|${escape(EN2)}`);

  const wipe = (root = document.body) => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const targets = [];
    while (tw.nextNode()) targets.push(tw.currentNode);

    targets.forEach(node => {
      const text = (node.nodeValue || '').replace(/\s+/g, ' ').trim();
      if (!PATTERN.test(text)) return;

      // 該当部分だけ消す
      node.nodeValue = node.nodeValue.replace(PATTERN, '').trim();

      // 文字が空になったら空タグを片付け（段落の隙間を残さない）
      if (!node.nodeValue) {
        const el = node.parentNode;
        el && el.removeChild(node);
        if (el && !el.textContent.trim() && /^(P|SMALL|SPAN|DIV)$/i.test(el.tagName)) {
          el.remove();
        }
      }
    });
  };

  // 既に表示中なら即実行
  wipe();
  // モーダルを開いた時も確実に実行
  new MutationObserver(() => wipe()).observe(document.body, { childList: true, subtree: true });
})();
/* === 言語モーダルの余白と不要な「/」だけを整える =================== */
(function tightenLangModal(){
  // 開いている言語モーダルを推定（テキストから判定）
  const findDialog = () => {
    const cands = Array.from(document.querySelectorAll('[role="dialog"], [class*="modal"]'));
    return cands.find(d => /言語|Translate\s+Language/i.test(d.textContent || ''));
  };

  const compact = () => {
    const dlg = findDialog();
    if (!dlg) return;

    // 1) 「/」など記号だけのテキストノードや空ノードを除去
    const isJunk = s => !s || /^[\s\/|・—\-–]*$/.test(s);
    const tw = document.createTreeWalker(dlg, NodeFilter.SHOW_TEXT, null, false);
    const removeTexts = [];
    while (tw.nextNode()) {
      const n = tw.currentNode;
      if (isJunk(n.nodeValue)) removeTexts.push(n);
    }
    removeTexts.forEach(n => {
      const p = n.parentNode;
      p && p.removeChild(n);
      // 親要素も中身が空なら片付け（p/small/span/divのみ）
      if (p && !p.textContent.trim() && /^(P|SMALL|SPAN|DIV)$/i.test(p.tagName)) p.remove();
    });

    // 2) 連続 <br> を1つに圧縮＆末尾の余分な <br> を削除
    dlg.querySelectorAll('br+br, br:empty').forEach(br => br.remove());
    const body = dlg.querySelector('.lang-body, .modal-body, .body, .content') || dlg;
    // 3) 下余白を少しだけ（控えめに）詰める
    body.style.paddingBottom = '12px';
    body.style.marginBottom = '0';
  };

  // すでに開いていれば即整形、以降は開閉を監視して都度整形
  compact();
  new MutationObserver(compact).observe(document.body, { childList: true, subtree: true });
})();
