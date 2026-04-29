# Crossword Maker

A free, no-install web app that generates printable crossword puzzles for elementary classrooms. The print output is clean — no ads, no watermarks, no accounts.

**Live site: https://hezequiel2.github.io/crossword-maker/**

## Use it

1. Open the live site (or `index.html` locally — see below).
2. Type a puzzle title.
3. Enter answers and clues, one per line. The separator can be a comma, `=`, or `:`:
   ```
   APPLE, a red fruit
   ICE CREAM, a cold dessert
   SUN = it rises in the east
   ```
   Spaces and hyphens inside answers are stripped automatically (`ICE-CREAM` becomes `ICECREAM`). Commas inside the clue are preserved — only the **first** comma on a line is treated as the separator.
4. Click **Generate puzzle**. The app runs 60 randomized layout attempts internally and shows the best one (most words placed, most square, smallest grid).
5. Don't like the layout? Click **Try another layout** to see a different arrangement. Keep clicking until you're happy.
6. Click **Print puzzle** (blank grid for students) or **Print answer key** (filled grid for the teacher). In the print dialog, choose **"Save as PDF"** if you want a file rather than a paper copy.

### Square size

The grid auto-fits the page width with cells capped at 0.6 inches (a comfortable size for elementary handwriting). With short word lists you'll get a small centered grid; with long lists the cells shrink to keep the grid on a single page.

If you want bigger cells, use fewer words (10–12 is the sweet spot). If you need a much longer puzzle and cells feel cramped, print on legal or 11×17 paper — the grid uses the extra width automatically.

### If a word can't be placed

The app tells you which words it couldn't fit and recommends clicking **Try another layout** — a different random arrangement often fits them. If a word still won't fit after several tries, it shares no letters with the rest of your list; remove it or swap it for one with more common letters.

## Run it locally

The app uses ES module imports, which Chrome blocks over `file://`. Either:

**Use a tiny local server (recommended):**
```bash
cd crossword-maker
python -m http.server 8000
```
Then open http://localhost:8000.

**Or use Firefox**, which allows ES modules from `file://`:
```bash
firefox index.html
```

## Updating the live site

Edit any file, then:
```bash
git add <files>
git commit -m "what changed"
git push
```
GitHub Pages rebuilds automatically within about a minute.

## Files

- `index.html` — page structure and form
- `styles.css` — screen + print styles, auto-fit-to-width grid, container-query font sizing
- `app.js` — UI wiring and rendering
- `crossword.js` — generation algorithm (randomized greedy placement, scored for squareness)

No build step, no dependencies, no backend. Pure static HTML/CSS/JS.
