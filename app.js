(function () {
  "use strict";

  var KEY = "dragons-hoard-v1";
  var $ = function (id) { return document.getElementById(id); };
  var SVGNS = "http://www.w3.org/2000/svg";

  // ---------- dates ----------
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function str(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return str(new Date()); }
  function utc(s) { var p = s.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = new Date(utc(s) + n * 86400000); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function dayIndex(s) { return Math.round((utc(s) - utc(state.start)) / 86400000); }
  function niceDate(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }

  // ---------- saved state ----------
  var demo = /[?&]demo=(\d+)/.exec(location.search);
  var state = load();

  function load() {
    var s = null;
    if (!demo) {
      try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    }
    if (!s || !s.start) s = { start: todayStr(), days: {}, star: false, alarms: false, name: "Ember", longer: false };
    if (!s.days) s.days = {};
    if (!s.name) s.name = "Ember";
    if (demo) {
      var n = +demo[1];
      s.start = addDays(todayStr(), -n);
      for (var i = 0; i < n; i++) s.days[addDays(s.start, i)] = { quest: "full", am: true, pm: true };
      if (n > 14) {
        s.side = { house: { awake: true, text: "" } };
        for (var j = 15; j < n; j += 2) s.days[addDays(s.start, j)].house = true;
      }
      s.star = n > 4;
      s.alarms = true;
    }
    return s;
  }
  function save() {
    if (demo) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }
  function day(s) { return state.days[s] || (state.days[s] = {}); }
  function gemCount() {
    var n = 0;
    for (var k in state.days) if (state.days[k].quest) n++;
    return n;
  }

  // ---------- gems ----------
  var SHAPES = [
    ["M12 2 21 10 12 22 3 10z", "M12 2 16 10 12 22 8 10z"],
    ["M12 2 20.5 7v10L12 22 3.5 17V7z", "M12 6 17 9v6l-5 3-5-3V9z"],
    ["M12 2c5 6 8 9.5 8 13a8 8 0 0 1-16 0c0-3.5 3-7 8-13z", "M12 8c2.5 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1.5-4 4-7z"],
    ["M8 2h8l6 6v8l-6 6H8l-6-6V8z", "M9 6h6l3 3v6l-3 3H9l-3-3V9z"],
    ["M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-1.5A5 5 0 0 1 22 8c0 3.5-3 7-10 13z", "M12 17c-4-3.5-6-6-6-8.500a2.500 2.500 0 0 1 5-.5h2a2.500 2.500 0 0 1 5 .5c0 2.500-2 5-6 8.500z"]
  ];
  var COLOURS = ["#e0314b", "#1fbf75", "#3b82f6", "#a855f7", "#f8fafc", "#f472b6", "#22d3ee"];
  function gemParts(i) {
    var sh = SHAPES[(i * 3 + 1) % SHAPES.length];
    var col = COLOURS[(i * 5 + 2) % COLOURS.length];
    return '<path d="' + sh[0] + '" fill="' + col + '" stroke="#fff" stroke-opacity=".55" stroke-width="1"/>' +
      '<path d="' + sh[1] + '" fill="#fff" opacity=".3"/><circle cx="9" cy="8" r="1.6" fill="#fff" opacity=".85"/>';
  }
  function gemSvg(i) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + gemParts(i) + "</svg>"; }

  // ---------- the scene ----------
  var SPOTS = [[72.7,177.2],[222.1,169.7],[42.9,187.1],[172.3,172.2],[112.6,189.6],[276.9,179.7],[212.2,203.6],[92.7,167.2],[137.5,202.1],[239.5,175.7],[57.8,199.6],[187.3,177.2],[30.4,189.6],[252.0,204.6],[82.7,194.6],[286.8,192.1],[125.0,177.2],[192.2,205.6],[60.3,172.2],[266.9,167.2],[102.6,207.1],[159.9,175.7],[232.1,207.1],[45.4,169.7],[77.7,209.5],[207.2,175.7],[279.4,202.1],[140.0,187.1]];
  function renderScene() {
    var g = gemCount();
    var shown = Math.min(g, 28);
    if (state.star) $("starGem").removeAttribute("hidden"); else $("starGem").setAttribute("hidden", "");

    // every gem earned lands on the gold, in its own place
    var out = "";
    for (var i = 0; i < shown; i++) {
      out += '<g class="pile-gem" transform="translate(' + (SPOTS[i][0] - 7.5) + "," + (SPOTS[i][1] - 7.5) + ') scale(.62)">' + gemParts(i) + "</g>";
    }
    $("pileGems").innerHTML = out;

    var name = state.name, line;
    if (g === 0) line = name + " is fast asleep, dreaming of a first gem from you.";
    else if (g === 1) line = name + " is dreaming on the hoard, with one gem from you.";
    else line = name + " is dreaming on the hoard, with " + g + " gems from you.";
    if (day(todayStr()).quest) line += " Today's is safe in the pile.";
    $("sceneLine").textContent = line;
    $("dragonNameA").textContent = name;
    $("dragonNameB").textContent = name;
    $("dragonNameC").textContent = name;
    var sign = $("signName");
    sign.textContent = name;
    sign.setAttribute("font-size", name.length <= 8 ? 20 : name.length <= 11 ? 16 : name.length <= 15 ? 12 : 9.5);
    $("whisperText").textContent = "“" + pick(WORDS.whispers, state.wOff) + "”";
    $("twist").textContent = "Today's twist, only if you fancy it: " + pick(WORDS.twists, 0);
  }

  function puff(ch, colour) {
    var layer = $("puffs");
    for (var i = 0; i < 5; i++) {
      var t = document.createElementNS(SVGNS, "text");
      t.setAttribute("x", 120 + i * 20);
      t.setAttribute("y", 70 + (i % 2) * 16);
      t.setAttribute("font-size", 16 + (i % 3) * 5);
      t.setAttribute("fill", colour);
      t.setAttribute("class", "puff");
      t.style.animationDelay = i * 0.12 + "s";
      t.textContent = ch;
      layer.appendChild(t);
    }
    var cave = $("cave");
    cave.classList.remove("happy");
    void cave.getBoundingClientRect();
    cave.classList.add("happy");
    setTimeout(function () { layer.innerHTML = ""; }, 2600);
  }

  // ---------- the hoard grid ----------
  var popDate = null;
  function renderGrid() {
    var today = todayStr(), ti = dayIndex(today);
    var chapter = Math.max(0, Math.floor(ti / 28));
    $("chapterLabel").textContent = chapter > 0 ? "(month " + (chapter + 1) + ")" : "";
    var grid = $("grid");
    grid.innerHTML = "";
    for (var i = 0; i < 28; i++) {
      var idx = chapter * 28 + i, ds = addDays(state.start, idx);
      var has = !!(state.days[ds] && state.days[ds].quest);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "spot " + (idx < ti ? "past" : idx === ti ? "today" : "future") + (has ? " has" : "") + (ds === popDate ? " pop" : "");
      b.dataset.date = ds;
      b.setAttribute("aria-label", niceDate(ds) + (has ? ", gem earned" : idx > ti ? ", still to come" : ", empty spot"));
      if (has) b.innerHTML = gemSvg(idx);
      if (idx >= ti || has) b.tabIndex = -1;
      grid.appendChild(b);
    }
    popDate = null;
  }

  // ---------- quest card ----------
  var run = null, ticker = null, audio = null, lock = null;
  var STRETCHES = [
    "Reach for the sky. Stand tall, both arms up, slow breaths.",
    "Shoulder rolls. Slow circles backward, then forward.",
    "Side lean. One hand on your hip, the other arm overhead, lean gently. Then the other side.",
    "Calf stretch. Hands on a wall, one foot back, heel down. Then the other foot."
  ];
  function walkMins() { return state.longer && dayIndex(todayStr()) >= 14 ? 15 : 10; }

  function renderQuest() {
    var d = day(todayStr());
    $("questIdle").hidden = !!d.quest || !!run;
    $("questRun").hidden = !run;
    $("questDone").hidden = !d.quest || !!run;
    $("walkMins").textContent = walkMins();
    $("longerWrap").hidden = dayIndex(todayStr()) < 14;
    $("longerBox").checked = !!state.longer;
    $("amBtn").setAttribute("aria-pressed", d.am ? "true" : "false");
    $("pmBtn").setAttribute("aria-pressed", d.pm ? "true" : "false");
    $("starCard").hidden = !!state.star;
    $("alarmHelp").hidden = false;
    if (!state.alarms) $("alarmHelp").open = true;
    $("alarmsSet").hidden = !!state.alarms;
  }

  // ---------- sleeping quests: built in now, woken later, one at a time ----------
  var SIDE = [
    { id: "house", name: "The Tidy Nook", plain: "my house", mins: 5, one: "gold coin", many: "gold coins",
      lead: "Today's corner: ", tail: ". Five minutes, and stop when it rings.",
      icon: '<circle cx="12" cy="12" r="9" fill="#ffd34d" stroke="#b97a10" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#b97a10" stroke-width="1.5"/>' },
    { id: "heart", name: "The Hearth", plain: "my relationship", mins: 0, one: "pearl", many: "pearls",
      lead: "Today's small kind thing: ", tail: ".",
      icon: '<circle cx="12" cy="12" r="8" fill="#fbeff5" stroke="#f4b6cf" stroke-width="1.5"/><circle cx="9" cy="9" r="2.2" fill="#fff"/>' }
  ];
  var WORDS = window.HOARD_WORDS || { whispers: ["Small steps still fill a hoard."], twists: [""], house: ["one small corner"], heart: ["one small kind thing"] };
  function dayNum() { return Math.round(utc(todayStr()) / 86400000); }
  function pick(list, off) { return list[(dayNum() + (off || 0)) % list.length]; }
  function todays(q) { return q.lead + pick(WORDS[q.id], side(q.id).off) + q.tail; }
  var sideRun = null, sideTicker = null;
  function sideOf(id) { for (var i = 0; i < SIDE.length; i++) if (SIDE[i].id === id) return SIDE[i]; return null; }
  function side(id) {
    if (!state.side) state.side = {};
    return state.side[id] || (state.side[id] = { awake: false, text: "" });
  }
  function treasureCount(id) {
    var n = 0;
    for (var k in state.days) if (state.days[k][id]) n++;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function icon(q) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + q.icon + "</svg>"; }

  function renderSide() {
    var d = day(todayStr()), html = "", asleep = "", chest = "";
    SIDE.forEach(function (q) {
      var s = side(q.id), n = treasureCount(q.id), at = ' data-id="' + q.id + '"';
      if (s.awake || n) chest += "<span>" + icon(q) + n + " " + (n === 1 ? q.one : q.many) + "</span>";
      if (!s.awake) {
        asleep += '<div class="sleeper"><div><b>' + q.name + '</b> <span class="plain">(' + q.plain + ')</span></div>' +
          '<button class="btn plum small-btn" data-act="wake"' + at + ">Wake</button></div>";
        return;
      }
      html += '<section class="card side"><h2>' + q.name + ' <span class="plain">(' + q.plain + ")</span></h2>";
      if (sideRun && sideRun.id === q.id) {
        html += '<p class="clock mid" id="sideClock"></p><button class="linkish" data-act="stop"' + at + ">Stop the timer</button>";
      } else if (d[q.id]) {
        html += '<p class="won">Done for today. One more ' + q.one + " for the hoard.</p>" +
          '<button class="linkish" data-act="undo"' + at + ">That was a mistake, take it back</button>";
      } else {
        html += '<p class="quest-what">' + esc(s.text || todays(q)) + '</p><div class="row">' +
          (q.mins ? '<button class="btn gold" data-act="start"' + at + ">Start " + q.mins + " minutes</button>" : "") +
          '<button class="btn ruby" data-act="done"' + at + ">Done</button></div>" +
          '<div class="tiny-links"><button class="linkish" data-act="other"' + at + ">A different one</button>" +
          '<button class="linkish" data-act="words"' + at + ">Use my own words</button>" +
          '<button class="linkish" data-act="sleep"' + at + ">Put back to sleep</button></div>";
      }
      html += "</section>";
    });
    if (asleep) {
      html += '<section class="card sleeping"><h2>Sleeping quests</h2><p class="small">' +
        (dayIndex(todayStr()) < 28 ? "These are for after your first month. Wake one at a time, whenever you choose." :
          "Ready when you are. One new quest at a time works best.") + "</p>" + asleep + "</section>";
    }
    $("sideQuests").innerHTML = html;
    $("chest").innerHTML = chest;
    $("chest").hidden = !chest;
    sideTick();
  }

  function sideTick() {
    if (!sideRun) return;
    var left = Math.max(0, Math.ceil((sideRun.endsAt - Date.now()) / 1000));
    var c = $("sideClock");
    if (c) c.textContent = Math.floor(left / 60) + ":" + pad(left % 60);
    if (left <= 0) { var id = sideRun.id; stopSide(); chime(); earnSide(id); }
  }
  function stopSide() {
    sideRun = null;
    clearInterval(sideTicker); sideTicker = null;
    if (lock) { try { lock.release(); } catch (e) { /* already released */ } lock = null; }
  }
  function earnSide(id) {
    day(todayStr())[id] = true;
    save();
    renderAll();
    puff("✦", "#9be7ff");
    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
  }
  function wakeUp() {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { audio = null; }
    if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (l) { lock = l; }, function () {});
  }

  $("sideQuests").onclick = function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var q = sideOf(b.dataset.id), s = side(q.id), act = b.dataset.act;
    if (act === "wake") {
      var early = dayIndex(todayStr()) < 28;
      var msg = early ? "The plan is one quest for the first month, so it has time to stick. Wake " + q.name + " now anyway?" :
        "Wake " + q.name + "? One new quest at a time works best.";
      if (!confirm(msg)) return;
      s.awake = true;
    } else if (act === "sleep") {
      if (!confirm("Put " + q.name + " back to sleep? Its treasure stays in the hoard.")) return;
      s.awake = false;
    } else if (act === "words") {
      var t = prompt("Write your own small step for this quest. Leave it empty to go back to a new idea every day.", s.text || "");
      if (t === null) return;
      s.text = t.trim().slice(0, 200);
    } else if (act === "other") {
      s.off = (s.off || 0) + 1;
      s.text = "";
    } else if (act === "done") {
      earnSide(q.id); return;
    } else if (act === "undo") {
      delete day(todayStr())[q.id];
    } else if (act === "start") {
      if (run || sideRun) { alert("One timer at a time. Finish or stop the other one first."); return; }
      wakeUp();
      sideRun = { id: q.id, endsAt: Date.now() + q.mins * 60000 };
      sideTicker = setInterval(sideTick, 250);
    } else if (act === "stop") {
      stopSide();
    }
    save();
    renderAll();
  };

  function renderAll() { renderScene(); renderGrid(); renderQuest(); renderSide(); }

  function earn(kind, ds) {
    ds = ds || todayStr();
    day(ds).quest = kind;
    popDate = ds;
    save();
    renderAll();
    puff("✦", "#ffe27a");
    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
  }

  function chime() {
    try {
      if (!audio) return;
      [523, 659, 784].forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = "sine"; o.frequency.value = f;
        var t = audio.currentTime + i * 0.22;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o.connect(g); g.connect(audio.destination);
        o.start(t); o.stop(t + 0.65);
      });
    } catch (e) { /* no sound available */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  function startPhase(phase) {
    var secs = phase === "walk" ? walkMins() * 60 : 5 * 60;
    run = { phase: phase, total: secs, endsAt: Date.now() + secs * 1000, left: null };
    $("phaseName").textContent = phase === "walk" ? "The walk" : "The stretch";
    $("skipBtn").textContent = phase === "walk" ? "On to the stretch" : "Finish now";
    $("pauseBtn").textContent = "Pause";
    tick();
  }
  function leftSecs() { return run.left !== null ? run.left : Math.max(0, Math.ceil((run.endsAt - Date.now()) / 1000)); }

  function tick() {
    if (!run) return;
    var left = leftSecs();
    $("clock").textContent = Math.floor(left / 60) + ":" + pad(left % 60);
    if (run.phase === "walk") {
      $("phaseHint").textContent = "Easy pace. Outside, or laps of the house. Nothing to prove.";
    } else {
      var done = run.total - left;
      var i = Math.min(STRETCHES.length - 1, Math.floor(done / (run.total / STRETCHES.length)));
      $("phaseHint").textContent = STRETCHES[i] + " Stop anything that hurts.";
    }
    if (left <= 0 && run.left === null) nextPhase();
  }
  function nextPhase() {
    chime();
    if (run.phase === "walk") { startPhase("stretch"); return; }
    endRun();
    earn("full");
  }
  function endRun() {
    run = null;
    clearInterval(ticker); ticker = null;
    if (lock) { try { lock.release(); } catch (e) { /* already released */ } lock = null; }
    renderQuest();
  }

  $("beginBtn").onclick = function () {
    if (sideRun) { alert("One timer at a time. Finish or stop the other one first."); return; }
    wakeUp();
    startPhase("walk");
    ticker = setInterval(tick, 250);
    renderQuest();
  };
  $("pauseBtn").onclick = function () {
    if (!run) return;
    if (run.left === null) { run.left = leftSecs(); this.textContent = "Carry on"; }
    else { run.endsAt = Date.now() + run.left * 1000; run.left = null; this.textContent = "Pause"; }
  };
  $("skipBtn").onclick = function () { if (run) { run.left = null; nextPhase(); } };
  $("stopBtn").onclick = function () { if (run) endRun(); };
  $("doneBtn").onclick = function () { earn("full"); };
  $("badBtn").onclick = function () { earn("bad"); };
  $("undoBtn").onclick = function () { delete day(todayStr()).quest; save(); renderAll(); };
  $("longerBox").onchange = function () { state.longer = this.checked; save(); renderQuest(); };

  function treat(which) {
    var d = day(todayStr());
    d[which] = !d[which];
    save();
    renderQuest();
    if (d[which]) puff("♥", "#ff8fb1");
  }
  $("amBtn").onclick = function () { treat("am"); };
  $("pmBtn").onclick = function () { treat("pm"); };

  $("starBtn").onclick = function () {
    state.star = true; save(); renderAll();
    puff("★", "#ffe27a");
  };
  $("alarmsSet").onclick = function () { state.alarms = true; save(); $("alarmHelp").open = false; renderQuest(); };
  $("whisper").onclick = function () { state.wOff = (state.wOff || 0) + 1; save(); renderScene(); };
  $("sign").onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("renameBtn").onclick(); } };
  $("sign").onclick = function () { $("renameBtn").onclick(); };
  $("renameBtn").onclick = function () {
    var n = prompt("What is your dragon called?", state.name);
    if (n && n.trim()) { state.name = n.trim().slice(0, 20); save(); renderAll(); }
  };

  $("grid").onclick = function (e) {
    var b = e.target.closest(".spot");
    if (!b || !b.classList.contains("past") || b.classList.contains("has")) return;
    if (confirm("Did you do your quest on " + niceDate(b.dataset.date) + "? Tap OK to add its gem.")) earn("late", b.dataset.date);
  };

  // a new day may have started while the app sat open
  var shownDay = todayStr();
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    if (run) tick();
    sideTick();
    if (todayStr() !== shownDay) { shownDay = todayStr(); renderAll(); }
    if (run && navigator.wakeLock && !lock) navigator.wakeLock.request("screen").then(function (l) { lock = l; }, function () {});
  });

  save();
  renderAll();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(function () { /* offline use just won't be available */ });
  }
})();
