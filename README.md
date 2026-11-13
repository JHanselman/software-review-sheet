<p align="center"><img src="docs/software-reviewing-logo.png" alt="Software Reviewing logo" width="360"></p>

# Software Review Sheet

An interactive, browser-based sheet for reviewing the software that accompanies a mathematical paper.
It is a guided version of the [MaRDI code review template](https://github.com/JHanselman/code-review-template),
designed so that reviewers can write a software review **without knowing LaTeX**.

Developed by Jeroen Hanselman as part of [MaRDI](https://www.mardi4nfdi.de) (Mathematical Research Data Initiative).

## Features

- **Guided form** following the structure of the template: basic info, role of the software, reproducibility
  (installation, records of setup, running the code), correctness and reliability, readability, use of AI, and comments.
- **Knowls**: clicking a dotted label or a *Guidance* button opens a short explanation of what to check,
  summarised from the article
  [*Guidelines for Writing and Reviewing Mathematical Software*](https://doi.org/10.1090/noti3210).
- **+ / − assessments** for each item, as in the template (`\mplus` / `\mminus`).
- **Status of results** (proven / conditional / heuristic / numerical) and **level of reproduction** for the correctness section.
- **Optional "Use of AI" section**: disclosure, verification of AI-generated code or results, and the reviewer's own use of AI.
- **Autosave** in the browser, plus **save / open** as a `.json` file (drag and drop works too).
- **Export**:
  - **PDF** via the browser's print dialog, styled like the LaTeX template;
  - **LaTeX project** (`.zip`) that reproduces the original template and compiles directly on Overleaf.
    The exported `.tex` file embeds the review data, so it can be opened in the sheet again.
- **Simple text formatting** that works for both outputs: `` `code` ``, ```` ``` ```` blocks for error messages,
  `$math$`, and automatic links.
- **Guide page** (`guide.html`): a practical how-to for software reviewers, including guidelines for using AI in a review.

Everything runs client-side. Nothing a reviewer types is sent anywhere.

## Usage

The site is static: plain HTML, CSS and JavaScript, with no build step and no backend.

- **Locally:** open `docs/index.html` in a browser. Everything works, except that the LaTeX export
  leaves out the logo (browsers block reading local files from `file://` pages); the exported project still compiles.
  For the full behaviour, serve the folder instead, e.g.

  ```sh
  cd docs && python3 -m http.server 8000
  # then open http://localhost:8000
  ```

- **GitHub Pages:** in the repository settings, under *Pages*, choose *Deploy from a branch*, branch `main`, folder `/docs`.

- **Embedding elsewhere:** copy the contents of `docs/` to any web server.

External resources loaded at runtime: Google Fonts (Fira Sans / Fira Mono) and MathJax from jsDelivr.
Without them the page falls back to system fonts and shows maths unrendered.

## Repository layout

```
docs/
  index.html                   the review sheet
  guide.html                   "How to perform a software review"
  review.js                    form logic, preview/PDF rendering, LaTeX export, save/load
  knowls.js                    texts of the knowls (guidance boxes)
  review.css                   styles, including the print layout used for the PDF
  mardi.png                    MaRDI logo used in the review header (and in the LaTeX export)
  mardi-logo.png               MaRDI logo in the introduction of both pages
  mardi-mark.png               small MaRDI logo for the page footer
  software-reviewing-logo.png  Software Reviewing logo (page header and this README)
  favicon.png                  browser-tab icon (the rabbit from the logo)
```

### Editing the content

- **Guidance texts** live in `docs/knowls.js`, one entry per knowl (`title`, `body` as HTML, and `ref`/`page`/`guide` for the links at the bottom).
- **Fields, default items, placeholders and the role/status/level options** are defined at the top of `docs/review.js`
  (`FILE_TYPES`, `ROLES`, `PLACEHOLDERS`, `CHOICES`, `ROWS`, `PARTS`, `HINTS`).
- **The LaTeX output** is generated in `buildTex()` in `docs/review.js`. The preamble, header and `TLCresume.sty`
  are embedded as strings there.

### Saved review format

Reviews are saved as JSON with `"format": "mardi-software-review"` and a `version` number.
Unknown or missing fields are filled with defaults when a file is opened, so older files keep working when items are added.

## Related

- Code review template (LaTeX): <https://github.com/JHanselman/code-review-template>
- J. Hanselman, *Guidelines for Writing and Reviewing Mathematical Software*, Notices of the AMS (2025):
  <https://doi.org/10.1090/noti3210>
- MaRDI: <https://www.mardi4nfdi.de>

## License

GPL-3.0, see [LICENSE](LICENSE). The review layout and `TLCresume.sty` are adapted from the template by
[Timmy Chan](https://github.com/TimmyChan), as in the original code review template.
