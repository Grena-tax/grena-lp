/* =========================================================
  script.js （完全置換版）
  - ハンバーガー（目次）開閉
  - 目次の自動生成（<main>内の section[id] を拾う）
  - JP/EN のみ：googtrans cookie 切替 → リロード
  - Google Translate 初期化（#google_translate_element を非表示で用意）
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
    2) JP/EN 切替（googtrans cookie）
  ========================================================= */

  function readGoogtransCookie() {
    const m1 = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    const m2 = document.cookie.match(/(?:^|;\s*)Googtrans=([^;]+)/);
    const raw = (m1 && m1[1]) || (m2 && m2[1]) || "";
    try {
      return decodeURIComponent(raw);
    } catch (_) {
      return raw;
    }
  }

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

  function removeGoogtransHashIfExists() {
    if (/#googtrans/.test(location.hash)) {
      try {
        history.replaceState("", document.title, location.pathname + location.search);
      } catch (_) {
        // ignore
      }
    }
  }

  function getCurrentLang() {
    const v = readGoogtransCookie();
    // 例: "/ja/en" or "/ja/ja"
    if (v === "/ja/en") return "en";
    return "ja";
  }

  function ensureLangSwitchUI() {
    // 既にHTML側で用意されている場合はそれを優先
    let wrap = document.getElementById("lpLangSwitch");
    let jpBtn = document.getElementById("lpLangJP");
    let enBtn = document.getElementById("lpLangEN");

    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "lpLangSwitch";
      wrap.setAttribute("role", "group");
      wrap.setAttribute("aria-label", "Language switch");

      // 見た目（あなたのHTML末尾スタイルが無いケースでも崩れない最低限）
      wrap.style.position = "fixed";
      wrap.style.top = "calc(env(safe-area-inset-top, 0px) + 12px)";
      wrap.style.left = "calc(env(safe-area-inset-left, 0px) + 12px)";
      wrap.style.zIndex = "10000";
      wrap.style.display = "flex";
      wrap.style.gap = "8px";
      wrap.style.padding = "8px";
      wrap.style.borderRadius = "12px";
      wrap.style.background = "rgba(255,255,255,0.92)";
      wrap.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
      wrap.style.backdropFilter = "blur(6px)";

      if (!jpBtn) {
        jpBtn = document.createElement("button");
        jpBtn.id = "lpLangJP";
        jpBtn.type = "button";
        jpBtn.textContent = "JP";
        jpBtn.setAttribute("aria-pressed", "true");
        jpBtn.style.appearance = "none";
        jpBtn.style.border = "1px solid #e5e7eb";
        jpBtn.style.background = "#fff";
        jpBtn.style.borderRadius = "10px";
        jpBtn.style.padding = "8px 10px";
        jpBtn.style.fontSize = "13px";
        jpBtn.style.fontWeight = "700";
        jpBtn.style.cursor = "pointer";
        jpBtn.style.lineHeight = "1";
      }

      if (!enBtn) {
        enBtn = document.createElement("button");
        enBtn.id = "lpLangEN";
        enBtn.type = "button";
        enBtn.textContent = "EN";
        enBtn.setAttribute("aria-pressed", "false");
        enBtn.style.appearance = "none";
        enBtn.style.border = "1px solid #e5e7eb";
        enBtn.style.background = "#fff";
        enBtn.style.borderRadius = "10px";
        enBtn.style.padding = "8px 10px";
        enBtn.style.fontSize = "13px";
        enBtn.style.fontWeight = "700";
        enBtn.style.cursor = "pointer";
        enBtn.style.lineHeight = "1";
      }

      wrap.appendChild(jpBtn);
      wrap.appendChild(enBtn);
      document.body.appendChild(wrap);
    }

    return { wrap, jpBtn, enBtn };
  }

  function updatePressedState(lang, jpBtn, enBtn) {
    if (jpBtn) jpBtn.setAttribute("aria-pressed", String(lang === "ja"));
    if (enBtn) enBtn.setAttribute("aria-pressed", String(lang === "en"));

    // 押されてる側は枠を濃く（HTML側CSSがあっても害が少ない）
    if (jpBtn && enBtn) {
      jpBtn.style.borderColor = (lang === "ja") ? "#111827" : "#e5e7eb";
      enBtn.style.borderColor = (lang === "en") ? "#111827" : "#e5e7eb";
    }
  }

  function initLangSwitch() {
    const { jpBtn, enBtn } = ensureLangSwitchUI();

    // 現在状態を反映
    const cur = getCurrentLang();
    updatePressedState(cur, jpBtn, enBtn);

    if (jpBtn) {
      jpBtn.addEventListener("click", () => {
        removeGoogtransHashIfExists();
        setGoogtransCookie("ja");
        // 状態反映→リロード
        updatePressedState("ja", jpBtn, enBtn);
        location.reload();
      });
    }

    if (enBtn) {
      enBtn.addEventListener("click", () => {
        removeGoogtransHashIfExists();
        setGoogtransCookie("en");
        updatePressedState("en", jpBtn, enBtn);
        location.reload();
      });
    }
  }

  /* =========================================================
    3) Google Translate 初期化（外部JSのcb）
     - #google_translate_element を「非表示」で用意して動かす
  ========================================================= */

  function ensureGoogleTranslateTarget() {
    let target = document.getElementById("google_translate_element");
    if (target) return target;

    target = document.createElement("div");
    target.id = "google_translate_element";
    target.setAttribute("aria-hidden", "true");
    target.style.position = "absolute";
    target.style.left = "-9999px";
    target.style.width = "1px";
    target.style.height = "1px";
    target.style.overflow = "hidden";
    document.body.appendChild(target);
    return target;
  }

  function loadGoogleTranslateScriptOnce() {
    // 既に読み込まれている可能性があるので二重追加しない
    const exists = $$("script", document).some(s => {
      const src = (s.getAttribute("src") || "");
      return src.includes("translate_a/element.js");
    });
    if (exists) return;

    // コールバック名は window.googleTranslateElementInit に合わせる
    const s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  // element.js?cb=googleTranslateElementInit に対応
  window.googleTranslateElementInit = function googleTranslateElementInit() {
    try {
      if (!window.google || !google.translate || !google.translate.TranslateElement) return;
      const target = ensureGoogleTranslateTarget();
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

  function initGoogleTranslateRuntime() {
    // JP/ENスイッチがgoogtrans cookieを切り替えたときに反映させるため
    // 翻訳エンジン自体は常に読み込む（表示はしない）
    ensureGoogleTranslateTarget();
    loadGoogleTranslateScriptOnce();
  }

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
    initLangSwitch();
    initGoogleTranslateRuntime();
    initCompoundTool();

    const toTop = $("#toTop");
    if (toTop) {
      toTop.addEventListener("click", (e) => {
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
