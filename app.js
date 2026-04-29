import { parseInput, generate } from './crossword.js';

const titleEl = document.getElementById('title');
const entriesEl = document.getElementById('entries');
const generateBtn = document.getElementById('generate');
const regenerateBtn = document.getElementById('regenerate');
const printPuzzleBtn = document.getElementById('print-puzzle');
const printAnswersBtn = document.getElementById('print-answers');
const warningEl = document.getElementById('warning');
const outputEl = document.getElementById('output');

let lastResult = null;

function render(result, title) {
  outputEl.innerHTML = '';
  if (!result || result.grid.length === 0) return;

  const wrap = document.createElement('div');
  wrap.className = 'puzzle';

  const h = document.createElement('h2');
  h.className = 'puzzle-title';
  h.textContent = title || 'Crossword';
  wrap.appendChild(h);

  const gridEl = document.createElement('div');
  gridEl.className = 'grid';
  const cols = result.grid[0].length;
  gridEl.style.setProperty('--cols', cols);
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const rows = result.grid.length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellData = result.grid[r][c];
      const cell = document.createElement('div');
      if (!cellData) {
        cell.className = 'cell blank';
      } else {
        cell.className = 'cell';
        // Mark cells whose right/bottom neighbor is missing or blank so they
        // draw the puzzle's outer silhouette. Internal edges are drawn by
        // exactly one neighbor (top+left always), so no doubling.
        if (c === cols - 1 || !result.grid[r][c + 1]) cell.classList.add('edge-right');
        if (r === rows - 1 || !result.grid[r + 1][c]) cell.classList.add('edge-bottom');
        if (cellData.number) {
          const num = document.createElement('span');
          num.className = 'cell-number';
          num.textContent = cellData.number;
          cell.appendChild(num);
        }
        const letter = document.createElement('span');
        letter.className = 'cell-letter';
        letter.textContent = cellData.letter;
        cell.appendChild(letter);
      }
      gridEl.appendChild(cell);
    }
  }
  wrap.appendChild(gridEl);

  const cluesWrap = document.createElement('div');
  cluesWrap.className = 'clues';
  cluesWrap.appendChild(buildClueColumn('Across', result.acrossClues));
  cluesWrap.appendChild(buildClueColumn('Down', result.downClues));
  wrap.appendChild(cluesWrap);

  outputEl.appendChild(wrap);
}

function buildClueColumn(label, clues) {
  const col = document.createElement('div');
  col.className = 'clue-col';
  const h = document.createElement('h3');
  h.textContent = label;
  col.appendChild(h);
  const ol = document.createElement('ol');
  for (const c of clues) {
    const li = document.createElement('li');
    li.value = c.number;
    li.textContent = c.clue;
    ol.appendChild(li);
  }
  col.appendChild(ol);
  return col;
}

function showWarning(message) {
  if (!message) {
    warningEl.hidden = true;
    warningEl.textContent = '';
    return;
  }
  warningEl.hidden = false;
  warningEl.textContent = message;
}

function runGenerate() {
  const entries = parseInput(entriesEl.value);
  if (entries.length === 0) {
    showWarning('Add at least one line in the format: answer, clue text');
    outputEl.innerHTML = '';
    printPuzzleBtn.disabled = true;
    printAnswersBtn.disabled = true;
    regenerateBtn.disabled = true;
    return;
  }
  const result = generate(entries, { seed: Math.floor(Math.random() * 1e9) });
  lastResult = result;
  render(result, titleEl.value.trim());
  if (result.unplaced.length > 0) {
    const list = result.unplaced.map(e => e.word).join(', ');
    showWarning(`Couldn't fit these into the grid: ${list}. Try clicking "Try another layout" — a different arrangement may fit them.`);
  } else {
    showWarning(null);
  }
  printPuzzleBtn.disabled = false;
  printAnswersBtn.disabled = false;
  regenerateBtn.disabled = false;
}

generateBtn.addEventListener('click', runGenerate);
regenerateBtn.addEventListener('click', runGenerate);

function printAs(mode) {
  if (!lastResult) return;
  document.body.classList.remove('mode-puzzle', 'mode-answers');
  document.body.classList.add(mode);
  // Let the browser apply styles before opening the print dialog.
  setTimeout(() => window.print(), 50);
}

printPuzzleBtn.addEventListener('click', () => printAs('mode-puzzle'));
printAnswersBtn.addEventListener('click', () => printAs('mode-answers'));

window.addEventListener('afterprint', () => {
  document.body.classList.remove('mode-puzzle', 'mode-answers');
});
