// Smart Bean: a playable starter puzzle on the /smartbean page.
// Same rules and geometry as the app: cell (x, y) with x + y <= 9 is drawn at
// ((x - y) * K, (x + y) * K); pieces turn a quarter on the square grid and flip.
(() => {
  "use strict";

  const K = 36 / Math.SQRT2;
  const R = 16.5;
  const TRAY_Y = 392;
  const TRAY_SCALE = 0.72;
  const SLOTS = [-170, 0, 170];
  const TAP_SLOP = 6;
  const NS = "http://www.w3.org/2000/svg";

  const key = (x, y) => `${x},${y}`;
  const toScreen = ([x, y]) => [(x - y) * K, (x + y) * K];
  const normalize = (cells) => {
    const mx = Math.min(...cells.map((c) => c[0]));
    const my = Math.min(...cells.map((c) => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  };
  const rotate = (cells) => normalize(cells.map(([x, y]) => [-y, x]));
  const flip = (cells) => normalize(cells.map(([x, y]) => [y, x])); // mirrors left-right on screen
  const centroid = (cells) => {
    const pts = cells.map(toScreen);
    return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  };

  function pieceMarkup(cells, color) {
    let out = "";
    cells.forEach((a, i) => {
      cells.forEach((b, j) => {
        if (j <= i || Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return;
        const [x1, y1] = toScreen(a);
        const [x2, y2] = toScreen(b);
        out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${R * 0.62}" stroke-linecap="round"/>`;
      });
    });
    cells.forEach((c) => {
      const [x, y] = toScreen(c);
      out +=
        `<circle class="sb-bead" cx="${x}" cy="${y}" r="${R}" fill="${color}"/>` +
        `<circle cx="${x}" cy="${y}" r="${R}" fill="url(#sbGloss)" pointer-events="none"/>` +
        `<circle cx="${x}" cy="${y}" r="${R * 0.16}" fill="rgba(0,0,0,.38)" pointer-events="none"/>`;
    });
    return out;
  }

  function setup(root) {
    const game = JSON.parse(root.dataset.game);
    const text = JSON.parse(root.dataset.text);
    const svg = root.querySelector("svg");
    const msg = root.querySelector(".sb-play-msg");
    const bar = root.querySelector(".sb-play-bar");

    const board = new Set();
    for (let y = 0; y <= 9; y++) for (let x = 0; x <= 9 - y; x++) board.add(key(x, y));
    const fixed = new Map();
    game.fixed.forEach((p) => p.cells.forEach(([x, y]) => fixed.set(key(x, y), p.piece)));

    let loose, selected, started, done, drag;

    function reset() {
      loose = game.solution.map((p, i) => ({
        id: p.piece,
        color: game.pieces[p.piece].color,
        cells: normalize(game.pieces[p.piece].cells),
        answer: p.cells,
        slot: SLOTS[i],
        at: null, // [dx, dy] when placed on the board
      }));
      selected = null;
      started = null;
      done = false;
      drag = null;
      root.classList.remove("sb-won");
      say(text.start);
      render();
    }

    function say(s) {
      msg.textContent = s;
    }

    const placedCells = (p) => p.cells.map(([x, y]) => [x + p.at[0], y + p.at[1]]);

    function fits(piece, at) {
      const taken = new Set(fixed.keys());
      loose.forEach((p) => {
        if (p !== piece && p.at) placedCells(p).forEach(([x, y]) => taken.add(key(x, y)));
      });
      return piece.cells.every(([x, y]) => {
        const k = key(x + at[0], y + at[1]);
        return board.has(k) && !taken.has(k);
      });
    }

    function trayTransform(p) {
      const [cx, cy] = centroid(p.cells);
      return `translate(${p.slot - cx * TRAY_SCALE} ${TRAY_Y - cy * TRAY_SCALE}) scale(${TRAY_SCALE})`;
    }

    function render() {
      let out = svg.querySelector("defs").outerHTML;
      board.forEach((k) => {
        const [x, y] = toScreen(k.split(",").map(Number));
        out += `<circle class="sb-tray" cx="${x}" cy="${y}" r="25"/>`;
      });
      board.forEach((k) => {
        const [x, y] = toScreen(k.split(",").map(Number));
        out += `<circle class="sb-hole" cx="${x}" cy="${y}" r="15"/>`;
      });
      game.fixed.forEach((p) => {
        out += `<g class="sb-fixed">${pieceMarkup(p.cells, game.pieces[p.piece].color)}</g>`;
      });
      out += `<g class="sb-ghost"></g>`;
      out += `<rect class="sb-traybox" x="-258" y="${TRAY_Y - 82}" width="516" height="164" rx="26"/>`;
      loose.forEach((p, i) => {
        const where = p.at ? `translate(${(p.at[0] - p.at[1]) * K} ${(p.at[0] + p.at[1]) * K})` : trayTransform(p);
        const cls = `sb-loose${p === selected ? " is-selected" : ""}${p.at ? " is-placed" : ""}`;
        out += `<g class="${cls}" data-i="${i}" transform="${where}">${pieceMarkup(p.cells, p.color)}</g>`;
      });
      if (done) {
        out += `<g class="sb-wonmark"><rect x="-120" y="70" width="240" height="64" rx="18"/><text x="0" y="114">${text.wontitle}</text></g>`;
      }
      svg.innerHTML = out;
    }

    function svgPoint(ev) {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    function localPoint(p, pt) {
      if (p.at) return [pt.x - (p.at[0] - p.at[1]) * K, pt.y - (p.at[0] + p.at[1]) * K];
      const [cx, cy] = centroid(p.cells);
      return [(pt.x - (p.slot - cx * TRAY_SCALE)) / TRAY_SCALE, (pt.y - (TRAY_Y - cy * TRAY_SCALE)) / TRAY_SCALE];
    }

    function nearestCell(px, py) {
      const u = px / K;
      const v = py / K;
      return [Math.round((u + v) / 2), Math.round((v - u) / 2)];
    }

    function onDown(ev) {
      const g = ev.target.closest(".sb-loose");
      if (!g || done) return;
      ev.preventDefault();
      const piece = loose[Number(g.dataset.i)];
      const pt = svgPoint(ev);
      // Which bead was grabbed: the one nearest the pointer, in the piece's own frame.
      const local = localPoint(piece, pt);
      let grab = piece.cells[0];
      let best = Infinity;
      piece.cells.forEach((c) => {
        const [x, y] = toScreen(c);
        const d = (x - local[0]) ** 2 + (y - local[1]) ** 2;
        if (d < best) {
          best = d;
          grab = c;
        }
      });
      started = started || performance.now();
      drag = { piece, g, grab, x0: ev.clientX, y0: ev.clientY, moved: false, lift: ev.pointerType === "touch" ? 46 : 0 };
      svg.setPointerCapture(ev.pointerId);
    }

    function dropTarget(px, py) {
      const [gx, gy] = drag.grab;
      const [cx, cy] = nearestCell(px, py);
      return [cx - gx, cy - gy];
    }

    function onMove(ev) {
      if (!drag) return;
      if (!drag.moved && Math.hypot(ev.clientX - drag.x0, ev.clientY - drag.y0) < TAP_SLOP) return;
      if (!drag.moved) {
        drag.moved = true;
        selected = drag.piece;
        drag.piece.at = null;
        render();
        drag.g = svg.querySelector(`.sb-loose[data-i="${loose.indexOf(drag.piece)}"]`);
        drag.g.classList.add("is-dragging");
        svg.appendChild(drag.g);
      }
      const pt = svgPoint(ev);
      const py = pt.y - drag.lift;
      const [bx, by] = toScreen(drag.grab);
      drag.g.setAttribute("transform", `translate(${pt.x - bx} ${py - by})`);
      const at = dropTarget(pt.x, py);
      const ghost = svg.querySelector(".sb-ghost");
      ghost.innerHTML = fits(drag.piece, at)
        ? `<g transform="translate(${(at[0] - at[1]) * K} ${(at[0] + at[1]) * K})">${pieceMarkup(drag.piece.cells, drag.piece.color)}</g>`
        : "";
    }

    function onUp(ev) {
      if (!drag) return;
      const { piece, moved } = drag;
      if (!moved) {
        // A tap picks a piece; a tap on a placed piece takes it back off the board.
        piece.at = null;
        selected = piece;
        drag = null;
        say(text.picked);
        render();
        return;
      }
      const pt = svgPoint(ev);
      const at = dropTarget(pt.x, pt.y - drag.lift);
      drag = null;
      if (fits(piece, at)) {
        piece.at = at;
        selected = null;
        checkWin();
      } else {
        say(text.nofit);
      }
      render();
      if (piece.at) {
        const g = svg.querySelector(`.sb-loose[data-i="${loose.indexOf(piece)}"]`);
        g.classList.add("just-placed");
      }
    }

    function checkWin() {
      if (!loose.every((p) => p.at)) {
        say(text.placed);
        return;
      }
      done = true;
      const secs = Math.max(1, Math.round((performance.now() - (started || performance.now())) / 1000));
      root.classList.add("sb-won");
      say(text.won.replace("{s}", secs) + " ");
      if (root.dataset.store) {
        const a = document.createElement("a");
        a.href = root.dataset.store;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = text.more;
        msg.appendChild(a);
      }
    }

    function turnSelected(op) {
      const p = selected || loose.find((q) => !q.at);
      if (!p || done) return;
      p.at = null;
      p.cells = op(p.cells);
      selected = p;
      render();
    }

    const inAnswer = (q) => {
      if (!q.at) return false;
      const mine = new Set(placedCells(q).map((c) => key(...c)));
      return q.answer.every((c) => mine.has(key(...c)));
    };

    // Puts the first piece that is not yet in its answer spot there.
    function hint() {
      if (done) return;
      const target = loose.find((q) => !inAnswer(q));
      if (!target) return;
      started = started || performance.now();
      const answer = new Set(target.answer.map((c) => key(...c)));
      loose.forEach((q) => {
        if (q !== target && q.at && placedCells(q).some((c) => answer.has(key(...c)))) q.at = null;
      });
      target.cells = normalize(target.answer);
      target.at = [Math.min(...target.answer.map((c) => c[0])), Math.min(...target.answer.map((c) => c[1]))];
      selected = null;
      checkWin();
      render();
    }

    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", () => {
      drag = null;
      render();
    });
    bar.querySelector('[data-act="rotate"]').addEventListener("click", () => turnSelected(rotate));
    bar.querySelector('[data-act="flip"]').addEventListener("click", () => turnSelected(flip));
    bar.querySelector('[data-act="hint"]').addEventListener("click", hint);
    bar.querySelector('[data-act="reset"]').addEventListener("click", reset);
    root.addEventListener("keydown", (ev) => {
      if (ev.target.closest("input, textarea")) return;
      if (ev.key === "r" || ev.key === "R") turnSelected(rotate);
      if (ev.key === "f" || ev.key === "F") turnSelected(flip);
    });

    svg.setAttribute("viewBox", `-262 -32 524 ${TRAY_Y + 90 + 32}`);
    root.classList.add("is-live");
    bar.hidden = false;
    reset();
  }

  document.querySelectorAll(".sb-play[data-game]").forEach(setup);
})();
