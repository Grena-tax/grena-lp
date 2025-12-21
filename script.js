/* =========================================================
  script.js
  - ハンバーガー（目次）開閉
  - 目次の自動生成（<main>内の section[id] を拾う）
  - 言語ドロワー開閉 + 検索 + cookie切替（Googtrans）
  - Google Translate 初期化（#google_translate_element）
  - 複利ツール（#cf-tool）計算
========================================================= */

(() => {
  "use strict";

  /* ---------- 共通ユーティリティ ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setAriaOpen(btn, drawer, isOpen) {
    if (btn) btn.setAttribute("aria-expanded", String(isOpen));
    if (drawer) drawer.setAttribute("aria-hidden", String(!isOpen));
    if (drawer) {
      // CSS側がクラスで制御している場合にも対応
      drawer.classList.toggle("is-open", isOpen);
    }
    document.documentElement.classList.toggle("drawer-open", isOpen);
  }

  function trapFocus(container) {
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ];
    const focusables = () =>
      $$(focusableSelectors.join(","), container).filter(el => el.offsetParent !== null);

    function onKeyDown(e) {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }

  function smoothScrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 72;
    try {
      window.scrollTo({ top: y, behavior: "smooth" });
    } catch (_) {
      window.scrollTo(0, y);
    }
  }

  /* =========================================================
    1) 目次（ハンバーガー）
  ========================================================= */
  function initMenu() {
    const btn = $("#menuBtn");
    const drawer = $("#menuDrawer");
    const closeBtn = $("#menuClose");
    const backdrop = $("#menuBackdrop");
    const groups = $("#menuGroups");

    if (!btn || !drawer || !groups) return;

    let releaseFocusTrap = null;

    function close() {
      setAriaOpen(btn, drawer, false);
      if (releaseFocusTrap) {
        releaseFocusTrap();
        releaseFocusTrap = null;
      }
      btn.focus();
    }

    function open() {
      setAriaOpen(btn, drawer, true);
      const panel = $(".menu-panel", drawer) || drawer;
      releaseFocusTrap = trapFocus(panel);

      // 最初のリンク or 閉じるボタンへフォーカス
      const focusTarget = closeBtn || $("a,button,input,select,textarea,[tabindex]", panel);
      if (focusTarget) focusTarget.focus();
    }

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (isOpen) close(); else open();
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (isOpen) close();
    });

    // 目次生成：main 内の section[id] を拾い、見出しをタイトルにする
    function buildMenu() {
      groups.innerHTML = "";

      const main = $("#main") || $("main");
      if (!main) return;

      const sections = $$("section[id]", main);

      const list = document.createElement("div");
      list.className = "menu-list";

      sections.forEach(sec => {
        const id = sec.getAttribute("id");
        if (!id) return;

        // 見出し取得（h2/h3優先）
        const h = $("h2, h3", sec);
        const title = (h && (h.textContent || "").trim()) || id;

        const a = document.createElement("a");
        a.href = `#${id}`;
        a.className = "menu-link";
        a.textContent = title;

        a.addEventListener("click", (ev) => {
          ev.preventDefault();
          close();
          smoothScrollToId(id);
        });

        list.appendChild(a);
      });

      groups.appendChild(list);
    }

    buildMenu();
  }

  /* =========================================================
    2) 言語ドロワー（Google Translate）
  ========================================================= */

  // 主要言語（英語名で検索できるようにする）
  const LANGS = [
    { code: "ja", name: "Japanese" },
    { code: "en", name: "English" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
    { code: "zh-TW", name: "Chinese (Traditional)" },
    { code: "ko", name: "Korean" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "id", name: "Indonesian" },
    { code: "th", name: "Thai" },
    { code: "vi", name: "Vietnamese" },
    { code: "tr", name: "Turkish" },
    { code: "nl", name: "Dutch" },
    { code: "sv", name: "Swedish" },
    { code: "pl", name: "Polish" }
  ];

  function setGoogtransCookie(toLang) {
    // from /ja/ja → /ja/<toLang>
    const v = `/ja/${toLang}`;
    const expDays = 365;
    const d = new Date();
    d.setTime(d.getTime() + expDays * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();

    // cookie名は小文字/大文字混在があるため両方設定
    document.cookie = `googtrans=${encodeURIComponent(v)}; ${expires}; path=/`;
    document.cookie = `Googtrans=${encodeURIComponent(v)}; ${expires}; path=/`;

    // サブドメイン対策
    const host = location.hostname.replace(/^www\./, "");
    document.cookie = `googtrans=${encodeURIComponent(v)}; ${expires}; path=/; domain=.${host}`;
    document.cookie = `Googtrans=${encodeURIComponent(v)}; ${expires}; path=/; domain=.${host}`;
  }

  function initLangDrawer() {
    const btn = $("#langBtn");
    const drawer = $("#langDrawer");
    const closeBtn = $("#langClose");
    const backdrop = $("#langBackdrop");
    const search = $("#langSearch");
    const list = $("#langList");

    if (!btn || !drawer || !list) return;

    let releaseFocusTrap = null;

    function close() {
      setAriaOpen(btn, drawer, false);
      if (releaseFocusTrap) {
        releaseFocusTrap();
        releaseFocusTrap = null;
      }
      btn.focus();
    }

    function open() {
      setAriaOpen(btn, drawer, true);
      const panel = $(".lang-panel", drawer) || drawer;
      releaseFocusTrap = trapFocus(panel);
      if (search) search.focus();
    }

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (isOpen) close(); else open();
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (isOpen) close();
    });

    function render(filterText) {
      const q = (filterText || "").trim().toLowerCase();
      list.innerHTML = "";

      const items = LANGS.filter(x => !q || x.name.toLowerCase().includes(q));

      items.forEach(x => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ls-item";
        b.setAttribute("role", "option");
        b.textContent = x.name;

        b.addEventListener("click", () => {
          // cookieを書き換えてページ再読込（Google Translateが反映）
          setGoogtransCookie(x.code);
          close();

          // hashに#googtransが付いていたら消す
          if (/#googtrans/.test(location.hash)) {
            history.replaceState("", document.title, location.pathname + location.search);
          }

          location.reload();
        });

        list.appendChild(b);
      });

      if (!items.length) {
        const p = document.createElement("p");
        p.className = "text-sm muted";
        p.textContent = "No languages found.";
        list.appendChild(p);
      }
    }

    render("");

    if (search) {
      search.addEventListener("input", () => render(search.value));
    }
  }

  /* =========================================================
    3) Google Translate 初期化（外部JSのcb）
  ========================================================= */
  // element.js?cb=googleTranslateElementInit に対応
  window.googleTranslateElementInit = function googleTranslateElementInit() {
    try {
      if (!window.google || !google.translate || !google.translate.TranslateElement) return;
      const target = document.getElementById("google_translate_element");
      if (!target) return;

      // すでに何か入っていたら二重生成しない
      if (target.getAttribute("data-inited") === "true") return;
      target.setAttribute("data-inited", "true");

      new google.translate.TranslateElement(
        {
          pageLanguage: "ja",
          autoDisplay: false
        },
        "google_translate_element"
      );
    } catch (_) {
      // 失敗してもLP本体は動かす
    }
  };

  /* =========================================================
    4) 複利ツール（#cf-tool）
  ========================================================= */
  function initCompoundTool() {
    const wrap = $("#cf-tool");
    if (!wrap) return;

    const currencySel = $("#cf-currency", wrap);
    const principalInp = $("#cf-principal", wrap);
    const rateInp = $("#cf-rate", wrap);
    const rateDisp = $("#cf-rate-display", wrap);
    const yearsInp = $("#cf-years", wrap);
    const nperSel = $("#cf-nper", wrap);
    const isCompChk = $("#cf-is-comp", wrap);
    const ackChk = $("#cf-ack", wrap);
    const runBtn = $("#cf-run", wrap);
    const clearBtn = $("#cf-clear", wrap);
    const out = $("#cf-out", wrap);
    const chips = $$(".cf-chip", wrap);

    if (!principalInp || !rateInp || !yearsInp || !nperSel || !ackChk || !runBtn || !out) return;

    function fmtMoney(v, symbol, locale) {
      try {
        return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" })
          .format(v)
          .replace("$", symbol);
      } catch (_) {
        return symbol + String(Math.round(v));
      }
    }

    function getCurrencyMeta() {
      const opt = currencySel ? currencySel.selectedOptions[0] : null;
      const symbol = opt ? (opt.getAttribute("data-symbol") || "") : "¥";
      const locale = opt ? (opt.getAttribute("data-locale") || "ja-JP") : "ja-JP";
      return { symbol, locale };
    }

    function syncRateDisplay() {
      const v = Number(rateInp.value || 0);
      if (rateDisp) rateDisp.textContent = (isFinite(v) ? v.toFixed(2) : "0.00") + "%";
    }

    function toggleRun() {
      runBtn.disabled = !ackChk.checked;
    }

    function calc() {
      const P = Number(principalInp.value || 0);
      const r = Number(rateInp.value || 0) / 100;
      const t = Number(yearsInp.value || 0);
      const n = Number(nperSel.value || 1);
      const isComp = !!(isCompChk && isCompChk.checked);

      if (!isFinite(P) || !isFinite(r) || !isFinite(t) || !isFinite(n) || P < 0 || t < 0 || n <= 0) {
        out.textContent = "入力値を確認してください。";
        return;
      }

      // 複利: A = P(1 + r/n)^(n*t)
      // 単利: A = P(1 + r*t)
      const A = isComp ? (P * Math.pow(1 + r / n, n * t)) : (P * (1 + r * t));
      const profit = A - P;

      const { symbol, locale } = getCurrencyMeta();

      const aText = fmtMoney(A, symbol, locale);
      const pText = fmtMoney(P, symbol, locale);
      const prText = fmtMoney(profit, symbol, locale);

      const mode = isComp ? "複利" : "単利";

      out.innerHTML = `
        <div class="text-sm">
          <p><strong>計算結果（${mode}）</strong></p>
          <ul>
            <li>元本：<strong>${pText}</strong></li>
            <li>最終金額：<strong>${aText}</strong></li>
            <li>増加分：<strong>${prText}</strong></li>
          </ul>
          <p class="muted text-sm">※ 税・手数料・為替・課税タイミング等は含めていません。</p>
        </div>
      `;
    }

    chips.forEach(btn => {
      btn.addEventListener("click", () => {
        const r = btn.getAttribute("data-rate");
        if (r != null) {
          rateInp.value = String(r);
          syncRateDisplay();
        }
      });
    });

    rateInp.addEventListener("input", syncRateDisplay);
    ackChk.addEventListener("change", toggleRun);

    runBtn.addEventListener("click", (e) => {
      e.preventDefault();
      calc();
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        principalInp.value = "1000000";
        rateInp.value = "10.00";
        yearsInp.value = "7";
        nperSel.value = "12";
        if (isCompChk) isCompChk.checked = true;
        ackChk.checked = false;
        toggleRun();
        syncRateDisplay();
        out.textContent = "";
      });
    }

    syncRateDisplay();
    toggleRun();
  }

  /* =========================================================
    起動
  ========================================================= */
  function boot() {
    initMenu();
    initLangDrawer();
    initCompoundTool();

    // 「トップへ」クリックはブラウザ標準でOKだが、古い環境用に補助
    const toTop = $("#toTop");
    if (toTop) {
      toTop.addEventListener("click", (e) => {
        // hrefが#page-topなので基本は不要だが、スムース対応
        e.preventDefault();
        smoothScrollToId("page-top");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
