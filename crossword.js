// Crossword generation: parse a list of WORD = clue lines, place words on a
// grid with letter intersections, and number cells in standard crossword order.

export function parseInput(text) {
  const entries = [];
  const seen = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const sepIdx = line.search(/[=:,]/);
    if (sepIdx === -1) continue;
    const wordPart = line.slice(0, sepIdx);
    const cluePart = line.slice(sepIdx + 1).trim();
    const word = wordPart.toUpperCase().replace(/[^A-Z]/g, '');
    if (!word || !cluePart) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    entries.push({ word, clue: cluePart });
  }
  return entries;
}

const ACROSS = 'across';
const DOWN = 'down';

function emptyGrid() {
  return new Map(); // key "r,c" -> letter
}

function key(r, c) { return r + ',' + c; }

function tryPlacement(grid, word, r, c, dir) {
  let intersections = 0;
  const dr = dir === DOWN ? 1 : 0;
  const dc = dir === ACROSS ? 1 : 0;

  // Cell immediately before the word must be empty (no run-on).
  const beforeR = r - dr, beforeC = c - dc;
  if (grid.has(key(beforeR, beforeC))) return null;

  for (let i = 0; i < word.length; i++) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    const existing = grid.get(key(rr, cc));
    if (existing !== undefined) {
      if (existing !== word[i]) return null;
      intersections++;
    } else {
      // Side-adjacent cells must be empty unless this cell is itself an intersection.
      if (dir === ACROSS) {
        if (grid.has(key(rr - 1, cc)) || grid.has(key(rr + 1, cc))) return null;
      } else {
        if (grid.has(key(rr, cc - 1)) || grid.has(key(rr, cc + 1))) return null;
      }
    }
  }

  // Cell immediately after the word must be empty.
  const afterR = r + dr * word.length;
  const afterC = c + dc * word.length;
  if (grid.has(key(afterR, afterC))) return null;

  return intersections;
}

function commit(grid, word, r, c, dir) {
  const dr = dir === DOWN ? 1 : 0;
  const dc = dir === ACROSS ? 1 : 0;
  for (let i = 0; i < word.length; i++) {
    grid.set(key(r + dr * i, c + dc * i), word[i]);
  }
}

function findBestPlacement(grid, placements, word, rng) {
  const candidates = [];
  let bestScore = 0;
  for (const p of placements) {
    for (let i = 0; i < p.word.length; i++) {
      for (let j = 0; j < word.length; j++) {
        if (p.word[i] !== word[j]) continue;
        const dir = p.dir === ACROSS ? DOWN : ACROSS;
        const r = p.dir === ACROSS ? p.r - j : p.r + i;
        const c = p.dir === ACROSS ? p.c + i : p.c - j;
        const score = tryPlacement(grid, word, r, c, dir);
        if (score !== null && score > 0) {
          if (score > bestScore) {
            bestScore = score;
            candidates.length = 0;
            candidates.push({ word, r, c, dir, score });
          } else if (score === bestScore) {
            candidates.push({ word, r, c, dir, score });
          }
        }
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)];
}

function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0)) / 4294967296;
  };
}

function shuffleByLength(entries, rng) {
  const groups = new Map();
  for (const e of entries) {
    const len = e.word.length;
    if (!groups.has(len)) groups.set(len, []);
    groups.get(len).push(e);
  }
  for (const arr of groups.values()) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .flatMap(([, arr]) => arr);
}

function scoreResult(result) {
  const placed = result.placements.length;
  const rows = result.grid.length;
  const cols = rows > 0 ? result.grid[0].length : 0;
  const aspectPenalty = Math.abs(rows - cols);
  const sizePenalty = Math.max(rows, cols);
  return placed * 10000 - aspectPenalty * 50 - sizePenalty;
}

export function generate(entries, options = {}) {
  const baseSeed = options.seed ?? Math.floor(Math.random() * 1e9);
  const attempts = options.attempts ?? 60;
  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < attempts; i++) {
    const result = generateOnce(entries, mulberry32(baseSeed + i * 7919));
    const score = scoreResult(result);
    if (score > bestScore) {
      bestScore = score;
      best = result;
    }
  }
  return best ?? { grid: [], placements: [], acrossClues: [], downClues: [], unplaced: [] };
}

function generateOnce(entries, rng) {
  const sorted = shuffleByLength(entries, rng);
  if (sorted.length === 0) {
    return { grid: [], placements: [], acrossClues: [], downClues: [], unplaced: [] };
  }

  const grid = emptyGrid();
  const placements = [];
  const unplaced = [];

  const seed = sorted[0];
  const seedDir = rng() < 0.5 ? ACROSS : DOWN;
  commit(grid, seed.word, 0, 0, seedDir);
  placements.push({ word: seed.word, clue: seed.clue, r: 0, c: 0, dir: seedDir });

  let pending = sorted.slice(1);
  let progress = true;
  while (progress && pending.length > 0) {
    progress = false;
    const stillPending = [];
    for (const entry of pending) {
      const best = findBestPlacement(grid, placements, entry.word, rng);
      if (best) {
        commit(grid, entry.word, best.r, best.c, best.dir);
        placements.push({ word: entry.word, clue: entry.clue, r: best.r, c: best.c, dir: best.dir });
        progress = true;
      } else {
        stillPending.push(entry);
      }
    }
    pending = stillPending;
  }
  for (const entry of pending) unplaced.push(entry);

  // Compute bounding box and shift placements so (0,0) is top-left.
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const k of grid.keys()) {
    const [r, c] = k.split(',').map(Number);
    if (r < minR) minR = r;
    if (c < minC) minC = c;
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const [k, v] of grid.entries()) {
    const [r, c] = k.split(',').map(Number);
    matrix[r - minR][c - minC] = { letter: v, number: null };
  }
  const shifted = placements.map(p => ({ ...p, r: p.r - minR, c: p.c - minC }));

  // Number cells in standard crossword order: top-to-bottom, left-to-right,
  // a number is assigned when the cell starts a new across or down word.
  let nextNum = 1;
  const acrossClues = [];
  const downClues = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = matrix[r][c];
      if (!cell) continue;
      const startsAcross =
        (c === 0 || matrix[r][c - 1] === null) &&
        c + 1 < cols && matrix[r][c + 1] !== null;
      const startsDown =
        (r === 0 || matrix[r - 1][c] === null) &&
        r + 1 < rows && matrix[r + 1][c] !== null;
      if (startsAcross || startsDown) {
        cell.number = nextNum;
        if (startsAcross) {
          const placement = shifted.find(p => p.r === r && p.c === c && p.dir === ACROSS);
          if (placement) acrossClues.push({ number: nextNum, word: placement.word, clue: placement.clue });
        }
        if (startsDown) {
          const placement = shifted.find(p => p.r === r && p.c === c && p.dir === DOWN);
          if (placement) downClues.push({ number: nextNum, word: placement.word, clue: placement.clue });
        }
        nextNum++;
      }
    }
  }

  return { grid: matrix, placements: shifted, acrossClues, downClues, unplaced };
}
