// 今後、言語切替やアコーディオン、スクロール対応などをここに追加します。
console.log("Grena LP script loaded");
const adjustCtaPadding = () => {
  const bar = document.getElementById('ctaBar');
  if (!bar) return;
  const h = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--cta-h', h + 'px');
};

// 初期化＋リサイズ対応
window.addEventListener('load', () => {
  adjustCtaPadding();
  setTimeout(adjustCtaPadding, 500); // ← 再調整でズレ防止
});
window.addEventListener('resize', adjustCtaPadding);
