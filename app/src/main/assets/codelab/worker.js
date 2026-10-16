/* Runs user code off the main thread so an infinite loop can be stopped. */
importScripts('alasql.min.js', 'runtime.js', 'challenges.js');

const PLAYGROUND_TRIGGERS = {
  UserEventScript: [{ event: 'create', values: { entity: 101 }, lines: [{ item: 201, quantity: 2 }] }],
  ClientScript: [{ entry: 'saveRecord', values: { entity: 101, memo: '' } }],
  Suitelet: [{ method: 'GET' }],
  Restlet: [{ method: 'GET', params: { id: '101' } }],
  WorkflowActionScript: [{ recordType: 'purchaseorder', id: 3001 }],
};

function safe(v) {
  if (v === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(v)); } catch (e) { return String(v); }
}

function summarize(res) {
  return {
    ok: res.ok,
    error: res.error,
    scriptType: res.scriptType,
    apiVersion: res.apiVersion,
    limit: res.limit,
    unitsUsed: res.unitsUsed,
    logs: res.logs,
    warnings: Array.from(new Set(res.warnings)).slice(0, 20),
    hints: Array.from(new Set(res.hints)),
    calls: res.calls,
    emails: res.emails,
    files: Object.values(res.db.files || {}).map((f) => ({ name: f.name, folder: f.folder, size: String(f.contents).length })),
    tasksQueued: res.tasks,
    dialogs: res.dialogs,
    runs: res.runs.map((r) => ({
      label: describeTrigger(r.trigger),
      returned: safe(r.returned),
      error: r.error,
      blocked: r.blocked,
      expectedBlock: !!r.expectedBlock,
      savedId: r.savedId || null,
      page: r.page ? { title: r.page.title, fields: r.page.fields.map((f) => ({ id: f.id, label: f.label, type: f.type, isMandatory: f.isMandatory })), submit: r.page.submit, buttons: r.page.buttons } : null,
      form: r.form ? { buttons: r.form.buttons, fields: r.form.fields.map((f) => ({ id: f.id, label: f.label })) } : null,
      written: r.written || null,
      redirect: r.redirect || null,
      unitsUsed: r.unitsUsed,
      inputCount: r.inputCount, mapCount: r.mapCount, reduceKeys: r.reduceKeys ? r.reduceKeys.length : undefined,
      mapErrors: r.mapErrors, reduceErrors: r.reduceErrors,
    })),
  };
}

function describeTrigger(t) {
  if (!t) return null;
  if (t.event) return t.event.toUpperCase() + ' ' + (t.recordType || 'salesorder') + (t.id ? ' ' + t.id : '');
  if (t.entry) return t.entry + (t.fieldId ? ' (' + t.fieldId + ')' : '');
  if (t.method) return t.method + (t.params ? ' ?' + Object.entries(t.params).map(([k, v]) => k + '=' + v).join('&') : '');
  if (t.call) return 'test call';
  if (t.recordType) return 'onAction on ' + t.recordType + ' ' + (t.id || '');
  return null;
}

self.onmessage = (ev) => {
  const { jobId, code, challengeId } = ev.data;
  try {
    if (challengeId) {
      const c = NSChallenges.CHALLENGES.find((x) => x.id === challengeId);
      const g = NSChallenges.grade(c, code);
      self.postMessage({ jobId, result: summarize(g.res), checks: g.checks, passed: g.passed });
    } else {
      const type = (code.match(/@NScriptType\s+(\w+)/) || [])[1];
      const res = NSRuntime.run(code, { triggers: PLAYGROUND_TRIGGERS[type] });
      self.postMessage({ jobId, result: summarize(res), checks: null, passed: null });
    }
  } catch (e) {
    self.postMessage({ jobId, crash: (e && e.message) || String(e) });
  }
};
