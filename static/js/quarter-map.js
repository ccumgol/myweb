(function () {
  "use strict";
  var svg = document.getElementById("us-map");
  var panel = document.getElementById("q-panel");
  if (!svg || !panel) return;

  var coins = window.__qcoins;
  if (!Array.isArray(coins)) {
    var dataEl = document.getElementById("qcoin-map-data");
    try {
      coins = JSON.parse(dataEl.textContent);
      if (typeof coins === "string") coins = JSON.parse(coins);
    } catch (e) { return; }
  }
  if (!Array.isArray(coins)) return;

  // group coins by state/territory abbreviation
  var byAbbr = {};
  coins.forEach(function (c) {
    if (!c.abbr) return;
    (byAbbr[c.abbr] = byAbbr[c.abbr] || []).push(c);
  });
  // sort each group by year
  Object.keys(byAbbr).forEach(function (a) {
    byAbbr[a].sort(function (x, y) { return (x.year || 0) - (y.year || 0); });
  });

  var seriesShort = {
    "50개 주": "주",
    "미국의 아름다운 국립공원": "국립공원",
    "D.C. & 미국 준주": "준주"
  };

  function headingName(list) {
    var s = list.find(function (c) { return c.series === "50개 주"; });
    if (s) return s.title;
    // e.g. "캘리포니아 — 요세미티..." -> take part before —
    return (list[0].title || "").split("—")[0].trim() || list[0].abbr;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  function render(abbr) {
    var list = byAbbr[abbr];
    if (!list) return;
    var html = '<h3>' + esc(headingName(list)) + '</h3>';
    list.forEach(function (c) {
      html +=
        '<a class="q-pcoin" href="' + esc(c.url) + '">' +
        '<img src="' + esc(c.image) + '" loading="lazy" alt="">' +
        '<span>' +
        '<span class="s">' + esc(seriesShort[c.series] || c.series) + '</span><br>' +
        '<span class="t">' + esc(c.title) + '</span> ' +
        '<span class="y">(' + esc(c.year) + ')</span>' +
        '</span></a>';
    });
    panel.innerHTML = html;
  }

  var current = null;
  Object.keys(byAbbr).forEach(function (abbr) {
    var el = document.getElementById(abbr);
    if (!el) return; // territory not on the 50-state SVG
    el.classList.add("has-coin");
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    function activate() {
      if (current) current.classList.remove("active");
      el.classList.add("active");
      current = el;
      render(abbr);
    }
    el.addEventListener("click", activate);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
  });
})();
