/* ===== script.js — safe pack (full) ===== */

/* Utilities */
const $  = (sel, el=document)=>el.querySelector(sel);
const $$ = (sel, el=document)=>Array.from(el.querySelectorAll(sel));

/* Force all <details> closed on first paint (KYCが勝手に開く対策) */
document.addEventListener('DOMContentLoaded', () => {
  $$('details[open]').forEach(d => d.removeAttribute('open'));
});

/* Smooth scroll for in-page anchors */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (!id || id === '#') return;
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.pushState(null, '', id);
});

/* Apply Now */
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdixKlGsWRMucxH9jMms4mthfKb0XbEuIioTGKuh-2q5qIzDA/viewform?usp=header';
$('#applyNow')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!FORM_URL) { alert('Form URL is not set'); return; }
  window.open(FORM_URL, '_blank', 'noopener');
});

/* Back to top */
$('#toTop')?.addEventListener('click', (e)=>{
  // let anchor default work (smooth by browser). Nothing special needed.
});

/* Hamburger open/close */
const btn        = $('#menuBtn');
const drawer     = $('#menuDrawer');
const closeBt    = $('#menuClose');
const overlay    = $('#menuBackdrop');

const openMenu  = () => { document.documentElement.classList.add('menu-open');  drawer?.setAttribute('aria-hidden','false'); btn?.setAttribute('aria-expanded','true'); };
const closeMenu = () => { document.documentElement.classList.remove('menu-open'); drawer?.setAttribute('aria-hidden','true');  btn?.setAttribute('aria-expanded','false'); };

btn?.addEventListener('click', () => { document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(); });
closeBt?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

/* Build hamburger menu (auto TOC) */
const excludeTitles = ['基本プラン','設立＋LPパック','設立+LPパック','フルサポートパック'];
function slug(t){return (t||'').toLowerCase().replace(/[（）()\[\]【】]/g,' ').replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')}
function buildMenu(){
  const groupsRoot = $('#menuGroups');
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
      h4.textContent = (h2.textContent || '').trim();
      wrap.appendChild(h4);
    } else {
      wrap.classList.add('no-title');
    }
    const ul = document.createElement('ul'); ul.className='menu-list';
    details.forEach(d=>{
      const s = d.querySelector('summary');
      const t = s?.textContent?.trim() || '項目';
      if (excludeTitles.some(x => t.includes(x))) return;
      if (!d.id) d.id = `acc-${i++}-${slug(t)||'item'}`;
      const li = document.createElement('li');
      const a  = document.createElement('a'); a.href = `#${d.id}`; a.textContent = t;
      a.addEventListener('click',(e)=>{
        e.preventDefault(); closeMenu(); d.open = true;
        d.scrollIntoView({behavior:'smooth', block:'start'}); history.pushState(null,'',`#${d.id}`);
      });
      li.appendChild(a); ul.appendChild(li);
    });
    wrap.appendChild(ul); frag.appendChild(wrap);
  });
  groupsRoot.textContent=''; groupsRoot.appendChild(frag);
}
document.addEventListener('DOMContentLoaded', buildMenu);

/* Language Switcher — English UI */
(function langSwitcher(){
  const globe   = $('#ls-btn');
  const dlg     = $('#ls-dlg');
  const back    = $('#ls-back');
  const close   = $('#ls-close');
  const slot    = $('#ls-slot');
  const resetBt = $('#ls-reset');

  const open = () => { dlg?.setAttribute('data-open','1'); dlg?.setAttribute('aria-hidden','false'); };
  const closeDlg = () => { dlg?.setAttribute('data-open','0'); dlg?.setAttribute('aria-hidden','true'); };

  globe?.addEventListener('click', open);
  back?.addEventListener('click', closeDlg);
  close?.addEventListener('click', closeDlg);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeDlg(); });

  // Move Google combo into our slot when ready
  const tryMount = () => {
    const combo = document.querySelector('select.goog-te-combo');
    if (combo && slot && !slot.contains(combo)) {
      slot.appendChild(combo);
      combo.title = 'Select language';
    }
  };
  const iv = setInterval(()=>{ tryMount(); if (document.querySelector('#ls-slot select.goog-te-combo')) clearInterval(iv); }, 300);
  window.addEventListener('load', tryMount);

  // Reset to Japanese (original)
  resetBt?.addEventListener('click', ()=>{
    const combo = document.querySelector('select.goog-te-combo');
    if (combo) {
      combo.value = 'ja';
      combo.dispatchEvent(new Event('change'));
    }
  });
})();
