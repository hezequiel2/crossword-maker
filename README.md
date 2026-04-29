# Crossword Maker

A free, no-install web app that generates printable crossword puzzles for elementary classrooms. Squares are sized in real-world inches so they're age-appropriate (large enough for kids' handwriting), and the print output is clean — no ads, no watermarks, no accounts.

## Use it

1. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge).
2. Type a puzzle title.
3. Enter words and clues, one per line, in the format:
   ```
   WORD = clue text
   APPLE = a red fruit
   ```
   Hyphens and spaces inside words are stripped (`ICE-CREAM` becomes `ICECREAM`). Either `=` or `:` works as the separator.
4. Pick a square size:
   - **1.0 in** for grades K–2
   - **0.6 in** for grades 3–5 *(default)*
   - **0.4 in** for grades 6+
5. Click **Generate puzzle**.
6. Click **Print puzzle** (blank grid for students) or **Print answer key** (filled grid for the teacher). In the print dialog, choose **"Save as PDF"** as the destination if you want a file rather than a paper copy.

If a word can't be fit into the grid, the app tells you which one — usually because it shares no letters with anything already placed. Removing that word, or swapping it for one with a more common letter, fixes it.

## Deploy it (so the teacher just visits a URL)

The whole app is static files: `index.html`, `styles.css`, `app.js`, `crossword.js`. Any free static host works:

- **GitHub Pages**: push these files to a repo, enable Pages on the `main` branch. Done.
- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the folder into their dashboard.
- **Local share**: zip the folder and email it; she opens `index.html` directly.

No build step, no dependencies, no backend.

## Files

- `index.html` — page structure and form
- `styles.css` — screen + print styles (real-world inch sizing for cells)
- `app.js` — UI wiring and rendering
- `crossword.js` — generation algorithm (greedy intersection placement)
