/* =========================================
   script.js — FINAL v3.1
   目的:
   - #scroll-root を自動生成（本文スクロール専用）
   - CTA 高さを測り、余白を可変反映
   - iOS bounce中でも CTA を浮かせない（transform追従）
   - KYC⇄料金の隙間ゼロをランタイムでも上書き
   - 上部UIの安全帯を計測して本文に反映
   - ハンバーガー操作/メニュー生成
   - Language Switcher（Original/Resetあり）
   ========================================= */

'use strict';

/* ===== フォームURL（必要なら置き換え） ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== util ===== */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const slug = (t='') => t.toLowerCase()
  .replace(/[（）()\[\]【】]/g,' ')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-')
  .replace(/-+/g,'-').replace(/^-|-$/g,'');

/* =========================================
   1) #scroll-root 生成（本文のみスクロール）
   ========================================= */
(function mountScrollRoot(){
  if ($('#scroll-root')) return;

  const body = document.body;
  const cta  = $('.fixed-cta, .cta-bar, #ctaBar');
  const wrap = document.createElement('div');
  wrap.id = 'scroll-root';

  if (cta) body.insertBefore(wrap, cta);
  else body.appendChild(wrap);

  // CTA・メニューUI 以外を #scroll-root に移す
  const keep = new Set([cta, wrap, $('#menuBtn'), $('#menuDrawer'), $('#langBtn')]);
  Array.from(body.childNodes).forEach(n => { if (!keep.has(n)) wrap.appendChild(n); });
})();

/* =========================================
   2) 固定CTAの高さ → 余白反映
   ========================================= */
function adjustCtaPadding(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if (!bar) return;

  const h = Math.ceil(bar.getBoundingClientRect().height || 0);
  document.documentElement.style.setProperty('--cta-h', h + 'px');

  const scroller = $('#scroll-root');
  if (scroller) scroller.classList.add('has-cta');
  document.body.classList.add('has-cta');
}
addEventListener('load', adjustCtaPadding);
addEventListener('resize', adjustCtaPadding);

/* =========================================
   3) CTA を最下部にロック（iOS bounce対策）
   ========================================= */
(function lockCtaToBottomFreeze(){
  const bar = $('.fixed-cta') || $('.cta-bar') || $('#ctaBar');
  if (!bar || !window.visualViewport) return;

  const scroller = $('#scroll-root') || document.documentElement;
  let stable = 0;

  const apply = () => {
    const vv  = window.visualViewport;
    const uiGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const maxScroll = Math.max(0, (scroller.scrollHeight||0) - (scroller.clientHeight||0));
    const y = (scroller === document.documentElement || scroller === document.body)
      ? (window.scrollY || document.documentElement.scrollTop || 0)
      : (scroller.scrollTop || 0);

    const isBouncingBottom = y > maxScroll + 1;
    if (!isBouncingBottom) stable = uiGap;

    const use = isBouncingBottom ? stable : uiGap;
    const tx = `translate3d(0, ${use}px, 0)`;
    if (bar.style.transform !== tx) bar.style.transform = tx;
  };

  apply();
  visualViewport.addEventListener('resize',  apply);
  visualViewport.addEventListener('scroll',  apply);
  scroller.addEventListener('scroll', apply, { passive:true });
  addEventListener('orientationchange', () => setTimeout(apply, 50));
})();

/* =========================================
   4) 上部UIぶんの安全帯（本文が被らない）
   ========================================= */
function applyTopUiSafe(){
  // 計測対象: 生成する #langBtn と 既存の #menuBtn（無ければスキップ）
  const targets = [$('#langBtn'), $('#menuBtn')].filter(Boolean);
  const pad = targets.reduce((m,el)=>{
    const r = el.getBoundingClientRect();
    return Math.max(m, r.top + r.height + 12); // 下に 12px 余裕
  }, 0);
  document.documentElement.style.setProperty('--ui-safe-top', Math.ceil(pad) + 'px');

  const scroller = $('#scroll-root');
  if (pad > 0 && scroller) scroller.classList.add('with-top-ui');
}
addEventListener('load', applyTopUiSafe);
addEventListener('resize', applyTopUiSafe);

/* =========================================
   5) KYC ⇄ 料金 の隙間ゼロ（CSSに加えJSでも上書き）
   ========================================= */
function forceNoGap(){
  const a = $('#corp-setup');
  const b = $('#plans');
  if (!a || !b) return;
  // どちらも上下の外側余白を殺す
  [a,b].forEach(el=>{
    el.style.marginTop='0'; el.style.marginBottom='0';
    el.style.paddingTop='0'; el.style.paddingBottom='0';
  });
  // 隣接隙間ゼロ
  if (a.nextElementSibling === b){
    b.style.marginTop='0';
  }
}
addEventListener('DOMContentLoaded', forceNoGap);
addEventListener('load', forceNoGap);

/* =========================================
   6) アンカー（#id）スムーススクロール
   ========================================= */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior:'smooth', block:'start' });

  // 免責(#disclaimer)以外は先頭の details を開く
  if (target.id !== 'disclaimer') {
    const first = target.querySelector('details');
    if (first && !first.open) first.open = true;
  }
  history.pushState(null,'',id);
});

/* =========================================
   7) 申込ボタン
   ========================================= */
$('#applyNow')?.addEventListener('click', (e)=>{
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* =========================================
   8) ハンバーガー開閉 + ドロワー最下部余白
   ========================================= */
const menuBtn     = $('#menuBtn');
const menuDrawer  = $('#menuDrawer');
const menuClose   = $('#menuClose');
const menuOverlay = $('#menuBackdrop');

function openMenu(){
  document.documentElement.classList.add('menu-open');
  menuDrawer?.setAttribute('aria-hidden','false');
  menuBtn?.setAttribute('aria-expanded','true');
  setTimeout(()=>menuClose?.focus(),0);
}
function closeMenu(){
  document.documentElement.classList.remove('menu-open');
  menuDrawer?.setAttribute('aria-hidden','true');
  menuBtn?.setAttribute('aria-expanded','false');
  menuBtn?.focus();
}
menuBtn?.addEventListener('click', ()=> {
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu();
});
menuClose?.addEventListener('click', closeMenu);
menuOverlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });

// ドロワー下端まで必ず読める（CTA重なり対策）
(function padDrawerBottom(){
  const bar = $('.cta-bar') || $('#ctaBar') || $('.fixed-cta');
  if (!bar || !menuDrawer) return;
  const h = Math.ceil(bar.getBoundingClientRect().height||0);
  menuDrawer.style.paddingBottom = `calc(16px + ${h}px + env(safe-area-inset-bottom))`;
})();
addEventListener('resize', ()=>padDrawerBottom());

/* =========================================
   9) ハンバーガー内メニュー自動生成
   ========================================= */
const groupsRoot = $('#menuGroups');
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];

function buildMenu(){
  if (!groupsRoot) return;

  const sections = $$('section[id]');
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
      h4.textContent = (h2.textContent||'').trim();
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
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;

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

  groupsRoot.textContent = '';
  groupsRoot.appendChild(frag);
}
addEventListener('DOMContentLoaded', buildMenu);

/* =========================================
   10) 重複ブロックの統一（免責/キャンセルは下だけ）
   ========================================= */
function cutOnlyBottomDup(){
  $('#site-disclaimer')?.remove();
  $$('details.disclaimer').forEach(d=>d.remove());
  $$('details').forEach(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    if (/免責事項/.test(t) && !d.closest('#disclaimer')) d.remove();
  });
  const cancels = $$('details').filter(d=>{
    const t = d.querySelector('summary')?.textContent?.trim() || '';
    return /キャンセルポリシー/.test(t);
  });
  if (cancels.length > 1) {
    const keep = cancels.find(d => d.closest('#disclaimer')) || cancels[0];
    cancels.forEach(d => { if (d !== keep) d.remove(); });
  }
}
addEventListener('DOMContentLoaded', cutOnlyBottomDup);
addEventListener('load', cutOnlyBottomDup);

/* =========================================
   11) Language Switcher（地球儀ボタン＋モーダル）
   ========================================= */
(function initLanguageUI(){
  // CSS注入（見た目は既存ダーク丸角に合わせる）
  const css = `
  .lang-btn{
    position:fixed;
    top:calc(10px + env(safe-area-inset-top));
    right:calc(10px + env(safe-area-inset-right) + 48px + 14px);
    z-index:10050;width:48px;height:48px;border-radius:12px;
    display:grid;place-items:center;background:#111827;color:#fff;
    border:1px solid rgba(255,255,255,.08);box-shadow:0 4px 14px rgba(0,0,0,.15);
    cursor:pointer
  }
  .lang-btn:active{transform:translateY(1px)}
  .lang-dialog{position:fixed;inset:0;z-index:10040;display:none;pointer-events:none}
  .lang-dialog[data-open="1"]{display:block;pointer-events:auto}
  .lang-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(1px)}
  .lang-panel{position:absolute;top:calc(70px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));
    width:min(560px,92vw);max-height:min(70vh,520px);background:#fff;border:1px solid #e5e7eb;border-radius:12px;
    box-shadow:0 20px 50px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:auto}
  .lang-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid #e5e7eb}
  .lang-head strong{font-weight:800}
  .lang-close{width:36px;height:36px;border-radius:10px;border:1px solid #e5e7eb;background:#fff}
  .lang-close:hover{background:#f3f4f6}
  .lang-body{padding:12px}
  #langProxy{width:100%;height:42px;border-radius:10px;border:1px solid #d1d5db;padding:0 10px;font-size:16px}
  .lang-hint{margin-top:8px;color:#64748b;font-size:12px}
  #google_translate_element{position:fixed;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none}
  @media (max-width:480px){ .lang-btn{transform:scale(.92);transform-origin:top right} }
  `;
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // ボタン
  const btn = document.createElement('button');
  btn.id = 'langBtn'; btn.className = 'lang-btn'; btn.type='button';
  btn.title='言語 / Language'; btn.setAttribute('aria-haspopup','dialog'); btn.setAttribute('aria-expanded','false');
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"></path>
  </svg>`;
  document.body.appendChild(btn);

  // ダイアログ
  const dlg = document.createElement('div');
  dlg.id = 'langDialog'; dlg.className='lang-dialog'; dlg.setAttribute('aria-hidden','true');
  dlg.setAttribute('role','dialog'); dlg.setAttribute('aria-modal','true');
  dlg.innerHTML = `
    <div class="lang-backdrop" id="langBackdrop"></div>
    <div class="lang-panel" role="document">
      <div class="lang-head">
        <strong>Select language / 言語を選択</strong>
        <button id="langClose" class="lang-close" type="button" aria-label="閉じる">×</button>
      </div>
      <div class="lang-body">
        <select id="langProxy" aria-label="Select Language">
          <option value="__RESET">Original / 原文（Reset）</option>
          <option value="" disabled>Loading languages…</option>
        </select>
        <p class="lang-hint">リストから選ぶと即時翻訳されます。/ Select a language and the page will translate.</p>
      </div>
    </div>`;
  document.body.appendChild(dlg);

  const proxySel = $('#langProxy');
  const closeBtn = $('#langClose');
  const backdrop = $('#langBackdrop');

  const open = ()=>{ dlg.setAttribute('data-open','1'); dlg.setAttribute('aria-hidden','false'); btn.setAttribute('aria-expanded','true'); setTimeout(()=>closeBtn?.focus(),0); };
  const close= ()=>{ dlg.removeAttribute('data-open'); dlg.setAttribute('aria-hidden','true'); btn.setAttribute('aria-expanded','false'); btn.focus(); };

  btn.addEventListener('click', ()=> dlg.getAttribute('data-open') ? close() : open());
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  document.addEventListener('click', (e)=>{
    if(!dlg.getAttribute('data-open')) return;
    if(e.target.closest('#langDialog') || e.target.closest('#langBtn')) return;
    close();
  });

  // Google翻訳の本体（隠し）
  const host = document.createElement('div');
  host.id = 'google_translate_element';
  document.body.appendChild(host);

  // Google初期化（UI英語化）
  window.googleTranslateElementInit = function(){
    try{
      new google.translate.TranslateElement({ pageLanguage:'ja', autoDisplay:false }, 'google_translate_element');
    }catch(e){}
    cloneOptionsToProxy();
    // 上部UI安全帯を再計測（ボタン追加後）
    applyTopUiSafe();
  };

  // スクリプト読込
  const s = document.createElement('script');
  s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=en';
  s.defer = true;
  document.head.appendChild(s);

  // 本体コンボからプロキシへ言語を複製
  function cloneOptionsToProxy(){
    let tries = 0;
    (function tick(){
      const combo = $('#google_translate_element select.goog-te-combo');
      if (!combo){
        if (tries++ < 60) return setTimeout(tick, 120);
        return;
      }
      const keepReset = proxySel.querySelector('option[value="__RESET"]');
      proxySel.innerHTML = ''; if (keepReset) proxySel.appendChild(keepReset);

      Array.from(combo.options).forEach((op, idx)=>{
        if (idx === 0) return;
        const o = document.createElement('option');
        o.value = op.value; o.textContent = op.textContent;
        proxySel.appendChild(o);
      });

      const current = getCurrentLangFromCookie() || '';
      proxySel.value = current ? current : '__RESET';

      proxySel.onchange = function(){
        const val = this.value;
        const combo = $('#google_translate_element select.goog-te-combo');
        if (!combo) return;
        if (val === '__RESET'){ clearGT(); combo.value=''; combo.dispatchEvent(new Event('change')); return; }
        combo.value = val; combo.dispatchEvent(new Event('change'));
      };
    })();
  }

  function getCurrentLangFromCookie(){
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (!m) return '';
    try{ const v = decodeURIComponent(m[1]); const p=v.split('/'); return p[2]||''; }catch(e){ return ''; }
  }
  function clearGT(){
    const d = location.hostname.replace(/^www\./,'');
    document.cookie='googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie=`googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${d}`;
    document.cookie=`googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }

  // ボタンクリック時に最新同期
  btn.addEventListener('click', cloneOptionsToProxy);
})();
