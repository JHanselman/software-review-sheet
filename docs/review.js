/*
 * Interactive software review sheet
 * Jeroen Hanselman – MaRDI (Mathematical Research Data Initiative)
 *
 * An HTML version of https://github.com/JHanselman/code-review-template.
 * Everything runs in the browser: the review is autosaved in localStorage, can be
 * saved/loaded as JSON, printed to PDF, and exported as a LaTeX project (.zip) that
 * reproduces the original template.
 */
(function () {
  'use strict';

  var KNOWLS = window.REVIEW_KNOWLS || {};
  var STORAGE_KEY = 'mardi-software-review:v1';
  var SETUP_KEY = 'mardi-software-review:reviewer-setup';
  var PAPER_URL = 'https://doi.org/10.1090/noti3210';
  // Set to true when PAPER_URL points to a PDF: knowls then link to the page of the relevant section.
  var PAPER_PAGE_LINKS = false;
  var GUIDE_URL = 'guide.html';
  var TEMPLATE_URL = 'https://github.com/JHanselman/code-review-template';
  var FORMAT = 'mardi-software-review';

  /* ------------------------------------------------------------------ *
   *  Schema                                                             *
   * ------------------------------------------------------------------ */

  var FILE_TYPES = [
    ['source', 'Source Code'],
    ['notebook', 'Notebook'],
    ['examples', 'Examples'],
    ['docker', 'Docker file/VM'],
    ['documentation', 'Documentation'],
    ['data', 'Computed data'],
    ['verify', 'Files that verify computed data']
  ];

  var ROLES = [
    { id: 'new', label: 'A new algorithm',
      text: 'The paper explains a new algorithm capable of computing things we were not able to compute before.',
      focus: 'Focus on correctness: examples and commentary in the repository help to understand and verify the algorithm. Run times and system specifications matter less.' },
    { id: 'better', label: 'A faster or better algorithm',
      text: 'The paper presents an algorithm that is claimed to be better than existing algorithms.',
      focus: 'Hardware specifications, run times and benchmarking tools are crucial to support the claims.' },
    { id: 'database', label: 'A database',
      text: 'The paper discusses a database of mathematical objects.',
      focus: 'Can you tell how each object was computed, whether rigorously or heuristically, and whether it depends on conjectures? Are there sanity checks? Is the data easy to access and query, and can users verify it themselves?' },
    { id: 'examples', label: 'Computing examples',
      text: 'The code is used to compute examples included in the paper.',
      focus: 'Ideally there is one clearly named file per example that runs immediately. For long computations, an estimate of the running time helps.' },
    { id: 'proof', label: 'Part of a proof',
      text: 'The code is used to do computations as part of a proof.',
      focus: 'The code is part of the proof: look for clear cross-references between the code and the paper and for well-commented code.' }
  ];

  var PLACEHOLDERS = {
    license: 'e.g. MIT license (LICENSE file in the repository)  —  or: No license found',
    availability: 'e.g. The files were uploaded to GitHub',
    readme: 'e.g. The repository contains a Readme explaining its contents',
    installation: 'e.g. Straightforward, took about 10 minutes',
    'Specification of CPU': 'e.g. Did not find what CPU was used',
    'Specification of Memory': 'e.g. Did not find the amount of memory used',
    'Specification of OS/software used': 'e.g. Did not find which Magma version was used',
    citation: 'e.g. Magma is cited. The other packages the software depends on are properly cited.',
    benchmarks: 'e.g. Timings for all examples are listed in Table 2 of the paper',
    doi: 'e.g. The repository is archived on Zenodo with a DOI',
    documentation: 'e.g. Every function has a docstring describing input and output',
    tests: 'e.g. The repository contains a test suite that ran without errors',
    verification: 'e.g. The file verify.m checks all computed curves in a few minutes',
    implementations: 'e.g. The Magma and Sage implementations give the same results',
    annotation: 'e.g. The code is clearly annotated',
    formatting: 'e.g. Consistent',
    naming: 'e.g. Consistent, meaningful and distinctive',
    structure: 'e.g. Clearly structured, with separate folders for code, data and examples',
    running: 'e.g. The code runs fine. It does give a small error, however:\n```\nIn file "Carrot.m", line 587, column 9:\n```',
    correctness: 'e.g. I reran the examples in Section 6 and obtained the same results as the authors',
    status: 'e.g. The paper says the results are unconditional, but the code uses a function that assumes GRH by default',
    'reproduction-level': 'e.g. Reran the examples from Section 3. According to the authors the full computation takes several weeks.',
    'ai-disclosure': 'e.g. The paper states that no AI tools were used  —  or: Not mentioned in the paper or repository',
    'ai-verification': 'e.g. The AI-generated helper functions are covered by the test suite',
    'ai-reviewer': 'e.g. I used an AI assistant to help interpret an error message; the problem was reproduced by hand'
  };

  // Items with a fixed set of options (in addition to the free text)
  var CHOICES = {
    status: { multi: true, label: 'Claimed status', options: [
      ['proven', 'Proven / certified'], ['conditional', 'Conditional (e.g. on GRH)'], ['heuristic', 'Heuristic'],
      ['numerical', 'Numerical'], ['unclear', 'Unclear from the paper']] },
    level: { multi: false, label: 'Reproduced up to', options: [
      ['none', 'Not attempted'], ['tests', 'Tests or small examples'], ['examples', 'Examples from the paper'],
      ['full', 'Full computation']] }
  };

  function choiceText(r) {
    var c = r.kind && CHOICES[r.kind];
    if (!c || !r.choices || !r.choices.length) return '';
    return c.options.filter(function (o) { return r.choices.indexOf(o[0]) >= 0; }).map(function (o) { return o[1]; }).join(', ');
  }

  // Sections consisting of assessed items (label + optional +/- + text)
  var ROWS = {
    install: {
      knowl: 'reproducibility',
      defaults: [
        { label: 'License', knowl: 'license' },
        { label: 'Availability', knowl: 'availability' },
        { label: 'Readme', knowl: 'readme' },
        { label: 'Installation', knowl: 'installation' }
      ],
      suggestions: [
        { label: 'DOI', knowl: 'doi' },
        { label: 'Documentation', knowl: 'documentation' }
      ],
      addLabel: 'Other item', labelPh: 'Item, e.g. Open source'
    },
    setup: {
      knowl: 'setup',
      defaults: [
        { label: 'Specification of CPU', knowl: 'setup' },
        { label: 'Specification of Memory', knowl: 'setup' },
        { label: 'Specification of OS/software used', knowl: 'setup' },
        { label: 'References and citation', knowl: 'citation' }
      ],
      suggestions: [
        { label: 'Running times', knowl: 'benchmarks' }
      ],
      addLabel: 'Other item', labelPh: 'Item, e.g. Running times'
    },
    running: {
      knowl: 'running',
      defaults: [{ label: 'Code', knowl: null, ph: 'running' }],
      suggestions: [],
      addLabel: 'Another piece of software', labelPh: 'e.g. Sage code', ph: 'running'
    },
    correctness: {
      knowl: 'correctness',
      defaults: [
        { label: 'Status of results', knowl: 'status', kind: 'status' },
        { label: 'Level of reproduction', knowl: 'reproduction-level', kind: 'level' },
        { label: 'Recalculating the examples', knowl: null, ph: 'correctness' }
      ],
      suggestions: [
        { label: 'Test files', knowl: 'tests' },
        { label: 'Verification files', knowl: 'verification' },
        { label: 'Multiple implementations', knowl: 'implementations' }
      ],
      addLabel: 'Example or claim', labelPh: 'e.g. Lemma 5.3', ph: 'correctness'
    },
    readability: {
      knowl: 'readability',
      defaults: [
        { label: 'Annotation', knowl: 'annotation' },
        { label: 'Indentation and formatting', knowl: 'formatting' },
        { label: 'Naming of variables', knowl: 'naming' }
      ],
      suggestions: [
        { label: 'Repository structure', knowl: 'structure' },
        { label: 'Documentation of functions', knowl: 'documentation' }
      ],
      addLabel: 'Other item', labelPh: 'Item'
    },
    ai: {
      knowl: 'ai',
      defaults: [
        { label: 'Disclosure of AI use', knowl: 'ai-disclosure' },
        { label: 'Verification of AI-generated code or results', knowl: 'ai-verification' },
        { label: "Reviewer's use of AI", knowl: 'ai-reviewer' }
      ],
      suggestions: [],
      addLabel: 'Other item', labelPh: 'Item'
    }
  };

  var PARTS = [
    { id: 'paper', title: 'The paper', knowl: 'metadata', report: 'Basic Info' },
    { id: 'files', title: 'Files provided', knowl: 'files' },
    { id: 'env', title: 'Your review setup', knowl: 'reviewer-setup' },
    { id: 'sources', title: 'Version reviewed', knowl: 'version' },
    { id: 'role', title: 'Importance of software in the paper', knowl: 'role' },
    { id: 'install', title: 'Reproducibility (Installation)', knowl: 'reproducibility' },
    { id: 'steps', title: 'Installation steps taken', knowl: 'steps' },
    { id: 'setup', title: 'Reproducibility (Records of setup)', knowl: 'setup' },
    { id: 'running', title: 'Reproducibility (Running the code)', knowl: 'running' },
    { id: 'correctness', title: 'Correctness and Reliability', knowl: 'correctness' },
    { id: 'readability', title: 'Readability', knowl: 'readability' },
    { id: 'ai', title: 'Use of AI', knowl: 'ai' },
    { id: 'comments', title: 'Comments', knowl: 'comments' }
  ];

  var HINTS = {
    paper: 'Which paper are you reviewing, and when?',
    files: 'Tick every kind of file that came with the paper.',
    env: 'The system and software <i>you</i> used, with version numbers.',
    sources: 'Which version of the code did you review, and where did you get it?',
    role: 'What does the code add to the paper? Pick what applies and describe it in a sentence or two.',
    install: 'License, hosting, Readme and how hard the installation was.',
    steps: 'Everything you did to install the code, so the authors can retrace it.',
    setup: 'Did the authors record the setup they used for their computations?',
    running: 'Did the code run? Quote any errors exactly.',
    correctness: 'Do the results match what the paper claims?',
    readability: 'Could someone study this code to debug or improve it?',
    ai: '<i>Optional.</i> Was the use of AI disclosed and handled responsibly? And did you use AI yourself?',
    comments: 'Anything else you want to tell the authors.'
  };

  /* ------------------------------------------------------------------ *
   *  State                                                              *
   * ------------------------------------------------------------------ */

  function uid() { return Math.random().toString(36).slice(2, 10); }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function rowsFrom(list) {
    return list.map(function (d) {
      return { id: uid(), label: d.label, knowl: d.knowl || null, ph: d.ph || null, kind: d.kind || null, choices: [], rating: '', text: '' };
    });
  }

  function readSavedSetup() {
    try {
      var s = JSON.parse(localStorage.getItem(SETUP_KEY) || 'null');
      if (s && typeof s === 'object') return s;
    } catch (e) { /* ignore */ }
    return null;
  }

  function defaultState() {
    var files = {};
    FILE_TYPES.forEach(function (f) { files[f[0]] = false; });
    var saved = readSavedSetup();
    return {
      format: FORMAT, version: 1,
      meta: { title: '', authors: '', date: todayISO() },
      files: files,
      extraFiles: [],
      env: {
        languages: saved ? saved.languages || '' : '',
        software: saved ? saved.software || '' : '',
        specs: saved ? saved.specs || '' : '',
        remember: true
      },
      sources: [{ id: uid(), label: '', version: '', url: '' }],
      role: { roles: [], text: '' },
      install: rowsFrom(ROWS.install.defaults),
      steps: [{ id: uid(), label: 'Code', text: '' }],
      setup: rowsFrom(ROWS.setup.defaults),
      running: rowsFrom(ROWS.running.defaults),
      correctness: rowsFrom(ROWS.correctness.defaults),
      readability: rowsFrom(ROWS.readability.defaults),
      ai: rowsFrom(ROWS.ai.defaults),
      aiSkip: false,
      comments: ''
    };
  }

  function str(v) { return v == null ? '' : String(v); }

  function normalize(d) {
    if (!d || typeof d !== 'object') throw new Error('This file does not contain a review.');
    var out = defaultState();
    var m = d.meta || {};
    out.meta = { title: str(m.title), authors: str(m.authors), date: str(m.date) || todayISO() };
    var f = d.files || {};
    FILE_TYPES.forEach(function (t) { out.files[t[0]] = !!f[t[0]]; });
    if (Array.isArray(d.extraFiles)) {
      out.extraFiles = d.extraFiles.map(function (x) { return { id: str(x.id) || uid(), label: str(x.label), checked: !!x.checked }; });
    }
    if (d.env && typeof d.env === 'object') {
      out.env = { languages: str(d.env.languages), software: str(d.env.software), specs: str(d.env.specs),
                  remember: d.env.remember !== false };
    }
    if (Array.isArray(d.sources) && d.sources.length) {
      out.sources = d.sources.map(function (x) { return { id: str(x.id) || uid(), label: str(x.label), version: str(x.version), url: str(x.url) }; });
    }
    if (d.role) {
      out.role = { roles: Array.isArray(d.role.roles) ? d.role.roles.filter(function (r) { return ROLES.some(function (R) { return R.id === r; }); }) : [],
                   text: str(d.role.text) };
    }
    Object.keys(ROWS).forEach(function (k) {
      if (Array.isArray(d[k])) {
        out[k] = d[k].map(function (x) {
          return { id: str(x.id) || uid(), label: str(x.label), knowl: (x.knowl && KNOWLS[x.knowl]) ? x.knowl : null,
                   ph: x.ph ? str(x.ph) : null, rating: (x.rating === 'plus' || x.rating === 'minus') ? x.rating : '', text: str(x.text),
                   kind: CHOICES[x.kind] ? x.kind : null,
                   choices: (CHOICES[x.kind] && Array.isArray(x.choices)) ? x.choices.filter(function (c) { return CHOICES[x.kind].options.some(function (o) { return o[0] === c; }); }) : [] };
        });
      }
    });
    if (Array.isArray(d.steps)) {
      out.steps = d.steps.map(function (x) { return { id: str(x.id) || uid(), label: str(x.label), text: str(x.text) }; });
    }
    out.aiSkip = !!d.aiSkip;
    out.comments = str(d.comments);
    return out;
  }

  function exampleState() {
    var s = defaultState();
    s.meta = { title: 'Algorithm to compute the number of carrots needed to complete a proof',
               authors: 'Jeroen Hanselman and Mardi the Math bunny', date: todayISO() };
    s.files.source = true; s.files.examples = true; s.files.documentation = true;
    s.env = { languages: 'N/A', software: 'Magma V2.27-8',
              specs: 'Ubuntu 22.04.1 with Intel i7-7700 processor, 4 cores @ 3.60GHz, 32GB RAM', remember: false };
    s.sources = [{ id: uid(), label: '', version: 'No version numbering. Files reviewed were last changed on the 11th of March 2024',
                   url: 'https://github.com/fakegithub/MathBunnyMadness' }];
    s.role = { roles: ['new'], text: 'The repository contains the implementation of the algorithms and the results of the computations described in the paper.' };
    var set = function (rows, vals) { rows.forEach(function (r, i) { if (vals[i]) { r.rating = vals[i][0]; r.text = vals[i][1]; } }); };
    set(s.install, [['minus', 'No license found'], ['plus', 'The files were uploaded to GitHub'],
                    ['plus', 'The repository contains a Readme explaining the contents of the Github.'], ['plus', 'Straightforward.']]);
    s.steps = [{ id: uid(), label: 'Code', text: 'Cloned `https://github.com/MaRDItheMathbunny/MaRDICode` from GitHub' }];
    set(s.setup, [['minus', 'Did not find what CPU was used.'], ['minus', 'Did not find the amount of memory used.'],
                  ['minus', 'Did not find which Magma version was used.'],
                  ['plus', 'Magma is cited. The other packages the software builds on or depends on are properly cited.']]);
    set(s.running, [['plus', 'The code seems to run fine. It does give a small error however:\n```\nIn file "Carrot.m", line 587, column 9:\n>> bunny := [ 0, 0, 0];\n```']]);
    s.correctness[0].choices = ['proven'];
    s.correctness[1].choices = ['examples'];
    set(s.correctness, [['minus', 'The paper claims the results are unconditional, but `CarrotCount` uses a probabilistic method by default. Could the authors clarify?'],
                        ['', 'Reran the examples in Section 3. According to the authors, the full computation in Section 5 takes several weeks.'],
                        ['minus', 'I find it a bit hard to check whether the code produces the same results as what the authors got. There are a lot of files in the Github and it was unclear to me what files I should look at.']]);
    set(s.readability, [['plus', 'The code is clearly annotated.'], ['plus', 'Consistent.'], ['plus', 'Consistent, meaningful and distinctive.']]);
    set(s.ai, [['plus', 'The paper states that no AI tools were used.'], ['', 'Not applicable.'],
               ['', 'I used an AI assistant to help interpret the error message in Carrot.m; the problem was reproduced by hand.']]);
    s.comments = 'None.';
    return s;
  }

  var state = (function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return defaultState();
  })();

  var storageOK = true;
  var saveTimer = null;

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        if (state.env.remember) {
          localStorage.setItem(SETUP_KEY, JSON.stringify({ languages: state.env.languages, software: state.env.software, specs: state.env.specs }));
        }
        storageOK = true;
        setStatus('Saved in this browser');
      } catch (e) {
        storageOK = false;
        setStatus('Not autosaved: use File → Save', true);
      }
    }, 400);
  }

  function setStatus(msg, warn) {
    var el = document.getElementById('save-status');
    el.textContent = msg;
    el.classList.toggle('warn', !!warn);
  }

  function isEmptyReview(s) {
    var json = JSON.stringify([s.meta.title, s.meta.authors, s.role.text, s.comments,
      s.sources.map(function (x) { return x.version + x.url; }),
      Object.keys(ROWS).map(function (k) { return s[k].map(function (r) { return r.text + r.rating + (r.choices || []).join(''); }); }),
      s.steps.map(function (x) { return x.text; })]);
    return !/[^\[\]",]/.test(json);
  }

  /* ------------------------------------------------------------------ *
   *  Rich text: a tiny markup that maps to both HTML and LaTeX          *
   *    `code`, ``` blocks ```, $math$, URLs, blank line = paragraph     *
   * ------------------------------------------------------------------ */

  function parseBlocks(src) {
    var lines = str(src).replace(/\r\n?/g, '\n').split('\n');
    var blocks = [], para = [], code = null;
    function flush() { if (para.length) { blocks.push({ type: 'para', text: para.join('\n') }); para = []; } }
    lines.forEach(function (line) {
      if (/^\s*```/.test(line)) {
        if (code === null) { flush(); code = []; }
        else { blocks.push({ type: 'code', text: code.join('\n') }); code = null; }
        return;
      }
      if (code !== null) { code.push(line); return; }
      if (line.trim() === '') { flush(); return; }
      para.push(line);
    });
    if (code !== null) blocks.push({ type: 'code', text: code.join('\n') });
    flush();
    return blocks;
  }

  function parseInline(s) {
    var out = [], re = /`([^`\n]+)`|\$([^$\n]+)\$|(https?:\/\/[^\s<>"`]+)/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
      if (m[1] !== undefined) out.push({ t: 'code', v: m[1] });
      else if (m[2] !== undefined) out.push({ t: 'math', v: m[2] });
      else {
        var url = m[3], trail = '';
        while (/[.,;:!?'")\]]$/.test(url)) {
          var ch = url.slice(-1);
          if (ch === ')' && (url.split('(').length - 1) >= (url.split(')').length - 1)) break;
          trail = ch + trail; url = url.slice(0, -1);
        }
        out.push({ t: 'url', v: url });
        if (trail) out.push({ t: 'text', v: trail });
      }
      last = re.lastIndex;
    }
    if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
    return out;
  }

  function esc(s) {
    return str(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function htmlInline(s) {
    return parseInline(str(s)).map(function (tok) {
      switch (tok.t) {
        case 'code': return '<code>' + esc(tok.v) + '</code>';
        case 'math': return '<span class="math">\\(' + esc(tok.v) + '\\)</span>';
        case 'url': return '<a href="' + esc(tok.v) + '">' + esc(tok.v) + '</a>';
        default: return esc(tok.v).replace(/\n/g, '<br>');
      }
    }).join('');
  }

  function htmlRich(s) {
    return parseBlocks(s).map(function (b) {
      return b.type === 'code' ? '<pre>' + esc(b.text) + '</pre>' : '<p>' + htmlInline(b.text) + '</p>';
    }).join('');
  }

  var TEX_MAP = {
    '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&', '#': '\\#', '%': '\\%',
    '_': '\\_', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}', '<': '\\textless{}', '>': '\\textgreater{}',
    '|': '\\textbar{}', '…': '\\ldots{}', '→': '$\\rightarrow$', '←': '$\\leftarrow$', '≤': '$\\leq$', '≥': '$\\geq$',
    '×': '$\\times$', '≠': '$\\neq$', '\u00a0': '~'
  };

  function texEscape(s) {
    return str(s).replace(/[\\{}$&#%_^~<>|…→←≤≥×≠\u00a0]/g, function (c) { return TEX_MAP[c]; });
  }

  function texVerb(s) {
    var delims = '|!+@=;:/'.split('');
    for (var i = 0; i < delims.length; i++) if (s.indexOf(delims[i]) < 0) return '\\verb' + delims[i] + s + delims[i];
    return '\\texttt{' + texEscape(s) + '}';
  }

  function texUrl(u) { return '\\url{' + u.replace(/([%#{}\\])/g, '\\$1') + '}'; }

  // safe = true: usable inside macro arguments (no \verb)
  function texInline(s, safe) {
    return parseInline(str(s)).map(function (tok) {
      switch (tok.t) {
        case 'code': return safe ? '\\texttt{' + texEscape(tok.v) + '}' : texVerb(tok.v);
        case 'math': return '$' + tok.v + '$';
        case 'url': return texUrl(tok.v);
        default: return texEscape(tok.v).replace(/\n/g, safe ? ' ' : '\\newline\n');
      }
    }).join('');
  }

  function texRich(s) {
    return parseBlocks(s).map(function (b) {
      return b.type === 'code' ? '\\begin{verbatim}\n' + b.text + '\n\\end{verbatim}' : texInline(b.text);
    }).join('\n\\par\n');
  }

  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(iso));
    if (!m) return str(iso);
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
  }

  /* ------------------------------------------------------------------ *
   *  Editor rendering                                                   *
   * ------------------------------------------------------------------ */

  var PLUS_SVG = '<svg class="mk" viewBox="0 0 10 10" aria-hidden="true"><path d="M0 5h10M5 0v10" stroke="#045BA7" stroke-width="2.6"/></svg>';
  var MINUS_SVG = '<svg class="mk" viewBox="0 0 10 10" aria-hidden="true"><path d="M0 5h10" stroke="#D06631" stroke-width="2.6"/></svg>';

  function knowlBtn(key, label, cls) {
    return '<button type="button" class="knowl' + (cls ? ' ' + cls : '') + '" data-knowl="' + esc(key) + '" aria-expanded="false">' + esc(label) + '</button>';
  }

  function textField(o) {
    var id = 'f-' + o.bind.replace(/\./g, '-');
    var label = o.knowl ? knowlBtn(o.knowl, o.label) : '<label for="' + id + '">' + esc(o.label) + '</label>';
    var input = o.multiline
      ? '<textarea id="' + id + '" data-bind="' + o.bind + '" rows="' + (o.rows || 1) + '" placeholder="' + esc(o.ph || '') + '" aria-label="' + esc(o.label) + '">' + esc(o.value) + '</textarea>'
      : '<input id="' + id + '" type="' + (o.type || 'text') + '" data-bind="' + o.bind + '" value="' + esc(o.value) + '" placeholder="' + esc(o.ph || '') + '" aria-label="' + esc(o.label) + '">';
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><div class="field-head" data-kanchor>' + label +
      (o.note ? '<span class="field-note">' + o.note + '</span>' : '') + '</div>' + input + '</div>';
  }

  function partShell(part, index, inner) {
    return '<section class="part card" id="part-' + part.id + '" data-part="' + part.id + '" aria-labelledby="h-' + part.id + '">' +
      '<header class="part-head" data-kanchor>' +
        '<span class="part-num">Part ' + (index + 1) + ' of ' + PARTS.length + '</span>' +
        '<h2 id="h-' + part.id + '">' + esc(part.title) + '</h2>' +
        '<p class="part-hint">' + HINTS[part.id] + ' ' + knowlBtn(part.knowl, 'Guidance', 'knowl-pill') + '</p>' +
      '</header>' +
      '<div class="part-body">' + inner + '</div></section>';
  }

  function rateButtons(sec, r) {
    return '<div class="rating" role="group" aria-label="Assessment">' +
      '<button type="button" class="rate rate-plus" data-act="rate" data-sec="' + sec + '" data-id="' + r.id + '" data-rate="plus" aria-pressed="' + (r.rating === 'plus') + '" title="Positive aspect">' + PLUS_SVG + '<span>Good</span></button>' +
      '<button type="button" class="rate rate-minus" data-act="rate" data-sec="' + sec + '" data-id="' + r.id + '" data-rate="minus" aria-pressed="' + (r.rating === 'minus') + '" title="Could be improved">' + MINUS_SVG + '<span>Needs work</span></button>' +
      '</div>';
  }

  function removeBtn(list, id, what) {
    return '<button type="button" class="icon-btn" data-act="remove" data-list="' + list + '" data-id="' + id + '" aria-label="Remove ' + esc(what) + '" title="Remove">' +
      '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>';
  }

  function placeholderFor(sec, r) {
    var cfg = ROWS[sec];
    return PLACEHOLDERS[r.label] || (r.knowl && PLACEHOLDERS[r.knowl]) || (r.ph && PLACEHOLDERS[r.ph]) || (cfg.ph && PLACEHOLDERS[cfg.ph]) || 'Your assessment';
  }

  function renderChoices(sec, r) {
    var c = r.kind && CHOICES[r.kind];
    if (!c) return '';
    return '<div class="choice-row"><span class="choice-label">' + esc(c.label) + (c.multi ? ' <span class="field-note">(all that apply)</span>' : '') + '</span>' +
      '<div class="chips chips-sm" role="group" aria-label="' + esc(c.label) + '">' +
      c.options.map(function (o) {
        var on = r.choices.indexOf(o[0]) >= 0;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="choice" data-sec="' + sec + '" data-id="' + r.id + '" data-choice="' + o[0] + '" aria-pressed="' + on + '">' + esc(o[1]) + '</button>';
      }).join('') + '</div></div>';
  }

  function renderRow(sec, r) {
    var cfg = ROWS[sec];
    var name = r.label || 'item';
    var label = r.knowl
      ? '<div class="crit-label">' + knowlBtn(r.knowl, r.label) + '</div>'
      : '<div class="crit-label"><input type="text" class="crit-label-input" data-bind="' + sec + '.' + r.id + '.label" value="' + esc(r.label) + '" placeholder="' + esc(cfg.labelPh) + '" aria-label="Name of this item"></div>';
    return '<div class="crit" data-row="' + r.id + '">' +
      '<div class="crit-top" data-kanchor>' + label + rateButtons(sec, r) + removeBtn(sec, r.id, name) + '</div>' +
      renderChoices(sec, r) +
      '<textarea data-bind="' + sec + '.' + r.id + '.text" rows="2" placeholder="' + esc(placeholderFor(sec, r)) + '" aria-label="' + esc(name) + '">' + esc(r.text) + '</textarea>' +
      '</div>';
  }

  function renderRowsPart(sec) {
    var cfg = ROWS[sec];
    var rows = state[sec];
    var present = {};
    rows.forEach(function (r) { present[r.label] = true; });
    var seen = {};
    var sugg = cfg.defaults.concat(cfg.suggestions).filter(function (s) {
      if (!s.knowl || present[s.label] || seen[s.label]) return false;
      seen[s.label] = true; return true;
    });
    var add = '<div class="addbar"><span class="addbar-label">Add</span>' +
      sugg.map(function (s) {
        return '<button type="button" class="chip-add" data-act="add-row" data-sec="' + sec + '" data-label="' + esc(s.label) + '" data-knowl="' + esc(s.knowl) + '">+ ' + esc(s.label) + '</button>';
      }).join('') +
      '<button type="button" class="chip-add chip-custom" data-act="add-row" data-sec="' + sec + '">+ ' + esc(cfg.addLabel) + '</button></div>';
    var list = rows.length ? rows.map(function (r) { return renderRow(sec, r); }).join('') : '<p class="empty-note">No items. This part will be left out.</p>';
    return '<div class="crit-list">' + list + '</div>' + add;
  }

  function renderPart(part, i) {
    var s = state, inner = '';
    switch (part.id) {
      case 'paper':
        inner = '<div class="grid-2">' +
          textField({ label: 'Title of the paper', bind: 'meta.title', value: s.meta.title, ph: 'Title as it appears on the paper', cls: 'span-2' }) +
          textField({ label: 'Author(s)', bind: 'meta.authors', value: s.meta.authors, ph: 'e.g. Ada Lovelace and Charles Babbage' }) +
          textField({ label: 'Date of the review', bind: 'meta.date', value: s.meta.date, type: 'date' }) +
          '</div>';
        break;

      case 'files':
        inner = '<div class="checks">' + FILE_TYPES.map(function (f) {
          return '<label class="check"><input type="checkbox" data-bind="files.' + f[0] + '"' + (s.files[f[0]] ? ' checked' : '') + '><span class="check-box" aria-hidden="true"></span><span>' + esc(f[1]) + '</span></label>';
        }).join('') + '</div>' +
          (s.extraFiles.length ? '<div class="extras">' + s.extraFiles.map(function (x) {
            return '<div class="extra"><label class="check check-inline"><input type="checkbox" data-bind="extraFiles.' + x.id + '.checked"' + (x.checked ? ' checked' : '') + ' aria-label="Included"><span class="check-box" aria-hidden="true"></span></label>' +
              '<input type="text" data-bind="extraFiles.' + x.id + '.label" value="' + esc(x.label) + '" placeholder="e.g. Test files" aria-label="Type of file">' + removeBtn('extraFiles', x.id, 'file type') + '</div>';
          }).join('') + '</div>' : '') +
          '<div class="addbar"><button type="button" class="chip-add chip-custom" data-act="add-extra">+ Another file type</button></div>';
        break;

      case 'env':
        inner = textField({ label: 'Programming languages', bind: 'env.languages', value: s.env.languages, multiline: true, ph: 'e.g. Python 3.13.1, Julia v1.11.4  —  or N/A' }) +
          textField({ label: 'Standard software used', bind: 'env.software', value: s.env.software, multiline: true, ph: 'e.g. Magma V2.27-8, SageMath v10.5, Oscar v1.3.1' }) +
          textField({ label: 'System specs used for review', bind: 'env.specs', value: s.env.specs, multiline: true, ph: 'Operating system, processor and RAM, e.g. Ubuntu 22.04.1 with Intel i7-7700 processor, 4 cores @ 3.60GHz, 32GB RAM' }) +
          '<label class="check check-small"><input type="checkbox" data-bind="env.remember"' + (s.env.remember ? ' checked' : '') + '><span class="check-box" aria-hidden="true"></span><span>Remember my setup in this browser for my next review</span></label>';
        break;

      case 'sources':
        inner = s.sources.map(function (x, k) {
          var many = s.sources.length > 1;
          return '<div class="source' + (many ? ' source-many' : '') + '">' +
            (many ? '<div class="source-head"><input type="text" class="crit-label-input" data-bind="sources.' + x.id + '.label" value="' + esc(x.label) + '" placeholder="Label, e.g. Sage" aria-label="Label for this piece of software">' + removeBtn('sources', x.id, 'this piece of software') + '</div>' : '') +
            '<div class="grid-2">' +
            textField({ label: 'Version reviewed', bind: 'sources.' + x.id + '.version', value: x.version, multiline: true, ph: 'e.g. v0.1.3  —  or: No version numbering. Files reviewed were last changed on 11 March 2024' }) +
            textField({ label: 'Downloaded from', bind: 'sources.' + x.id + '.url', value: x.url, ph: 'https://github.com/…', type: 'url' }) +
            '</div></div>';
        }).join('') +
          '<div class="addbar"><button type="button" class="chip-add chip-custom" data-act="add-source">+ Another piece of software</button>' +
          '<span class="addbar-note">e.g. when there is both a Magma and a Sage implementation</span></div>';
        break;

      case 'role':
        inner = '<div class="field"><div class="field-head" data-kanchor><span class="field-label-text">What role does the code play?</span><span class="field-note">Select all that apply</span></div>' +
          '<div class="chips">' + ROLES.map(function (r) {
            var on = s.role.roles.indexOf(r.id) >= 0;
            return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="role" data-role="' + r.id + '" aria-pressed="' + on + '" title="' + esc(r.text) + '">' + esc(r.label) + '</button>';
          }).join('') + '</div>' +
          s.role.roles.map(function (id) {
            var r = ROLES.filter(function (R) { return R.id === id; })[0];
            return '<p class="focus-note"><b>' + esc(r.label) + ':</b> ' + esc(r.focus) + '</p>';
          }).join('') + '</div>' +
          textField({ label: 'Describe the role of the code', bind: 'role.text', value: s.role.text, multiline: true, rows: 3,
                      ph: 'e.g. The repository contains the implementation of the algorithms and the results of the computations described in the paper.' });
        break;

      case 'steps':
        inner = s.steps.map(function (g) {
          return '<div class="crit steps-group">' +
            '<div class="crit-top"><div class="crit-label"><input type="text" class="crit-label-input" data-bind="steps.' + g.id + '.label" value="' + esc(g.label) + '" placeholder="e.g. Magma code" aria-label="Which software these steps are for"></div>' +
            removeBtn('steps', g.id, 'these steps') + '</div>' +
            '<textarea data-bind="steps.' + g.id + '.text" rows="3" placeholder="' + esc('One step per line, e.g.\nCloned `https://github.com/…` from GitHub\nInstalled the dependencies listed in the Readme') + '" aria-label="Steps, one per line">' + esc(g.text) + '</textarea>' +
            '<p class="hint">One step per line.</p></div>';
        }).join('') +
          '<div class="addbar"><button type="button" class="chip-add chip-custom" data-act="add-steps">+ Steps for another piece of software</button></div>';
        break;

      case 'comments':
        inner = textField({ label: 'Comments for the authors', bind: 'comments', value: s.comments, multiline: true, rows: 4, ph: 'e.g. None.' });
        break;

      case 'ai':
        inner = '<label class="check check-small skip-toggle"><input type="checkbox" data-bind="aiSkip"' + (s.aiSkip ? ' checked' : '') + '><span class="check-box" aria-hidden="true"></span><span>Leave this part out of the review</span></label>' +
          '<div class="skippable">' + renderRowsPart('ai') + '</div>';
        break;

      default:
        inner = renderRowsPart(part.id);
    }
    return partShell(part, i, inner);
  }

  function partStatus(id) {
    var s = state, filled = function (v) { return str(v).trim() !== ''; };
    var score = function (arr) {
      if (!arr.length) return 'empty';
      var n = arr.filter(Boolean).length;
      return n === 0 ? 'empty' : n === arr.length ? 'done' : 'partial';
    };
    switch (id) {
      case 'paper': return score([filled(s.meta.title), filled(s.meta.authors)]);
      case 'files': return FILE_TYPES.some(function (f) { return s.files[f[0]]; }) || s.extraFiles.some(function (x) { return x.checked; }) ? 'done' : 'empty';
      case 'env': return score([filled(s.env.languages), filled(s.env.software), filled(s.env.specs)]);
      case 'sources': return score([].concat.apply([], s.sources.map(function (x) { return [filled(x.version), filled(x.url)]; })));
      case 'role': return score([s.role.roles.length > 0 || filled(s.role.text), filled(s.role.text)]);
      case 'steps': return s.steps.some(function (g) { return filled(g.text); }) ? 'done' : 'empty';
      case 'comments': return filled(s.comments) ? 'done' : 'empty';
      case 'ai': if (s.aiSkip) return 'done'; /* falls through */
      default: return score(s[id].map(function (r) { return filled(r.text) || (r.choices && r.choices.length > 0); }));
    }
  }

  function renderToc() {
    var toc = document.getElementById('toc');
    toc.innerHTML = PARTS.map(function (p, i) {
      var st = partStatus(p.id);
      var label = { empty: 'not started', partial: 'partly filled in', done: 'filled in' }[st];
      return '<li><a href="#part-' + p.id + '" data-part-link="' + p.id + '"><span class="dot dot-' + st + '" title="' + label + '"><span class="sr-only">' + label + '</span></span>' +
        '<span class="toc-num">' + (i + 1) + '</span><span class="toc-title">' + esc(p.title) + '</span></a></li>';
    }).join('');
    highlightToc();
  }

  function updateTocStatus() {
    PARTS.forEach(function (p) {
      var dot = document.querySelector('[data-part-link="' + p.id + '"] .dot');
      if (dot) {
        var st = partStatus(p.id);
        dot.className = 'dot dot-' + st;
      }
    });
  }

  var form = document.getElementById('review-form');

  function focusKey(el) {
    if (!el || !form.contains(el)) return null;
    if (el.dataset.bind) return '[data-bind="' + el.dataset.bind + '"]';
    if (el.dataset.act) {
      var sel = '[data-act="' + el.dataset.act + '"]';
      ['sec', 'id', 'rate', 'role'].forEach(function (k) { if (el.dataset[k]) sel += '[data-' + k + '="' + el.dataset[k] + '"]'; });
      return sel;
    }
    return null;
  }

  function renderForm(focusSelector) {
    var keep = focusSelector || focusKey(document.activeElement);
    form.innerHTML = PARTS.map(renderPart).join('');
    form.querySelectorAll('textarea').forEach(autosize);
    renderToc();
    if (keep) {
      var el = form.querySelector(keep);
      if (el) el.focus({ preventScroll: true });
    }
    observeParts();
  }

  function autosize(t) {
    t.style.height = 'auto';
    t.style.height = (t.scrollHeight + 2) + 'px';
  }

  /* ------------------------------------------------------------------ *
   *  Editing                                                            *
   * ------------------------------------------------------------------ */

  function resolve(path) {
    var parts = path.split('.'), obj = state;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      obj = Array.isArray(obj) ? obj.filter(function (x) { return x.id === k; })[0] : obj[k];
      if (!obj) return null;
    }
    return { obj: obj, key: parts[parts.length - 1] };
  }

  form.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.dataset.bind) return;
    var r = resolve(el.dataset.bind);
    if (!r) return;
    r.obj[r.key] = el.type === 'checkbox' ? el.checked : el.value;
    if (el.tagName === 'TEXTAREA') autosize(el);
    updateTocStatus();
    persist();
  });
  // checkbox 'input' events already fire in modern browsers; this is a fallback for older ones
  form.addEventListener('change', function (e) {
    var el = e.target;
    if (el.type !== 'checkbox' || !el.dataset.bind) return;
    var r = resolve(el.dataset.bind);
    if (r) { r.obj[r.key] = el.checked; updateTocStatus(); persist(); }
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  form.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn || !form.contains(btn)) return;
    var act = btn.dataset.act, focus = null;

    if (act === 'rate') {
      var row = state[btn.dataset.sec].filter(function (r) { return r.id === btn.dataset.id; })[0];
      if (!row) return;
      row.rating = row.rating === btn.dataset.rate ? '' : btn.dataset.rate;
      btn.parentNode.querySelectorAll('.rate').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.rate === row.rating)); });
      persist();
      return;
    }
    if (act === 'choice') {
      var crow = state[btn.dataset.sec].filter(function (r) { return r.id === btn.dataset.id; })[0];
      if (!crow) return;
      var cdef = CHOICES[crow.kind], val = btn.dataset.choice, ci = crow.choices.indexOf(val);
      if (cdef.multi) {
        if (ci >= 0) crow.choices.splice(ci, 1); else crow.choices.push(val);
        crow.choices.sort(function (a, b) { return cdef.options.findIndex(function (o) { return o[0] === a; }) - cdef.options.findIndex(function (o) { return o[0] === b; }); });
      } else {
        crow.choices = ci >= 0 ? [] : [val];
      }
      btn.parentNode.querySelectorAll('.chip').forEach(function (b) {
        var on = crow.choices.indexOf(b.dataset.choice) >= 0;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
      });
      updateTocStatus();
      persist();
      return;
    }
    if (act === 'role') {
      var roles = state.role.roles, id = btn.dataset.role, idx = roles.indexOf(id);
      if (idx >= 0) roles.splice(idx, 1); else roles.push(id);
      roles.sort(function (a, b) { return ROLES.findIndex(function (R) { return R.id === a; }) - ROLES.findIndex(function (R) { return R.id === b; }); });
    } else if (act === 'remove') {
      var list = state[btn.dataset.list];
      var item = list.filter(function (x) { return x.id === btn.dataset.id; })[0];
      var hasContent = item && (str(item.text).trim() || str(item.version).trim() || str(item.url).trim() || (item.choices && item.choices.length));
      if (hasContent && !window.confirm('Remove this item and the text you wrote in it?')) return;
      state[btn.dataset.list] = list.filter(function (x) { return x.id !== btn.dataset.id; });
      if (btn.dataset.list === 'sources' && !state.sources.length) state.sources.push({ id: uid(), label: '', version: '', url: '' });
      focus = 'none';
    } else if (act === 'add-row') {
      var sec = btn.dataset.sec, nid = uid();
      var known = btn.dataset.knowl || null;
      var def = ROWS[sec].defaults.concat(ROWS[sec].suggestions).filter(function (d) { return d.label === btn.dataset.label; })[0];
      var newRow = { id: nid, label: btn.dataset.label || '', knowl: known, ph: null, kind: def && def.kind ? def.kind : null, choices: [], rating: '', text: '' };
      // keep default order: re-insert removed defaults at their original position
      var order = ROWS[sec].defaults.map(function (d) { return d.label; });
      var pos = def ? order.indexOf(def.label) : -1;
      if (pos >= 0) {
        var rows = state[sec], at = rows.length;
        for (var j = 0; j < rows.length; j++) { var o = order.indexOf(rows[j].label); if (o < 0 || o > pos) { at = j; break; } }
        rows.splice(at, 0, newRow);
      } else {
        state[sec].push(newRow);
      }
      focus = known ? '[data-bind="' + sec + '.' + nid + '.text"]' : '[data-bind="' + sec + '.' + nid + '.label"]';
    } else if (act === 'add-extra') {
      var eid = uid();
      state.extraFiles.push({ id: eid, label: '', checked: true });
      focus = '[data-bind="extraFiles.' + eid + '.label"]';
    } else if (act === 'add-source') {
      if (state.sources.length === 1 && !state.sources[0].label) state.sources[0].label = '';
      var sid = uid();
      state.sources.push({ id: sid, label: '', version: '', url: '' });
      focus = '[data-bind="sources.' + sid + '.label"]';
    } else if (act === 'add-steps') {
      var gid = uid();
      state.steps.push({ id: gid, label: '', text: '' });
      focus = '[data-bind="steps.' + gid + '.label"]';
    } else {
      return;
    }
    renderForm(focus === 'none' ? null : focus);
    persist();
  });

  /* ------------------------------------------------------------------ *
   *  Knowls                                                             *
   * ------------------------------------------------------------------ */

  var knowlCounter = 0;

  function typeset(el) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      return window.MathJax.typesetPromise([el]).catch(function () {});
    }
    return Promise.resolve();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.knowl');
    if (!btn) return;
    e.preventDefault();
    var key = btn.dataset.knowl, k = KNOWLS[key];
    if (!k) return;

    if (btn.dataset.kid) {
      var open = document.getElementById(btn.dataset.kid);
      if (open) { closeKnowl(btn, open); return; }
    }
    var anchor = btn.closest('[data-kanchor]') || btn.parentNode;
    var id = 'knowl-' + (++knowlCounter);
    var box = document.createElement('div');
    box.className = 'knowl-box';
    box.id = id;
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', k.title);
    box.innerHTML =
      '<div class="knowl-head"><h3>' + esc(k.title) + '</h3>' +
      '<button type="button" class="icon-btn knowl-close" aria-label="Close">' +
      '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>' +
      '<div class="knowl-body">' + k.body + '</div>' +
      (k.ref ? '<p class="knowl-ref">Summarised from ' + esc(k.ref) + ' of <i>Guidelines for Writing and Reviewing Mathematical Software</i>. ' +
        '<a href="' + PAPER_URL + (PAPER_PAGE_LINKS ? '#page=' + (k.page || 1) : '') + '" target="_blank" rel="noopener">Read the article</a>' +
        (k.guide != null ? ' · <a href="' + GUIDE_URL + (k.guide ? '#' + k.guide : '') + '" target="_blank" rel="noopener">More in the guide</a>' : '') + '</p>'
        : (k.guide != null ? '<p class="knowl-ref">See also <a href="' + GUIDE_URL + (k.guide ? '#' + k.guide : '') + '" target="_blank" rel="noopener">How to perform a software review</a>.</p>' : ''));
    // place the box after the anchor (but after any knowl boxes already open there)
    var after = anchor;
    while (after.nextElementSibling && after.nextElementSibling.classList.contains('knowl-box')) after = after.nextElementSibling;
    after.parentNode.insertBefore(box, after.nextSibling);
    btn.dataset.kid = id;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-controls', id);
    btn.classList.add('active');
    box.querySelector('.knowl-close').addEventListener('click', function () { closeKnowl(btn, box); btn.focus(); });
    requestAnimationFrame(function () { box.classList.add('open'); });
    typeset(box);
  });

  function closeKnowl(btn, box) {
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('active');
    delete btn.dataset.kid;
    box.remove();
  }

  /* ------------------------------------------------------------------ *
   *  Report (preview + PDF)                                             *
   * ------------------------------------------------------------------ */

  function box(on) {
    return '<svg class="r-box" viewBox="0 0 10 10" aria-hidden="true"><rect x=".6" y=".6" width="8.8" height="8.8" fill="none" stroke="currentColor" stroke-width=".9"/>' +
      (on ? '<path d="M.6 .6l8.8 8.8M9.4 .6l-8.8 8.8" stroke="currentColor" stroke-width=".9"/>' : '') + '</svg>';
  }

  var EMPTY = '<span class="r-empty">not filled in</span>';

  function rRich(text) { return str(text).trim() ? htmlRich(text) : EMPTY; }
  function rInline(text) { return str(text).trim() ? htmlInline(text) : EMPTY; }

  function includeAi() {
    return !state.aiSkip && state.ai.some(function (r) { return str(r.text).trim() || r.rating; });
  }

  function rRows(rows) {
    if (!rows.length) return '';
    return '<div class="r-rows">' + rows.map(function (r) {
      var mark = r.rating === 'plus' ? PLUS_SVG : r.rating === 'minus' ? MINUS_SVG : '';
      var choice = choiceText(r);
      var body = (choice ? '<p class="r-choice">' + esc(choice) + '</p>' : '') + (str(r.text).trim() || !choice ? rRich(r.text) : '');
      return '<div class="r-row"><div class="r-label">' + esc(r.label) + ':</div><div class="r-val' + (mark ? ' has-mark' : '') + '">' + mark + body + '</div></div>';
    }).join('') + '</div>';
  }

  function renderReport() {
    var s = state;
    var files = FILE_TYPES.map(function (f) { return { label: f[1], on: s.files[f[0]] }; })
      .concat(s.extraFiles.filter(function (x) { return str(x.label).trim(); }).map(function (x) { return { label: x.label, on: x.checked }; }));
    var fileList = function (list) { return '<ul class="r-checks">' + list.map(function (f) { return '<li>' + box(f.on) + esc(f.label) + '</li>'; }).join('') + '</ul>'; };

    var basic = [
      ['Programming languages', rInline(s.env.languages)],
      ['Standard software used', rInline(s.env.software)],
      ['System specs used for review', rInline(s.env.specs)]
    ];
    s.sources.forEach(function (x) {
      var suffix = x.label.trim() ? ' (' + esc(x.label.trim()) + ')' : '';
      basic.push(['Version reviewed' + suffix, rInline(x.version)]);
      var url = x.url.trim();
      basic.push(['Downloaded from' + suffix, url ? (/^https?:\/\//.test(url) ? '<a class="r-url" href="' + esc(url) + '">' + esc(url) + '</a>' : htmlInline(url)) : EMPTY]);
    });

    var roles = s.role.roles.map(function (id) { return ROLES.filter(function (R) { return R.id === id; })[0].text; });

    var steps = s.steps.filter(function (g) { return str(g.label).trim() || str(g.text).trim(); }).map(function (g) {
      var lines = str(g.text).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      return (g.label.trim() ? '<p class="r-steps-label"><b>' + esc(g.label.trim()) + ':</b></p>' : '') +
        (lines.length ? '<ul class="r-bullets">' + lines.map(function (l) { return '<li>' + htmlInline(l) + '</li>'; }).join('') + '</ul>' : '<p>' + EMPTY + '</p>');
    }).join('');

    var sec = function (title, body) { return body ? '<h2 class="r-sec">' + title + '</h2>' + body : ''; };

    var html =
      '<header class="r-head">' +
        '<div class="r-meta">' +
          '<p><b>Title:</b> ' + rInline(s.meta.title) + '</p>' +
          '<p><b>Author(s):</b> ' + rInline(s.meta.authors) + '</p>' +
          '<p class="r-date"><b>Date:</b> ' + esc(formatDate(s.meta.date)) + '</p>' +
        '</div>' +
        '<h1 class="r-title">Technical review</h1>' +
        '<img class="r-logo" src="mardi.png" alt="MaRDI">' +
      '</header>' +
      sec('Basic Info',
        '<div class="r-basic"><div class="r-files"><p><b>Files provided</b></p><div class="r-files-cols">' +
          fileList(files.slice(0, 4)) + fileList(files.slice(4)) + '</div></div>' +
          '<div class="r-table">' + basic.map(function (b) { return '<div class="r-label">' + b[0] + ':</div><div class="r-val">' + b[1] + '</div>'; }).join('') + '</div></div>') +
      sec('Importance of software in the paper',
        (roles.length ? '<p class="r-roles">' + roles.map(esc).join(' ') + '</p>' : '') + (str(s.role.text).trim() || !roles.length ? rRich(s.role.text) : '')) +
      sec('Reproducibility (Installation)', rRows(s.install)) +
      sec('Installation steps taken', steps) +
      sec('Reproducibility (Records of setup)', rRows(s.setup)) +
      sec('Reproducibility (Running the code)', rRows(s.running)) +
      sec('Correctness and Reliability', rRows(s.correctness)) +
      sec('Readability', rRows(s.readability)) +
      (includeAi() ? sec('Use of AI', rRows(s.ai)) : '') +
      sec('Comments', rRich(s.comments));

    var sheet = document.getElementById('sheet');
    sheet.innerHTML = html;
    return typeset(sheet);
  }

  /* ------------------------------------------------------------------ *
   *  LaTeX export                                                       *
   * ------------------------------------------------------------------ */

  var TEX_PREAMBLE = [
    '%Technical Review template made by Jeroen Hanselman for MaRDI (Mathematical Research Data Initiative)',
    '%',
    '% The template used for this technical review was adapted from the template made by Timmy Chan on https://github.com/TimmyChan ',
    '%',
    '% This file was generated by the interactive software review sheet.',
    '% Template: ' + TEMPLATE_URL,
    '',
    '\\documentclass[10pt]{article}',
    '\\usepackage[utf8]{inputenc}',
    '\\usepackage{graphicx}',
    '\\usepackage{pifont,xcolor}',
    '\\usepackage{amssymb}',
    '\\usepackage{TLCresume}',
    '\\usepackage{tikz}',
    '\\usepackage{parallel,enumitem}',
    '',
    '\\definecolor{mardiblue}{RGB}{4,91,167}',
    '\\definecolor{mardiorange}{RGB}{208,102,49}',
    '',
    '\\newcommand{\\mplus}[1][mardiblue]{',
    '  \\begingroup\\leavevmode\\color{#1}',
    '  \\setlength{\\unitlength}{0.8em}',
    '  \\linethickness{.25em}',
    '  \\begin{picture}(1,1)',
    '  \\put(0,0.5){\\line(1,0){1}}',
    '  \\put(0.5,0){\\line(0,1){1}}',
    '  \\end{picture}',
    '  \\hspace{0.2em}',
    '  \\endgroup',
    '}',
    '',
    '\\newcommand{\\mminus}[1][mardiorange]{',
    '  \\begingroup\\leavevmode\\color{#1}',
    '  \\setlength{\\unitlength}{0.8em}',
    '  \\linethickness{.25em}',
    '  \\begin{picture}(1,1)',
    '  \\put(0,0.5){\\line(1,0){1}}',
    '  \\end{picture}',
    '  \\hspace{0.2em}',
    '  \\endgroup',
    '}',
    ''
  ].join('\n');

  var HEADER_TEX = [
    '%====================',
    '% Review Header',
    '%====================',
    '',
    '\\RequirePackage{fancyhdr}',
    '\\fancypagestyle{fancy}{%',
    '\\fancyhf{}',
    '\\lhead{',
    '\\textbf{Title: }\\titleofpaper\\\\',
    '\\textbf{Author(s): }\\authors  \\\\',
    '\\textbf{} \\\\',
    '\\textbf{Date: }\\ifdefined\\reviewdate\\reviewdate\\else\\today\\fi\\\\ ',
    '\t    } ',
    '\t\\chead{%',
    '\t    \\centering {\\huge \\textbf{Technical review}} \\\\ %',
    '\t    }%',
    '\t    ',
    '\\rhead{\\IfFileExists{Mardi.png}{\\includegraphics[scale=0.7]{Mardi.png}}{}}',
    '\\renewcommand{\\headrulewidth}{2pt}% 2pt header rule',
    '\\renewcommand{\\headrule}{}',
    '}',
    '\\pagestyle{fancy}',
    '',
    '\\setlength{\\headheight}{150pt}',
    '\\setlength{\\headsep}{5pt}',
    ''
  ].join('\n');

  var TLC_STY = [
    '\\NeedsTeXFormat{LaTeX2e}',
    '\\ProvidesPackage{TLCresume}[11/19/21 resume package]',
    '% Author: Timmy Chan',
    '',
    '% Assuming using "article" document class and letter sized paper.',
    '% FONT STUFF',
    '',
    '\\RequirePackage[T1]{fontenc} %  Font encoding https://texfaq.org/FAQ-why-inp-font',
    '\\RequirePackage[sfdefault]{FiraSans}',
    '\\RequirePackage[10pt]{moresize}',
    '\\usepackage{anyfontsize}',
    '\\RequirePackage{csquotes}',
    '',
    '% MARGINS AND SPACING',
    '\\RequirePackage[margin=.5in, top=.5in]{geometry} % Set Margins',
    '\\raggedright % left align no indent',
    '\\raggedbottom % top align no indent',
    '',
    '% COLOR',
    '\\RequirePackage{xcolor}',
    '\\definecolor{highlight}{RGB}{4,91,167} ',
    '',
    '% LINKS',
    '\\RequirePackage{hyperref}',
    '\\hypersetup{colorlinks=true,urlcolor=highlight}',
    '\\RequirePackage[inline]{enumitem}',
    '\\setlength{\\tabcolsep}{0in}',
    ' ',
    ' \\def\\hrulefill{\\leavevmode\\leaders\\hrule height 1pt\\hfill\\kern\\z@}',
    ' ',
    '% SECTION FORMATTING ',
    '\\RequirePackage[nostruts]{titlesec}',
    '\\titlespacing*{\\section}{0em}{0.5em}{0em}',
    '\\titleformat{\\section}{\\color{highlight} \\scshape \\raggedright \\large}{}{0em}{}[\\vspace{-0.75em}\\hrulefill]',
    '% SUBSECTION FORMATTING',
    '\\titlespacing*{\\subsection}{0em}{0em}{0em}',
    '\\titleformat{\\subsection}{\\bfseries}{}{0em}{}[]',
    '',
    '',
    '% SUBTEXT',
    '\\newcommand{\\subtext}[1]{\\textit{#1}\\par\\vspace{-.75em}}',
    '',
    '% tighter spacing than itemize',
    '\\setlist[itemize]{align=parleft,left=0pt..1em}',
    '\\newenvironment{zitemize}{',
    '\\begin{itemize} \\itemsep 0pt \\parskip 0pt \\parsep 1pt}',
    '{\\end{itemize}\\vspace{-.5em}}',
    '',
    '% NO PAGE NUMBER',
    '\\pagenumbering{gobble}',
    '',
    '% SUBFILES IMPORTING',
    '\\RequirePackage{standalone}',
    ''
  ].join('\n');

  function texRows(rows) {
    if (!rows.length) return '';
    return '\\begin{tabular}[t]{p{15 em} p{1em} p{35em}}\n' + rows.map(function (r) {
      var mark = r.rating === 'plus' ? '\\mplus \n' : r.rating === 'minus' ? '\\mminus \n' : '';
      var choice = choiceText(r);
      var body = (choice ? '\\textit{' + texEscape(choice) + '}' + (str(r.text).trim() ? '\n\\par\n' : '') : '') + texRich(r.text);
      return '\\textbf{' + texInline(r.label, true) + ':} & & \n' + mark + body + '\\\\';
    }).join('\n\n') + '\n\\end{tabular}\n';
  }

  function buildTex() {
    var s = state, L = [];
    var oneLine = function (v) { return texInline(str(v).replace(/\s*\n\s*/g, ' '), true); };
    L.push(TEX_PREAMBLE);
    L.push('\\def\\titleofpaper{' + oneLine(s.meta.title) + '}');
    L.push('\\def\\authors{' + oneLine(s.meta.authors) + '}');
    L.push('\\def\\reviewdate{' + texEscape(formatDate(s.meta.date)) + '}');
    L.push('');
    L.push('\\input{_header}');
    L.push('\\begin{document}');
    L.push('');
    L.push('\\section{Basic Info}');

    var files = FILE_TYPES.map(function (f) { return { label: f[1], on: s.files[f[0]] }; })
      .concat(s.extraFiles.filter(function (x) { return str(x.label).trim(); }).map(function (x) { return { label: x.label, on: x.checked }; }));
    var items = function (list) {
      return list.map(function (f) { return '\\item[$' + (f.on ? '\\boxtimes' : '\\square') + '$] ' + texInline(f.label, true); }).join('\n');
    };
    L.push('\\begin{minipage}{0.30\\textwidth}');
    L.push('\\noindent\\parbox[t]{1.2in}{\\raggedright%');
    L.push('\\vspace{0.5em}');
    L.push('\\textbf{Files provided}');
    L.push('');
    L.push('\\begin{itemize}[topsep=0pt,itemsep=-2pt,leftmargin=13pt]');
    L.push(items(files.slice(0, 4)));
    L.push('\\end{itemize}');
    L.push('');
    L.push('\\vspace{0.5em}');
    L.push('}%');
    L.push('\\parbox[t]{1.2in}{\\raggedright%');
    L.push('\\vspace{1em}');
    L.push('\\begin{itemize}[topsep=6pt,itemsep=-2pt,leftmargin=13pt]');
    L.push(items(files.slice(4)));
    L.push('\\end{itemize}');
    L.push('\\vspace{0.5em}');
    L.push('}');
    L.push('\\end{minipage}%');
    L.push('\\hfill');
    L.push('%');
    L.push('\\begin{minipage}{0.6\\textwidth}');
    L.push('\\begin{tabular}[t]{p{13em} p{1em} p{17em}}');
    L.push('\\textbf{Programming languages:} & &  ' + texInline(s.env.languages) + ' \\\\');
    L.push('\\textbf{Standard software used: }& &  ' + texInline(s.env.software) + ' \\\\');
    L.push('\\textbf{System specs used for review :}& &  ' + texInline(s.env.specs) + ' \\\\');
    s.sources.forEach(function (x) {
      var suffix = x.label.trim() ? ' (' + texInline(x.label.trim(), true) + ')' : '';
      L.push('\\textbf{Version reviewed' + suffix + ':}& &  ' + texInline(x.version) + '\\\\');
      var url = x.url.trim();
      L.push('\\textbf{Downloaded from' + suffix + ': }& &   ' + (/^https?:\/\/\S+$/.test(url) ? texUrl(url) : texInline(url)) + ' \\\\');
    });
    L.push('\\end{tabular}');
    L.push('\\end{minipage}%');
    L.push('');

    L.push('\\section{Importance of software in the paper}');
    var roles = s.role.roles.map(function (id) { return ROLES.filter(function (R) { return R.id === id; })[0].text; });
    if (roles.length) L.push('\\textit{' + texEscape(roles.join(' ')) + '}' + (str(s.role.text).trim() ? '\n\\par\\smallskip\n' : ''));
    L.push(texRich(s.role.text));
    L.push('');

    var rowSec = function (title, rows) {
      if (!rows.length) return;
      L.push('\\section{' + title + '}');
      L.push(texRows(rows));
    };
    rowSec('Reproducibility (Installation)', s.install);

    L.push('\\section{Installation steps taken}');
    s.steps.filter(function (g) { return str(g.label).trim() || str(g.text).trim(); }).forEach(function (g) {
      var lines = str(g.text).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (g.label.trim()) L.push('\\textbf{' + texInline(g.label.trim(), true) + ':}');
      if (lines.length) {
        L.push('\\begin{itemize}');
        lines.forEach(function (l) { L.push('\\item ' + texInline(l)); });
        L.push('\\end{itemize}');
      } else {
        L.push('\\par No steps recorded.\\par');
      }
      L.push('');
    });

    rowSec('Reproducibility (Records of setup)', s.setup);
    rowSec('Reproducibility (Running the code)', s.running);
    rowSec('Correctness and Reliability', s.correctness);
    rowSec('Readability', s.readability);
    if (includeAi()) rowSec('Use of AI', s.ai);

    L.push('\\section{Comments}');
    L.push(texRich(s.comments));
    L.push('');
    L.push('\\end{document}');
    L.push('');
    // Embed the review data, so the .tex file can be opened in the sheet again
    L.push('% The lines below let you open this file again in the interactive review sheet.');
    var b64 = toBase64(JSON.stringify(state));
    L.push('% MARDI-REVIEW-DATA-BEGIN');
    for (var i = 0; i < b64.length; i += 76) L.push('% ' + b64.slice(i, i + 76));
    L.push('% MARDI-REVIEW-DATA-END');
    return L.join('\n') + '\n';
  }

  function toBase64(text) {
    var bytes = new TextEncoder().encode(text), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function fromBase64(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* Minimal ZIP writer (stored, no compression) */
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(buf) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0, now = new Date();
    var time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    var date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data), size = data.length;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true);
      ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + size;
    });
    var cdSize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: 'application/zip' });
  }

  function slug() {
    var t = str(state.meta.title).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
    return 'software-review' + (t ? '-' + t : '');
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function exportLatex() {
    var enc = new TextEncoder();
    var files = [
      { name: 'code-review.tex', data: enc.encode(buildTex()) },
      { name: '_header.tex', data: enc.encode(HEADER_TEX) },
      { name: 'TLCresume.sty', data: enc.encode(TLC_STY) }
    ];
    var finish = function () {
      download(makeZip(files), slug() + '-latex.zip');
      toast('LaTeX project downloaded. Upload the .zip to Overleaf (New Project → Upload Project) or compile code-review.tex with pdflatex.');
    };
    fetch('mardi.png').then(function (r) { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
      .then(function (buf) { files.push({ name: 'Mardi.png', data: new Uint8Array(buf) }); finish(); })
      .catch(finish);
  }

  /* ------------------------------------------------------------------ *
   *  Save / open / new                                                  *
   * ------------------------------------------------------------------ */

  function saveJson() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    download(blob, slug() + '.json');
    toast('Review saved. Use File → Open saved review… to continue later.');
  }

  function loadState(next, msg) {
    state = next;
    renderForm();
    setView('edit');
    window.scrollTo(0, 0);
    persist();
    if (msg) toast(msg);
  }

  var fileInput = document.getElementById('file-input');
  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (f) readReviewFile(f);
  });

  function readReviewFile(f) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result), data;
        if (/\.tex$/i.test(f.name) || /MARDI-REVIEW-DATA-BEGIN/.test(text)) {
          var m = /% MARDI-REVIEW-DATA-BEGIN\n([\s\S]*?)% MARDI-REVIEW-DATA-END/.exec(text.replace(/\r\n?/g, '\n'));
          if (!m) throw new Error('This .tex file was not made with the review sheet, so it cannot be opened here.');
          data = JSON.parse(fromBase64(m[1].replace(/^%\s?/gm, '').replace(/\s+/g, '')));
        } else {
          data = JSON.parse(text);
        }
        if (!isEmptyReview(state) && !window.confirm('Replace the review you are currently working on with "' + f.name + '"?')) return;
        loadState(normalize(data), 'Opened ' + f.name);
      } catch (e) {
        toast(e instanceof SyntaxError ? 'Could not read ' + f.name + ': it is not a saved review.' : (e.message || 'Could not open this file.'), true);
      }
    };
    reader.readAsText(f);
  }

  // drag and drop a saved review anywhere on the page
  document.addEventListener('dragover', function (e) {
    if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) { e.preventDefault(); document.body.classList.add('dropping'); }
  });
  document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) document.body.classList.remove('dropping'); });
  document.addEventListener('drop', function (e) {
    document.body.classList.remove('dropping');
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault();
    readReviewFile(e.dataTransfer.files[0]);
  });

  /* ------------------------------------------------------------------ *
   *  PDF                                                                *
   * ------------------------------------------------------------------ */

  var printTitle = null;
  function printPdf() {
    renderReport().then(function () {
      printTitle = document.title;
      document.title = slug();
      toast('In the print dialog, choose “Save as PDF” as the destination.');
      setTimeout(function () { window.print(); }, 50);
    });
  }
  window.addEventListener('beforeprint', function () { renderReport(); });
  window.addEventListener('afterprint', function () { if (printTitle) { document.title = printTitle; printTitle = null; } });

  /* ------------------------------------------------------------------ *
   *  Chrome: views, menu, toast, toc                                    *
   * ------------------------------------------------------------------ */

  function setView(v) {
    var preview = v === 'preview';
    document.getElementById('editor').hidden = preview;
    document.getElementById('preview').hidden = !preview;
    document.getElementById('tab-edit').setAttribute('aria-selected', String(!preview));
    document.getElementById('tab-preview').setAttribute('aria-selected', String(preview));
    document.body.classList.toggle('is-preview', preview);
    if (preview) { renderReport(); window.scrollTo(0, 0); }
  }

  var toastTimer;
  function toast(msg, warn) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.toggle('warn', !!warn);
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.hidden = true; }, 300); }, 5000);
  }

  var menuBtn = document.getElementById('btn-file'), menu = document.getElementById('menu-file');
  function toggleMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector('button').focus();
  }
  menuBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(menu.hidden); });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) toggleMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { toggleMenu(false); menuBtn.focus(); }
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]');
    if (a) {
      if (!menu.hidden) toggleMenu(false);
      switch (a.dataset.action) {
        case 'new':
          if (isEmptyReview(state) || window.confirm('Start a new review? The current review will be cleared from this browser. Save it to a file first if you want to keep it.')) {
            loadState(defaultState(), 'Started a new review.');
          }
          break;
        case 'open': fileInput.click(); break;
        case 'save': saveJson(); break;
        case 'example':
          if (isEmptyReview(state) || window.confirm('Replace your current review with the example?')) loadState(exampleState(), 'Loaded the example review.');
          break;
        case 'latex': exportLatex(); break;
        case 'pdf': printPdf(); break;
      }
      return;
    }
    var v = e.target.closest('[data-view]');
    if (v) { setView(v.dataset.view); return; }
    var link = e.target.closest('[data-part-link]');
    if (link) {
      e.preventDefault();
      if (document.body.classList.contains('is-preview')) setView('edit');
      var target = document.getElementById('part-' + link.dataset.partLink);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var first = target.querySelector('input:not([type=checkbox]), textarea');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 400);
    }
  });

  var activePart = null, observer = null;
  function highlightToc() {
    document.querySelectorAll('[data-part-link]').forEach(function (a) {
      a.classList.toggle('current', a.dataset.partLink === activePart);
    });
  }
  function observeParts() {
    if (!('IntersectionObserver' in window)) return;
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { activePart = en.target.dataset.part; highlightToc(); } });
    }, { rootMargin: '-30% 0px -60% 0px' });
    form.querySelectorAll('.part').forEach(function (p) { observer.observe(p); });
  }

  /* ------------------------------------------------------------------ *
   *  Boot                                                               *
   * ------------------------------------------------------------------ */

  renderForm();
  try { localStorage.setItem('mardi-software-review:test', '1'); localStorage.removeItem('mardi-software-review:test'); setStatus(isEmptyReview(state) ? '' : 'Saved in this browser'); }
  catch (e) { storageOK = false; setStatus('Not autosaved: use File → Save', true); }
  window.addEventListener('resize', function () { form.querySelectorAll('textarea').forEach(autosize); });

  // exposed for testing
  window.__review = { buildTex: buildTex, getState: function () { return state; }, renderReport: renderReport };
})();
