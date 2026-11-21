import {
  campaign, createCircuit, dailyPuzzle,
  decodeCircuit, encodeCircuit, indices, solveCross, tileKinds, utcDate,
} from './puzzles.mjs';

const get = id => document.getElementById(id);
const boardElement = get('board');
const feedback = get('feedback');
const storageKey = 'pressure-room-campaign-v1';
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const emptyRun = () => ({ history: [], deadline: 0, finishedAt: 0, hintsUsed: 0, hintTile: null });
const newDesign = size => ({ size, kinds: Array(size * size).fill(0), presses: 0 });

function loadSave() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}

function restoreRun(saved, puzzle) {
  const run = emptyRun();
  if (!Array.isArray(saved?.history) || saved.history.length > puzzle.limit ||
      !saved.history.every(index => Number.isInteger(index) && index >= 0 && index < puzzle.masks.length)) return run;
  run.history = saved.history;
  if (puzzle.time && Number.isFinite(saved.deadline) && saved.deadline > 0) run.deadline = saved.deadline;
  if (run.deadline && Number.isFinite(saved.finishedAt) && saved.finishedAt > 0) run.finishedAt = saved.finishedAt;
  if (Number.isInteger(saved.hintsUsed)) run.hintsUsed = Math.max(0, Math.min(3, saved.hintsUsed));
  if (run.hintsUsed && Number.isInteger(saved.hintTile) && saved.hintTile in puzzle.masks) run.hintTile = saved.hintTile;
  return run;
}

const saved = loadSave();
const records = {};
for (const level of campaign) {
  const record = saved.records?.[level.number];
  if (Number.isInteger(record?.stars) && record.stars >= 1 && record.stars <= 3 &&
      Number.isInteger(record.moves) && record.moves >= level.shortest.length && record.moves <= level.limit) {
    records[level.number] = record;
  }
}
const dailyResults = {};
for (const [date, result] of Object.entries(saved.dailyResults || {})) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isInteger(result?.moves) && result.moves > 0 &&
      Number.isInteger(result.hints) && result.hints >= 0 && result.hints <= 3) dailyResults[date] = result;
}

let campaignLevel = campaign[saved.level - 1] || campaign[0];
let page = Math.floor((campaignLevel.number - 1) / 20);
let daily = dailyPuzzle(utcDate());
const savedDesign = saved.lab?.design;
let design = savedDesign && [3, 4, 5].includes(savedDesign.size) &&
  Array.isArray(savedDesign.kinds) && savedDesign.kinds.length === savedDesign.size ** 2 &&
  savedDesign.kinds.every(kind => Number.isInteger(kind) && tileKinds[kind]) &&
  Number.isInteger(savedDesign.presses) && savedDesign.presses >= 0 && savedDesign.presses < 2 ** savedDesign.kinds.length
  ? savedDesign : newDesign(4);
let labPuzzle = createCircuit(design);
let labPhase = saved.lab?.phase === 'scramble' ? 'scramble' : 'wire';
if (saved.lab?.phase === 'play' && labPuzzle.initial) labPhase = 'play';
const runs = {
  campaign: restoreRun(saved.run, campaignLevel),
  daily: daily.date === saved.dailyRun?.date ? restoreRun(saved.dailyRun.run, daily) : emptyRun(),
  lab: labPhase === 'play' ? restoreRun(saved.lab.run, labPuzzle) : emptyRun(),
};
let practice = saved.practice === true;
if (practice) runs.campaign.deadline = 0;
let mode = ['campaign', 'daily', 'lab'].includes(saved.mode) ? saved.mode : 'campaign';
let sound = saved.sound === true;
let trace = false;
let hoveredTile = null;
let pickedTile = null;
let tiles = [];
let displayedTime;
let audioContext;
let toastTimer;

const puzzle = () => ({ campaign: campaignLevel, daily, lab: labPuzzle })[mode];
const activeRun = () => runs[mode];
const editing = () => mode === 'lab' && labPhase !== 'play';
const timed = () => mode === 'campaign' && !practice && campaignLevel.time > 0;

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      level: campaignLevel.number, records, run: runs.campaign, practice, sound, mode,
      dailyResults, dailyRun: { date: daily.date, run: runs.daily },
      lab: { design, phase: labPhase, run: runs.lab },
    }));
  } catch { /* Play remains available when storage is unavailable. */ }
}

function boardState() {
  const current = puzzle();
  return activeRun().history.reduce((board, index) => board ^ current.masks[index], current.initial);
}

function remainingTime() {
  if (!timed()) return null;
  const run = activeRun();
  return run.deadline ? Math.max(0, Math.ceil((run.deadline - (run.finishedAt || Date.now())) / 1000)) : campaignLevel.time;
}

function state() {
  const board = boardState();
  const time = remainingTime();
  const won = !editing() && board === 0;
  const expired = !won && time === 0;
  const exhausted = !won && activeRun().history.length >= puzzle().limit;
  return { board, time, won, expired, exhausted, stopped: won || expired || exhausted };
}

function stars() {
  const run = activeRun();
  if (!run.hintsUsed && run.history.length === puzzle().shortest.length) return 3;
  return run.hintsUsed <= 1 ? 2 : 1;
}

function setText(id, value) {
  const element = get(id);
  if (element.textContent !== String(value)) element.textContent = value;
}

function shortDate(date) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(date + 'T00:00:00Z'));
}

function updateDaily() {
  const date = utcDate();
  if (daily.date === date) return false;
  daily = dailyPuzzle(date);
  runs.daily = emptyRun();
  return true;
}

function dailyStreak() {
  const day = new Date(daily.date + 'T00:00:00Z');
  if (!dailyResults[daily.date]) day.setUTCDate(day.getUTCDate() - 1);
  let streak = 0;
  while (dailyResults[utcDate(day)]) {
    streak++;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return streak;
}

function renderDaily() {
  const best = dailyResults[daily.date];
  const streak = dailyStreak();
  setText('daily-date', shortDate(daily.date));
  setText('daily-best', best ? best.moves + ' moves' + (best.hints ? ' · ' + best.hints + ' hints' : '') : 'Unsolved');
  setText('daily-streak', streak + (streak === 1 ? ' day' : ' days'));
}

function renderMap() {
  const first = page * 20;
  setText('chapter', 'Chapter ' + (page + 1) + ' of 5');
  get('prev-page').disabled = page === 0;
  get('next-page').disabled = page === 4;
  get('levels').replaceChildren(...campaign.slice(first, first + 20).map(level => {
    const button = document.createElement('button');
    const record = records[level.number];
    button.type = 'button';
    button.className = record ? 'level cleared' : 'level';
    button.textContent = String(level.number).padStart(2, '0');
    button.setAttribute('aria-label', 'Level ' + level.number + (record ? ', ' + record.stars + ' stars' : ''));
    if (level.number === campaignLevel.number) button.setAttribute('aria-current', 'true');
    if (record) {
      const badge = document.createElement('small');
      badge.textContent = '★'.repeat(record.stars);
      badge.setAttribute('aria-hidden', 'true');
      button.append(badge);
    }
    button.addEventListener('click', () => openLevel(level.number));
    return button;
  }));
  const results = Object.values(records);
  get('campaign-progress').value = results.length;
  setText('progress-text', results.length + ' of 100 cleared');
  setText('total-stars', results.reduce((sum, result) => sum + result.stars, 0) + ' stars');
}

function renderLab() {
  const playing = labPhase === 'play';
  get('lab-size').value = String(design.size);
  get('lab-size').disabled = playing;
  get('lab-wire').setAttribute('aria-pressed', String(labPhase === 'wire'));
  get('lab-scramble').setAttribute('aria-pressed', String(labPhase === 'scramble'));
  get('brush-wrap').hidden = labPhase !== 'wire';
  get('lab-test').disabled = !labPuzzle.initial;
  setText('lab-test', playing ? 'Edit puzzle' : 'Play puzzle');
  get('lab-share').disabled = !labPuzzle.initial;
  const messages = {
    wire: 'Choose a tile type, then click tiles to assign it.',
    scramble: 'Press a few tiles to set the starting pattern.',
    play: 'Try to solve your circuit. Edit it any time.',
  };
  setText('lab-instructions', messages[labPhase]);
  setText('lab-result', labPuzzle.initial ? 'Par: ' + labPuzzle.shortest.length + ' moves' : '');
}

function updateBoardPaint(view = state()) {
  const current = puzzle();
  const run = activeRun();
  const target = trace && pickedTile !== null ? pickedTile : hoveredTile;
  const origin = view.stopped || (editing() && labPhase === 'wire') ? null : target;
  const previewMask = origin === null ? 0 : current.masks[origin];
  tiles.forEach((tile, index) => {
    const lit = !(view.board & (1 << index));
    const kind = current.kinds?.[index] ?? 0;
    tile.dataset.kind = kind;
    tile.classList.toggle('lit', lit);
    tile.classList.toggle('affected', Boolean(previewMask & (1 << index)));
    tile.classList.toggle('origin', origin === index);
    tile.classList.toggle('hint', run.hintTile === index);
    tile.disabled = view.stopped;
    tile.firstChild.textContent = tileKinds[kind].mark;
    const column = index % current.size + 1;
    const row = Math.floor(index / current.size) + 1;
    tile.setAttribute('aria-label', 'Row ' + row + ', column ' + column + ', ' + tileKinds[kind].name +
      ', ' + (lit ? 'blue' : 'unlit') + (run.hintTile === index ? ', suggested move' : ''));
    tile.setAttribute('aria-description', tileKinds[kind].description);
  });
  const pattern = origin === null ? '' : tileKinds[current.kinds?.[origin] ?? 0].name;
  setText('trace-info', pattern ? pattern + ' · flips ' + indices(previewMask, tiles.length).length + ' tiles'
    : trace ? 'Select a tile to trace its pulse.' : '');
  get('pulse').hidden = !trace || pickedTile === null || view.stopped;
}

function render() {
  const current = puzzle();
  const run = activeRun();
  const view = state();
  const hadTileFocus = tiles.includes(document.activeElement);
  const clock = view.time !== null;
  displayedTime = view.time;
  const lit = current.masks.length - indices(view.board, current.masks.length).length;
  get('lit-progress').max = current.masks.length;
  get('lit-progress').value = lit;
  setText('lit-count', lit + ' / ' + current.masks.length + ' blue');
  setText('move-label', editing() ? 'Scrambled' : mode === 'campaign' ? 'Moves left' : 'Moves');
  setText('moves', editing() ? current.masks.length - lit : mode === 'campaign' ? current.limit - run.history.length : run.history.length);
  setText('metric-label', clock ? 'Clock' : 'Par');
  setText('metric-value', clock ? Math.floor(view.time / 60) + ':' + String(view.time % 60).padStart(2, '0')
    : current.initial ? current.shortest.length : '–');
  get('metric').classList.toggle('urgent', Boolean(run.deadline && clock && view.time <= 10 && !view.won));

  get('undo').disabled = view.won || view.expired || !run.history.length;
  get('undo').hidden = editing();
  get('hint').hidden = editing();
  get('hint').disabled = view.stopped || run.hintsUsed >= 3 || run.hintTile !== null;
  setText('hint', 'Hint (' + (3 - run.hintsUsed) + ')');
  get('trace').hidden = editing() && labPhase === 'wire';
  get('trace').disabled = view.stopped;
  get('trace').setAttribute('aria-pressed', String(trace));
  setText('restart', editing() ? 'Clear scramble' : 'Restart');
  get('restart').disabled = editing() && design.presses === 0;
  get('next').hidden = !view.won || mode !== 'campaign';
  setText('next', campaignLevel.number === 100 ? 'Play Daily Signal' : 'Next level');
  get('share-result').hidden = !view.won || mode !== 'daily';

  let message = 'Make every tile blue.';
  if (editing()) message = labPhase === 'wire' ? 'Click a tile to assign the selected pattern.' : 'Press tiles to scramble the starting board.';
  else if (clock && !run.deadline) message = 'The clock starts with your first move.';
  if (run.hintTile !== null) message = 'Try the highlighted tile.';
  if (view.exhausted) message = 'Out of moves. Undo a pulse or restart.';
  if (view.expired) message = 'Time is up. Restart to try again.';
  if (view.won) message = mode === 'campaign' ? 'Level cleared · ' + '★'.repeat(stars()) :
    'Circuit clear in ' + run.history.length + ' moves. ' + (run.history.length === current.shortest.length ? 'You matched par.' : 'Par is ' + current.shortest.length + '.');
  setText('feedback', message);
  feedback.classList.toggle('win', view.won);
  feedback.classList.toggle('fail', view.expired || view.exhausted);
  updateBoardPaint(view);
  if (hadTileFocus && view.stopped) {
    const button = view.won ? finishedAction() : view.expired ? get('restart') : get('undo');
    button.focus();
  }
}

function finishedAction() {
  return get('next').hidden ? get('share-result').hidden ? get('restart') : get('share-result') : get('next');
}

function focusTile(index = 0, scroll = false) {
  const target = tiles[index];
  if (target?.disabled) get('restart').focus({ preventScroll: !scroll });
  else target?.focus({ preventScroll: !scroll });
}

function mountBoard() {
  hoveredTile = pickedTile = null;
  const current = puzzle();
  if (mode === 'campaign') {
    setText('puzzle-meta', 'Level ' + String(campaignLevel.number).padStart(2, '0'));
    setText('puzzle-title', campaignLevel.name);
  } else {
    setText('puzzle-meta', mode === 'daily' ? shortDate(daily.date) : labPhase === 'play' ? 'Test run' : 'Builder');
    setText('puzzle-title', mode === 'daily' ? 'Daily Signal' : 'Your circuit');
  }
  boardElement.style.setProperty('--size', current.size);
  tiles = current.masks.map((_, index) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.tabIndex = index === 0 ? 0 : -1;
    tile.dataset.index = index;
    const glyph = document.createElement('span');
    glyph.setAttribute('aria-hidden', 'true');
    tile.append(glyph);
    return tile;
  });
  boardElement.replaceChildren(...tiles);
}

function selectMode(nextMode) {
  if (nextMode === 'daily') updateDaily();
  mode = nextMode;
  trace = false;
  for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  for (const panel of ['campaign', 'daily', 'lab']) get(panel + '-panel').hidden = mode !== panel;
  for (const kind of document.querySelectorAll('.circuit-kind')) kind.hidden = mode === 'campaign';
  if (mode === 'campaign') renderMap();
  if (mode === 'daily') renderDaily();
  if (mode === 'lab') renderLab();
  mountBoard();
  render();
  save();
}

function openLevel(number) {
  campaignLevel = campaign[number - 1];
  page = Math.floor((number - 1) / 20);
  runs.campaign = emptyRun();
  selectMode('campaign');
  focusTile(0, true);
}

function animatePulse(indicesToPulse) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const touched = indicesToPulse.map(index => tiles[index]);
  touched.forEach(tile => tile.classList.remove('pulsed'));
  requestAnimationFrame(() => requestAnimationFrame(() => touched.forEach(tile => tile.classList.add('pulsed'))));
}

function setDesign(nextDesign) {
  design = nextDesign;
  labPuzzle = createCircuit(design);
  runs.lab = emptyRun();
  renderLab();
  save();
}

function chooseLabPhase(phase) {
  labPhase = phase;
  runs.lab = emptyRun();
  selectMode('lab');
  if (phase !== 'wire') focusTile(0, true);
}

function press(index, confirm = false) {
  const current = puzzle();
  if (state().stopped) return;
  if (editing() && labPhase === 'wire') {
    const kind = Number(get('lab-brush').value);
    if (design.kinds[index] === kind) return;
    setDesign({ ...design, kinds: design.kinds.map((value, tile) => tile === index ? kind : value) });
    render();
    return;
  }
  if (trace && !confirm) {
    pickedTile = index;
    updateBoardPaint();
    return;
  }
  pickedTile = null;
  if (editing()) {
    setDesign({ ...design, presses: design.presses ^ (1 << index) });
  } else {
    const run = activeRun();
    if (timed() && !run.deadline) run.deadline = Date.now() + current.time * 1000;
    run.history.push(index);
    run.hintTile = null;
  }
  const won = state().won;
  if (won) {
    activeRun().finishedAt = Date.now();
    recordWin();
  }
  playSound(won);
  render();
  animatePulse(indices(current.masks[index], tiles.length));
  if (won) celebrate();
  save();
}

function recordWin() {
  const run = activeRun();
  const moves = run.history.length;
  if (mode === 'campaign') {
    const rating = stars();
    const previous = records[campaignLevel.number];
    if (!previous || rating > previous.stars || (rating === previous.stars && moves < previous.moves)) {
      records[campaignLevel.number] = { stars: rating, moves };
    }
    renderMap();
  }
  if (mode === 'daily') {
    const previous = dailyResults[daily.date];
    if (!previous || moves < previous.moves || (moves === previous.moves && run.hintsUsed < previous.hints)) {
      dailyResults[daily.date] = { moves, hints: run.hintsUsed };
    }
    renderDaily();
  }
}

function restart() {
  if (editing()) setDesign({ ...design, presses: 0 });
  else runs[mode] = emptyRun();
  hoveredTile = pickedTile = null;
  render();
  focusTile();
  save();
}

function tileIndex(target) {
  const tile = target.closest?.('.tile');
  return boardElement.contains(tile) ? Number(tile.dataset.index) : null;
}

boardElement.addEventListener('click', event => {
  const index = tileIndex(event.target);
  if (index !== null) press(index);
});
boardElement.addEventListener('pointerover', event => {
  if (event.pointerType !== 'touch') {
    hoveredTile = tileIndex(event.target);
    updateBoardPaint();
  }
});
boardElement.addEventListener('pointerleave', () => {
  hoveredTile = null;
  updateBoardPaint();
});
boardElement.addEventListener('focusin', event => {
  const index = tileIndex(event.target);
  if (index === null) return;
  tiles.forEach((tile, tileIndex) => { tile.tabIndex = tileIndex === index ? 0 : -1; });
  if (event.target.matches(':focus-visible')) {
    hoveredTile = index;
    updateBoardPaint();
  }
});
boardElement.addEventListener('focusout', event => {
  if (!boardElement.contains(event.relatedTarget)) {
    hoveredTile = null;
    updateBoardPaint();
  }
});

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const { key, target } = event;
  const offsets = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
  if (!Object.hasOwn(offsets, key)) return;
  const origin = tileIndex(target);
  if (origin === null && target !== document.body && target !== document.documentElement) return;
  if (origin === null) {
    const bounds = boardElement.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
  }
  if (state().stopped) return;
  const size = puzzle().size;
  const from = origin ?? Math.max(0, tiles.findIndex(tile => tile.tabIndex === 0));
  const [dr, dc] = offsets[key];
  const row = Math.max(0, Math.min(size - 1, Math.floor(from / size) + dr));
  const column = Math.max(0, Math.min(size - 1, from % size + dc));
  event.preventDefault();
  focusTile(row * size + column);
});

for (const button of modeButtons) {
  button.addEventListener('click', () => { if (mode !== button.dataset.mode) selectMode(button.dataset.mode); });
}
get('prev-page').addEventListener('click', () => { if (page > 0) { page--; renderMap(); } });
get('next-page').addEventListener('click', () => { if (page < 4) { page++; renderMap(); } });
get('practice').checked = practice;
get('practice').addEventListener('change', event => {
  practice = event.target.checked;
  runs.campaign.deadline = 0;
  runs.campaign.finishedAt = 0;
  render();
  save();
});
get('restart').addEventListener('click', restart);
get('next').addEventListener('click', () => {
  if (campaignLevel.number < 100) openLevel(campaignLevel.number + 1);
  else { selectMode('daily'); focusTile(); }
});
get('undo').addEventListener('click', () => {
  if (state().expired) return;
  const run = activeRun();
  const previous = run.history.pop();
  run.hintTile = pickedTile = null;
  render();
  focusTile(previous);
  save();
});
get('hint').addEventListener('click', () => {
  const view = state();
  const current = puzzle();
  const run = activeRun();
  if (view.stopped || run.hintTile !== null || run.hintsUsed >= 3) return;
  const next = (current.solve ? current.solve(view.board) : solveCross(view.board, current.size, current.masks))?.[0];
  if (next === undefined) return;
  if (trace) pickedTile = next;
  run.hintTile = next;
  run.hintsUsed++;
  render();
  focusTile(next);
  save();
});
get('trace').addEventListener('click', () => {
  trace = !trace;
  pickedTile = null;
  render();
});
get('pulse').addEventListener('click', () => {
  if (pickedTile === null) return;
  const index = pickedTile;
  press(index, true);
  const view = state();
  if (view.stopped) {
    const action = view.won ? finishedAction() : view.expired ? get('restart') : get('undo');
    action.focus({ preventScroll: true });
  } else focusTile(index);
});
get('lab-size').addEventListener('change', event => {
  setDesign(newDesign(Number(event.target.value)));
  selectMode('lab');
});
get('lab-wire').addEventListener('click', () => chooseLabPhase('wire'));
get('lab-scramble').addEventListener('click', () => chooseLabPhase('scramble'));
get('lab-test').addEventListener('click', () => { if (labPuzzle.initial) chooseLabPhase(labPhase === 'play' ? 'scramble' : 'play'); });

async function share(value, label) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(label);
  } catch {
    const dialog = get('copy-dialog');
    if (!dialog.open) dialog.showModal();
    get('copy-text').value = value;
    get('copy-text').select();
  }
}

get('share-result').addEventListener('click', () => {
  const run = runs.daily;
  share('Turn Every Tile Blue · Daily Signal ' + daily.date + '\n' +
    'Solved in ' + run.history.length + ' moves (par ' + daily.shortest.length + ') · ' +
    (run.hintsUsed ? run.hintsUsed + ' hint' + (run.hintsUsed === 1 ? '' : 's') : 'no hints'), 'Daily result copied.');
});
get('lab-share').addEventListener('click', () => { if (labPuzzle.initial) share(encodeCircuit(design), 'Puzzle code copied.'); });

function readCircuitInput(value) {
  try { return decodeCircuit(new URL(value).searchParams.get('circuit') || ''); }
  catch { return decodeCircuit(value); }
}

function loadCircuit(circuit) {
  setDesign(circuit);
  chooseLabPhase('play');
}

get('import-form').addEventListener('submit', event => {
  event.preventDefault();
  const circuit = readCircuitInput(get('import-code').value);
  if (!circuit) {
    setText('import-status', 'That code does not contain a playable circuit.');
    return;
  }
  setText('import-status', 'Puzzle loaded.');
  get('import-code').value = '';
  loadCircuit(circuit);
});

function playSound(won = false) {
  if (!sound) return;
  try {
    audioContext ||= new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const notes = won ? [440, 523.25, 659.25, 783.99] : [369.99];
    for (const [index, frequency] of notes.entries()) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + index * .075;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.06, start);
      gain.gain.exponentialRampToValueAtTime(.001, start + .16);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + .17);
    }
  } catch { /* Sound is optional. */ }
}

function renderSound() {
  get('sound').querySelector('span').textContent = sound ? 'on' : 'off';
  get('sound').setAttribute('aria-pressed', String(sound));
}

get('sound').addEventListener('click', () => {
  sound = !sound;
  renderSound();
  playSound();
  save();
});
get('rules').addEventListener('click', () => get('rules-dialog').showModal());
get('rules-dialog').addEventListener('close', () => get('rules').focus({ preventScroll: true }));

function renderFullscreen() {
  const active = Boolean(document.fullscreenElement) || document.body.classList.contains('focus-view');
  get('fullscreen').setAttribute('aria-pressed', String(active));
  setText('fullscreen', active ? 'Exit full screen' : 'Full screen');
}

get('fullscreen').addEventListener('click', async () => {
  if (document.fullscreenElement) {
    try { await document.exitFullscreen(); } catch {}
  } else if (document.body.classList.contains('focus-view')) {
    document.body.classList.remove('focus-view');
  } else {
    try {
      if (!document.documentElement.requestFullscreen) throw new Error('Unavailable');
      await document.documentElement.requestFullscreen();
    } catch {
      document.body.classList.add('focus-view');
    }
  }
  renderFullscreen();
});
document.addEventListener('fullscreenchange', renderFullscreen);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !document.querySelector('dialog[open]') && document.body.classList.contains('focus-view')) {
    document.body.classList.remove('focus-view');
    renderFullscreen();
  }
});

function showToast(message) {
  clearTimeout(toastTimer);
  setText('toast', message);
  get('toast').hidden = false;
  toastTimer = setTimeout(() => { get('toast').hidden = true; }, 3000);
}

function celebrate(discovery = false) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = get('celebration');
  const colors = ['#4375ff', '#a7dbff', '#ffb975', '#69d7c9', '#f4aeef'];
  const particles = Array.from({ length: discovery ? 36 : 22 }, (_, index) => {
    const item = document.createElement('i');
    item.className = discovery && index >= 30 ? 'balloon' : 'particle';
    item.style.setProperty('--left', (index * 37 % 96 + 2) + '%');
    item.style.setProperty('--color', colors[index % colors.length]);
    item.style.setProperty('--delay', (index * 43 % 420) + 'ms');
    item.style.setProperty('--drift', (index * 19 % 120 - 60) + 'px');
    return item;
  });
  layer.replaceChildren(...particles);
  layer.hidden = false;
  setTimeout(() => {
    if (layer.firstChild !== particles[0]) return;
    layer.hidden = true;
    layer.replaceChildren();
  }, discovery ? 3200 : 3050);
}

const currentUrl = new URL(location.href);
const sharedCircuit = decodeCircuit(currentUrl.searchParams.get('circuit') || '');
if (sharedCircuit && (labPhase !== 'play' || encodeCircuit(sharedCircuit) !== encodeCircuit(design))) loadCircuit(sharedCircuit);
else if (sharedCircuit) selectMode('lab');
else selectMode(mode);
renderSound();
if (['party', '1'].includes(currentUrl.searchParams.get('discovered'))) {
  showToast('Congratulations! You found the hidden game.');
  celebrate(true);
  currentUrl.searchParams.delete('discovered');
  history.replaceState(history.state, '', currentUrl);
}
setInterval(() => {
  if (mode === 'daily' && updateDaily()) selectMode('daily');
  else if (displayedTime !== remainingTime()) render();
}, 350);
