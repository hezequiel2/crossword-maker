import { parseInput, generate } from './crossword.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const titleEl = document.getElementById('title');
const entriesEl = document.getElementById('entries');
const generateBtn = document.getElementById('generate');
const regenerateBtn = document.getElementById('regenerate');
const printPuzzleBtn = document.getElementById('print-puzzle');
const printAnswersBtn = document.getElementById('print-answers');
const answerPlacementEl = document.getElementById('answer-placement');
const warningEl = document.getElementById('warning');
const outputEl = document.getElementById('output');
const toastEl = document.getElementById('toast');

const saveBtn = document.getElementById('save-puzzle');
const myPuzzlesBtn = document.getElementById('my-puzzles');
const signInBtn = document.getElementById('signin-btn');
const signOutBtn = document.getElementById('signout-btn');
const authStatusEl = document.getElementById('auth-status');

const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authEmailEl = document.getElementById('auth-email');
const authPasswordEl = document.getElementById('auth-password');
const authPasswordConfirmEl = document.getElementById('auth-password-confirm');
const authPasswordConfirmField = document.getElementById('auth-password-confirm-field');
const authErrorEl = document.getElementById('auth-error');
const authCaptchaEl = document.getElementById('auth-captcha');
const authSubmitBtn = document.getElementById('auth-submit');
const authForgotBtn = document.getElementById('auth-forgot');
const tabSignIn = document.getElementById('tab-signin');
const tabSignUp = document.getElementById('tab-signup');
const passwordToggleBtns = document.querySelectorAll('.password-toggle');

const puzzlesModal = document.getElementById('puzzles-modal');
const puzzlesListEl = document.getElementById('puzzles-list');

const editingPillEl = document.getElementById('editing-pill');
const editingPillNameEl = editingPillEl.querySelector('.editing-pill__name');
const editingPillClearBtn = editingPillEl.querySelector('.editing-pill__clear');

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);

let lastResult = null;
let currentUser = null;
let currentPuzzleId = null;
let currentPuzzleName = '';
let authMode = 'signin';

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
  const rows = result.grid.length;
  const cols = result.grid[0].length;
  gridEl.style.setProperty('--cols', cols);
  gridEl.style.setProperty('--rows', rows);

  // Every grid line is drawn by exactly one cell, so no two cells paint the
  // same pixel — that's what keeps lines from doubling and from drifting
  // off-axis. Internal lines + left/top silhouette: `has-left`/`has-top` on
  // the cell to the right/below the line. Right/bottom silhouette at the
  // outer edge of the grid (where there is no cell to the right/below):
  // `has-right`/`has-bottom` on the edge real cell itself. We avoid the
  // earlier phantom-row/column trick because 1px-wide grid tracks aren't
  // reliably rendered by print engines, which dropped those silhouettes.
  const isReal = (r, c) =>
    r >= 0 && r < rows && c >= 0 && c < cols && !!result.grid[r][c];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellData = result.grid[r][c];
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (cellData) cell.classList.add('real');
      if (isReal(r, c - 1) || isReal(r, c)) cell.classList.add('has-left');
      if (isReal(r - 1, c) || isReal(r, c)) cell.classList.add('has-top');
      if (cellData && c === cols - 1) cell.classList.add('has-right');
      if (cellData && r === rows - 1) cell.classList.add('has-bottom');
      if (cellData) {
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

function showToast(message, duration = 2500) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toastEl.hidden = true; }, duration);
}

function runGenerate({ seed } = {}) {
  const entries = parseInput(entriesEl.value);
  if (entries.length === 0) {
    showWarning('Add at least one line in the format: answer, clue text');
    outputEl.innerHTML = '';
    printPuzzleBtn.disabled = true;
    printAnswersBtn.disabled = true;
    regenerateBtn.disabled = true;
    updateSaveButton();
    updateEditingPill();
    return;
  }
  const useSeed = seed ?? Math.floor(Math.random() * 1e9);
  const result = generate(entries, { seed: useSeed });
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
  updateSaveButton();
  updateEditingPill();
}

function startNew() {
  titleEl.value = '';
  entriesEl.value = '';
  lastResult = null;
  currentPuzzleId = null;
  currentPuzzleName = '';
  outputEl.innerHTML = '';
  regenerateBtn.disabled = true;
  printPuzzleBtn.disabled = true;
  printAnswersBtn.disabled = true;
  showWarning(null);
  toastEl.hidden = true;
  updateSaveButton();
  updateEditingPill();
  titleEl.focus();
}

function updateEditingPill() {
  if (currentPuzzleId && currentPuzzleName) {
    editingPillNameEl.textContent = currentPuzzleName;
    editingPillEl.hidden = false;
  } else {
    editingPillEl.hidden = true;
  }
}

editingPillClearBtn.addEventListener('click', startNew);

generateBtn.addEventListener('click', () => runGenerate());
regenerateBtn.addEventListener('click', () => runGenerate());

function printAs(mode) {
  if (!lastResult) return;
  document.body.classList.remove('mode-puzzle', 'mode-answers');
  document.body.classList.add(mode);
  document.body.dataset.answerPlacement = answerPlacementEl.value;
  // Let the browser apply styles before opening the print dialog.
  setTimeout(() => window.print(), 50);
}

printPuzzleBtn.addEventListener('click', () => printAs('mode-puzzle'));
printAnswersBtn.addEventListener('click', () => printAs('mode-answers'));

window.addEventListener('afterprint', () => {
  document.body.classList.remove('mode-puzzle', 'mode-answers');
  delete document.body.dataset.answerPlacement;
});

// ---------- Auth ----------

let turnstileWidgetId = null;

function emailRedirectTo() {
  return window.location.origin + window.location.pathname;
}

function ensureTurnstile() {
  if (turnstileWidgetId !== null) return;
  if (!window.turnstile || !window.TURNSTILE_SITE_KEY) return;
  turnstileWidgetId = window.turnstile.render(authCaptchaEl, {
    sitekey: window.TURNSTILE_SITE_KEY,
    theme: 'light',
  });
}

function resetTurnstile() {
  if (turnstileWidgetId !== null && window.turnstile) {
    window.turnstile.reset(turnstileWidgetId);
  }
}

function getTurnstileToken() {
  if (turnstileWidgetId === null || !window.turnstile) return undefined;
  return window.turnstile.getResponse(turnstileWidgetId) || undefined;
}

function resetPasswordVisibility() {
  authPasswordEl.type = 'password';
  authPasswordConfirmEl.type = 'password';
  for (const btn of passwordToggleBtns) {
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Show password');
  }
}

function setAuthMode(mode) {
  authMode = mode;
  tabSignIn.classList.toggle('active', mode === 'signin');
  tabSignUp.classList.toggle('active', mode === 'signup');
  authSubmitBtn.textContent = mode === 'signin' ? 'Sign in' : 'Create account';
  authPasswordEl.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
  authPasswordConfirmField.hidden = mode !== 'signup';
  authPasswordConfirmEl.required = mode === 'signup';
  // Supabase's CAPTCHA protection covers every auth endpoint (signin,
  // signup, password reset, resend), so the widget needs to be visible
  // in every mode — not just signup.
  authCaptchaEl.hidden = false;
  if (window.turnstile) ensureTurnstile();
  else window.turnstile?.ready?.(ensureTurnstile);
  resetPasswordVisibility();
  authErrorEl.hidden = true;
  authErrorEl.textContent = '';
}

function showAuthError(msg, { withResend = false, email = '' } = {}) {
  authErrorEl.textContent = '';
  const span = document.createElement('span');
  span.textContent = msg;
  authErrorEl.appendChild(span);
  if (withResend && email) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'linkish';
    btn.style.marginLeft = '.5rem';
    btn.textContent = 'Resend confirmation';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        const captchaToken = getTurnstileToken();
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: emailRedirectTo(), captchaToken },
        });
        if (error) throw error;
        authErrorEl.textContent = `Confirmation email re-sent to ${email}. Check your inbox.`;
      } catch (err) {
        authErrorEl.textContent = err?.message ?? 'Could not resend confirmation email.';
      } finally {
        resetTurnstile();
      }
    });
    authErrorEl.appendChild(btn);
  }
  authErrorEl.hidden = false;
}

tabSignIn.addEventListener('click', () => setAuthMode('signin'));
tabSignUp.addEventListener('click', () => setAuthMode('signup'));

signInBtn.addEventListener('click', () => {
  setAuthMode('signin');
  authModal.showModal();
});

document.querySelector('[data-close-auth]').addEventListener('click', () => authModal.close());
document.querySelector('[data-close-puzzles]').addEventListener('click', () => puzzlesModal.close());

for (const btn of passwordToggleBtns) {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.toggleTarget;
    const input = document.getElementById(targetId);
    if (!input) return;
    const revealing = input.type === 'password';
    input.type = revealing ? 'text' : 'password';
    btn.setAttribute('aria-pressed', revealing ? 'true' : 'false');
    btn.setAttribute('aria-label', revealing ? 'Hide password' : 'Show password');
  });
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authSubmitBtn.disabled = true;
  const email = authEmailEl.value.trim();
  const password = authPasswordEl.value;
  try {
    const captchaToken = getTurnstileToken();
    if (authMode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        const code = error.code || '';
        if (msg.includes('not confirmed') || msg.includes('email not confirmed') || code === 'email_not_confirmed') {
          showAuthError(
            'Your email isn\'t confirmed yet. Check your inbox for the confirmation link, or resend it below.',
            { withResend: true, email },
          );
          return;
        }
        throw error;
      }
      authModal.close();
      authForm.reset();
      resetPasswordVisibility();
    } else {
      const confirmPassword = authPasswordConfirmEl.value;
      if (password !== confirmPassword) {
        showAuthError('Passwords do not match.');
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: emailRedirectTo(), captchaToken },
      });
      if (error) throw error;
      authModal.close();
      authForm.reset();
      resetPasswordVisibility();
      // Identity is present but no active session means email confirmation is required.
      const needsConfirmation = !data?.session && !!data?.user;
      if (needsConfirmation) {
        showToast(`Check ${email} for a confirmation link to finish creating your account.`, 8000);
      }
    }
  } catch (err) {
    showAuthError(err?.message ?? 'Something went wrong. Try again.');
  } finally {
    authSubmitBtn.disabled = false;
    resetTurnstile();
  }
});

authForgotBtn.addEventListener('click', async () => {
  const email = authEmailEl.value.trim();
  if (!email) {
    showAuthError('Enter your email above first, then click "Forgot password?".');
    return;
  }
  try {
    const captchaToken = getTurnstileToken();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { captchaToken });
    if (error) throw error;
    showAuthError(`Password reset email sent to ${email}. Check your inbox.`);
  } catch (err) {
    showAuthError(err?.message ?? 'Could not send reset email.');
  } finally {
    resetTurnstile();
  }
});

signOutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

function updateAuthUI() {
  if (currentUser) {
    authStatusEl.textContent = `Signed in as ${currentUser.email}`;
    signInBtn.hidden = true;
    signOutBtn.hidden = false;
    myPuzzlesBtn.disabled = false;
    myPuzzlesBtn.title = 'View your saved puzzles';
    document.body.classList.add('is-signed-in');
  } else {
    authStatusEl.textContent = 'Not signed in';
    signInBtn.hidden = false;
    signOutBtn.hidden = true;
    myPuzzlesBtn.disabled = true;
    myPuzzlesBtn.title = 'Sign in to view your puzzles';
    document.body.classList.remove('is-signed-in');
    // Signing out should drop any editing-pill state too.
    currentPuzzleId = null;
    currentPuzzleName = '';
    updateEditingPill();
  }
  updateSaveButton();
}

function updateSaveButton() {
  const hasPuzzle = !!(lastResult && lastResult.grid.length > 0);
  saveBtn.disabled = !currentUser || !hasPuzzle;
  saveBtn.title = !currentUser
    ? 'Sign in to save'
    : !hasPuzzle ? 'Generate a puzzle first' : (currentPuzzleId ? 'Update saved puzzle' : 'Save puzzle');
  saveBtn.textContent = currentPuzzleId ? 'Update' : 'Save';
}

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
  updateAuthUI();
});

// Initial session check (in case user is already signed in from previous visit).
supabase.auth.getSession().then(({ data }) => {
  currentUser = data.session?.user ?? null;
  updateAuthUI();
});

// ---------- Puzzles repo ----------

function buildPuzzleRow() {
  const entries = parseInput(entriesEl.value);
  return {
    user_id: currentUser.id,
    name: titleEl.value.trim() || 'Untitled',
    title: titleEl.value.trim(),
    // `entries` is `text` in the schema — store as JSON string.
    entries: JSON.stringify(entries),
    answer_placement: answerPlacementEl.value,
    seed: lastResult.seed,
  };
}

function parseStoredEntries(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

saveBtn.addEventListener('click', async () => {
  if (!currentUser || !lastResult) return;
  saveBtn.disabled = true;
  try {
    const row = buildPuzzleRow();
    if (currentPuzzleId) {
      const { error } = await supabase
        .from('puzzles')
        .update(row)
        .eq('id', currentPuzzleId);
      if (error) throw error;
      currentPuzzleName = row.name;
      showToast('Puzzle updated.');
    } else {
      const { data, error } = await supabase
        .from('puzzles')
        .insert(row)
        .select('id')
        .single();
      if (error) throw error;
      currentPuzzleId = data.id;
      currentPuzzleName = row.name;
      showToast('Puzzle saved.');
    }
  } catch (err) {
    showWarning(`Save failed: ${err?.message ?? err}`);
  } finally {
    updateSaveButton();
    updateEditingPill();
  }
});

myPuzzlesBtn.addEventListener('click', async () => {
  puzzlesModal.showModal();
  puzzlesListEl.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const { data, error } = await supabase
      .from('puzzles')
      .select('id, name, title, entries, answer_placement, seed, updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    renderPuzzlesList(data);
  } catch (err) {
    puzzlesListEl.innerHTML = `<p class="warning">Couldn't load puzzles: ${err?.message ?? err}</p>`;
  }
});

function renderPuzzlesList(puzzles) {
  puzzlesListEl.innerHTML = '';
  const countEl = document.getElementById('puzzles-count');
  if (!puzzles || puzzles.length === 0) {
    if (countEl) countEl.textContent = '';
    puzzlesListEl.innerHTML = '<p class="muted">No saved puzzles yet. Generate one and click Save.</p>';
    return;
  }
  if (countEl) countEl.textContent = `${puzzles.length} saved`;
  for (const p of puzzles) {
    const row = document.createElement('div');
    row.className = 'puzzle-row';

    const info = document.createElement('div');
    info.className = 'puzzle-row-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'puzzle-row-name';
    nameEl.textContent = p.name || p.title || 'Untitled';
    const metaEl = document.createElement('div');
    metaEl.className = 'puzzle-row-meta';
    const when = new Date(p.updated_at).toLocaleString();
    const entriesArr = parseStoredEntries(p.entries);
    const badge = document.createElement('span');
    badge.className = 'entries-badge';
    badge.textContent = `${entriesArr.length} entries`;
    const dateEl = document.createElement('span');
    dateEl.className = 'puzzle-row-date';
    dateEl.textContent = `updated ${when}`;
    metaEl.appendChild(badge);
    metaEl.appendChild(dateEl);
    info.appendChild(nameEl);
    info.appendChild(metaEl);

    const actions = document.createElement('div');
    actions.className = 'puzzle-row-actions';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'primary';
    openBtn.textContent = 'Open';
    openBtn.addEventListener('click', () => openPuzzle(p));

    const renameBtn = document.createElement('button');
    renameBtn.type = 'button';
    renameBtn.textContent = 'Rename';
    renameBtn.addEventListener('click', () => renamePuzzle(p));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePuzzle(p));

    actions.appendChild(openBtn);
    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(info);
    row.appendChild(actions);
    puzzlesListEl.appendChild(row);
  }
}

function openPuzzle(p) {
  titleEl.value = p.title || '';
  const entries = parseStoredEntries(p.entries);
  entriesEl.value = entries.map(e => `${e.word}, ${e.clue}`).join('\n');
  if (p.answer_placement) answerPlacementEl.value = p.answer_placement;
  currentPuzzleId = p.id;
  currentPuzzleName = p.name || p.title || 'Untitled';
  puzzlesModal.close();
  runGenerate({ seed: p.seed });
}

async function renamePuzzle(p) {
  const nextName = prompt('New name for this puzzle:', p.name || p.title || '');
  if (nextName == null) return;
  const trimmed = nextName.trim();
  if (!trimmed) return;
  try {
    const { error } = await supabase
      .from('puzzles')
      .update({ name: trimmed })
      .eq('id', p.id);
    if (error) throw error;
    p.name = trimmed;
    if (currentPuzzleId === p.id) {
      currentPuzzleName = trimmed;
      updateEditingPill();
    }
    myPuzzlesBtn.click(); // reload
  } catch (err) {
    showWarning(`Rename failed: ${err?.message ?? err}`);
  }
}

async function deletePuzzle(p) {
  if (!confirm(`Delete "${p.name || p.title || 'Untitled'}"? This cannot be undone.`)) return;
  try {
    const { error } = await supabase.from('puzzles').delete().eq('id', p.id);
    if (error) throw error;
    if (currentPuzzleId === p.id) {
      currentPuzzleId = null;
      currentPuzzleName = '';
      updateSaveButton();
      updateEditingPill();
    }
    myPuzzlesBtn.click(); // reload
  } catch (err) {
    showWarning(`Delete failed: ${err?.message ?? err}`);
  }
}
