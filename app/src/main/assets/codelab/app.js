/* NS Code Lab page: editor, challenge picker, results and sample data. */
(function () {
  'use strict';

  const Bridge = window.CodeLabBridge || null;
  const C = window.NSChallenges.CHALLENGES;
  const params = new URLSearchParams(location.search);
  if (params.get('dark') === '1') document.documentElement.classList.add('dark');

  const CHAPTER_NAMES = {
    0: 'JavaScript from Zero', 1: 'The NetSuite Mental Model', 2: 'Records, Fields & IDs', 3: 'Customization Without Code',
    4: 'Saved Searches & SuiteQL', 5: 'SuiteScript 2.1 Basics', 6: 'Script Types & Entry Points', 7: 'The N/ Modules',
    8: 'Governance & Data at Scale', 9: 'Workflows, Suitelets & Integrations', 10: 'SDF, Environments & Deployment',
  };

  const PLAYGROUND = {
    id: 'playground', chapter: null, title: 'Playground',
    summary: 'Free practice against the sample data.',
    brief: [
      'Write any SuiteScript here and press Run. Nothing is graded and the data resets every run.',
      'Quick scripts can use `record`, `search`, `query`, `log`, `runtime`, `format`, `email`, `file`, `https` and `task` directly.',
      'Full script files with `define()` work too. Code Lab detects the `@NScriptType` and runs it: a User Event creates a sales order, a Suitelet gets a GET request, and so on.',
      'Open **Sample data** to see the records you can load.',
    ],
    starter: "// Try things! For example:\nconst so = record.load({ type: record.Type.SALES_ORDER, id: 1001 });\nlog.debug('Customer', so.getText({ fieldId: 'entity' }));\nlog.debug('Total', so.getValue({ fieldId: 'total' }));\n\nsearch.create({\n  type: search.Type.CUSTOMER,\n  filters: [['isinactive', 'is', 'F']],\n  columns: ['companyname', 'email'],\n}).run().each((r) => {\n  log.debug(r.getValue('companyname'), r.getValue('email'));\n  return true;\n});\n",
    hints: [],
  };

  // ---------- storage ----------
  const store = {
    loadCode(id) {
      try { if (Bridge) { const v = Bridge.loadCode(id); return v === null || v === undefined || v === '' ? null : v; } } catch (e) { /* fall through */ }
      try { return localStorage.getItem('code_' + id); } catch (e) { return null; }
    },
    saveCode(id, code) {
      try { if (Bridge) { Bridge.saveCode(id, code); return; } } catch (e) { /* fall through */ }
      try { localStorage.setItem('code_' + id, code); } catch (e) { /* ignore */ }
    },
    status(id) {
      try { if (Bridge) return Bridge.getStatus(id) || ''; } catch (e) { /* fall through */ }
      try { return localStorage.getItem('status_' + id) || ''; } catch (e) { return ''; }
    },
    report(id, passed, summary) {
      try { if (Bridge) { Bridge.reportResult(id, passed, summary); return; } } catch (e) { /* fall through */ }
      try {
        const prev = localStorage.getItem('status_' + id);
        if (passed || prev !== 'passed') localStorage.setItem('status_' + id, passed ? 'passed' : 'tried');
      } catch (e) { /* ignore */ }
    },
    attempts(id) { try { return Number(sessionStorage.getItem('att_' + id) || 0); } catch (e) { return 0; } },
    bumpAttempts(id) { try { sessionStorage.setItem('att_' + id, String(this.attempts(id) + 1)); } catch (e) { /* ignore */ } },
  };

  // ---------- markup ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Supports **bold**, `code`, and ``code with a ` inside``.
  function inline(s) {
    let out = '', last = 0;
    const re = /``(.+?)``|`([^`]+)`/g;
    let m;
    const text = String(s);
    while ((m = re.exec(text))) {
      out += esc(text.slice(last, m.index)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      out += '<code>' + esc((m[1] !== undefined ? m[1] : m[2]).trim() || m[0]) + '</code>';
      last = re.lastIndex;
    }
    return out + esc(text.slice(last)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }
  function brief(lines) {
    let html = '', inList = false;
    lines.forEach((l) => {
      if (l.startsWith('- ')) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += '<li>' + inline(l.slice(2)) + '</li>';
        return;
      }
      if (inList) { html += '</ul>'; inList = false; }
      if (/^\*\*[^*]+\*\*$/.test(l)) html += '<h3>' + esc(l.slice(2, -2)) + '</h3>';
      else html += '<p>' + inline(l) + '</p>';
    });
    if (inList) html += '</ul>';
    return html;
  }

  // ---------- state ----------
  const $ = (id) => document.getElementById(id);
  const editor = $('editor'), gutter = $('gutter');
  let current = null;
  let hintsShown = 0;
  let lastResult = null;

  function find(id) { return id === 'playground' ? PLAYGROUND : C.find((c) => c.id === id) || null; }

  function open(id, opts) {
    const c = find(id) || PLAYGROUND;
    current = c;
    hintsShown = 0;
    lastResult = null;
    $('pickLabel').textContent = c.chapter === null ? 'Playground' : 'Ch ' + c.chapter + ' · ' + c.title;
    editor.value = store.loadCode(c.id) || c.starter;
    updateGutter();
    renderTask();
    $('resultsBody').innerHTML = '<p class="muted">Run your code to see results here.</p>';
    $('resultDot').className = 'dot';
    try { localStorage.setItem('last_challenge', c.id); } catch (e) { /* ignore */ }
    show(opts && opts.tab ? opts.tab : 'task');
  }

  function renderTask() {
    const c = current;
    const st = c.id === 'playground' ? '' : store.status(c.id);
    let html = '';
    if (c.chapter !== null) html += '<span class="chip">Chapter ' + c.chapter + ' · ' + esc(CHAPTER_NAMES[c.chapter] || '') + '</span>';
    html += '<h1>' + esc(c.title) + '</h1>';
    if (st === 'passed') html += '<div class="status pass">✓ Passed. Your result is saved in the study app.</div>';
    html += '<div class="brief">' + brief(c.brief) + '</div>';
    html += '<div class="row"><button class="primary" id="goCode">Write code</button>';
    if (c.hints && c.hints.length) html += '<button id="hintBtn">Show a hint</button>';
    if (c.solution) html += '<button class="ghost" id="solBtn">Show solution</button>';
    html += '</div><div id="hintBox"></div><div id="solBox"></div>';
    $('taskBody').innerHTML = html;
    $('goCode').onclick = () => show('code');
    if ($('hintBtn')) $('hintBtn').onclick = () => {
      if (hintsShown < c.hints.length) {
        $('hintBox').insertAdjacentHTML('beforeend', '<div class="hint">💡 ' + inline(c.hints[hintsShown]) + '</div>');
        hintsShown++;
      }
      if (hintsShown >= c.hints.length) $('hintBtn').disabled = true;
    };
    if ($('solBtn')) $('solBtn').onclick = () => {
      if (store.attempts(c.id) < 2 && !confirm('Try running it at least twice first? You learn more by struggling a bit. Show the solution anyway?')) return;
      $('solBox').innerHTML = '<div class="card solution"><h4>One working solution</h4><pre><code>' + esc(c.solution) + '</code></pre><div class="row"><button id="useSol">Put it in the editor</button></div></div>';
      $('useSol').onclick = () => { editor.value = c.solution; updateGutter(); store.saveCode(c.id, editor.value); show('code'); };
    };
  }

  // ---------- tabs ----------
  function show(tab) {
    const wide = window.matchMedia('(min-width: 860px)').matches;
    if (wide && tab === 'task') tab = 'code';
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('active', p.id === 'pane-' + tab));
    if (tab === 'data' && !$('dataBody').dataset.ready) renderData();
  }
  document.querySelectorAll('.tab').forEach((b) => { b.onclick = () => show(b.dataset.tab); });

  // ---------- editor ----------
  function updateGutter() {
    const n = editor.value.split('\n').length;
    let s = '';
    for (let i = 1; i <= n; i++) s += i + '\n';
    gutter.textContent = s;
    gutter.scrollTop = editor.scrollTop;
  }
  let saveTimer = null;
  editor.addEventListener('input', () => {
    updateGutter();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => current && store.saveCode(current.id, editor.value), 400);
  });
  editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop; });

  function insert(text, caretBack) {
    const s = editor.selectionStart, e = editor.selectionEnd;
    editor.value = editor.value.slice(0, s) + text + editor.value.slice(e);
    const pos = s + text.length - (caretBack || 0);
    editor.selectionStart = editor.selectionEnd = pos;
    editor.focus();
    editor.dispatchEvent(new Event('input'));
  }
  editor.addEventListener('keydown', (ev) => {
    if (ev.key === 'Tab') { ev.preventDefault(); insert('  '); }
    if (ev.key === 'Enter') {
      const s = editor.selectionStart;
      const lineStart = editor.value.lastIndexOf('\n', s - 1) + 1;
      const indent = (editor.value.slice(lineStart, s).match(/^\s*/) || [''])[0];
      const prev = editor.value[s - 1];
      ev.preventDefault();
      insert('\n' + indent + (prev === '{' || prev === '(' || prev === '[' ? '  ' : ''));
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); runCode(); }
  });

  // Symbols that are slow to reach on a phone keyboard.
  const KEYS = [['⇥', '  '], ['{ }', '{}', 1], ['( )', '()', 1], ['[ ]', '[]', 1], [';', ';'], ["' '", "''", 1], ['` `', '``', 1], ['${ }', '${}', 1], ['=>', ' => '], ['.', '.'], [',', ', '], ['=', ' = '], [':', ': '], ['===', ' === '], ['!', '!'], ['&&', ' && '], ['||', ' || '], ['<', ' < '], ['>', ' > '], ['+', ' + '], ['"', '"'], ['_', '_'], ['/', '/']];
  KEYS.forEach(([label, text, back]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.onclick = () => insert(text, back);
    $('keys').appendChild(b);
  });

  $('resetBtn').onclick = () => {
    if (!confirm('Replace your code with the starter code?')) return;
    editor.value = current.starter;
    updateGutter();
    store.saveCode(current.id, editor.value);
  };

  // ---------- running ----------
  let worker = null, jobId = 0, timer = null;
  function newWorker() {
    if (worker) worker.terminate();
    worker = new Worker('worker.js');
    worker.onmessage = (ev) => {
      if (ev.data.jobId !== jobId) return;
      clearTimeout(timer);
      $('runBtn').disabled = false;
      $('runBtn').textContent = '▶ Run';
      if (ev.data.crash) { renderCrash(ev.data.crash); return; }
      handleResult(ev.data);
    };
    worker.onerror = (e) => { clearTimeout(timer); $('runBtn').disabled = false; $('runBtn').textContent = '▶ Run'; renderCrash(e.message || 'Worker error'); };
  }
  newWorker();

  function runCode() {
    const code = editor.value;
    store.saveCode(current.id, code);
    jobId++;
    $('runBtn').disabled = true;
    $('runBtn').textContent = 'Running…';
    worker.postMessage({ jobId, code, challengeId: current.id === 'playground' ? null : current.id });
    clearTimeout(timer);
    timer = setTimeout(() => {
      newWorker();
      $('runBtn').disabled = false;
      $('runBtn').textContent = '▶ Run';
      renderCrash('Your script ran for more than 5 seconds and was stopped. Look for a loop that never ends, like a while loop whose condition never becomes false.');
    }, 5000);
  }
  $('runBtn').onclick = runCode;

  function handleResult(data) {
    lastResult = data;
    if (current.id !== 'playground') {
      store.bumpAttempts(current.id);
      const passedCount = data.checks.filter((c) => c.pass).length;
      store.report(current.id, data.passed, JSON.stringify({ passed: passedCount, total: data.checks.length }));
      if (data.passed) renderTask();
    }
    $('resultDot').className = 'dot ' + (data.passed === null ? (data.result.ok ? 'pass' : 'fail') : data.passed ? 'pass' : 'fail');
    renderResults(data);
    show('results');
  }

  function renderCrash(msg) {
    $('resultsBody').innerHTML = '<div class="err">' + esc(msg) + '</div>';
    $('resultDot').className = 'dot fail';
    show('results');
  }

  function fmtVal(v) {
    if (v === undefined) return 'undefined';
    if (typeof v === 'string') return JSON.stringify(v);
    return JSON.stringify(v, null, 1);
  }

  function renderResults(data) {
    const r = data.result;
    let html = '';
    if (data.checks) {
      const n = data.checks.filter((c) => c.pass).length;
      html += data.passed
        ? '<div class="banner pass"><strong>✓ Challenge passed</strong>Saved to the study app. Nice work.</div>'
        : '<div class="banner fail"><strong>Not yet: ' + n + ' of ' + data.checks.length + ' checks</strong>Read the checks and logs below, then try again.</div>';
      html += '<ul class="checks">' + data.checks.map((c) => '<li><span class="mark ' + (c.pass ? 'y">✓' : 'n">✗') + '</span><span>' + inline(c.label) + '</span></li>').join('') + '</ul>';
    }
    if (r.error) {
      html += '<div class="err"><b>' + esc(r.error.name) + '</b>' + (r.error.line ? ' (line ' + r.error.line + ')' : '') + '\n' + esc(r.error.message) + '</div>';
    }
    (r.hints || []).forEach((h) => { html += '<div class="warn">💡 ' + esc(h) + '</div>'; });
    (r.warnings || []).forEach((w) => { html += '<div class="warn">⚠ ' + esc(w) + '</div>'; });

    const pct = Math.min(100, Math.round((r.unitsUsed / r.limit) * 100));
    html += '<div class="card"><h4>Governance</h4><div class="meter' + (r.unitsUsed > r.limit ? ' over' : '') + '"><div style="width:' + pct + '%"></div></div>'
      + '<span class="muted">' + r.unitsUsed + ' of ' + r.limit.toLocaleString() + ' units' + (r.scriptType ? ' · ' + esc(r.scriptType) : '') + '</span></div>';

    const logs = r.logs || [];
    html += '<div class="card"><h4>Logs (' + logs.length + ')</h4>' + (logs.length
      ? logs.slice(0, 300).map((l) => '<div class="log"><span class="lvl ' + l.level + '">' + l.level + '</span><b>' + esc(l.title) + '</b>' + (l.details !== '' ? ' · ' + esc(l.details) : '') + '</div>').join('') + (logs.length > 300 ? '<div class="muted">…and ' + (logs.length - 300) + ' more</div>' : '')
      : '<span class="muted">No log lines. Use log.debug(title, details) to see what your code is doing.</span>') + '</div>';

    const interesting = (r.runs || []).filter((x) => x.label || x.returned !== undefined || x.page || x.written || x.redirect || x.blocked);
    if (interesting.length) {
      html += '<div class="card"><h4>Test runs</h4>' + interesting.map((x) => {
        let s = '<div class="log"><b>' + esc(x.label || 'run') + '</b>';
        if (x.blocked) s += '<br>Save blocked: ' + esc(x.blocked.name) + ' · ' + esc(x.blocked.message);
        if (x.savedId) s += '<br>Saved as internal ID ' + x.savedId;
        if (x.returned !== undefined) s += '<br>Returned: ' + esc(fmtVal(x.returned));
        if (x.redirect) s += '<br>Redirected to ' + esc(JSON.stringify(x.redirect));
        if (x.written) s += '<br>Wrote: ' + esc(x.written.slice(0, 400));
        if (x.error && !x.expectedBlock) s += '<br><span style="color:var(--bad)">' + esc(x.error.name + ': ' + x.error.message) + '</span>';
        if (x.inputCount !== undefined) s += '<br>Map/Reduce: ' + x.inputCount + ' inputs → ' + x.mapCount + ' map calls → ' + x.reduceKeys + ' reduce keys' + (x.mapErrors && x.mapErrors.length ? ' · ' + x.mapErrors.length + ' map errors' : '');
        s += '</div>';
        if (x.page) {
          s += '<div class="mock-form"><b>' + esc(x.page.title) + '</b>' + x.page.fields.map((f) => '<label>' + esc(f.label) + (f.isMandatory ? ' *' : '') + ' <span class="muted">(' + esc(f.id) + ')</span></label><div class="fake"></div>').join('') + (x.page.submit ? '<div class="row"><button class="primary" disabled>' + esc(x.page.submit.label) + '</button></div>' : '') + '</div>';
        }
        return s;
      }).join('') + '</div>';
    }
    if (r.emails && r.emails.length) html += '<div class="card"><h4>Emails sent</h4>' + r.emails.map((e) => '<div class="log">To ' + esc(e.recipients.join(', ')) + ' · <b>' + esc(e.subject) + '</b>' + (e.attachments.length ? ' · 📎 ' + esc(e.attachments.join(', ')) : '') + '</div>').join('') + '</div>';
    if (r.files && r.files.length) html += '<div class="card"><h4>Files saved</h4>' + r.files.map((f) => '<div class="log">' + esc(f.name) + ' · folder ' + esc(f.folder) + ' · ' + f.size + ' characters</div>').join('') + '</div>';
    if (r.dialogs && r.dialogs.length) html += '<div class="card"><h4>Pop-ups shown</h4>' + r.dialogs.map((d) => '<div class="log"><b>' + esc(d.title || '') + '</b> ' + esc(d.message || '') + '</div>').join('') + '</div>';
    if (r.tasksQueued && r.tasksQueued.length) html += '<div class="card"><h4>Tasks queued</h4>' + r.tasksQueued.map((t) => '<div class="log">' + esc(t.taskType + ' ' + (t.scriptId || '')) + '</div>').join('') + '</div>';
    $('resultsBody').innerHTML = html;
  }

  // ---------- sample data ----------
  function renderData() {
    const tables = window.NSRuntime.describeData();
    $('dataBody').innerHTML = tables.map((t) => '<h3>' + esc(t.title) + '</h3><div class="tbl"><table><thead><tr>' + t.columns.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>'
      + t.rows.map((row) => '<tr>' + row.map((v) => '<td>' + esc(v === null || v === undefined ? '' : v) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>').join('');
    $('dataBody').dataset.ready = '1';
  }

  // ---------- picker ----------
  function renderPicker() {
    let html = '<button class="item" data-id="playground"><div><div class="t">Playground</div><div class="s">Free practice, nothing graded</div></div></button>';
    let chapter = -1;
    C.forEach((c) => {
      if (c.chapter !== chapter) { chapter = c.chapter; html += '<div class="grp">Chapter ' + chapter + ' · ' + esc(CHAPTER_NAMES[chapter]) + '</div>'; }
      const st = store.status(c.id);
      html += '<button class="item" data-id="' + c.id + '"><div><div class="t">' + esc(c.title) + '</div><div class="s">' + esc(c.summary) + '</div></div>'
        + (st === 'passed' ? '<span class="badge done">✓</span>' : st === 'tried' ? '<span class="badge tried">…</span>' : '') + '</button>';
    });
    $('pickerList').innerHTML = html;
    $('pickerList').querySelectorAll('.item').forEach((b) => { b.onclick = () => { $('picker').classList.add('hidden'); open(b.dataset.id); }; });
  }
  $('pickBtn').onclick = () => { renderPicker(); $('picker').classList.remove('hidden'); };
  $('closePicker').onclick = () => $('picker').classList.add('hidden');

  $('studyBtn').onclick = () => {
    if (Bridge && Bridge.openStudyApp) Bridge.openStudyApp(current ? current.chapter == null ? -1 : current.chapter : -1);
  };
  if (!Bridge) $('studyBtn').style.display = 'none';

  // Called by the Android app when the study app asks for a specific challenge.
  window.CodeLab = { open: (id) => open(id) };

  let first = params.get('challenge');
  if (!first) { try { first = localStorage.getItem('last_challenge'); } catch (e) { first = null; } }
  open(first || 'c0-1');
})();
