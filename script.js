/* =========================================
   script.js — safe build (menu / scroll / CTA / translator)
   ========================================= */

/* ====== 申込フォームURL ====== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ====== ページ内リンク（スムーススクロール） ====== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (!id || id === '#') return;
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 免責だけは自動オープンしない
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null, '', id);
});

/* ====== 「トップへ」 ====== */
document.getElementById('toTop')?.addEventListener('click', (e)=>{
  const top = document.getElementById('page-top');
  if (!top) return;
  e.preventDefault();
  top.scrollIntoView({behavior:'smooth', block:'start'});
});

/* ====== CTAの高さ → 本文余白に反映 ====== */
const adjustCtaPadding = () => {
  const bar = document.querySelector('.fixed-cta');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* ====== 申込ボタン ====== */
document.getElementById('applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ====== ハンバーガー開閉 ====== */
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

/* ====== メニュー（ハンバーガー内）自動生成 ====== */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

function slug(t){ return (t||'').toLowerCase().replace(/[（）()\[\]【】]/g,' ').replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }

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

  if (groupsRoot) {
    groupsRoot.textContent = '';
    groupsRoot.appendChild(frag);
  }
}
addEventListener('DOMContentLoaded', buildMenu);

/* ====== 重複する免責/キャンセルを下部に統一 ====== */
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

/* ====== 翻訳（Google Translate をUIに移植） ====== */
(function languageSwitcher(){
  const dlg   = document.getElementById('ls-dlg');
  const btn   = document.getElementById('ls-btn');
  const back  = document.getElementById('ls-back');
  const close = document.getElementById('ls-close');
  const slot  = document.getElementById('ls-slot');

  // Googleのセレクトを監視してUIに移す
  function mountCombo(){
    const combo = document.querySelector('#google_translate_element select.goog-te-combo');
    if (!combo || !slot) return false;

    // 既にある場合は置換
    const copy = combo.cloneNode(true);
    copy.addEventListener('change', (e)=>{
      // 元comboにも反映 → Googleが翻訳処理
      combo.value = copy.value;
      combo.dispatchEvent(new Event('change'));
    });

    // 先頭に「Original / 原文（Reset）」を付ける
    const hasReset = Array.from(copy.options).some(o=>o.value==='');
    if(!hasReset){
      const opt = document.createElement('option');
      opt.value=''; opt.textContent='Original / 原文 (Reset)';
      copy.insertBefore(opt, copy.firstChild);
      copy.value='';
    }

    slot.textContent = '';
    slot.appendChild(copy);
    return true;
  }

  // モーダル開閉
  const open = ()=>{ if (mountCombo()){ dlg.dataset.open='1'; dlg.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); } };
  const closeDlg = ()=>{ dlg.dataset.open='0'; dlg.setAttribute('aria-hidden','true'); btn?.setAttribute('aria-expanded','false'); };

  btn?.addEventListener('click', open);
  close?.addEventListener('click', closeDlg);
  back?.addEventListener('click', closeDlg);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDlg(); });

  // スクロール時に地球儀を少し控えめに（任意）
  let tId;
  addEventListener('scroll', ()=>{
    if (!btn) return;
    btn.dataset.shy = '1';
    clearTimeout(tId);
    tId = setTimeout(()=>{ btn.dataset.shy='0'; }, 250);
  }, {passive:true});
})();

/* ====== Google翻訳バナーの押し下げ復元（保険） ====== */
(function killBannerPush(){
  const tick = () => { if (document.body && getComputedStyle(document.body).top !== '0px'){ document.body.style.top = '0px'; } };
  const id = setInterval(tick, 500);
  addEventListener('load', ()=>{ tick(); setTimeout(()=>clearInterval(id), 4000); });
})();
