/* ===== 設定 ===== */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';

/* ===== ユーティリティ ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ===== CTA高さをCSS変数へ反映 ===== */
function adjustCtaPadding(){
  const bar = $('.fixed-cta, .cta-bar, #ctaBar');
  if(!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
}
addEventListener('load', adjustCtaPadding, { once:true });
addEventListener('resize', adjustCtaPadding);

/* ===== アンカー：スムーススクロール + 最初のdetailsオープン ===== */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const first = target.querySelector('details');
  if (first && !first.open) first.open = true;

  history.pushState(null, '', id);
});
$('#toTop')?.addEventListener('click', (e)=>{
  // ページトップが存在しない（編集時の保険）
  if (!$('#page-top')) {
    e.preventDefault();
    scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ===== 申込ボタン ===== */
$('#applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('フォームURLが未設定です'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* ===== ハンバーガー ===== */
(function menu(){
  const html = document.documentElement;
  const btn = $('#menuBtn');
  const drawer = $('#menuDrawer');
  const closeBt = $('#menuClose');
  const overlay = $('#menuBackdrop');

  function open(){
    html.classList.add('menu-open');
    drawer?.setAttribute('aria-hidden','false');
    btn?.setAttribute('aria-expanded','true');
    setTimeout(()=>closeBt?.focus(), 0);
  }
  function close(){
    html.classList.remove('menu-open');
    drawer?.setAttribute('aria-hidden','true');
    btn?.setAttribute('aria-expanded','false');
    btn?.focus();
  }

  btn?.addEventListener('click', (e)=>{
    e.preventDefault();
    html.classList.contains('menu-open') ? close() : open();
  });
  closeBt?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });

  // 片方を開く時はもう片方を閉じる
  document.addEventListener('click', e=>{
    if (e.target.closest('#langBtn')) close();
  }, {passive:true});
})();

/* ===== メニュー自動生成 ===== */
(function buildMenu(){
  const root = $('#menuGroups');
  if (!root) return;
  const EXCLUDE = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
  const frag = document.createDocumentFragment();
  let i = 1;

  $$('section[id]').forEach(sec=>{
    const ds = sec.querySelectorAll(':scope > .accordion > details, :scope > details');
    if (!ds.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'menu-group';

    const h2 = $('h2', sec);
    if (h2 && sec.id !== 'plans') {
      const h4 = document.createElement('h4');
      h4.textContent = (h2.textContent || '').trim();
      wrap.appendChild(h4);
    }

    const ul = document.createElement('ul');
    ul.className = 'menu-list';

    ds.forEach(d=>{
      const s = $('summary', d);
      const t = s?.textContent?.trim() || '項目';
      if (EXCLUDE.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${t.replace(/\s+/g,'-').replace(/[^\w\u3040-\u30ff\u3400-\u9fff-]/g,'').slice(0,40)}`;

      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#${d.id}`;
      a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        document.documentElement.classList.remove('menu-open');
        $('#menuDrawer')?.setAttribute('aria-hidden','true');
        $('#menuBtn')?.setAttribute('aria-expanded','false');
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

  root.textContent = '';
  root.appendChild(frag);
})();

/* ===== 言語ドロワー ===== */
(function language(){
  const html = document.documentElement;
  const langBtn = $('#langBtn');
  const drawer  = $('#langDrawer');
  const closeBt = $('#langClose');
  const backdrop= $('#langBackdrop');

  function open(){
    html.classList.add('lang-open');
    drawer?.setAttribute('aria-hidden','false');
    langBtn?.setAttribute('aria-expanded','true');
    setTimeout(()=>closeBt?.focus(), 0);
  }
  function close(){
    html.classList.remove('lang-open');
    drawer?.setAttribute('aria-hidden','true');
    langBtn?.setAttribute('aria-expanded','false');
    langBtn?.focus();
  }

  langBtn?.addEventListener('click', (e)=>{
    e.preventDefault();
    html.classList.contains('lang-open') ? close() : open();
  });
  closeBt?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });

  // 片方を開く時はもう片方を閉じる
  document.addEventListener('click', e=>{
    if (e.target.closest('#menuBtn')) close();
  }, {passive:true});
})();

/* ===== 言語リスト（Google Translate 公式<select>へ反映） ===== */
(function initLangList(){
  const LANGS = [
    // 主要どころ＋必要に応じて拡張可（全言語を入れたい場合はここに追加）
    ['en','English'],['ja','Japanese'],['zh-CN','Chinese (Simplified)'],['zh-TW','Chinese (Traditional)'],
    ['fr','French'],['de','German'],['es','Spanish'],['it','Italian'],['ko','Korean'],['ru','Russian'],
    ['pt','Portuguese'],['ar','Arabic'],['hi','Hindi'],['id','Indonesian'],['vi','Vietnamese'],['th','Thai'],
    ['tr','Turkish'],['uk','Ukrainian'],['fa','Persian'],['pl','Polish']
  ];

  const list = $('#langList');
  const q = $('#langSearch');
  if (!list) return;

  function render(filter = ''){
    const word = (filter || '').toLowerCase();
    list.textContent = '';
    const frag = document.createDocumentFragment();

    LANGS.filter(([code,name]) => !word || name.toLowerCase().includes(word) || code.toLowerCase().includes(word))
      .forEach(([code,name])=>{
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ls-item';
        btn.dataset.code = code;
        btn.innerHTML = `<span>${name}</span><span class="ls-code">${code}</span>`;
        btn.addEventListener('click', ()=>{
          const sel = document.querySelector('#google_translate_element select.goog-te-combo');
          if (!sel) return; // まだ読み込み中の可能性
          sel.value = code;
          sel.dispatchEvent(new Event('change'));
          list.querySelectorAll('.ls-item').forEach(x => x.classList.toggle('ls-active', x===btn));
        });
        frag.appendChild(btn);
      });

    list.appendChild(frag);
  }

  render();
  q?.addEventListener('input', e=>render(e.target.value));

  // Reset（Original / 日本語）
  $('#gtReset')?.addEventListener('click', ()=>{
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
})();

/* ===== スマホだけ改行（見出しの可読性） ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  const setOnce=(el,html)=>{ if(!el || el.dataset.spHandled) return; el.innerHTML = html; el.dataset.spHandled='1'; };

  // 1) 「仮想通貨とジョージア法人の相性（重要な注意点）」 → 括弧の前で改行
  const s1 = $$('#corp-setup details > summary').find(s=>/仮想通貨/.test(s.textContent)&&/相性/.test(s.textContent)&&/重要な注意点/.test(s.textContent));
  if (s1) setOnce(s1, s1.textContent.trim().replace('（重要な注意点）','<br class="sp-only">（重要な注意点）'));

  // 2) 個人事業主H2 → （条件あり）の前で改行
  const hSole = $('#sole-setup h2');
  if (hSole) setOnce(hSole, hSole.textContent.trim().replace('（条件あり）','<br class="sp-only">（条件あり）'));

  // 3) summaryを1行固定したいケース（任意）
  const s2 = $$('#sole-setup details > summary').find(s=>/ジョージアで、スモールに世界を始める/.test(s.textContent));
  if (s2) s2.classList.add('sp-nowrap');

  // 4) 銀行H2 → ｜の後で改行
  const hBank = $('#personal-account h2');
  if (hBank) setOnce(hBank, hBank.textContent.trim().replace('｜','｜<br class="sp-only">'));

  // 5) 為替シミュレーション → 括弧の前で改行
  const s3 = $$('#personal-account details > summary').find(s=>/リスクと為替の考え方/.test(s.textContent)&&/簡易シミュレーション/.test(s.textContent));
  if (s3) setOnce(s3, s3.textContent.trim().replace('（簡易シミュレーション）','<br class="sp-only">（簡易シミュレーション）'));
});
