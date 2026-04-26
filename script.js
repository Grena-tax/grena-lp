/* =========================================================
   script.js（全文）
   - ハンバーガーメニュー：開閉／目次自動生成
   - 固定CTA：「トップへ」スムーズスクロール
   - 複利ツール（#cf-tool）：計算・表示・バリデーション
========================================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function on(el, evt, fn, opt) {
    if (!el) return;
    el.addEventListener(evt, fn, opt);
  }

  function setAriaExpanded(btn, expanded) {
    if (!btn) return;
    btn.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  function setAriaHidden(el, hidden) {
    if (!el) return;
    el.setAttribute("aria-hidden", hidden ? "true" : "false");
  }

  function getCurrentLang() {
    const html = document.documentElement;
    const langAttr = String(html.getAttribute("lang") || "").toLowerCase();
    if (langAttr.startsWith("en")) return "en";
    if (langAttr.startsWith("ja")) return "ja";
    return "ja";
  }

  function smoothScrollToId(id, offsetPx = 80) {
    const target = document.getElementById(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.pageYOffset - offsetPx;
    try {
      window.scrollTo({ top: y, behavior: "smooth" });
    } catch (e) {
      window.scrollTo(0, y);
    }
  }

  function makeSafeId(s) {
    const base = String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "-")
      .replace(/\-+/g, "-")
      .replace(/^\-|\-$/g, "");
    return base || "item";
  }

  /* =========================================================
     1) ハンバーガーメニュー
  ========================================================= */
  function initMenuDrawer() {
    const html = document.documentElement;
    const menuBtn = $("#menuBtn") || $(".menu-button");
    const menuDrawer = $("#menuDrawer") || $(".menu-panel");
    const menuBackdrop = $("#menuBackdrop") || $(".menu-backdrop");
    const menuClose = $("#menuClose") || $(".menu-close");
    const menuGroups = $("#menuGroups") || $(".menu-groups");

    if (!menuBtn || !menuDrawer || !menuGroups) return;

    if (menuClose && String(menuClose.textContent || "").trim() === "") {
      menuClose.textContent = "×";
    }

    function openMenu() {
      html.classList.add("menu-open");
      setAriaExpanded(menuBtn, true);
      setAriaHidden(menuDrawer, false);
      buildMenu(menuGroups, closeMenu);
      if (menuClose) menuClose.focus();
    }

    function closeMenu() {
      html.classList.remove("menu-open");
      setAriaExpanded(menuBtn, false);
      setAriaHidden(menuDrawer, true);
      menuBtn.focus();
    }

    on(menuBtn, "click", (e) => {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      const isOpen = html.classList.contains("menu-open");
      if (isOpen) closeMenu();
      else openMenu();
    });

    on(menuBackdrop, "click", closeMenu);
    on(menuClose, "click", closeMenu);

    on(menuDrawer, "click", (e) => {
      const a = e && e.target ? e.target.closest("a") : null;
      if (!a) return;
      if (html.classList.contains("menu-open")) closeMenu();
    });

    on(document, "keydown", (e) => {
      if (!e || e.key !== "Escape") return;
      if (!html.classList.contains("menu-open")) return;
      closeMenu();
    });

    on(window, "resize", () => {
      if (!html.classList.contains("menu-open")) return;
      closeMenu();
    });
  }

  /* =========================================================
     2) 目次自動生成
  ========================================================= */
  function getSectionTitle(sectionEl, lang) {
    const dt = sectionEl.getAttribute("data-title");
    if (dt && String(dt).trim()) return String(dt).trim();
    const h2 = $("h2", sectionEl);
    if (h2 && (h2.textContent || "").trim()) return (h2.textContent || "").trim();
    const h3 = $("h3", sectionEl);
    if (h3 && (h3.textContent || "").trim()) return (h3.textContent || "").trim();
    return sectionEl.id || "section";
  }

  function getDetailsTitle(detailsEl, lang) {
    const dt = detailsEl.getAttribute("data-title");
    if (dt && String(dt).trim()) return String(dt).trim();
    const sum = $("summary", detailsEl);
    if (sum && (sum.textContent || "").trim()) return (sum.textContent || "").trim();
    return detailsEl.id || "detail";
  }

  function buildMenu(menuGroupsEl, closeMenuFn) {
    if (!menuGroupsEl) return;
    menuGroupsEl.innerHTML = "";
    const lang = getCurrentLang();

    // ドキュメント全体からsection[id]を取得（#mainに限定しない）
    const sections = $$("section[id]").filter((s) => {
      const id = (s.id || "").trim();
      if (!id) return false;
      if (id === "page-top") return false;
      return true;
    });

    const groupDefs = [
      {
        title: lang === "en" ? "Services" : "📋 サービス",
        ids: ["personal-account", "solo-bank", "corp-setup", "sole-setup", "pricing"]
      },
      {
        title: lang === "en" ? "About Georgia" : "📌 GRENAについて",
        ids: ["why-georgia", "about-georgia", "service", "founder-story"]
      },
      {
        title: lang === "en" ? "Reviews & FAQ" : "⭐ 口コミ・FAQ",
        ids: ["reviews", "faq", "other-services"]
      },
      {
        title: lang === "en" ? "Terms" : "📄 規約・確認",
        ids: ["not-for", "disclaimer"]
      }
    ];

    const byId = new Map(sections.map((s) => [s.id, s]));
    const used = new Set();

    groupDefs.forEach((g) => {
      const items = g.ids.map((id) => byId.get(id)).filter(Boolean);
      if (items.length === 0) return;
      items.forEach((el) => used.add(el.id));

      const groupEl = document.createElement("div");
      groupEl.className = "menu-group";
      const h = document.createElement("h4");
      h.textContent = g.title;
      groupEl.appendChild(h);
      const ul = document.createElement("ul");
      ul.className = "menu-list";
      items.forEach((sec) => {
        appendSectionAndAccordionItems(ul, sec, closeMenuFn, lang);
      });
      groupEl.appendChild(ul);
      menuGroupsEl.appendChild(groupEl);
    });

    const rest = sections.filter((s) => !used.has(s.id));
    if (rest.length > 0) {
      const groupEl = document.createElement("div");
      groupEl.className = "menu-group";
      const h = document.createElement("h4");
      h.textContent = lang === "en" ? "Others" : "その他";
      groupEl.appendChild(h);
      const ul = document.createElement("ul");
      ul.className = "menu-list";
      rest.forEach((sec) => {
        appendSectionAndAccordionItems(ul, sec, closeMenuFn, lang);
      });
      groupEl.appendChild(ul);
      menuGroupsEl.appendChild(groupEl);
    }
  }

  function ensureDetailsId(detailsEl, sectionId, idx) {
    if (detailsEl.id && String(detailsEl.id).trim()) return detailsEl.id;
    const sum = $("summary", detailsEl);
    const label = sum ? (sum.textContent || "").trim() : "";
    const slug = makeSafeId(label || `detail-${idx + 1}`);
    const newId = `${sectionId}--${slug}--${idx + 1}`;
    detailsEl.id = newId;
    return newId;
  }

  function appendSectionAndAccordionItems(ul, sectionEl, closeMenuFn, lang) {
    if (!ul || !sectionEl || !sectionEl.id) return;
    ul.appendChild(makeMenuItem(sectionEl.id, getSectionTitle(sectionEl, lang), closeMenuFn, { isSub: false }));

    // .accordion > details のみサブ項目化（fallback廃止 — 不要な詳細が大量出力するのを防ぐ）
    const detailsList = $$(".accordion > details", sectionEl);
    detailsList.slice(0, 6).forEach((d, i) => {
      const did = ensureDetailsId(d, sectionEl.id, i);
      ul.appendChild(makeMenuItem(did, getDetailsTitle(d, lang), closeMenuFn, { isSub: true }));
    });
  }

  function makeMenuItem(targetId, label, closeMenuFn, opt) {
    const options = opt || {};
    const li = document.createElement("li");
    if (options.isSub) li.classList.add("sub");
    const a = document.createElement("a");
    a.href = `#${targetId}`;
    a.textContent = label;
    on(a, "click", (e) => {
      e.preventDefault();
      if (typeof closeMenuFn === "function") closeMenuFn();
      const el = document.getElementById(targetId);
      if (el && el.tagName === "DETAILS") {
        try { el.open = true; } catch (_) {}
      }
      smoothScrollToId(targetId, 86);
    });
    li.appendChild(a);
    return li;
  }

  /* =========================================================
     3) 固定CTA：「トップへ」
  ========================================================= */
  function initTopButton() {
    const toTop = $("#toTop");
    if (!toTop) return;
    on(toTop, "click", (e) => {
      e.preventDefault();
      const topAnchor = $("#page-top");
      if (topAnchor && topAnchor.id) {
        smoothScrollToId(topAnchor.id, 0);
      } else {
        try { window.scrollTo({ top: 0, behavior: "smooth" }); }
        catch (err) { window.scrollTo(0, 0); }
      }
    });
  }

  /* =========================================================
     4) 複利ツール（#cf-tool）
  ========================================================= */
  function initCompoundTool() {
    const tool = $("#cf-tool");
    if (!tool) return;

    const currencySel = $("#cf-currency", tool);
    const principalInp = $("#cf-principal", tool);
    const rateInp = $("#cf-rate", tool);
    const rateDisp = $("#cf-rate-display", tool);
    const yearsInp = $("#cf-years", tool);
    const nperSel = $("#cf-nper", tool);
    const isCompChk = $("#cf-is-comp", tool);
    const ackChk = $("#cf-ack", tool);
    const runBtn = $("#cf-run", tool);
    const clearBtn = $("#cf-clear", tool);
    const out = $("#cf-out", tool);

    if (!currencySel || !principalInp || !rateInp || !yearsInp || !nperSel || !isCompChk || !ackChk || !runBtn || !clearBtn || !out) {
      return;
    }

    function updateRateDisplay() {
      const r = safeNumber(rateInp.value, 0);
      if (rateDisp) rateDisp.textContent = `${toFixed2(r)}%`;
    }

    function updateRunEnabled() {
      runBtn.disabled = !ackChk.checked;
    }

    function getCurrencyMeta() {
      const opt = currencySel.options[currencySel.selectedIndex];
      const locale = opt ? (opt.getAttribute("data-locale") || "ja-JP") : "ja-JP";
      const symbol = opt ? (opt.getAttribute("data-symbol") || "") : "";
      const code = opt ? (opt.value || "JPY") : "JPY";
      return { locale, symbol, code };
    }

    function formatMoney(value, meta) {
      const v = Number.isFinite(value) ? value : 0;
      try {
        const num = new Intl.NumberFormat(meta.locale, { maximumFractionDigits: 2 }).format(v);
        return `${meta.symbol}${num}`;
      } catch (e) {
        return `${meta.symbol}${String(round2(v))}`;
      }
    }

    function renderResult(kvPairs, title) {
      out.innerHTML = "";
      const h = document.createElement("h5");
      h.textContent = title;
      out.appendChild(h);
      const kv = document.createElement("div");
      kv.className = "cf-kv";
      kvPairs.forEach(([k, v]) => {
        const dk = document.createElement("div");
        dk.textContent = k;
        const dv = document.createElement("div");
        dv.style.fontWeight = "800";
        dv.textContent = v;
        kv.appendChild(dk);
        kv.appendChild(dv);
      });
      out.appendChild(kv);
    }

    function validateInputs() {
      const principal = safeNumber(principalInp.value, NaN);
      const rate = safeNumber(rateInp.value, NaN);
      const years = safeNumber(yearsInp.value, NaN);
      const nper = safeNumber(nperSel.value, NaN);
      const errors = [];
      if (!Number.isFinite(principal) || principal < 0) errors.push("元本は 0 以上の数字にしてください。");
      if (!Number.isFinite(rate) || rate < 0) errors.push("年率（%）は 0 以上の数字にしてください。");
      if (!Number.isFinite(years) || years < 0) errors.push("年数は 0 以上の数字にしてください。");
      if (!Number.isFinite(nper) || nper <= 0) errors.push("回数/年は 1 以上を選んでください。");
      return { ok: errors.length === 0, errors, principal, rate, years, nper };
    }

    function calcCompound(P, ratePercent, years, nper) {
      const r = ratePercent / 100;
      const A = P * Math.pow(1 + (r / nper), nper * years);
      return { A, interest: A - P };
    }

    function calcSimple(P, ratePercent, years) {
      const r = ratePercent / 100;
      const A = P * (1 + r * years);
      return { A, interest: A - P };
    }

    function run() {
      if (!ackChk.checked) return;
      const meta = getCurrencyMeta();
      const v = validateInputs();
      if (!v.ok) {
        renderResult([["エラー", v.errors.join(" / ")]], "計算できません");
        return;
      }
      const isComp = !!isCompChk.checked;
      const res = isComp
        ? calcCompound(v.principal, v.rate, v.years, v.nper)
        : calcSimple(v.principal, v.rate, v.years);
      const total = res.A;
      const interest = res.interest;
      const resYearly = calcCompound(v.principal, v.rate, v.years, 1);
      const diffVsYearly = total - resYearly.A;
      const kvPairs = [
        ["計算モード", isComp ? "複利" : "単利"],
        ["通貨", `${meta.code}`],
        ["元本", formatMoney(v.principal, meta)],
        ["年率", `${toFixed2(v.rate)}%`],
        ["年数", `${stripTrailingZeros(v.years)} 年`],
        ...(isComp ? [["回数/年", `${Math.round(v.nper)}`]] : []),
        ["最終金額（概算）", formatMoney(round2(total), meta)],
        ["増えた分（概算）", formatMoney(round2(interest), meta)],
        ...(isComp ? [["参考：年1回複利との差（概算）", formatMoney(round2(diffVsYearly), meta)]] : [])
      ];
      renderResult(kvPairs, "結果（概算）");
    }

    function clear() {
      currencySel.value = "JPY";
      principalInp.value = "1000000";
      rateInp.value = "10.00";
      yearsInp.value = "7";
      nperSel.value = "12";
      isCompChk.checked = true;
      ackChk.checked = false;
      updateRateDisplay();
      updateRunEnabled();
      out.innerHTML = "";
    }

    $$(".cf-chip", tool).forEach((chip) => {
      on(chip, "click", () => {
        const r = chip.getAttribute("data-rate");
        if (r == null) return;
        rateInp.value = String(r);
        updateRateDisplay();
      });
    });

    on(rateInp, "input", updateRateDisplay);
    on(ackChk, "change", updateRunEnabled);
    on(runBtn, "click", run);
    on(clearBtn, "click", clear);

    updateRateDisplay();
    updateRunEnabled();
  }

  /* 数値ヘルパー */
  function safeNumber(v, fallback) {
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : fallback;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function toFixed2(n) {
    const x = Number.isFinite(n) ? n : 0;
    return (Math.round(x * 100) / 100).toFixed(2);
  }

  function stripTrailingZeros(n) {
    const x = Number.isFinite(n) ? n : 0;
    const s = String(x);
    if (s.includes(".")) return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
    return s;
  }

  /* 起動 */
  function boot() {
    initMenuDrawer();
    initTopButton();
    initCompoundTool();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

/* ============================================================
   スクロールアニメーション（モダンリデザイン2026）
   IntersectionObserver でカードを順番に表示
============================================================ */
(function() {
  'use strict';
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      // 非対応ブラウザは全部表示
      document.querySelectorAll('.why-card,.emp-card,.stat,.glp-card').forEach(function(el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.why-card,.emp-card,.stat,.glp-card').forEach(function(el) {
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }
})();
