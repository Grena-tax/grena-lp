<script>
(()=>{"use strict";

/* ===== util ===== */
if(window.__GR_PATCH__) return; window.__GR_PATCH__=true;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const html=document.documentElement;

/* ===== 0) Google翻訳の透明オーバーレイがタップを殺すのを防止（表示は消さない） ===== */
(function(){
  const css=`
    iframe.goog-te-banner-frame,
    #goog-gt-tt,
    .VIpgJd-ZVi9od-ORHb-OEVmcd,
    .goog-te-spinner-pos { pointer-events:none !important; }
    html.gtbar body { top:0 !important; }
  `;
  const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
})();

/* ===== 1) ハンバーガー ===== */
function initMenu(){
  const btn=$("#menuBtn"), drawer=$("#menuDrawer"), bd=$("#menuBackdrop"), cls=$("#menuClose");
  if(!btn||!drawer) return;
  const set=o=>{ html.classList.toggle("menu-open",o); drawer.setAttribute("aria-hidden",String(!o)); btn.setAttribute("aria-expanded",String(o)); };
  const tog=e=>{ e&&e.preventDefault(); set(!html.classList.contains("menu-open")); };
  ["click","touchstart"].forEach(ev=>btn.addEventListener(ev,tog,{passive:false}));
  bd&&bd.addEventListener("click",()=>set(false));
  cls&&cls.addEventListener("click",()=>set(false));
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") set(false); });
}

/* ===== 2) 言語ドロワー + Google翻訳連携（翻訳本体は公式をそのまま使用） ===== */
function ensureGTranslate(cb){
  if(window.google&&google.translate&&google.translate.TranslateElement) return cb();
  if(window.__GT_LOADING__){ let t=0; const tm=setInterval(()=>{ if(window.google?.translate?.TranslateElement||++t>20){clearInterval(tm); cb();}},200); return; }
  window.__GT_LOADING__=true;
  if(!$("#google_translate_element")){ const d=document.createElement("div"); d.id="google_translate_element"; d.style.cssText="position:fixed;left:-9999px;top:-9999px;"; document.body.appendChild(d); }
  window.googleTranslateElementInit=function(){ try{ new google.translate.TranslateElement({pageLanguage:"ja",autoDisplay:false}, "google_translate_element"); }catch(_){} cb(); };
  const s=document.createElement("script"); s.src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"; s.async=true; document.head.appendChild(s);
}

function initLang(){
  const btn=$("#langBtn"), drawer=$("#langDrawer"), bd=$("#langBackdrop"), cls=$("#langClose"), list=$("#langList"), q=$("#langSearch");
  if(!btn||!drawer||!list) return;
  const set=o=>{ html.classList.toggle("lang-open",o); drawer.setAttribute("aria-hidden",String(!o)); btn.setAttribute("aria-expanded",String(o)); };

  function doTranslate(code){
    const sel=$("#google_translate_element select.goog-te-combo"); if(!sel) return;
    sel.value=code; sel.dispatchEvent(new Event("change",{bubbles:true}));
    const exp=new Date(Date.now()+365*24*3600*1000).toUTCString();
    document.cookie=`googtrans=/auto/${code};expires=${exp};path=/`;
    document.cookie=`googtrans=/ja/${code};expires=${exp};path=/`;
    setTimeout(()=>sel.dispatchEvent(new Event("change",{bubbles:true})),150);
    set(false);
    setTimeout(runFxFix,250);
  }

  function buildList(){
    ensureGTranslate(()=>{
      const sel=$("#google_translate_element select.goog-te-combo"); if(!sel) return;
      const dn=(window.Intl&&Intl.DisplayNames)?new Intl.DisplayNames(["en"],{type:"language"}):null;
      const cur=(decodeURIComponent((document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/)||[])[1]||""));
      list.innerHTML="";
      Array.from(sel.options).filter(o=>o.value&&o.value!=="auto").map(o=>{
        const code=o.value.trim();
        const name=(dn&&dn.of(code.replace("_","-")))||(o.textContent||code).trim();
        const el=document.createElement("div");
        el.className="ls-item"+(cur.endsWith("/"+code)?" ls-active":"");
        el.setAttribute("role","option");
        el.innerHTML=`<span>${name}</span><span class="ls-code">${code}</span>`;
        el.addEventListener("click",()=>doTranslate(code));
        list.appendChild(el);
      });
      if(q){
        q.value=""; q.oninput=()=>{ const s=q.value.trim().toLowerCase(); $$(".ls-item",list).forEach(el=>{ const t=(el.textContent||"").toLowerCase(); el.style.display=(!s||t.includes(s))?"":"none"; }); };
      }
    });
  }

  ["click","touchstart"].forEach(ev=>btn.addEventListener(ev,(e)=>{ e.preventDefault(); set(true); buildList(); },{passive:false}));
  bd&&bd.addEventListener("click",()=>set(false));
  cls&&cls.addEventListener("click",()=>set(false));
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") set(false); });
}

/* ===== 3) FX表の「¥1,547, -」だけを「¥1,547,000」に補正（他は触らない） ===== */
function runFxFix(){
  try{
    const Y='[¥￥]', C='[,，]', D='[\\-\\u2212\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u30FC\\uFF0D]';
    const RE=new RegExp('^('+Y+'\\s*\\d{1,3}(?:'+C+'\\d{3})*),\\s*(?:'+D+')\\s*$','u');
    function isFx(tbl){ const h=(tbl.tHead?.textContent||tbl.rows[0]?.textContent||"").replace(/\s+/g,""); return h.includes("円換算額")&&h.includes("損益"); }
    $$("table").forEach(tbl=>{
      if(!isFx(tbl)) return;
      const rows=Array.from(tbl.tBodies[0]?.rows||[]);
      rows.forEach(tr=>{
        Array.from(tr.cells).forEach(td=>{
          td.querySelectorAll("br").forEach(br=>br.replaceWith(document.createTextNode(" ")));
          const t=(td.textContent||"").trim();
          if(RE.test(t)) td.textContent=t.replace(RE,(_,a)=>a+"000");
        });
      });
    });
  }catch(_){}
}

/* ===== 4) 安全属性だけ付与（副作用なし） ===== */
function hardenExternalLinks(){ $$('a[target="_blank"]').forEach(a=>{ const need=['noopener','noreferrer']; const cur=(a.rel||'').split(/\s+/).filter(Boolean); need.forEach(t=>{if(!cur.includes(t)) cur.push(t);}); a.rel=cur.join(' '); }); }

/* ===== 5) 起動 & 変化への追従 ===== */
function boot(){
  initMenu();
  initLang();
  runFxFix();
  hardenExternalLinks();
  document.addEventListener("toggle",e=>{ if(e.target.tagName==="DETAILS"&&e.target.open) setTimeout(runFxFix,0); },true);
  let n=0; const tm=setInterval(()=>{ runFxFix(); if(++n>12) clearInterval(tm); },300); // 遅延描画の追従
  new MutationObserver(ms=>{ for(const m of ms){ if(m.addedNodes&&m.addedNodes.length){ setTimeout(runFxFix,0); break; } } })
    .observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded",boot,{once:true}); } else { boot(); }

})();</script>
