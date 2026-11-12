/*
 * Knowls for the interactive software review sheet.
 *
 * Each knowl summarises part of
 *   J. Hanselman, "Guidelines for Writing and Reviewing Mathematical Software"
 * Notices of the AMS (2025), https://doi.org/10.1090/noti3210.
 *
 * Fields:  title  – heading of the knowl box
 *          body   – HTML content
 *          ref    – section of the paper the summary is based on
 *          page   – page of the AMS Notices PDF that section starts on (only used for the
 *                   "read more" link when PAPER_PAGE_LINKS in review.js is true)
 */
window.REVIEW_KNOWLS = {

  start: {
    title: "How to approach a software review",
    ref: "§3 and §5", page: 3, guide: '',
    body: `
      <p>Start by reading the abstract and introduction, then skim the rest of the paper and look at the files that came with it.
      That is usually enough to fill in the first part of the review (parts 1&ndash;5).</p>
      <p>As a software reviewer your main focus is <b>reproducibility</b>, not the correctness of the mathematics:
      can an average user find the software, install it, run it and check that the results are what the authors claim?
      You should be broadly familiar with the field and with the programming languages involved, but you do not need to be an expert on the paper's topic.</p>
      <p>The review covers four categories:</p>
      <ol>
        <li>Metadata and the role of the code in the paper</li>
        <li>Reproducibility (installing and rerunning the code)</li>
        <li>Reliability and correctness</li>
        <li>Readability</li>
      </ol>
      <p>A peer review cannot guarantee that code is bug-free. The goals are to <b>increase confidence</b> that the results are correct and to make sure others can <b>follow and reproduce</b> the steps the authors took.</p>`
  },

  metadata: {
    title: "Metadata",
    ref: "§5.1", page: 7,
    body: `
      <p>The review should record:</p>
      <ul>
        <li>the title of the paper and the authors' names (if given);</li>
        <li>the date on which the review was written;</li>
        <li>an overview of the files that came with the paper;</li>
        <li>the version of the code that was reviewed and the link used to download it;</li>
        <li>a short description of the relationship between the code and the paper.</li>
      </ul>`
  },

  files: {
    title: "Files provided",
    ref: "§5.1", page: 7,
    body: `
      <p>Give an overview of everything that accompanies the paper. Tick each kind of file you found:</p>
      <ul>
        <li><b>Source code</b>: the implementation itself.</li>
        <li><b>Notebook</b>: e.g. a Jupyter notebook that walks through the code.</li>
        <li><b>Examples</b>: files that show how to use the code, ideally one clearly named file per example from the paper.</li>
        <li><b>Docker file / VM</b>: a container or virtual machine that reproduces the environment.</li>
        <li><b>Documentation</b>: explains input, output and purpose of the functions.</li>
        <li><b>Computed data</b>: results of the computations, e.g. a database.</li>
        <li><b>Files that verify computed data</b>: code that checks the results in a different (often quicker) way than recomputing them.</li>
      </ul>
      <p>Test files are worth mentioning too. Use <i>Add another file type</i> for anything else.</p>`
  },

  "reviewer-setup": {
    title: "Your own setup",
    ref: "§5.2", page: 7,
    body: `
      <p>To help the authors process your feedback, record the setup <i>you</i> used for the review:</p>
      <ul>
        <li>the operating system;</li>
        <li>the programming languages and standard software packages you used, <b>with version numbers</b>
            (e.g. Python 3.13.1, Julia v1.11.4, Magma V2.27-8, SageMath v10.5, Oscar v1.3.1);</li>
        <li>the processor and the amount of RAM.</li>
      </ul>
      <p>If the authors cannot reproduce a problem you ran into, this is the first thing they will look at. Write <i>N/A</i> if a field does not apply.</p>`
  },

  version: {
    title: "Version and download location",
    ref: "§5.1", page: 7,
    body: `
      <p>Record exactly which version of the code you reviewed and the link you downloaded it from.
      If there is no version number, give the date on which the files were last changed or the date you downloaded them.</p>
      <p>If the paper comes with several pieces of software (for instance a Magma <i>and</i> a Sage implementation in different repositories),
      add one entry per piece of software and give each a short label.</p>`
  },

  role: {
    title: "The role of the code in the paper",
    ref: "§3 and §4", page: 5,
    body: `
      <p>Code can play very different roles in a paper, much like experiments in physics or chemistry.
      What the review should focus on depends on that role:</p>
      <ul>
        <li><b>A new algorithm</b> that computes things we could not compute before: the key is demonstrating correctness. Examples and commentary in the repository help; run times matter less.</li>
        <li><b>An algorithm claimed to be better</b> than existing ones: hardware specifications, run times and benchmarking tools become crucial.</li>
        <li><b>A database of mathematical objects</b>: can you tell who computed what, with which algorithm, rigorously or heuristically, conditional on conjectures or not? Are there sanity checks? Is it easy to query?</li>
        <li><b>Code that computes examples</b>: ideally one clearly named file per example; for long computations, an estimate of the running time.</li>
        <li><b>Computations that are part of a proof</b>: the code <i>is</i> part of the proof. Look for clear cross-references between code and paper, and well-commented code.</li>
      </ul>
      <p>Describe in a few sentences what the code adds to the paper and how important it is for the results. Authors should state this clearly in the paper; note it if you could not find it.</p>`
  },

  reproducibility: {
    title: "Reproducibility: a first scan of the repository",
    ref: "§5.2", page: 7,
    body: `
      <p>A quick look at the repository already tells you a lot. A rough checklist:</p>
      <ul>
        <li>Does the repository have a license?</li>
        <li>Where is the code hosted? Is it publicly available? Is it open source? Does it have a DOI?</li>
        <li>Is there a Readme, and how good is it?</li>
      </ul>
      <p>Then try to install the code and run some of the examples or tests.</p>
      <p>Use <span class="mk mk-plus" aria-hidden="true"></span> for a positive aspect and <span class="mk mk-minus" aria-hidden="true"></span> for something that could be improved.
      The markers are optional, but they let authors see at a glance what went well.</p>`
  },

  license: {
    title: "License",
    ref: "§4.2", page: 5,
    body: `
      <p>Without a license nobody is legally allowed to reuse the code. Co-authors share ownership too, so the lack of a license can even cause problems for the authors themselves.</p>
      <p>For academic code an open-source license is usually best:</p>
      <ul>
        <li><b>GNU GPL</b>: derived work must also be open source under the same license;</li>
        <li><b>MIT / BSD</b>: derived work only needs proper attribution and may even become closed source.</li>
      </ul>
      <p>The license must be compatible with the licenses of the software the code depends on. Authors can use <a href="https://choosealicense.com/" target="_blank" rel="noopener">choosealicense.com</a> to pick one.</p>`
  },

  availability: {
    title: "Availability and hosting",
    ref: "§4.2 and §5.2", page: 6,
    body: `
      <p>The code should be publicly available in a <b>long-lasting</b> place.</p>
      <ul>
        <li>A personal or university website is a bad choice: these often disappear when people change jobs, and papers keep pointing to the old location.</li>
        <li>GitHub or GitLab are fine. Zenodo (hosted by CERN) is ideal: every upload gets a DOI, which makes the code citable.</li>
      </ul>
      <p>Note whether the code is open source and whether there is a DOI linking to it.</p>`
  },

  readme: {
    title: "Readme",
    ref: "§4.2", page: 6,
    body: `
      <p>The Readme is the <b>visiting card</b> of the repository. A good Readme</p>
      <ul>
        <li>quickly explains what the repository is for and what one can do with it;</li>
        <li>gives an overview of the files and their purpose;</li>
        <li>may contain installation instructions, basic documentation and small examples;</li>
        <li>references the accompanying paper and cites the work the software depends on.</li>
      </ul>
      <p>Comment on both whether there is a Readme and on its quality.</p>`
  },

  installation: {
    title: "Installation",
    ref: "§4.2 and §5.2", page: 6,
    body: `
      <p>Give a general impression of how difficult it was to install the software. Is it doable for the average user? Could the instructions or the process be improved?</p>
      <p>For reference: in the statistics in the paper, installation counts as <b>easy</b> if it took at most about 15 minutes.</p>
      <p>Things to look out for:</p>
      <ul>
        <li>missing or vague installation instructions;</li>
        <li>steps that could be automated with an installation script;</li>
        <li>instructions that require manually changing files, in particular editing a library written by someone else (a bad practice: will the library still work, and what happens when it is updated?).</li>
      </ul>`
  },

  steps: {
    title: "Installation steps taken",
    ref: "§5.2", page: 7,
    body: `
      <p>Write down <b>all</b> steps you took when trying to install the code, even if they seem obvious.
      If the installation fails, this is what allows the authors to reproduce the problem and fix it.</p>
      <p>If the paper comes with several pieces of software, keep a separate list for each (e.g. <i>Magma code</i> and <i>Sage code</i>).</p>
      <p>Tip: put commands between backticks, like <code>&#96;git clone …&#96;</code>, so they are typeset as code.</p>`
  },

  setup: {
    title: "Records of the authors' setup",
    ref: "§4.2 and §5.2", page: 6,
    body: `
      <p>Check what information the authors gave about the setup they used: CPU, RAM, operating system,
      and the exact versions of the programming languages and packages. For big computations: how long did they take and how much data was produced?</p>
      <p>How important this is depends on the role of the code. It is <b>essential</b> when algorithms are benchmarked or compared with other algorithms, or when computations take a long time; it matters less for a quick example.</p>`
  },

  citation: {
    title: "References and citation",
    ref: "§4.2 and §5.2", page: 6,
    body: `
      <p>Check whether the authors properly credit the work they build on: the software and the packages written by others that the code uses should be cited, both in the repository and in the paper.</p>`
  },

  running: {
    title: "Running the code",
    ref: "§5.2 and §5.3", page: 8, guide: 'safety',
    body: `
      <p>Once the software is installed, run the examples or test code from the repository or paper, and then try to reproduce the authors' work as described in the paper.</p>
      <p>Did the code run without issues? This is separate from whether the output matches the paper (that goes in the next part).</p>
      <p>If an error occurs, describe <b>exactly</b> what you did and what went wrong, and quote the error message. You may attempt a quick fix if the problem is obvious, but it is <i>not</i> the reviewer's task to debug the authors' code.</p>
      <p>Tip: paste error messages between lines containing three backticks <code>&#96;&#96;&#96;</code> so they are typeset verbatim.</p>`
  },

  correctness: {
    title: "Correctness and reliability",
    ref: "§5.3 and §4.3", page: 8,
    body: `
      <p>How convinced are you that the code does what the paper claims? The main test is to run the code yourself and compare with the results in the paper.</p>
      <p>If that is not feasible (a computation that took the authors months, say), other things can still increase confidence:</p>
      <ul>
        <li><b>smaller examples</b> showing that the code works correctly;</li>
        <li><b>test files</b> showing that parts of the code work, including edge cases or random examples;</li>
        <li><b>verification files</b> that check the results in a cheaper way than recomputing them (checking that \\(AB = I\\) instead of recomputing \\(A^{-1}\\));</li>
        <li><b>multiple implementations</b> in different systems that agree.</li>
      </ul>
      <p>Also record what kind of correctness the paper claims (<i>Status of results</i>) and how far you got in reproducing the work (<i>Level of reproduction</i>).</p>
      <p>If you check several examples or claims (e.g. <i>Lemma 5.3</i>, <i>the polynomials in Section 6</i>), add a separate item for each.</p>
      <p><b>Formal proofs.</b> If the paper comes with a formalisation in a proof assistant (Lean, Coq, Isabelle, …), check that it contains no unfinished parts (such as Lean's <code>sorry</code>),
      which axioms it depends on (<code>#print axioms</code> in Lean, <code>Print Assumptions</code> in Coq) and, most importantly, that the formal statement really says what the theorem in the paper says.</p>`,
    guide: 'correctness'
  },

  status: {
    title: "Status of the results",
    ref: null, guide: 'status',
    body: `
      <p>Results backed by computation come with different guarantees. Check what the paper claims, and whether the code actually delivers that:</p>
      <ul>
        <li><b>Proven / certified</b>: every step is rigorous, e.g. exact arithmetic or certified numerics.</li>
        <li><b>Conditional</b>: correct assuming a conjecture such as GRH.</li>
        <li><b>Heuristic</b>: e.g. probabilistic algorithms or unproven bounds. Very likely correct, but not proven.</li>
        <li><b>Numerical</b>: floating-point results. Is the precision tracked, and are exact values that were recognised numerically verified afterwards?</li>
      </ul>
      <p>Things to watch for: computer algebra systems sometimes take shortcuts by default (PARI's <code>bnfinit</code> assumes GRH unless <code>bnfcertify</code> is called; a Sage script can switch proofs off with <code>proof.all(False)</code>),
      and randomised algorithms (Las Vegas or Monte Carlo? Are random seeds recorded?).</p>
      <p>If the paper does not make the status clear, choose <i>Unclear from the paper</i> and ask the authors to clarify.</p>`
  },

  "reproduction-level": {
    title: "Level of reproduction",
    ref: null, guide: 'levels',
    body: `
      <p>How far did you get in reproducing the authors' work?</p>
      <ul>
        <li><b>Not attempted</b>: e.g. you had no license for the software, or the code could not be installed.</li>
        <li><b>Tests or small examples</b>: the test suite or toy examples ran.</li>
        <li><b>Examples from the paper</b>: you reproduced (some of) the examples in the paper.</li>
        <li><b>Full computation</b>: you reran the main computation.</li>
      </ul>
      <p>Nobody expects you to rerun a computation that took the authors months. Say where you stopped and why: this helps editors and readers interpret the rest of the review.</p>`
  },

  ai: {
    title: "Use of AI",
    ref: null, guide: 'ai-authors',
    body: `
      <p>This part is optional. AI tools are now widely used for writing code and even for finding mathematical results.
      That is not a problem in itself, but readers should know where they were used, and AI-generated output needs at least as much checking as anything else.</p>
      <p>Check whether the authors disclosed their use of AI, and whether AI-generated code or results are backed by tests or independent verification.
      Also state briefly how you used AI yourself during the review.</p>
      <p>Tick <i>Leave this part out of the review</i> if you did not look at this.</p>`
  },

  "ai-disclosure": {
    title: "Disclosure of AI use",
    ref: null, guide: 'ai-authors',
    body: `
      <p>Do the paper or the repository say where AI tools were used: for writing code, documentation or tests, or for producing results?
      Many journals and conferences now have their own policy on this; check what applies.</p>
      <p>A missing statement does not prove that AI was used. Rather than speculating, ask the authors if something is unclear.</p>`
  },

  "ai-verification": {
    title: "Verification of AI-generated code or results",
    ref: null, guide: 'ai-authors',
    body: `
      <p>Authors remain fully responsible for AI-generated code. Things to look at:</p>
      <ul>
        <li>AI-generated code often <i>looks</i> clean and well documented while being subtly wrong, so readability says less about the care that went into it.
            Give more weight to tests, verification files and independent checks.</li>
        <li>Documentation that does not match what the code does, and calls to functions that do not exist in the stated version of the software.</li>
        <li>If AI was used to produce results (e.g. to search for examples or counterexamples), the model, its version and the prompts should be recorded,
            and the results should come with something that can be checked independently of the AI, such as a certificate or a verification script.</li>
      </ul>`
  },

  "ai-reviewer": {
    title: "Your own use of AI",
    ref: null, guide: 'ai-reviewers',
    body: `
      <p>State briefly what you used AI tools for during the review, e.g. <i>"used an assistant to interpret error messages and to read the C code"</i>.
      You are responsible for everything in the review: only report problems you have confirmed yourself.</p>
      <p>Before uploading a manuscript or a private repository to an AI service, check the confidentiality rules of the journal or conference.</p>`
  },

  readability: {
    title: "Readability",
    ref: "§5.4 and §4.4", page: 8,
    body: `
      <p>Could someone who really wants to study the code, to debug or improve it, feasibly do so?
      You do <b>not</b> need to understand the code yourself; just check whether basic good coding practices are respected:</p>
      <ul>
        <li>Do functions describe what they do, and what their input and output are?</li>
        <li>Is the code properly annotated?</li>
        <li>Does the indentation look okay?</li>
        <li>Are files, functions and variables given distinctive and descriptive names?</li>
        <li>Is the repository structured sensibly?</li>
      </ul>`
  },

  annotation: {
    title: "Annotation and documentation",
    ref: "§4.2 and §5.4", page: 6,
    body: `
      <p>Every function should explain its input, its output and its purpose. Comments should help a reader understand what the code does.
      For code that is part of a proof, references from the code to sections of the paper (and vice versa) are especially valuable.</p>`
  },

  formatting: {
    title: "Indentation and formatting",
    ref: "§5.4", page: 8,
    body: `<p>Is the code consistently indented and formatted, so that its structure is easy to follow?</p>`
  },

  naming: {
    title: "Naming of variables, functions and files",
    ref: "§4.4", page: 7,
    body: `
      <p>Good names do wonders for comprehensibility. Nobody likes to see names like <code>helperfunctions3</code> or <code>mmhm</code>. Names should ideally be</p>
      <ul>
        <li>meaningful to someone who has read the paper;</li>
        <li>close to common mathematical conventions (<code>f</code> for a function, <code>v</code> for a vector, …);</li>
        <li>light on abbreviations;</li>
        <li>consistent.</li>
      </ul>`
  },

  structure: {
    title: "Repository structure",
    ref: "§4.4", page: 7,
    body: `<p>Is the repository clearly structured, and are files easy to find? This matters most for big repositories: nobody wants to spend hours figuring out which of hundreds of files they need.</p>`
  },

  doi: {
    title: "DOI",
    ref: "§4.2", page: 6,
    body: `<p>A DOI is a persistent identifier that makes the code citable just like a paper. Zenodo assigns one to every upload, and GitHub repositories can be archived on Zenodo.</p>`
  },

  documentation: {
    title: "Documentation",
    ref: "§4.2", page: 6,
    body: `<p>Users should be able to understand how to use the code: every function should explain its input, output and purpose, and there should be a few files with examples of how to use it. A Jupyter notebook works well for this.</p>`
  },

  tests: {
    title: "Test files",
    ref: "§4.3", page: 6,
    body: `<p>Test code does not have to test the intended example. It can test individual functions or submodules, do sanity checks, try edge cases or random examples. Cleverly chosen tests can make a convincing case that the code works even when the full computation takes too long to rerun. Continuous integration runs the tests automatically after every change.</p>`
  },

  verification: {
    title: "Verification files",
    ref: "§4.3", page: 7,
    body: `<p>Verifying a result is often different from, and quicker than, recomputing it: checking that \\(A\\) times the computed matrix is the identity is easier than computing \\(A^{-1}\\). Files that do such checks on the computed data increase confidence in the results.</p>`
  },

  implementations: {
    title: "Multiple implementations",
    ref: "§4.3", page: 7,
    body: `<p>Implementing the algorithms in several systems and comparing the output increases the chance that the results are correct; different systems sometimes give different answers because of bugs in the systems themselves.</p>`
  },

  benchmarks: {
    title: "Running times and benchmarks",
    ref: "§4 and §4.2", page: 5,
    body: `<p>If the paper claims an algorithm is faster than existing ones, it should provide benchmarking tools together with hardware specifications and running times. For long computations, an estimate of the expected duration helps reviewers and users.</p>`
  },

  comments: {
    title: "Comments",
    ref: "§5", page: 7, guide: 'writing',
    body: `
      <p>Anything you want to pass on to the authors that did not fit elsewhere: suggestions for improvements, things you liked, or details about how the review was done.</p>
      <p>Feedback is useful: in the reviews behind the paper, many authors improved their code after the review, from adding a license or a short Readme to adding documentation, examples and bug fixes.</p>`
  },

  formatting_help: {
    title: "Formatting your text",
    ref: null,
    body: `
      <p>You do not need to know LaTeX. All text fields understand a few simple conventions:</p>
      <table class="fmt-table">
        <tr><td><code>&#96;some code&#96;</code></td><td>inline code</td></tr>
        <tr><td><code>&#96;&#96;&#96;</code><br>error message<br><code>&#96;&#96;&#96;</code></td><td>a verbatim block (e.g. an error message)</td></tr>
        <tr><td><code>$x^2 + 1$</code></td><td>mathematics (LaTeX notation)</td></tr>
        <tr><td><code>https://…</code></td><td>links are detected automatically</td></tr>
        <tr><td>an empty line</td><td>starts a new paragraph</td></tr>
      </table>
      <p>Other characters such as <code>%</code>, <code>_</code> or <code>&amp;</code> are escaped for you in the LaTeX export.</p>`
  }
};
