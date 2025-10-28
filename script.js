<!-- ✅ script.js（全置換／翻訳ロジック不干渉・最小修正） -->
<script>
(() => {
  'use strict';
  // 重複実行ガード（新しい名前で衝突回避）
  if (window.__GRN_HOTFIX_R5__) return;
  window.__GRN_HOTFIX_R5__ = true;

  // ========== 1) Google翻訳のオーバーレイだけ無効化（翻訳そのものは不干渉） ==========
  // CSSで強制的に非表示＆クリック無効化（確実）
  (function injectKillCss(){
    try{
      const css = `
        body { top: 0 !important; }
        iframe.goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-spinner-pos,
        .VIpgJd-ZVi9od-ORHb-OEVmcd {
          display: none !important;
          pointer-events: none !important;
          visibility: hidden !important;
          z-index: 0 !important;
          opacity: 0 !important;
        }
      `;
      const st = document.createElement('style');
      st.id = 'gt-kill-overlays';
      st.type = 'text/css';
      st.appendChild(document.createTextNode(css));
      document.head.appendChild(st);
    }catch(_){}
  })();

  function killTranslateOverlaysJS(){
    try{
      if (document.body) document.body.style.top = '0px';
      [
        'iframe.goog-te-banner-frame',
        '#goog-gt-tt',
        '.goog-te-spinner-pos',
        '.VIpgJd-ZVi9od-ORHb-OEVmcd'
      ].forEach(sel=>{
        document.querySelectorAll(sel).forEach(el=>{
          el.style.display = 'none';
          el.style.pointerEvents = 'none';
          el.style.visibility = 'hidden';
          el.style.zIndex = '0';
          el.style.opacity = '0';
        });
      });
    }catch(_){}
  }

  // ========== 2) FX表の「¥1,547, -」→「¥1,547,000」だけ補正（他は一切触らない） ==========
  // 末尾 ", -"/各種ダッシュを厳密検出
  const YEN  = '[¥￥]';
  const COM  = '[,，]';
  // ハイフン/マイナス類（全角半角・幾何学的ダッシュ等）
  const DASH = '[\\-\\u2212\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u30FC\\uFF0D]';
  // 「¥1,234, -」や「￥12,345， −」の形式だけ許可（前後空白は許容）
  const RE_YEN_COMMA_DASH_END = new RegExp(
    '^\\s*(' + YEN + '\\s*\\d{1,3}(?:' + COM + '\\d{3})*)\\s*,\\s*(?:' + DASH + ')\\s*$',
    'u'
  );

  function fixFxCell(td){
    if (!td) return;
    // 表の見た目を崩さないよう <br> はスペース化のみ
    td.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
    const before = (td.textContent || '').replace(/\s+/g,' ').trim();
    const m = before.match(RE_YEN_COMMA_DASH_END);
    if (!m) return;
    const after = m[1] + '000';
    if (after !== before) {
      td.textContent = after; // 中のHTMLは極力触らない
    }
  }

  function runFxFix(){
    try{
      // 影響範囲を最小化：table直下のth/tdだけ走査
      document.querySelectorAll('table').forEach(tbl=>{
        // テーブル全体に触らず、全セルを軽量チェック
        (tbl.tBodies ? Array.from(tbl.tBodies) : []).forEach(tbody=>{
          Array.from(tbody.rows || []).forEach(tr=>{
            Array.from(tr.cells || []).forEach(fixFxCell);
          });
        });
      });
    }catch(_){}
  }

  // ========== 3) 冪等な再適用（翻訳・アコーディオンでのDOM差し替えに追従） ==========
  function reapply(){
    killTranslateOverlaysJS();
    runFxFix();
  }

  // 起動
  function boot(){
    reapply(); // 初回
    // details開閉時に再適用
    document.addEventListener('toggle', e=>{
      if (e.target && e.target.tagName === 'DETAILS') {
        // 開閉どちらでも、描画後に軽く再適用
        setTimeout(reapply, 0);
      }
    }, true);

    // DOM差し替え監視（翻訳や遅延描画）
    const obs = new MutationObserver((muts)=>{
      for (const m of muts) {
        if (m.addedNodes && m.addedNodes.length) { reapply(); break; }
      }
    });
    obs.observe(document.body || document.documentElement, { childList:true, subtree:true });

    // 初期遅延に備えて数回だけ追い打ち
    let n=0; const tm = setInterval(()=>{
      reapply();
      if (++n > 20) clearInterval(tm);
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }

})();
</script>
