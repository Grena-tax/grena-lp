/* ===== script.js（メニュー自動生成＋JP/EN切替）===== */
(function () {
  'use strict';

  // ========= Utilities =========
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function safeSetAttr(el, name, value) {
    if (!el) return;
    el.setAttribute(name, value);
  }

  // ========= Drawer Menu (目次) =========
  var menuBtn = $('#menuBtn');
  var menuDrawer = $('#menuDrawer');
  var menuBackdrop = $('#menuBackdrop');
  var menuClose = $('#menuClose');
  var menuGroups = $('#menuGroups');

  function openMenu() {
    if (!menuDrawer) return;
    menuDrawer.classList.add('is-open');
    safeSetAttr(menuDrawer, 'aria-hidden', 'false');
    if (menuBtn) safeSetAttr(menuBtn, 'aria-expanded', 'true');
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    if (!menuDrawer) return;
    menuDrawer.classList.remove('is-open');
    safeSetAttr(menuDrawer, 'aria-hidden', 'true');
    if (menuBtn) safeSetAttr(menuBtn, 'aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  if (menuBtn) menuBtn.addEventListener('click', function () {
    var isOpen = menuDrawer && menuDrawer.classList.contains('is-open');
    if (isOpen) closeMenu(); else openMenu();
  });

  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  function buildMenu() {
    if (!menuGroups) return;

    // data-group がある details を集めて、グループごとにリンクを作る
    var details = $all('details[data-group]');
    var groups = {};
    details.forEach(function (d) {
      var group = d.getAttribute('data-group') || 'その他';
      var summary = $('summary', d);
      var text = summary ? summary.textContent.trim() : '';
      // クリックで開閉されるので、リンクとしてはセクションへ飛ばす
      // detailsの親セクションid を探す
      var sec = d.closest('section[id]');
      var target = sec ? ('#' + sec.id) : '#';
      if (!groups[group]) groups[group] = [];
      if (text) groups[group].push({ label: text, href: target });
    });

    // 既存クリア
    menuGroups.innerHTML = '';

    Object.keys(groups).forEach(function (groupName) {
      var box = document.createElement('div');
      box.className = 'menu-group';

      var h = document.createElement('div');
      h.className = 'menu-group-title';
      h.textContent = groupName;
      box.appendChild(h);

      var ul = document.createElement('ul');
      ul.className = 'menu-list';

      groups[groupName].forEach(function (item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        a.addEventListener('click', function () {
          closeMenu();
        });
        li.appendChild(a);
        ul.appendChild(li);
      });

      box.appendChild(ul);
      menuGroups.appendChild(box);
    });
  }

  // ========= JP/EN Language Switch =========
  var btnJP = $('#lpLangJP');
  var btnEN = $('#lpLangEN');

  function setLangPressed(isEN) {
    if (btnJP) btnJP.setAttribute('aria-pressed', isEN ? 'false' : 'true');
    if (btnEN) btnEN.setAttribute('aria-pressed', isEN ? 'true' : 'false');
  }

  // Google Translate cookie helpers
  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + value + '; ' + expires + '; path=/';
  }

  function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  // Google Translate uses 'googtrans' cookie like "/ja/en"
  function applyEN() {
    setCookie('googtrans', '/ja/en', 30);
    setLangPressed(true);
    // Reload to apply translation
    location.reload();
  }

  function applyJP() {
    // Clear translation cookie
    deleteCookie('googtrans');
    // Some environments store it on .domain; try common variants
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname;
    setLangPressed(false);
    location.reload();
  }

  if (btnEN) btnEN.addEventListener('click', function () {
    applyEN();
  });

  if (btnJP) btnJP.addEventListener('click', function () {
    applyJP();
  });

  // ========= Init =========
  document.addEventListener('DOMContentLoaded', function () {
    buildMenu();

    // On load, reflect current cookie state
    var isEN = document.cookie.indexOf('googtrans=/ja/en') !== -1;
    setLangPressed(isEN);
  });

})();
