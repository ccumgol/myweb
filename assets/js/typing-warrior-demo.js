/*!
 * Typing Warrior — a small practice line you can type right on the page.
 *
 * The Hangul composition and the keyboard tables below are ported from the app's
 * own source so the demo behaves exactly like the real thing: it reads the
 * physical key position (KeyboardEvent.code) and builds 두벌식 Hangul itself,
 * no matter which input method the visitor's computer has selected.
 *
 * Source: https://github.com/ccumgol/typing-warrior (MIT)
 *   src/renderer/core/hangul.js, keyboard-layout.js, typing-input.js
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- Hangul */

  var CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  var JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  var JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  var BASE = 0xac00;
  var LAST = 0xd7a3;

  var JUNG_COMBINE = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ' };
  var JONG_COMBINE = {
    'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ',
    'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ',
  };

  // Compound jamo -> the atomic keys that produce it.
  var SPLIT = {};
  [JUNG_COMBINE, JONG_COMBINE].forEach(function (table) {
    Object.keys(table).forEach(function (pair) { SPLIT[table[pair]] = [pair[0], pair[1]]; });
  });

  var CONSONANTS = {};
  CHO.concat(JONG.filter(Boolean)).forEach(function (c) { CONSONANTS[c] = true; });
  var VOWELS = {};
  JUNG.forEach(function (v) { VOWELS[v] = true; });

  var EMPTY = { cho: '', jung: '', jong: '' };

  function renderBlock(b) {
    if (b.cho && b.jung) {
      return String.fromCharCode(BASE + (CHO.indexOf(b.cho) * 21 + JUNG.indexOf(b.jung)) * 28 + JONG.indexOf(b.jong || ''));
    }
    return b.cho || b.jung || '';
  }

  function addConsonant(b, c) {
    if (!b.cho && !b.jung) return { out: '', block: { cho: c, jung: '', jong: '' } };
    if (!b.jung || !b.cho) return { out: renderBlock(b), block: { cho: c, jung: '', jong: '' } };
    if (!b.jong) {
      return JONG.indexOf(c) >= 0
        ? { out: '', block: { cho: b.cho, jung: b.jung, jong: c } }
        : { out: renderBlock(b), block: { cho: c, jung: '', jong: '' } };
    }
    var joined = JONG_COMBINE[b.jong + c];
    return joined
      ? { out: '', block: { cho: b.cho, jung: b.jung, jong: joined } }
      : { out: renderBlock(b), block: { cho: c, jung: '', jong: '' } };
  }

  function addVowel(b, v) {
    if (b.jong) {
      // The final consonant moves on to start the next syllable (갑 + ㅏ -> 가바).
      var parts = SPLIT[b.jong];
      var keep = parts ? parts[0] : '';
      var move = parts ? parts[1] : b.jong;
      return { out: renderBlock({ cho: b.cho, jung: b.jung, jong: keep }), block: { cho: move, jung: v, jong: '' } };
    }
    if (b.jung) {
      var joined = JUNG_COMBINE[b.jung + v];
      return joined
        ? { out: '', block: { cho: b.cho, jung: joined, jong: '' } }
        : { out: renderBlock(b), block: { cho: '', jung: v, jong: '' } };
    }
    if (b.cho) return { out: '', block: { cho: b.cho, jung: v, jong: '' } };
    return { out: '', block: { cho: '', jung: v, jong: '' } };
  }

  function compose(tokens) {
    var text = '';
    var block = EMPTY;
    for (var i = 0; i < tokens.length; i += 1) {
      var t = tokens[i];
      var step;
      if (CONSONANTS[t]) step = addConsonant(block, t);
      else if (VOWELS[t]) step = addVowel(block, t);
      else step = { out: renderBlock(block) + t, block: EMPTY };
      text += step.out;
      block = step.block;
    }
    return text + renderBlock(block);
  }

  function decompose(text) {
    var tokens = [];
    Array.prototype.forEach.call(text, function (ch) {
      var code = ch.charCodeAt(0);
      if (code >= BASE && code <= LAST) {
        var index = code - BASE;
        var jung = JUNG[Math.floor((index % 588) / 28)];
        var jong = JONG[index % 28];
        tokens.push(CHO[Math.floor(index / 588)]);
        tokens = tokens.concat(SPLIT[jung] || [jung]);
        if (jong) tokens = tokens.concat(SPLIT[jong] || [jong]);
      } else if (SPLIT[ch]) {
        tokens = tokens.concat(SPLIT[ch]);
      } else {
        tokens.push(ch);
      }
    });
    return tokens;
  }

  /* ------------------------------------------------------- Keyboard layout */

  function k(code, en, enShift, ko, koShift, finger) {
    return { code: code, en: en, enShift: enShift, ko: ko, koShift: koShift, finger: finger };
  }
  function wide(code, label, finger, size) {
    return { code: code, label: label, finger: finger, size: size, special: true };
  }

  var ROWS = [
    [
      k('Backquote', '`', '~', '`', '~', 'L5'), k('Digit1', '1', '!', '1', '!', 'L5'),
      k('Digit2', '2', '@', '2', '@', 'L4'), k('Digit3', '3', '#', '3', '#', 'L3'),
      k('Digit4', '4', '$', '4', '$', 'L2'), k('Digit5', '5', '%', '5', '%', 'L2'),
      k('Digit6', '6', '^', '6', '^', 'R2'), k('Digit7', '7', '&', '7', '&', 'R2'),
      k('Digit8', '8', '*', '8', '*', 'R3'), k('Digit9', '9', '(', '9', '(', 'R4'),
      k('Digit0', '0', ')', '0', ')', 'R5'), k('Minus', '-', '_', '-', '_', 'R5'),
      k('Equal', '=', '+', '=', '+', 'R5'), wide('Backspace', '⌫', 'R5', 2),
    ],
    [
      wide('Tab', 'Tab', 'L5', 1.5),
      k('KeyQ', 'q', 'Q', 'ㅂ', 'ㅃ', 'L5'), k('KeyW', 'w', 'W', 'ㅈ', 'ㅉ', 'L4'),
      k('KeyE', 'e', 'E', 'ㄷ', 'ㄸ', 'L3'), k('KeyR', 'r', 'R', 'ㄱ', 'ㄲ', 'L2'),
      k('KeyT', 't', 'T', 'ㅅ', 'ㅆ', 'L2'), k('KeyY', 'y', 'Y', 'ㅛ', 'ㅛ', 'R2'),
      k('KeyU', 'u', 'U', 'ㅕ', 'ㅕ', 'R2'), k('KeyI', 'i', 'I', 'ㅑ', 'ㅑ', 'R3'),
      k('KeyO', 'o', 'O', 'ㅐ', 'ㅒ', 'R4'), k('KeyP', 'p', 'P', 'ㅔ', 'ㅖ', 'R5'),
      k('BracketLeft', '[', '{', '[', '{', 'R5'), k('BracketRight', ']', '}', ']', '}', 'R5'),
      k('Backslash', '\\', '|', '\\', '|', 'R5'),
    ],
    [
      wide('CapsLock', 'Caps', 'L5', 1.8),
      k('KeyA', 'a', 'A', 'ㅁ', 'ㅁ', 'L5'), k('KeyS', 's', 'S', 'ㄴ', 'ㄴ', 'L4'),
      k('KeyD', 'd', 'D', 'ㅇ', 'ㅇ', 'L3'), k('KeyF', 'f', 'F', 'ㄹ', 'ㄹ', 'L2'),
      k('KeyG', 'g', 'G', 'ㅎ', 'ㅎ', 'L2'), k('KeyH', 'h', 'H', 'ㅗ', 'ㅗ', 'R2'),
      k('KeyJ', 'j', 'J', 'ㅓ', 'ㅓ', 'R2'), k('KeyK', 'k', 'K', 'ㅏ', 'ㅏ', 'R3'),
      k('KeyL', 'l', 'L', 'ㅣ', 'ㅣ', 'R4'), k('Semicolon', ';', ':', ';', ':', 'R5'),
      k('Quote', "'", '"', "'", '"', 'R5'), wide('Enter', 'Enter', 'R5', 2.2),
    ],
    [
      wide('ShiftLeft', 'Shift', 'L5', 2.4),
      k('KeyZ', 'z', 'Z', 'ㅋ', 'ㅋ', 'L5'), k('KeyX', 'x', 'X', 'ㅌ', 'ㅌ', 'L4'),
      k('KeyC', 'c', 'C', 'ㅊ', 'ㅊ', 'L3'), k('KeyV', 'v', 'V', 'ㅍ', 'ㅍ', 'L2'),
      k('KeyB', 'b', 'B', 'ㅠ', 'ㅠ', 'L2'), k('KeyN', 'n', 'N', 'ㅜ', 'ㅜ', 'R2'),
      k('KeyM', 'm', 'M', 'ㅡ', 'ㅡ', 'R2'), k('Comma', ',', '<', ',', '<', 'R3'),
      k('Period', '.', '>', '.', '>', 'R4'), k('Slash', '/', '?', '/', '?', 'R5'),
      wide('ShiftRight', 'Shift', 'R5', 2.8),
    ],
    [wide('Space', '', 'T', 7)],
  ];

  var HOME = { KeyF: true, KeyJ: true };
  var BY_CODE = {};
  ROWS.forEach(function (row) { row.forEach(function (key) { BY_CODE[key.code] = key; }); });

  function charFromKey(code, opts) {
    if (code === 'Space') return ' ';
    var key = BY_CODE[code];
    if (!key || key.special) return null;
    if (opts.lang === 'ko') return opts.shift ? key.koShift : key.ko;
    var isLetter = /^[a-z]$/.test(key.en);
    var upper = isLetter ? opts.shift !== opts.capsLock : opts.shift;
    return upper ? key.enShift : key.en;
  }

  var REVERSE = (function () {
    var map = { ' ': { code: 'Space', shift: false, finger: 'T' } };
    var chars = [];
    ROWS.forEach(function (row) { row.forEach(function (key) { if (!key.special) chars.push(key); }); });
    var add = function (ch, key, shift) {
      if (ch && !Object.prototype.hasOwnProperty.call(map, ch)) map[ch] = { code: key.code, shift: shift, finger: key.finger };
    };
    chars.forEach(function (key) { add(key.en, key, false); add(key.ko, key, false); });
    chars.forEach(function (key) { add(key.enShift, key, true); add(key.koShift, key, true); });
    return map;
  })();

  function keyForChar(ch) {
    var info = REVERSE[ch];
    if (!info) return null;
    if (!info.shift) return info;
    // Shift is pressed with the opposite hand.
    return { code: info.code, shift: true, finger: info.finger, shiftCode: info.finger.charAt(0) === 'L' ? 'ShiftRight' : 'ShiftLeft' };
  }

  /* ----------------------------------------------------------- Demo driver */

  var AUTO_DELAY = 150;

  function buildKeyboard(root) {
    var kb = document.createElement('div');
    kb.className = 'tw-kb';
    kb.setAttribute('aria-hidden', 'true');
    ROWS.forEach(function (row) {
      var line = document.createElement('div');
      line.className = 'tw-kb-row';
      row.forEach(function (key) {
        var cap = document.createElement('span');
        cap.className = 'tw-key' + (key.special ? ' is-special' : '') + (HOME[key.code] ? ' is-home' : '');
        cap.style.flexGrow = String(key.size || 1);
        cap.dataset.code = key.code;
        var main = document.createElement('b');
        var sub = document.createElement('i');
        cap.appendChild(main);
        cap.appendChild(sub);
        line.appendChild(cap);
      });
      kb.appendChild(line);
    });
    root.appendChild(kb);
    return kb;
  }

  function start(root) {
    // Hugo lower-cases front-matter keys, so every key read here is lower case.
    var text = JSON.parse(root.dataset.text || '{}');
    var lines = JSON.parse(root.dataset.lines || '[]');
    if (!lines.length) return;

    var lineBox = root.querySelector('.tw-line');
    var sourceBox = root.querySelector('.tw-source');
    var msgBox = root.querySelector('.tw-msg');
    var statBox = root.querySelector('.tw-stats');
    var tabs = root.querySelectorAll('.tw-tab');
    var kb = buildKeyboard(root.querySelector('.tw-kb-slot'));
    var caps = kb.querySelectorAll('.tw-key');

    var state = {
      index: 0,
      typed: [],
      target: [],
      lang: 'ko',
      startedAt: 0,
      presses: 0,
      mistakes: 0,
      done: false,
      auto: false,
      timer: 0,
      tick: 0,
    };

    function fmt(template, values) {
      return String(template || '').replace(/\{(\w+)\}/g, function (_, name) {
        return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : '';
      });
    }

    function paintKeyboard() {
      var next = null;
      if (!state.done) {
        var allCorrect = state.typed.every(function (t, i) { return t === state.target[i]; });
        if (!allCorrect) next = { code: 'Backspace' };
        else if (state.typed.length < state.target.length) next = keyForChar(state.target[state.typed.length]);
      }
      Array.prototype.forEach.call(caps, function (cap) {
        var code = cap.dataset.code;
        var key = BY_CODE[code];
        var label = key.special ? key.label : (state.lang === 'ko' ? key.ko : key.en);
        var shiftLabel = key.special ? '' : (state.lang === 'ko' ? key.koShift : key.enShift);
        cap.firstChild.textContent = label;
        cap.lastChild.textContent = shiftLabel && shiftLabel !== label ? shiftLabel : '';
        cap.classList.toggle('is-next', Boolean(next) && code === next.code);
        cap.classList.toggle('is-shift', Boolean(next && next.shiftCode) && code === next.shiftCode);
      });
    }

    function paintLine() {
      var typedText = compose(state.typed);
      var frag = document.createDocumentFragment();
      var good = 0;
      while (good < state.typed.length && state.typed[good] === state.target[good]) good += 1;
      var ok = compose(state.target.slice(0, good));
      var wrong = typedText.slice(ok.length);
      var rest = state.text.slice(ok.length + wrong.length);

      var make = function (cls, value) {
        if (!value) return;
        var span = document.createElement('span');
        span.className = cls;
        span.textContent = value;
        frag.appendChild(span);
      };
      make('tw-ok', ok);
      make('tw-bad', wrong);
      var caret = document.createElement('span');
      caret.className = 'tw-caret';
      frag.appendChild(caret);
      make('tw-rest', rest);
      lineBox.textContent = '';
      lineBox.appendChild(frag);
    }

    // Keystrokes a minute (타수), the same figure the app's status bar shows.
    function speedOf(seconds, correct) {
      if (seconds < 1 || !correct) return 0;
      return Math.min(Math.round((correct / seconds) * 60), 999);
    }

    function paintStats() {
      var seconds = state.startedAt ? (Date.now() - state.startedAt) / 1000 : 0;
      var correct = 0;
      state.typed.forEach(function (t, i) { if (t === state.target[i]) correct += 1; });
      var wpm = speedOf(seconds, correct);
      var accuracy = state.presses ? Math.round(((state.presses - state.mistakes) / state.presses) * 100) : 100;
      statBox.innerHTML = '';
      [[text.speed, wpm], [text.accuracy, accuracy + '%'], [text.time, Math.round(seconds) + 's']]
        .forEach(function (pair) {
          var item = document.createElement('span');
          var label = document.createElement('small');
          label.textContent = pair[0];
          var value = document.createElement('b');
          value.textContent = pair[1];
          item.appendChild(label);
          item.appendChild(value);
          statBox.appendChild(item);
        });
    }

    function load(index) {
      var line = lines[index] || lines[0];
      state.index = index;
      state.lang = line.lang === 'en' ? 'en' : 'ko';
      state.text = line.text;
      state.target = decompose(line.text);
      state.typed = [];
      state.startedAt = 0;
      state.presses = 0;
      state.mistakes = 0;
      state.done = false;
      state.tick = 0;
      root.classList.remove('is-done');
      sourceBox.textContent = line.source || '';
      Array.prototype.forEach.call(tabs, function (tab, i) {
        tab.classList.toggle('is-on', i === index);
        tab.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
      msgBox.textContent = state.auto ? text.autohint : text.hint;
      paintLine();
      paintStats();
      paintKeyboard();
    }

    function finish() {
      state.done = true;
      root.classList.add('is-done');
      var seconds = (Date.now() - state.startedAt) / 1000;
      var wpm = speedOf(seconds, state.target.length);
      var accuracy = state.presses ? Math.round(((state.presses - state.mistakes) / state.presses) * 100) : 100;
      msgBox.textContent = fmt(text.done, { wpm: wpm, accuracy: accuracy });
      paintStats();
      paintKeyboard();
    }

    function press(token, isBackspace) {
      if (state.done) return;
      if (!state.startedAt) state.startedAt = Date.now();
      if (isBackspace) {
        state.typed = state.typed.slice(0, -1);
      } else {
        var position = state.typed.length;
        state.presses += 1;
        if (token !== state.target[position]) state.mistakes += 1;
        state.typed = state.typed.concat([token]);
      }
      paintLine();
      paintStats();
      paintKeyboard();
      if (state.typed.length === state.target.length
        && state.typed.every(function (t, i) { return t === state.target[i]; })) finish();
    }

    function stopAuto() {
      if (state.timer) { clearInterval(state.timer); state.timer = 0; }
    }

    function runAuto() {
      stopAuto();
      state.auto = true;
      root.classList.add('is-auto');
      load(state.index);
      state.timer = setInterval(function () {
        if (state.typed.length >= state.target.length) {
          stopAuto();
          setTimeout(function () {
            if (!state.auto) return;
            load((state.index + 1) % lines.length);
            runAuto();
          }, 1800);
          return;
        }
        press(state.target[state.typed.length], false);
      }, AUTO_DELAY);
    }

    function goLive() {
      if (!state.auto && state.startedAt) return;
      stopAuto();
      state.auto = false;
      root.classList.remove('is-auto');
      load(state.index);
    }

    function onKeyDown(event) {
      if (!root.contains(document.activeElement)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === 'Tab') return;
      if (event.code === 'Backspace') {
        event.preventDefault();
        if (state.auto) goLive();
        press(null, true);
        return;
      }
      if (event.code === 'Enter') {
        event.preventDefault();
        if (state.done) load((state.index + 1) % lines.length);
        return;
      }
      var ch = charFromKey(event.code, {
        shift: event.shiftKey,
        capsLock: event.getModifierState ? event.getModifierState('CapsLock') : false,
        lang: state.lang,
      });
      if (ch === null) return;
      event.preventDefault();
      if (state.auto) goLive();
      press(ch, false);
    }

    // The card itself holds the focus; the page keeps every other key to itself.
    document.addEventListener('keydown', onKeyDown);
    root.addEventListener('pointerdown', function (event) {
      if (event.target.closest('button')) return;
      event.preventDefault();
      root.focus({ preventScroll: true });
    });

    Array.prototype.forEach.call(tabs, function (tab, i) {
      tab.addEventListener('click', function () {
        stopAuto();
        state.auto = false;
        root.classList.remove('is-auto');
        load(i);
        root.focus();
      });
    });

    var restart = root.querySelector('[data-act="restart"]');
    if (restart) {
      restart.addEventListener('click', function () {
        stopAuto();
        state.auto = false;
        root.classList.remove('is-auto');
        load(state.index);
        root.focus();
      });
    }

    root.classList.add('is-live');
    root.tabIndex = 0;
    root.addEventListener('focusin', function () {
      root.classList.add('is-focused');
      if (!state.auto && !state.done && !state.startedAt) msgBox.textContent = text.ready;
    });
    root.addEventListener('focusout', function () {
      root.classList.remove('is-focused');
      if (!state.auto && !state.done && !state.startedAt) msgBox.textContent = text.hint;
    });

    // Touch devices have no physical keyboard, so show the line typing itself.
    // The first real key press (an iPad with a Magic Keyboard, say) takes over.
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    load(0);
    if (coarse) runAuto();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.tw-demo'), start);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
