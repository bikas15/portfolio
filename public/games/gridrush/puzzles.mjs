const checkpoints = {
  1: { name: 'Warm-up', size: 3, limit: 4, time: 0, solution: [1, 8] },
  25: { name: 'Cross Check', size: 4, limit: 7, time: 75, solution: [1, 2, 12, 13] },
  60: { name: 'Under the Clock', size: 4, limit: 7, time: 45, solution: [0, 2, 3, 6, 9, 15] },
  99: { name: 'Last Stand', size: 5, limit: 9, time: 30, solution: [1, 7, 10, 14, 15, 16, 18, 20, 22] },
  100: { name: 'Final Room', size: 5, limit: 10, time: 60, solution: [1, 4, 5, 6, 8, 11, 15, 17, 19, 23] }
};

function makeMasks(size) {
  return Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    let mask = 1 << index;
    if (row > 0) mask |= 1 << (index - size);
    if (row + 1 < size) mask |= 1 << (index + size);
    if (col > 0) mask |= 1 << (index - 1);
    if (col + 1 < size) mask |= 1 << (index + 1);
    return mask;
  });
}

// Every move on lower rows is forced once the first row has been chosen.
export function solveCross(initial, size, masks) {
  let best = null;
  for (let firstRow = 0; firstRow < 1 << size; firstRow++) {
    let board = initial;
    const moves = [];
    for (let index = 0; index < size * size; index++) {
      const required = index < size ? firstRow & (1 << index) : board & (1 << (index - size));
      if (required) {
        moves.push(index);
        board ^= masks[index];
      }
    }
    if (board === 0 && (!best || moves.length < best.length)) best = moves;
  }
  return best;
}

function makeCampaign() {
  const masksBySize = { 3: makeMasks(3), 4: makeMasks(4), 5: makeMasks(5) };
  const seen = new Set();
  const fixed = new Map();
  for (const [number, level] of Object.entries(checkpoints)) {
    const masks = masksBySize[level.size];
    const initial = level.solution.reduce((board, index) => board ^ masks[index], 0);
    const shortest = solveCross(initial, level.size, masks);
    fixed.set(Number(number), { ...level, number: Number(number), masks, initial, shortest });
    seen.add(level.size + ':' + initial);
  }
  return Array.from({ length: 100 }, (_, index) => {
    const number = index + 1;
    if (fixed.has(number)) return fixed.get(number);
    const size = number <= 12 ? 3 : number <= 65 ? 4 : 5;
    const masks = masksBySize[size];
    const minimum = number <= 12 ? 2 + Math.floor(number / 5) : number <= 65 ? 4 + Math.floor((number - 13) / 18) : 7 + Math.floor((number - 66) / 16);
    const limit = minimum + (number < 38 ? 3 : number < 82 ? 2 : 1);
    const time = number <= 12 ? 0 : Math.max(32, 86 - Math.floor(number * .55));
    const name = number <= 12 ? 'Training Room' : number <= 37 ? 'Circuit Room' : number <= 65 ? 'Control Room' : number <= 81 ? 'High Voltage' : 'Critical Pressure';
    let seed = Math.imul(number, 2654435761);
    for (let attempt = 0; attempt < 256; attempt++) {
      const choices = Array.from({ length: size * size }, (_, tile) => tile);
      let initial = 0;
      for (let count = 0; count < minimum; count++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const choice = count + Math.floor(seed / 4294967296 * (choices.length - count));
        [choices[count], choices[choice]] = [choices[choice], choices[count]];
        initial ^= masks[choices[count]];
      }
      const key = size + ':' + initial;
      if (seen.has(key)) continue;
      const shortest = solveCross(initial, size, masks);
      if (shortest.length !== minimum) continue;
      seen.add(key);
      return { number, name, size, masks, initial, shortest, limit, time };
    }
    throw new Error('Could not generate level ' + number);
  });
}

export const campaign = makeCampaign();

export const tileKinds = [
  { name: 'Cross', mark: '+', description: 'Flips this tile and its four side neighbors.' },
  { name: 'Diagonal', mark: '×', description: 'Flips this tile and its diagonal neighbors.' },
  { name: 'Row beam', mark: '—', description: 'Flips every tile in this row.' },
  { name: 'Column beam', mark: '│', description: 'Flips every tile in this column.' },
];

export function indices(mask, count) {
  return Array.from({ length: count }, (_, index) => index).filter(index => mask & (1 << index));
}

export function circuitMasks(size, kinds) {
  const cross = makeMasks(size);
  return kinds.map((kind, index) => {
    if (kind === 0) return cross[index];
    const row = Math.floor(index / size);
    const column = index % size;
    let mask = 1 << index;
    if (kind === 1) {
      for (const rowOffset of [-1, 1]) {
        for (const columnOffset of [-1, 1]) {
          const nextRow = row + rowOffset;
          const nextColumn = column + columnOffset;
          if (nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size) {
            mask |= 1 << (nextRow * size + nextColumn);
          }
        }
      }
    } else {
      for (let offset = 0; offset < size; offset++) {
        const next = kind === 2 ? row * size + offset : offset * size + column;
        mask |= 1 << next;
      }
    }
    return mask;
  });
}

export function applyPresses(masks, presses) {
  return masks.reduce((board, mask, index) => presses & (1 << index) ? board ^ mask : board, 0);
}

function enumerate(masks) {
  const states = new Uint32Array(1 << masks.length);
  const weights = new Uint8Array(states.length);
  for (let subset = 1; subset < states.length; subset++) {
    const lowest = subset & -subset;
    const rest = subset ^ lowest;
    states[subset] = states[rest] ^ masks[31 - Math.clz32(lowest)];
    weights[subset] = weights[rest] + 1;
  }
  return { states, weights };
}

// Pulses commute and pressing twice cancels. Match the two halves by XOR,
// keeping the cheapest subset for each state, to find the exact minimum.
export function makeCircuitSolver(masks) {
  const split = Math.floor(masks.length / 2);
  const left = enumerate(masks.slice(0, split));
  const right = enumerate(masks.slice(split));
  const byState = new Map();
  right.states.forEach((state, subset) => {
    const previous = byState.get(state);
    if (previous === undefined || right.weights[subset] < right.weights[previous]) {
      byState.set(state, subset);
    }
  });

  return target => {
    let bestWeight = Infinity;
    let bestMask = 0;
    left.states.forEach((state, subset) => {
      const partner = byState.get(target ^ state);
      if (partner === undefined) return;
      const weight = left.weights[subset] + right.weights[partner];
      if (weight < bestWeight) {
        bestWeight = weight;
        bestMask = subset | (partner << split);
      }
    });
    return Number.isFinite(bestWeight) ? indices(bestMask, masks.length) : null;
  };
}

export function createCircuit(design) {
  const { size, kinds, presses } = design;
  const masks = circuitMasks(size, kinds);
  const initial = applyPresses(masks, presses);
  const solve = makeCircuitSolver(masks);
  return { size, kinds, masks, initial, shortest: solve(initial), solve, limit: Infinity, time: 0 };
}

export function utcDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function dailyPuzzle(date) {
  const day = Date.parse(date + 'T00:00:00Z') / 86400000;
  const size = day % 3 === 0 ? 5 : 4;
  const count = size * size;
  let seed = (day ^ 0x72b7e153) >>> 0;
  function pick(limit) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor(seed / 4294967296 * limit);
  }

  const kinds = Array.from({ length: count }, () => {
    const value = pick(10);
    return value < 5 ? 0 : value < 8 ? 1 : value - 6;
  });
  // Each daily includes all four patterns.
  tileKinds.forEach((_, kind) => { kinds[Math.floor(count / 4) * kind] = kind; });
  const masks = circuitMasks(size, kinds);
  const solve = makeCircuitSolver(masks);
  const target = size === 5 ? 8 : 6;
  let best = null;
  for (let attempt = 0; attempt < 32; attempt++) {
    const choices = Array.from({ length: count }, (_, index) => index);
    let initial = 0;
    for (let step = 0; step < target; step++) {
      const choice = step + pick(count - step);
      [choices[step], choices[choice]] = [choices[choice], choices[step]];
      initial ^= masks[choices[step]];
    }
    const shortest = solve(initial);
    if (!best || shortest.length > best.shortest.length) best = { initial, shortest };
    if (shortest.length === target) break;
  }
  return { ...best, date, size, kinds, masks, solve, limit: Infinity, time: 0 };
}

export function encodeCircuit({ size, kinds, presses }) {
  return ['1', size, kinds.join(''), presses.toString(36)].join('.');
}

export function decodeCircuit(value) {
  const match = /^1\.([345])\.([0-3]{9,25})\.([0-9a-z]{1,5})$/i.exec(value.trim());
  if (!match) return null;
  const size = Number(match[1]);
  if (match[2].length !== size * size) return null;
  const kinds = Array.from(match[2], Number);
  const presses = parseInt(match[3], 36);
  if (presses >= 1 << kinds.length || applyPresses(circuitMasks(size, kinds), presses) === 0) return null;
  return { size, kinds, presses };
}
