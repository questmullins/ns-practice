/*
 * NS Code Lab runtime: a small, offline imitation of NetSuite's SuiteScript 2.1
 * environment. It is a teaching tool, not a full emulator. It covers the parts
 * of N/record, N/search, N/query, N/log, N/runtime and friends that the
 * practice challenges use, and it charges governance units like NetSuite does.
 *
 * Works in a browser Web Worker (self) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  // ---------- dates ----------
  const DAY = 86400000;
  function today() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function daysFromToday(n) { return new Date(today().getTime() + n * DAY); }
  function fmtDate(d) { return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear(); }
  function parseDate(v) {
    if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    if (typeof v !== 'string') return null;
    const s = v.trim().toLowerCase();
    if (s === 'today') return today();
    if (s === 'yesterday') return daysFromToday(-1);
    let m = s.match(/^daysago(\d+)$/); if (m) return daysFromToday(-Number(m[1]));
    m = s.match(/^daysfromnow(\d+)$/); if (m) return daysFromToday(Number(m[1]));
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return new Date(+m[3], +m[1] - 1, +m[2]);
    return null;
  }

  // ---------- schema ----------
  const LISTS = {
    subsidiary: { 1: 'Parent Company', 2: 'Excel US' },
    location: { 1: 'Main Warehouse', 2: 'West Coast DC' },
    customercategory: { 1: 'Retail', 2: 'Wholesale' },
    term: { 1: 'Net 30', 2: 'Net 60' },
    warrantytype: { 1: 'Standard', 2: 'Extended', 3: 'Lifetime' },
    taskstatus: { NOTSTART: 'Not Started', PROGRESS: 'In Progress', COMPLETE: 'Completed' },
  };

  const STATUS = {
    SalesOrd: { A: 'Pending Approval', B: 'Pending Fulfillment', C: 'Cancelled', D: 'Partially Fulfilled', E: 'Pending Billing/Partially Fulfilled', F: 'Pending Billing', G: 'Billed', H: 'Closed' },
    CustInvc: { A: 'Open', B: 'Paid In Full' },
    PurchOrd: { A: 'Pending Supervisor Approval', B: 'Pending Receipt', C: 'Rejected by Supervisor' },
  };

  const f = (kind, extra) => Object.assign({ kind }, extra || {});
  const TEXT = f('text'), NUM = f('number'), CUR = f('currency'), DATE = f('date'), BOOL = f('checkbox');
  const rec = (t) => f('select', { rec: t });
  const list = (l) => f('select', { list: l });

  const ITEM_LINES = { item: rec('item'), quantity: NUM, rate: CUR, amount: CUR, description: TEXT, custcol_engraving: TEXT };

  const TYPES = {
    customer: { family: 'entity', fields: { entityid: TEXT, companyname: TEXT, email: TEXT, phone: TEXT, subsidiary: list('subsidiary'), category: list('customercategory'), salesrep: rec('employee'), terms: list('term'), creditlimit: CUR, custentity_open_balance: CUR, isinactive: BOOL, comments: TEXT } },
    vendor: { family: 'entity', fields: { entityid: TEXT, companyname: TEXT, email: TEXT, subsidiary: list('subsidiary') } },
    employee: { family: 'entity', fields: { entityid: TEXT, firstname: TEXT, lastname: TEXT, email: TEXT, title: TEXT, supervisor: rec('employee'), subsidiary: list('subsidiary'), isinactive: BOOL } },
    item: { family: 'item', fields: { itemid: TEXT, displayname: TEXT, itemtype: TEXT, baseprice: CUR, quantityavailable: NUM, reorderpoint: NUM, isinactive: BOOL } },
    salesorder: { family: 'transaction', code: 'SalesOrd', prefix: 'SO', sublists: { item: ITEM_LINES }, fields: { tranid: TEXT, entity: rec('customer'), trandate: DATE, orderstatus: TEXT, status: TEXT, memo: TEXT, otherrefnum: TEXT, subsidiary: list('subsidiary'), location: list('location'), salesrep: rec('employee'), terms: list('term'), total: CUR, custbody_rush_order: BOOL, custbody_discount_pct: NUM, custbody_reviewed: BOOL } },
    invoice: { family: 'transaction', code: 'CustInvc', prefix: 'INV', sublists: { item: ITEM_LINES }, fields: { tranid: TEXT, entity: rec('customer'), trandate: DATE, duedate: DATE, createdfrom: rec('transaction'), status: TEXT, memo: TEXT, subsidiary: list('subsidiary'), location: list('location'), terms: list('term'), total: CUR, amountremaining: CUR, custbody_reviewed: BOOL } },
    purchaseorder: { family: 'transaction', code: 'PurchOrd', prefix: 'PO', sublists: { item: ITEM_LINES }, fields: { tranid: TEXT, entity: rec('vendor'), trandate: DATE, approvalstatus: TEXT, status: TEXT, memo: TEXT, subsidiary: list('subsidiary'), employee: rec('employee'), total: CUR } },
    task: { family: 'entity', fields: { title: TEXT, assigned: rec('employee'), transaction: rec('transaction'), company: rec('customer'), status: list('taskstatus'), duedate: DATE, message: TEXT } },
    customrecord_warranty: { family: 'custom', fields: { name: TEXT, custrecord_warranty_customer: rec('customer'), custrecord_warranty_type: list('warrantytype'), custrecord_warranty_start: DATE, custrecord_warranty_end: DATE } },
    customrecord_warranty_claim: { family: 'custom', fields: { name: TEXT, custrecord_claim_warranty: rec('customrecord_warranty'), custrecord_claim_desc: TEXT, custrecord_claim_date: DATE } },
    customrecord_audit_note: { family: 'custom', fields: { name: TEXT, custrecord_note_transaction: rec('transaction'), custrecord_note_text: TEXT } },
    customrecord_integration_log: { family: 'custom', fields: { name: TEXT, custrecord_log_request: TEXT, custrecord_log_status: TEXT } },
  };
  // Item records are stored in one table; these record types point at it.
  const ITEM_TYPES = { inventoryitem: 'InvtPart', serviceitem: 'Service', noninventoryitem: 'NonInvtPart' };
  const TRAN_CODES = { SalesOrd: 'salesorder', CustInvc: 'invoice', PurchOrd: 'purchaseorder' };

  const COST = {
    load: { transaction: 10, custom: 2, entity: 5, item: 5 },
    save: { transaction: 20, custom: 4, entity: 10, item: 10 },
    submitFields: { transaction: 10, custom: 2, entity: 5, item: 5 },
    delete: { transaction: 20, custom: 4, entity: 10, item: 10 },
    create: { transaction: 10, custom: 2, entity: 5, item: 5 },
    transform: { transaction: 10, custom: 2, entity: 5, item: 5 },
  };

  const LIMITS = {
    UserEventScript: 1000, ClientScript: 1000, Suitelet: 1000, Portlet: 1000, WorkflowActionScript: 1000,
    MassUpdateScript: 1000, Restlet: 5000, ScheduledScript: 10000, Playground: 10000, Module: 10000,
  };

  // ---------- errors ----------
  class SuiteScriptError extends Error {
    constructor(name, message) { super(message); this.name = name; this.type = 'error.SuiteScriptError'; }
    toString() { return this.name + ': ' + this.message; }
  }
  const nsErr = (name, msg) => new SuiteScriptError(name, msg);

  // ---------- seed data ----------
  function seed() {
    const d = daysFromToday;
    const db = { customer: {}, vendor: {}, employee: {}, item: {}, transaction: {}, task: {}, customrecord_warranty: {}, customrecord_warranty_claim: {}, customrecord_audit_note: {}, customrecord_integration_log: {}, files: {} };
    const add = (table, id, values, lines) => { db[table][id] = { id: Number(id), values, lines: lines || null }; };

    add('employee', 7, { entityid: 'Quest Mullins', firstname: 'Quest', lastname: 'Mullins', email: 'quest@example.com', title: 'NetSuite Developer', supervisor: 8, subsidiary: 2, isinactive: false });
    add('employee', 8, { entityid: 'Dana Ortiz', firstname: 'Dana', lastname: 'Ortiz', email: 'dana@example.com', title: 'Controller', supervisor: '', subsidiary: 2, isinactive: false });
    add('employee', 9, { entityid: 'Sam Rivera', firstname: 'Sam', lastname: 'Rivera', email: 'sam@example.com', title: 'Warehouse Lead', supervisor: 8, subsidiary: 2, isinactive: false });

    const cust = (id, name, email, cat, limit, inactive) => add('customer', id, { entityid: name, companyname: name, email, phone: '555-01' + String(id).slice(-2), subsidiary: 2, category: cat, salesrep: 7, terms: 1, creditlimit: limit, custentity_open_balance: 0, isinactive: !!inactive, comments: '' });
    cust(101, 'Acme Corp', 'ap@acme.example', 2, 5000);
    cust(102, 'Globex Inc', 'orders@globex.example', 2, 10000);
    cust(103, 'Initech LLC', 'billing@initech.example', 1, 2500);
    cust(104, 'Umbrella Co', 'hello@umbrella.example', 1, 3000);
    cust(105, 'Stark Supply', 'buy@stark.example', 2, 8000, true);

    add('vendor', 301, { entityid: 'Parts Unlimited', companyname: 'Parts Unlimited', email: 'sales@parts.example', subsidiary: 2 });

    const item = (id, itemid, name, type, price, qty, reorder) => add('item', id, { itemid, displayname: name, itemtype: type, baseprice: price, quantityavailable: qty, reorderpoint: reorder, isinactive: false });
    item(201, 'WIDGET-S', 'Small Widget', 'InvtPart', 12.5, 140, 50);
    item(202, 'WIDGET-L', 'Large Widget', 'InvtPart', 30, 20, 40);
    item(203, 'GEAR-KIT', 'Gear Kit', 'InvtPart', 75, 8, 10);
    item(204, 'SVC-INSTALL', 'Installation Service', 'Service', 120, 0, 0);
    item(205, 'BOLT-100', 'Bolt Pack (100)', 'InvtPart', 4.25, 900, 200);

    const L = (item, quantity, rate) => ({ item, quantity, rate, amount: round2(quantity * rate), description: '' });
    const so = (id, entity, ago, status, lines, extra) => add('transaction', id, Object.assign({ _type: 'salesorder', tranid: 'SO' + id, entity, trandate: d(-ago), orderstatus: status, memo: '', otherrefnum: '', subsidiary: 2, location: 1, salesrep: 7, terms: 1, custbody_rush_order: false, custbody_discount_pct: 0, custbody_reviewed: false }, extra || {}), lines);
    so(1001, 101, 20, 'B', [L(201, 10, 12.5), L(202, 2, 30)]);
    so(1002, 101, 12, 'B', [L(203, 1, 75), L(204, 1, 120)]);
    so(1003, 102, 9, 'B', [L(201, 40, 12), L(205, 100, 4.25), L(202, 5, 30)]);
    so(1004, 103, 30, 'F', [L(202, 10, 30)]);
    so(1005, 101, 45, 'G', [L(201, 4, 12.5)]);
    so(1006, 104, 3, 'A', [L(203, 3, 75)], { custbody_rush_order: true, memo: 'Customer event on Friday' });

    const inv = (id, entity, ago, dueIn, status, lines, remaining, createdfrom) => add('transaction', id, { _type: 'invoice', tranid: 'INV' + id, entity, trandate: d(-ago), duedate: d(dueIn), createdfrom: createdfrom || '', status, memo: '', subsidiary: 2, location: 1, terms: 1, amountremaining: remaining, custbody_reviewed: false }, lines);
    inv(2001, 101, 40, -10, 'A', [L(201, 4, 12.5)], 50, 1005);
    inv(2002, 103, 25, 5, 'A', [L(202, 10, 30)], 300, 1004);
    inv(2003, 102, 70, -40, 'A', [L(203, 10, 75), L(204, 4, 125)], 800);
    inv(2004, 101, 60, -30, 'B', [L(202, 12, 30), L(205, 12, 4.25)], 0);
    inv(2005, 104, 15, 15, 'A', [L(201, 4, 12.5), L(205, 10, 4.5)], 95);

    add('transaction', 3001, { _type: 'purchaseorder', tranid: 'PO3001', entity: 301, trandate: d(-1), approvalstatus: 'A', memo: 'Restock gear kits', subsidiary: 2, employee: 9 }, [L(203, 96, 75)]);

    add('customrecord_warranty', 1, { name: 'W-0001', custrecord_warranty_customer: 101, custrecord_warranty_type: 1, custrecord_warranty_start: d(-200), custrecord_warranty_end: d(165) });
    add('customrecord_warranty_claim', 1, { name: 'C-0001', custrecord_claim_warranty: 1, custrecord_claim_desc: 'Widget arrived cracked', custrecord_claim_date: d(-50) });

    Object.values(db.transaction).forEach(recalc);
    return db;
  }

  function round2(n) { return Math.round(Number(n) * 100) / 100; }
  function recalc(row) {
    if (!row.lines) return;
    let total = 0;
    row.lines.forEach((l) => {
      if (l.quantity !== '' && l.rate !== '' && l.quantity != null && l.rate != null) l.amount = round2(Number(l.quantity) * Number(l.rate));
      total += Number(l.amount) || 0;
    });
    row.values.total = round2(total);
  }

  // Lets challenges add lots of records quickly.
  function addSalesOrders(db, count, opts) {
    const o = opts || {};
    let id = Math.max(...Object.keys(db.transaction).map(Number)) + 1;
    const customers = Object.keys(db.customer).map(Number).filter((c) => !db.customer[c].values.isinactive);
    for (let i = 0; i < count; i++, id++) {
      const entity = o.entity || customers[i % customers.length];
      const row = { id, values: { _type: 'salesorder', tranid: 'SO' + id, entity, trandate: daysFromToday(-(i % 28)), orderstatus: o.status || 'B', memo: '', otherrefnum: '', subsidiary: 2, location: 1, salesrep: 7, terms: 1, custbody_rush_order: false, custbody_discount_pct: 0, custbody_reviewed: false }, lines: [{ item: 201 + (i % 5), quantity: 1 + (i % 7), rate: 10, amount: 0, description: '' }] };
      recalc(row);
      db.transaction[id] = row;
    }
  }

  // ---------- environment ----------
  function makeEnv(opts) {
    const o = opts || {};
    const env = {
      db: o.db || seed(),
      logs: [], warnings: [], hints: [], emails: [], tasks: [], dialogs: [], https: [], calls: {},
      params: o.params || {},
      limit: o.limit || 10000,
      used: 0,
      stageUsage: {},
      stage: 'script',
      scriptType: o.scriptType || 'Playground',
      executionContext: o.executionContext || 'USERINTERFACE',
      httpMocks: o.httpMocks || {},
      nextId: {},
    };
    env.charge = (units, what) => {
      env.calls[what] = (env.calls[what] || 0) + 1;
      env.used += units;
      env.stageUsage[env.stage] = (env.stageUsage[env.stage] || 0) + units;
      if (env.used > env.limit) {
        throw nsErr('SSS_USAGE_LIMIT_EXCEEDED', 'Script Execution Usage Limit Exceeded. ' + what + ' pushed usage to ' + env.used + ' of ' + env.limit + ' units.');
      }
    };
    env.note = (what) => { env.calls[what] = (env.calls[what] || 0) + 1; };
    return env;
  }

  function tableFor(type) {
    const t = String(type || '').toLowerCase();
    if (TYPES[t] && TYPES[t].family === 'transaction') return 'transaction';
    if (t === 'item' || ITEM_TYPES[t]) return 'item';
    if (TYPES[t]) return t;
    return null;
  }
  function schemaFor(type) {
    const t = String(type || '').toLowerCase();
    if (ITEM_TYPES[t]) return TYPES.item;
    return TYPES[t];
  }
  function familyFor(type) { const s = schemaFor(type); return s ? s.family : 'custom'; }

  function nextId(env, table) {
    const keys = Object.keys(env.db[table]).map(Number);
    let base = keys.length ? Math.max(...keys) : 0;
    if (table === 'transaction') base = Math.max(base, 5000);
    return base + 1;
  }

  function checkType(type) {
    if (!type) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'Missing a required argument: type');
    if (!schemaFor(type)) {
      throw nsErr('SSS_INVALID_RECORD_TYPE', 'The record type [' + type + '] is invalid or isn\'t available in Code Lab. Try record.Type.SALES_ORDER, CUSTOMER, INVOICE, TASK, or a customrecord_ type listed in Sample data.');
    }
  }

  function findRow(env, type, id) {
    const table = tableFor(type);
    const row = env.db[table][Number(id)];
    if (!row) return null;
    if (table === 'transaction' && row.values._type !== String(type).toLowerCase()) return null;
    if (table === 'item' && ITEM_TYPES[String(type).toLowerCase()] && row.values.itemtype !== ITEM_TYPES[String(type).toLowerCase()]) return null;
    return row;
  }

  function displayOf(env, fieldDef, value) {
    if (value === '' || value == null) return '';
    if (!fieldDef || fieldDef.kind !== 'select') {
      if (value instanceof Date) return fmtDate(value);
      if (typeof value === 'boolean') return value ? 'T' : 'F';
      return String(value);
    }
    if (fieldDef.list) return (LISTS[fieldDef.list] || {})[value] || String(value);
    const target = fieldDef.rec;
    const table = target === 'transaction' ? 'transaction' : tableFor(target);
    const row = table && env.db[table][Number(value)];
    if (!row) return String(value);
    const v = row.values;
    if (table === 'transaction') {
      const s = TYPES[v._type];
      return (s ? { salesorder: 'Sales Order', invoice: 'Invoice', purchaseorder: 'Purchase Order' }[v._type] : '') + ' #' + v.tranid;
    }
    if (table === 'employee') return v.firstname + ' ' + v.lastname;
    if (table === 'item') return v.itemid;
    return v.companyname || v.entityid || v.name || v.title || String(value);
  }

  function statusText(values) {
    const s = TYPES[values._type];
    if (!s) return '';
    const letter = values._type === 'salesorder' ? values.orderstatus : values._type === 'purchaseorder' ? values.approvalstatus : values.status;
    return (STATUS[s.code] || {})[letter] || '';
  }

  // ---------- N/record ----------
  function makeRecordModule(env) {
    const Type = { SALES_ORDER: 'salesorder', INVOICE: 'invoice', PURCHASE_ORDER: 'purchaseorder', CUSTOMER: 'customer', VENDOR: 'vendor', EMPLOYEE: 'employee', TASK: 'task', INVENTORY_ITEM: 'inventoryitem', SERVICE_ITEM: 'serviceitem', NON_INVENTORY_ITEM: 'noninventoryitem' };

    function argObj(a, key) { return (a && typeof a === 'object' && !(a instanceof Date)) ? a : { [key]: a }; }

    class Record {
      constructor(type, values, lines, opts) {
        this.type = String(type).toLowerCase();
        this._schema = schemaFor(this.type);
        this._values = values;
        this._lines = lines ? { item: lines } : (this._schema.sublists ? { item: [] } : {});
        this.isDynamic = !!(opts && opts.isDynamic);
        this._id = opts && opts.id != null ? Number(opts.id) : null;
        this._current = {};
        this._readOnly = !!(opts && opts.readOnly);
        this._onlyFields = opts && opts.onlyFields;
      }
      get id() { return this._id; }
      set id(v) { throw nsErr('READ_ONLY_PROPERTY', 'record.id is read-only'); }
      _field(id) { return this._schema.fields[id]; }
      _checkField(id, action) {
        if (typeof id !== 'string' || !id) throw nsErr('SSS_MISSING_REQD_ARGUMENT', action + ' needs a fieldId, e.g. ' + action + "({ fieldId: 'memo' })");
        if (!this._field(id) && !/^cust/.test(id) && id !== 'id' && id !== 'internalid') {
          env.warnings.push("Field '" + id + "' doesn't exist on " + this.type + ' records here. Check the spelling against Sample data.');
        }
      }
      getValue(a) {
        const fieldId = argObj(a, 'fieldId').fieldId;
        this._checkField(fieldId, 'getValue');
        if (fieldId === 'id' || fieldId === 'internalid') return this._id == null ? '' : String(this._id);
        if (fieldId === 'status' && this._schema.family === 'transaction') return statusText(this._values);
        if (this._onlyFields && !(fieldId in this._onlyFields)) return undefined;
        const v = this._values[fieldId];
        if (v instanceof Date) return new Date(v.getTime());
        if (v === undefined || v === null) {
          const def = this._field(fieldId);
          return def && def.kind === 'checkbox' ? false : '';
        }
        return v;
      }
      getText(a) {
        const fieldId = argObj(a, 'fieldId').fieldId;
        this._checkField(fieldId, 'getText');
        if (fieldId === 'status' && this._schema.family === 'transaction') return statusText(this._values);
        return displayOf(env, this._field(fieldId), this._values[fieldId]);
      }
      setValue(a, maybeValue) {
        let o = a;
        if (typeof a === 'string') o = { fieldId: a, value: maybeValue };
        if (!o || typeof o !== 'object') throw nsErr('SSS_MISSING_REQD_ARGUMENT', "setValue needs an object, e.g. setValue({ fieldId: 'memo', value: 'Hi' })");
        if (this._readOnly) {
          env.warnings.push('setValue on ' + o.fieldId + ' did nothing: this record is already saved (afterSubmit). Use record.submitFields or load and save it to change it.');
          return this;
        }
        this._checkField(o.fieldId, 'setValue');
        if (!('value' in o)) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'setValue is missing value for ' + o.fieldId);
        const def = this._field(o.fieldId);
        let value = o.value;
        if (def && def.kind === 'date' && value !== '' && value != null && !(value instanceof Date)) {
          throw nsErr('INVALID_FLD_VALUE', 'You have entered an Invalid Field Value ' + value + ' for the following field: ' + o.fieldId + '. Date fields need a JavaScript Date object (use new Date() or N/format.parse).');
        }
        if (def && def.kind === 'select' && value !== '' && value != null && isNaN(Number(value))) {
          throw nsErr('INVALID_FLD_VALUE', 'Invalid value ' + JSON.stringify(value) + ' for ' + o.fieldId + '. List/record fields take an internal ID (a number). Use setText to set by name.');
        }
        this._values[o.fieldId] = value;
        if (this.isDynamic && o.fieldId === 'entity' && value) {
          const c = env.db.customer[Number(value)];
          if (c) { this._values.salesrep = c.values.salesrep; this._values.terms = c.values.terms; this._values.subsidiary = c.values.subsidiary; }
        }
        return this;
      }
      setText(o) {
        const def = this._field(o.fieldId);
        if (!def || def.kind !== 'select') return this.setValue({ fieldId: o.fieldId, value: o.text });
        const pool = def.list ? Object.entries(LISTS[def.list] || {}) : Object.values(env.db[tableFor(def.rec) || 'transaction'] || {}).map((r) => [r.id, displayOf(env, def, r.id)]);
        const hit = pool.find(([, t]) => String(t).toLowerCase() === String(o.text).toLowerCase());
        if (!hit) throw nsErr('INVALID_FLD_VALUE', 'No ' + o.fieldId + ' option named ' + o.text);
        return this.setValue({ fieldId: o.fieldId, value: isNaN(Number(hit[0])) ? hit[0] : Number(hit[0]) });
      }
      getFields() { return Object.keys(this._schema.fields); }
      getSublists() { return Object.keys(this._lines); }
      _sub(id) {
        if (!this._lines[id]) throw nsErr('SSS_INVALID_SUBLIST_OPERATION', "Sublist '" + id + "' doesn't exist on " + this.type + ". Transactions here have the 'item' sublist.");
        return this._lines[id];
      }
      getLineCount(a) { return this._sub(argObj(a, 'sublistId').sublistId).length; }
      _line(o) {
        const lines = this._sub(o.sublistId);
        if (typeof o.line !== 'number' || o.line < 0 || o.line >= lines.length) {
          throw nsErr('SSS_INVALID_SUBLIST_OPERATION', 'Line ' + o.line + ' is out of range. The ' + o.sublistId + ' sublist has ' + lines.length + ' line(s), numbered 0 to ' + (lines.length - 1) + '.');
        }
        return lines[o.line];
      }
      getSublistValue(o) { const v = this._line(o)[o.fieldId]; return v === undefined ? '' : v; }
      getSublistText(o) { return displayOf(env, ITEM_LINES[o.fieldId], this._line(o)[o.fieldId]); }
      setSublistValue(o) {
        if (this.isDynamic) throw nsErr('SSS_INVALID_API_USAGE', 'setSublistValue is for standard mode. In dynamic mode use selectNewLine / setCurrentSublistValue / commitLine.');
        const lines = this._sub(o.sublistId);
        if (o.line === lines.length) lines.push({});
        this._line(o)[o.fieldId] = o.value;
        return this;
      }
      insertLine(o) {
        const lines = this._sub(o.sublistId);
        lines.splice(o.line == null ? lines.length : o.line, 0, {});
        return this;
      }
      removeLine(o) { this._line(o); this._sub(o.sublistId).splice(o.line, 1); return this; }
      findSublistLineWithValue(o) { return this._sub(o.sublistId).findIndex((l) => String(l[o.fieldId]) === String(o.value)); }
      _needDynamic(fn) { if (!this.isDynamic) throw nsErr('SSS_INVALID_API_USAGE', fn + ' only works in dynamic mode. Create or load the record with isDynamic: true, or use setSublistValue with a line number.'); }
      selectNewLine(o) { this._needDynamic('selectNewLine'); this._sub(o.sublistId); this._current[o.sublistId] = { line: null, values: {} }; return this; }
      selectLine(o) { this._needDynamic('selectLine'); const l = this._line(o); this._current[o.sublistId] = { line: o.line, values: Object.assign({}, l) }; return this; }
      _cur(id) { const c = this._current[id]; if (!c) throw nsErr('SSS_INVALID_API_USAGE', 'Call selectNewLine or selectLine before setting current line values.'); return c; }
      setCurrentSublistValue(o) {
        this._needDynamic('setCurrentSublistValue');
        const c = this._cur(o.sublistId);
        c.values[o.fieldId] = o.value;
        if (o.fieldId === 'item') {
          const it = env.db.item[Number(o.value)];
          if (it) { c.values.rate = it.values.baseprice; c.values.description = it.values.displayname; }
        }
        if (c.values.quantity != null && c.values.rate != null) c.values.amount = round2(c.values.quantity * c.values.rate);
        return this;
      }
      getCurrentSublistValue(o) { const v = this._cur(o.sublistId).values[o.fieldId]; return v === undefined ? '' : v; }
      commitLine(o) {
        this._needDynamic('commitLine');
        const c = this._cur(o.sublistId);
        if (!c.values.item) throw nsErr('USER_ERROR', 'Please enter a value for item before committing the line.');
        if (c.values.quantity == null || c.values.quantity === '') c.values.quantity = 1;
        c.values.amount = round2(c.values.quantity * c.values.rate);
        const lines = this._sub(o.sublistId);
        if (c.line == null) lines.push(c.values); else lines[c.line] = c.values;
        delete this._current[o.sublistId];
        return this;
      }
      cancelLine(o) { delete this._current[o.sublistId]; return this; }
      save(opts) {
        if (this._readOnly) throw nsErr('SSS_INVALID_API_USAGE', 'This record object is read-only here and can\'t be saved.');
        env.charge(COST.save[this._schema.family], 'record.save');
        return commit(this);
      }
      toJSON() { return { id: this._id, type: this.type, fields: this._values, sublists: this._lines }; }
    }

    function commit(r, opts) {
      const table = tableFor(r.type);
      const isNew = r._id == null;
      const values = Object.assign({}, r._values);
      if (r._schema.family === 'transaction') {
        values._type = r.type;
        if (!values.entity) throw nsErr('USER_ERROR', 'Please enter value(s) for: Customer (entity)');
        if (r._lines.item && r._lines.item.length === 0) throw nsErr('USER_ERROR', 'You must enter at least one line item for this transaction.');
        (r._lines.item || []).forEach((l, i) => {
          if (!l.item) throw nsErr('USER_ERROR', 'Line ' + i + ' is missing an item.');
          const it = env.db.item[Number(l.item)];
          if (!it) throw nsErr('INVALID_KEY_OR_REF', 'Invalid item reference key ' + l.item + ' on line ' + i + '.');
          if (l.rate === undefined || l.rate === '') l.rate = it.values.baseprice;
          if (l.quantity === undefined || l.quantity === '') l.quantity = 1;
        });
        if (!values.trandate) values.trandate = today();
        if (r.type === 'salesorder' && !values.orderstatus) values.orderstatus = 'B';
        if (r.type === 'invoice' && !values.status) values.status = 'A';
        if (r.type === 'purchaseorder' && !values.approvalstatus) values.approvalstatus = 'A';
        if (!values.subsidiary) values.subsidiary = 2;
      }
      if (r.type === 'customer' && !values.companyname) throw nsErr('USER_ERROR', 'Please enter value(s) for: Company Name (companyname)');
      if (r.type === 'customer' && !values.subsidiary) throw nsErr('USER_ERROR', 'Please enter value(s) for: Primary Subsidiary (subsidiary)');
      if (r.type === 'task' && !values.title) throw nsErr('USER_ERROR', 'Please enter value(s) for: Title (title)');
      Object.keys(values).forEach((k) => {
        const def = r._schema.fields[k];
        const v = values[k];
        if (!def || def.kind !== 'select' || !def.rec || v === '' || v == null) return;
        const t2 = def.rec === 'transaction' ? 'transaction' : tableFor(def.rec);
        if (t2 && !env.db[t2][Number(v)]) throw nsErr('INVALID_KEY_OR_REF', 'Invalid ' + k + ' reference key ' + v + '. No ' + def.rec + ' with that internal ID exists in this account.');
      });
      const id = isNew ? nextId(env, table) : r._id;
      if (r._schema.family === 'transaction' && isNew) values.tranid = TYPES[r.type].prefix + id;
      if (r.type === 'invoice' && values.amountremaining === undefined) values.amountremaining = null;
      const row = { id, values, lines: r._lines.item ? r._lines.item.map((l) => Object.assign({}, l)) : null };
      recalc(row);
      if (r.type === 'invoice' && row.values.amountremaining == null) row.values.amountremaining = row.values.total;
      if (r.type === 'customer' && values.custentity_open_balance === undefined) row.values.custentity_open_balance = 0;
      env.db[table][id] = row;
      r._id = id;
      r._values = Object.assign({}, row.values);
      if (row.lines) r._lines.item = row.lines.map((l) => Object.assign({}, l));
      return id;
    }

    function load(o) {
      o = o || {};
      checkType(o.type);
      if (o.id == null || o.id === '') throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'record.load needs an id.');
      env.charge(COST.load[familyFor(o.type)], 'record.load');
      const row = findRow(env, o.type, o.id);
      if (!row) throw nsErr('RCRD_DSNT_EXIST', 'That record does not exist. No ' + o.type + ' with internal ID ' + o.id + '. Check Sample data.');
      return new Record(o.type, cloneValues(row.values), row.lines ? row.lines.map((l) => Object.assign({}, l)) : null, { id: row.id, isDynamic: o.isDynamic });
    }
    function create(o) {
      o = o || {};
      checkType(o.type);
      env.charge(COST.create[familyFor(o.type)], 'record.create');
      const values = {};
      if (o.defaultValues) Object.assign(values, o.defaultValues);
      if (ITEM_TYPES[String(o.type).toLowerCase()]) values.itemtype = ITEM_TYPES[String(o.type).toLowerCase()];
      return new Record(o.type, values, null, { isDynamic: o.isDynamic });
    }
    function copy(o) {
      const r = load(Object.assign({}, o));
      env.calls['record.load']--; env.note('record.copy');
      r._id = null; r._values.tranid = '';
      return r;
    }
    function submitFields(o) {
      o = o || {};
      checkType(o.type);
      env.charge(COST.submitFields[familyFor(o.type)], 'record.submitFields');
      const row = findRow(env, o.type, o.id);
      if (!row) throw nsErr('RCRD_DSNT_EXIST', 'That record does not exist: ' + o.type + ' ' + o.id);
      const schema = schemaFor(o.type);
      Object.keys(o.values || {}).forEach((k) => {
        if (!schema.fields[k] && !/^cust/.test(k)) env.warnings.push("Field '" + k + "' doesn't exist on " + o.type + '.');
        row.values[k] = o.values[k];
      });
      return Number(o.id);
    }
    function del(o) {
      checkType(o.type);
      env.charge(COST.delete[familyFor(o.type)], 'record.delete');
      const row = findRow(env, o.type, o.id);
      if (!row) throw nsErr('RCRD_DSNT_EXIST', 'That record does not exist: ' + o.type + ' ' + o.id);
      delete env.db[tableFor(o.type)][row.id];
      return Number(o.id);
    }
    function transform(o) {
      o = o || {};
      checkType(o.fromType); checkType(o.toType);
      env.charge(COST.transform[familyFor(o.fromType)], 'record.transform');
      const row = findRow(env, o.fromType, o.fromId);
      if (!row) throw nsErr('RCRD_DSNT_EXIST', 'Source record does not exist: ' + o.fromType + ' ' + o.fromId);
      const from = String(o.fromType).toLowerCase(), to = String(o.toType).toLowerCase();
      if (!(from === 'salesorder' && to === 'invoice')) throw nsErr('INVALID_TRANSFORM', 'Code Lab supports transforming salesorder → invoice.');
      if (row.values.orderstatus === 'A') throw nsErr('INVALID_INITIALIZE_REF', 'You can not initialize invoice: invalid reference ' + o.fromId + '. The sales order is still Pending Approval.');
      if (row.values.orderstatus === 'G') throw nsErr('INVALID_INITIALIZE_REF', 'Sales order ' + row.values.tranid + ' is already fully billed.');
      const v = row.values;
      const values = { entity: v.entity, trandate: today(), duedate: daysFromToday(30), createdfrom: row.id, memo: v.memo, subsidiary: v.subsidiary, location: v.location, terms: v.terms };
      const r = new Record('invoice', values, row.lines.map((l) => Object.assign({}, l)), { isDynamic: o.isDynamic });
      r._afterSave = () => { row.values.orderstatus = 'G'; };
      const origSave = r.save.bind(r);
      r.save = (opts) => { const id = origSave(opts); r._afterSave(); return id; };
      return r;
    }

    return { Type, load, create, copy, submitFields, delete: del, transform, Record, _commit: commit, _make: (t, v, l, opt) => new Record(t, v, l, opt) };
  }

  function cloneValues(v) {
    const out = {};
    Object.keys(v).forEach((k) => { out[k] = v[k] instanceof Date ? new Date(v[k].getTime()) : v[k]; });
    return out;
  }

  // ---------- N/search ----------
  const JOINS = { customer: 'entity', customermain: 'entity', vendor: 'entity', item: 'item', createdfrom: 'createdfrom', salesrep: 'salesrep', employee: 'employee', assigned: 'assigned', transaction: 'transaction', company: 'company', custrecord_warranty_customer: 'custrecord_warranty_customer', custrecord_claim_warranty: 'custrecord_claim_warranty' };

  function makeSearchModule(env) {
    const Type = { SALES_ORDER: 'salesorder', INVOICE: 'invoice', PURCHASE_ORDER: 'purchaseorder', TRANSACTION: 'transaction', CUSTOMER: 'customer', VENDOR: 'vendor', EMPLOYEE: 'employee', ITEM: 'item', INVENTORY_ITEM: 'inventoryitem', TASK: 'task' };
    const Operator = { IS: 'is', ISNOT: 'isnot', ANYOF: 'anyof', NONEOF: 'noneof', EQUALTO: 'equalto', NOTEQUALTO: 'notequalto', GREATERTHAN: 'greaterthan', GREATERTHANOREQUALTO: 'greaterthanorequalto', LESSTHAN: 'lessthan', LESSTHANOREQUALTO: 'lessthanorequalto', CONTAINS: 'contains', DOESNOTCONTAIN: 'doesnotcontain', STARTSWITH: 'startswith', ISEMPTY: 'isempty', ISNOTEMPTY: 'isnotempty', ON: 'on', BEFORE: 'before', AFTER: 'after', ONORBEFORE: 'onorbefore', ONORAFTER: 'onorafter', WITHIN: 'within', BETWEEN: 'between' };
    const Summary = { GROUP: 'GROUP', COUNT: 'COUNT', SUM: 'SUM', AVG: 'AVG', MIN: 'MIN', MAX: 'MAX' };
    const Sort = { ASC: 'ASC', DESC: 'DESC', NONE: 'NONE' };

    function createColumn(o) {
      if (typeof o === 'string') o = { name: o };
      if (!o || !o.name) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'search.createColumn needs a name.');
      return { name: String(o.name).toLowerCase(), join: o.join ? String(o.join).toLowerCase() : null, summary: o.summary ? String(o.summary).toUpperCase() : null, sort: o.sort || null, label: o.label || o.name, formula: o.formula };
    }
    function createFilter(o) {
      return { _filter: true, name: String(o.name).toLowerCase(), join: o.join ? String(o.join).toLowerCase() : null, operator: String(o.operator).toLowerCase(), values: Array.isArray(o.values) ? o.values : (o.values === undefined ? [] : [o.values]) };
    }
    function normColumn(c) {
      if (typeof c === 'string') {
        const parts = c.split('.');
        return parts.length === 2 ? createColumn({ name: parts[1], join: parts[0] }) : createColumn({ name: c });
      }
      return createColumn(c);
    }

    // Each search "row" is { type, row, line } where line is null for the main line.
    function rowsFor(type) {
      const t = String(type).toLowerCase();
      if (t === 'transaction' || (TYPES[t] && TYPES[t].family === 'transaction')) {
        const out = [];
        Object.values(env.db.transaction).forEach((r) => {
          if (t !== 'transaction' && r.values._type !== t) return;
          out.push({ type: r.values._type, row: r, line: null });
          (r.lines || []).forEach((l, i) => out.push({ type: r.values._type, row: r, line: l, lineNo: i }));
        });
        return out;
      }
      const table = tableFor(t);
      if (!table) throw nsErr('SSS_INVALID_SRCH_TYPE', 'Search type ' + type + " isn't available in Code Lab.");
      return Object.values(env.db[table])
        .filter((r) => !(ITEM_TYPES[t] && r.values.itemtype !== ITEM_TYPES[t]))
        .map((r) => ({ type: t === 'item' || ITEM_TYPES[t] ? (Object.keys(ITEM_TYPES).find((k) => ITEM_TYPES[k] === r.values.itemtype) || 'item') : t, row: r, line: null }));
    }

    function fieldDef(srow, name) {
      const s = schemaFor(srow.type) || {};
      if (srow.line && ITEM_LINES[name]) return ITEM_LINES[name];
      return (s.fields || {})[name];
    }

    function rawValue(srow, name, join) {
      if (join) {
        const via = JOINS[join] || join;
        const ref = rawValue(srow, via, null).v;
        if (ref === '' || ref == null) return { v: '', def: null };
        const def = fieldDef(srow, via) || { rec: join === 'customer' || join === 'customermain' ? 'customer' : join };
        let targetType = def.rec || join;
        let table = targetType === 'transaction' ? 'transaction' : tableFor(targetType);
        if (!table && (join === 'customer' || join === 'customermain')) table = 'customer';
        const target = table && env.db[table][Number(ref)];
        if (!target) return { v: '', def: null };
        const ttype = table === 'transaction' ? target.values._type : (table === 'item' ? 'item' : table);
        return rawValue({ type: ttype, row: target, line: null }, name, null);
      }
      const v = srow.row.values;
      const ttype = srow.type;
      if (name === 'internalid') return { v: srow.row.id, def: null };
      if (name === 'mainline') return { v: srow.line === null, def: BOOL };
      if (name === 'recordtype') return { v: srow.type, def: null };
      if (name === 'type' && TYPES[ttype] && TYPES[ttype].family === 'transaction') return { v: TYPES[ttype].code, def: null, text: { SalesOrd: 'Sales Order', CustInvc: 'Invoice', PurchOrd: 'Purchase Order' }[TYPES[ttype].code] };
      if (name === 'type' && ttype !== 'task' && tableFor(ttype) === 'item') return { v: v.itemtype, def: null };
      if (name === 'status' && TYPES[ttype] && TYPES[ttype].family === 'transaction') {
        const code = TYPES[ttype].code;
        const letter = ttype === 'salesorder' ? v.orderstatus : ttype === 'purchaseorder' ? v.approvalstatus : v.status;
        const text = statusText(v);
        return { v: code + ':' + letter, def: null, text, display: text.replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/).map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join('') };
      }
      if (srow.line) {
        if (['item', 'quantity', 'rate', 'description', 'custcol_engraving'].includes(name)) return { v: srow.line[name], def: ITEM_LINES[name] };
        if (name === 'amount') return { v: srow.line.amount, def: CUR };
        if (name === 'line') return { v: srow.lineNo + 1, def: NUM };
      } else if (name === 'amount' && TYPES[ttype] && TYPES[ttype].family === 'transaction') {
        return { v: v.total, def: CUR };
      } else if (['item', 'quantity', 'rate'].includes(name) && TYPES[ttype] && TYPES[ttype].family === 'transaction') {
        return { v: '', def: ITEM_LINES[name] };
      }
      if (name === 'name' && (ttype === 'customer' || ttype === 'vendor' || ttype === 'employee')) return { v: v.entityid, def: TEXT };
      if (name === 'firstname' || name === 'lastname' || name in v) return { v: v[name], def: fieldDef(srow, name) };
      if (name === 'formulatext' || name === 'formulanumeric') return { v: '', def: null };
      env.warnings.push("Search column/filter '" + name + "' isn't a field on " + ttype + ' here. It returned empty.');
      return { v: '', def: null };
    }

    function asString(x) {
      if (x.v instanceof Date) return fmtDate(x.v);
      if (typeof x.v === 'boolean') return x.v;
      if (x.v === null || x.v === undefined) return '';
      if (x.display !== undefined) return x.display;
      return String(x.v);
    }

    const OPS = new Set(Object.values(Operator));
    function evalTerm(srow, name, op, vals) {
      let field = name, join = null;
      if (name.includes('.')) { [join, field] = name.split('.'); }
      const x = rawValue(srow, field.toLowerCase(), join);
      const v = x.v;
      const first = vals[0];
      const asBool = (q) => q === true || q === 'T' || q === 't' || q === 'true';
      const num = (q) => Number(q);
      const isEmpty = v === '' || v === null || v === undefined;
      switch (op) {
        case 'is':
          if (typeof v === 'boolean') return v === asBool(first);
          return String(v).toLowerCase() === String(first).toLowerCase();
        case 'isnot': return !evalTerm(srow, name, 'is', vals);
        case 'anyof': {
          const list = vals.flat().map(String);
          if (list.includes('@NONE@') && isEmpty) return true;
          return list.map((s) => s.toLowerCase()).includes(String(v).toLowerCase());
        }
        case 'noneof': return !evalTerm(srow, name, 'anyof', vals);
        case 'equalto': return !isEmpty && num(v) === num(first);
        case 'notequalto': return isEmpty || num(v) !== num(first);
        case 'greaterthan': return !isEmpty && num(v) > num(first);
        case 'greaterthanorequalto': return !isEmpty && num(v) >= num(first);
        case 'lessthan': return !isEmpty && num(v) < num(first);
        case 'lessthanorequalto': return !isEmpty && num(v) <= num(first);
        case 'contains': return String(v).toLowerCase().includes(String(first).toLowerCase());
        case 'doesnotcontain': return !String(v).toLowerCase().includes(String(first).toLowerCase());
        case 'startswith': return String(v).toLowerCase().startsWith(String(first).toLowerCase());
        case 'isempty': return isEmpty;
        case 'isnotempty': return !isEmpty;
        case 'on': case 'before': case 'after': case 'onorbefore': case 'onorafter': case 'within': {
          if (!(v instanceof Date)) return false;
          const a = parseDate(first);
          if (!a) throw nsErr('INVALID_SRCH_FILTER_EXPR', 'Could not read the date ' + JSON.stringify(first) + ". Use 'today', 'daysago30', a Date, or M/D/YYYY.");
          const t = v.getTime(), at = a.getTime();
          if (op === 'on') return t === at;
          if (op === 'before') return t < at;
          if (op === 'after') return t > at;
          if (op === 'onorbefore') return t <= at;
          if (op === 'onorafter') return t >= at;
          const b = parseDate(vals[1]);
          return t >= at && b && t <= b.getTime();
        }
        default:
          throw nsErr('SSS_INVALID_SRCH_OPERATOR', 'Unknown search operator: ' + op);
      }
    }

    function isTerm(a) { return Array.isArray(a) && typeof a[0] === 'string' && typeof a[1] === 'string' && OPS.has(a[1].toLowerCase()); }
    function evalExpr(srow, expr) {
      if (isTerm(expr)) return evalTerm(srow, expr[0].toLowerCase(), expr[1].toLowerCase(), expr.slice(2));
      if (expr && expr._filter) return evalTerm(srow, expr.join ? expr.join + '.' + expr.name : expr.name, expr.operator, expr.values);
      if (!Array.isArray(expr)) throw nsErr('INVALID_SRCH_FILTER_EXPR', 'Filters must be an array, e.g. [["mainline", "is", "T"], "AND", ["entity", "anyof", 101]]');
      if (expr.length === 0) return true;
      if (expr[0] === 'NOT' || expr[0] === 'not') return !evalExpr(srow, expr[1]);
      const hasJoiners = expr.some((e) => typeof e === 'string');
      if (!hasJoiners) return expr.every((e) => evalExpr(srow, e));
      let result = evalExpr(srow, expr[0]);
      for (let i = 1; i < expr.length; i += 2) {
        const joiner = String(expr[i]).toUpperCase();
        const next = expr[i + 1];
        if (next === undefined) throw nsErr('INVALID_SRCH_FILTER_EXPR', 'Filter expression ends with ' + joiner + '.');
        if (joiner === 'AND') result = result && evalExpr(srow, next);
        else if (joiner === 'OR') result = result || evalExpr(srow, next);
        else throw nsErr('INVALID_SRCH_FILTER_EXPR', "Expected 'AND' or 'OR' between filters, got " + JSON.stringify(expr[i]) + '. Did you forget a comma or an AND?');
      }
      return result;
    }

    class Result {
      constructor(srow, columns, summaryValues) {
        this._srow = srow; this.columns = columns; this._summary = summaryValues;
        this.id = srow ? String(srow.row.id) : null;
        this.recordType = srow ? srow.type : null;
      }
      _col(a) {
        if (typeof a === 'string') {
          const parts = a.split('.');
          const c = this.columns.find((k) => k.name === a.toLowerCase() && !k.join) || (parts.length === 2 ? this.columns.find((k) => k.name === parts[1] && k.join === parts[0]) : null);
          return c || createColumn({ name: a });
        }
        const n = createColumn(a);
        return this.columns.find((k) => k.name === n.name && (k.join || null) === (n.join || null) && (!n.summary || k.summary === n.summary)) || n;
      }
      getValue(a) {
        const c = this._col(a);
        if (this._summary) {
          const k = colKey(c);
          if (!(k in this._summary)) return null;
          return this._summary[k].value;
        }
        return asString(rawValue(this._srow, c.name, c.join));
      }
      getText(a) {
        const c = this._col(a);
        if (this._summary) { const k = colKey(c); return k in this._summary ? this._summary[k].text : null; }
        const x = rawValue(this._srow, c.name, c.join);
        if (x.text !== undefined) return x.text;
        if (x.def && x.def.kind === 'select') return displayOf(env, x.def, x.v);
        return null;
      }
      toJSON() {
        const values = {};
        this.columns.forEach((c) => {
          const key = (c.join ? c.join + '.' : '') + c.name;
          const v = this.getValue(c); const t = this.getText(c);
          values[c.summary ? c.summary + '(' + key + ')' : key] = t != null && t !== v ? { value: v, text: t } : v;
        });
        return { recordType: this.recordType, id: this.id, values };
      }
    }
    function colKey(c) { return (c.summary || '') + ':' + (c.join || '') + '.' + c.name; }

    function execute(s) {
      let rows = rowsFor(s.searchType).filter((r) => evalExpr(r, s.filters));
      const cols = s.columns;
      if (cols.some((c) => c.summary)) {
        const groups = new Map();
        rows.forEach((r) => {
          const key = cols.filter((c) => c.summary === 'GROUP').map((c) => String(rawValue(r, c.name, c.join).v)).join('|');
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(r);
        });
        const out = [];
        groups.forEach((members) => {
          const sv = {};
          cols.forEach((c) => {
            const vals = members.map((m) => rawValue(m, c.name, c.join));
            let value, text = null;
            const nums = vals.map((x) => Number(x.v) || 0);
            switch (c.summary) {
              case 'GROUP': value = asString(vals[0]); { const x = vals[0]; text = x.text !== undefined ? x.text : (x.def && x.def.kind === 'select' ? displayOf(env, x.def, x.v) : null); } break;
              case 'COUNT': value = String(members.length); break;
              case 'SUM': value = String(round2(nums.reduce((a, b) => a + b, 0))); break;
              case 'AVG': value = String(round2(nums.reduce((a, b) => a + b, 0) / (nums.length || 1))); break;
              case 'MIN': value = String(Math.min(...nums)); break;
              case 'MAX': value = String(Math.max(...nums)); break;
              default: throw nsErr('SSS_INVALID_SRCH_COLUMN_SUM', 'When any column has a summary, every column needs one (GROUP, SUM, COUNT...). Column ' + c.name + ' has none.');
            }
            sv[colKey(c)] = { value, text };
          });
          out.push(new Result(null, cols, sv));
        });
        return out;
      }
      const sortCol = cols.find((c) => c.sort && c.sort !== 'NONE');
      if (sortCol) {
        const dir = sortCol.sort === 'DESC' ? -1 : 1;
        rows = rows.slice().sort((a, b) => {
          const x = rawValue(a, sortCol.name, sortCol.join).v, y = rawValue(b, sortCol.name, sortCol.join).v;
          const xv = x instanceof Date ? x.getTime() : (isNaN(Number(x)) ? String(x) : Number(x));
          const yv = y instanceof Date ? y.getTime() : (isNaN(Number(y)) ? String(y) : Number(y));
          return xv < yv ? -dir : xv > yv ? dir : 0;
        });
      }
      return rows.map((r) => new Result(r, cols));
    }

    function makeSearch(o) {
      const s = {
        searchType: String(o.type).toLowerCase(),
        filters: o.filters || [],
        columns: (o.columns || []).map(normColumn),
        id: o.id || null,
        title: o.title || null,
      };
      s.filterExpression = s.filters;
      s.run = () => {
        const results = execute(s);
        return {
          columns: s.columns,
          each(cb) {
            if (typeof cb !== 'function') throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'each() needs a callback function.');
            env.charge(10, 'ResultSet.each');
            const max = Math.min(results.length, 4000);
            let i = 0;
            for (; i < max; i++) {
              if (cb(results[i]) !== true) {
                if (i === 0 && results.length > 1) env.hints.push('each() stopped after the first result because the callback did not return true.');
                return;
              }
            }
            if (results.length > 4000) env.warnings.push('each() stopped at 4,000 results. Use runPaged() for bigger result sets.');
          },
          getRange(r) {
            const start = (r && r.start) || 0, end = r && r.end;
            if (end == null) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'getRange needs { start, end }.');
            if (end - start > 1000) throw nsErr('SSS_INVALID_SEARCH_RANGE', 'getRange can return at most 1,000 results per call.');
            env.charge(10, 'ResultSet.getRange');
            return results.slice(start, end);
          },
        };
      };
      s.runPaged = (p) => {
        const pageSize = (p && p.pageSize) || 50;
        if (pageSize < 5 || pageSize > 1000) throw nsErr('INVALID_PAGE_SIZE', 'pageSize must be between 5 and 1000.');
        env.charge(5, 'search.runPaged');
        const results = execute(s);
        const pages = [];
        for (let i = 0; i < results.length; i += pageSize) pages.push(results.slice(i, i + pageSize));
        return {
          count: results.length,
          pageSize,
          pageRanges: pages.map((pg, i) => ({ index: i, compoundLabel: String(i * pageSize + 1) + ' – ' + String(i * pageSize + pg.length) })),
          fetch(f) {
            const index = typeof f === 'number' ? f : f && f.index;
            if (!pages[index]) throw nsErr('INVALID_PAGE_RANGE', 'No page ' + index);
            env.charge(5, 'PagedData.fetch');
            return { data: pages[index], pageRange: { index }, isFirst: index === 0, isLast: index === pages.length - 1 };
          },
        };
      };
      s.runPaged.promise = undefined;
      s.save = () => { s.id = s.id || 'customsearch_' + Math.floor(Math.random() * 1000); env.note('search.save'); return 1; };
      return s;
    }

    const SAVED = {
      customsearch_open_orders: () => ({ type: 'salesorder', filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'SalesOrd:B']], columns: ['tranid', 'entity', 'trandate', 'amount'] }),
      customsearch_open_invoices: () => ({ type: 'invoice', filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'CustInvc:A']], columns: ['tranid', 'entity', 'duedate', 'amountremaining'] }),
    };

    return {
      Type, Operator, Summary, Sort,
      create(o) {
        if (!o || !o.type) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'search.create needs a type.');
        env.note('search.create');
        return makeSearch(o);
      },
      load(o) {
        const id = o && o.id;
        env.charge(5, 'search.load');
        if (!SAVED[id]) throw nsErr('INVALID_SEARCH', 'Saved search ' + id + ' not found. Available: ' + Object.keys(SAVED).join(', '));
        return makeSearch(Object.assign({ id }, SAVED[id]()));
      },
      lookupFields(o) {
        o = o || {};
        env.charge(1, 'search.lookupFields');
        const row = findRow(env, o.type, o.id);
        if (!row) throw nsErr('RCRD_DSNT_EXIST', 'lookupFields: no ' + o.type + ' with id ' + o.id);
        const srow = { type: String(o.type).toLowerCase(), row, line: null };
        const out = {};
        [].concat(o.columns || []).forEach((name) => {
          const parts = String(name).split('.');
          const x = parts.length === 2 ? rawValue(srow, parts[1].toLowerCase(), parts[0].toLowerCase()) : rawValue(srow, String(name).toLowerCase(), null);
          if (x.def && x.def.kind === 'select') out[name] = x.v === '' || x.v == null ? [] : [{ value: String(x.v), text: displayOf(env, x.def, x.v) }];
          else if (x.text !== undefined) out[name] = [{ value: x.v, text: x.text }];
          else out[name] = asString(x);
        });
        return out;
      },
      createColumn, createFilter,
      _resultsToJSON: (s) => execute(s).map((r) => r.toJSON()),
      _isSearch: (s) => s && typeof s.run === 'function' && 'searchType' in s,
    };
  }

  // ---------- N/query (SuiteQL via alasql) ----------
  function makeQueryModule(env) {
    function tables() {
      const T = (b) => (b ? 'T' : 'F');
      const tx = [], tl = [];
      Object.values(env.db.transaction).forEach((r) => {
        const v = r.values;
        const s = TYPES[v._type];
        const letter = v._type === 'salesorder' ? v.orderstatus : v._type === 'purchaseorder' ? v.approvalstatus : v.status;
        tx.push({
          id: r.id, tranid: v.tranid, type: s.code, type__display: { SalesOrd: 'Sales Order', CustInvc: 'Invoice', PurchOrd: 'Purchase Order' }[s.code],
          entity: v.entity, entity__display: displayOf(env, rec('customer'), v.entity) || displayOf(env, rec('vendor'), v.entity),
          trandate: v.trandate, duedate: v.duedate || null, status: letter, status__display: statusText(v), memo: v.memo || '',
          foreigntotal: v.total, total: v.total, foreignamountremaining: v.amountremaining == null ? null : v.amountremaining, amountremaining: v.amountremaining == null ? null : v.amountremaining,
          createdfrom: v.createdfrom || null, otherrefnum: v.otherrefnum || '', subsidiary: v.subsidiary, location: v.location, location__display: LISTS.location[v.location] || '',
          custbody_rush_order: T(v.custbody_rush_order),
        });
        tl.push({ transaction: r.id, id: 0, linesequencenumber: 0, mainline: 'T', item: null, item__display: null, quantity: null, rate: null, netamount: v.total, foreignamount: v.total, amount: v.total });
        (r.lines || []).forEach((l, i) => tl.push({ transaction: r.id, id: i + 1, linesequencenumber: i + 1, mainline: 'F', item: l.item, item__display: displayOf(env, rec('item'), l.item), quantity: l.quantity, rate: l.rate, netamount: l.amount, foreignamount: l.amount, amount: l.amount }));
      });
      const customer = Object.values(env.db.customer).map((r) => Object.assign({ id: r.id }, r.values, { isinactive: T(r.values.isinactive), salesrep__display: displayOf(env, rec('employee'), r.values.salesrep), category__display: LISTS.customercategory[r.values.category] || '' }));
      const employee = Object.values(env.db.employee).map((r) => Object.assign({ id: r.id }, r.values, { isinactive: T(r.values.isinactive), supervisor__display: displayOf(env, rec('employee'), r.values.supervisor) }));
      const item = Object.values(env.db.item).map((r) => Object.assign({ id: r.id }, r.values, { isinactive: T(r.values.isinactive) }));
      const task = Object.values(env.db.task).map((r) => Object.assign({ id: r.id }, r.values));
      return { ns_transaction: tx, ns_transactionline: tl, ns_customer: customer, ns_employee: employee, ns_item: item, ns_task: task };
    }

    function translate(sql) {
      let q = String(sql);
      if (/^\s*(update|delete|insert|drop|create|alter)\b/i.test(q)) throw nsErr('SSS_SEARCH_ERROR_OCCURRED', 'SuiteQL is read-only. Use N/record to change data.');
      q = q.replace(/BUILTIN\.DF\s*\(\s*([\w.]+)\s*\)/gi, (m, f) => f + '__display');
      q = q.replace(/\bSYSDATE\b(?!\s*\()/gi, 'SYSDATE()');
      q = q.replace(/\b(FROM|JOIN)\s+(transactionline|transaction|customer|employee|item|task)\b/gi, (m, kw, t) => kw + ' ns_' + t.toLowerCase());
      return q;
    }

    function runSuiteQL(o) {
      const opts = typeof o === 'string' ? { query: o } : (o || {});
      if (!opts.query) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'runSuiteQL needs { query }.');
      env.charge(10, 'query.runSuiteQL');
      const alasql = root.alasql || (typeof require === 'function' ? require('./alasql.min.js') : null);
      if (!alasql) throw nsErr('UNEXPECTED_ERROR', 'SQL engine missing.');
      const db = new alasql.Database();
      const tbl = tables();
      Object.keys(tbl).forEach((name) => { db.exec('CREATE TABLE ' + name); db.tables[name].data = tbl[name]; });
      alasql.fn.SYSDATE = () => today();
      alasql.fn.ADD_MONTHS = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + Number(n)); return x; };
      alasql.fn.NVL = (a, b) => (a === null || a === undefined || a === '' ? b : a);
      alasql.fn.TO_CHAR = (d, fmt) => {
        if (!(d instanceof Date)) return d == null ? null : String(d);
        const p = (n) => String(n).padStart(2, '0');
        return String(fmt || 'MM/DD/YYYY').replace('YYYY', d.getFullYear()).replace('MM', p(d.getMonth() + 1)).replace('DD', p(d.getDate()));
      };
      alasql.fn.TO_DATE = (s) => parseDate(s);
      let rows;
      try {
        rows = db.exec(translate(opts.query), opts.params || []);
      } catch (e) {
        throw nsErr('SSS_SEARCH_ERROR_OCCURRED', 'SuiteQL error: ' + (e && e.message ? e.message.split('\n')[0] : e) + '. Tables here: transaction, transactionline, customer, employee, item, task.');
      }
      const mapped = rows.map((r) => {
        const out = {};
        Object.keys(r).forEach((k) => { const v = r[k]; out[k.toLowerCase().replace(/__display$/, '')] = v instanceof Date ? fmtDate(v) : v; });
        return out;
      });
      const keys = mapped.length ? Object.keys(mapped[0]) : [];
      return {
        columns: keys.map((k) => ({ fieldId: k, label: k })),
        results: mapped.map((m) => ({ values: keys.map((k) => m[k]), asMap: () => m })),
        asMappedResults: () => mapped,
      };
    }

    return {
      runSuiteQL,
      runSuiteQLPaged(o) {
        const all = runSuiteQL(o).asMappedResults();
        const size = (o && o.pageSize) || 50;
        const pages = [];
        for (let i = 0; i < all.length; i += size) pages.push(all.slice(i, i + size));
        return {
          count: all.length,
          pageRanges: pages.map((_, i) => ({ index: i })),
          fetch: (f) => { env.charge(5, 'PagedData.fetch'); const pg = pages[typeof f === 'number' ? f : f.index] || []; return { data: { asMappedResults: () => pg, results: pg.map((m) => ({ values: Object.values(m), asMap: () => m })) } }; },
        };
      },
      Type: { TRANSACTION: 'transaction', CUSTOMER: 'customer' },
      _translate: translate,
    };
  }

  // ---------- small modules ----------
  function makeLog(env) {
    const write = (level) => (a, b) => {
      let title, details;
      if (a && typeof a === 'object' && !Array.isArray(a) && ('title' in a || 'details' in a)) { title = a.title; details = a.details; } else { title = a; details = b; }
      const fmt = (x) => {
        if (x === undefined) return '';
        if (x instanceof Error) return x.name + ': ' + x.message;
        if (typeof x === 'object' && x !== null) { try { return JSON.stringify(x); } catch (e) { return String(x); } }
        return String(x);
      };
      env.logs.push({ level, title: fmt(title), details: fmt(details), stage: env.stage });
    };
    return { debug: write('DEBUG'), audit: write('AUDIT'), error: write('ERROR'), emergency: write('EMERGENCY') };
  }

  function makeRuntime(env) {
    const ContextType = { USER_INTERFACE: 'USERINTERFACE', CSV_IMPORT: 'CSVIMPORT', WEBSERVICES: 'WEBSERVICES', SCHEDULED: 'SCHEDULED', MAP_REDUCE: 'MAPREDUCE', RESTLET: 'RESTLET', SUITELET: 'SUITELET', USEREVENT: 'USEREVENT', CLIENT: 'CLIENT', WORKFLOW: 'WORKFLOW', MASS_UPDATE: 'MASSUPDATE' };
    return {
      ContextType,
      EnvType: { PRODUCTION: 'PRODUCTION', SANDBOX: 'SANDBOX' },
      get executionContext() { return env.executionContext; },
      envType: 'SANDBOX',
      accountId: '1234567_SB1',
      version: '2026.2',
      getCurrentScript() {
        return {
          id: 'customscript_codelab', deploymentId: 'customdeploy_codelab', logLevel: 'DEBUG',
          getParameter(o) {
            const name = typeof o === 'string' ? o : o && o.name;
            if (!name) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'getParameter needs { name }.');
            if (!/^custscript_/.test(name)) env.warnings.push('Script parameter IDs start with custscript_. You asked for ' + name + '.');
            env.note('getParameter:' + name);
            return name in env.params ? env.params[name] : null;
          },
          getRemainingUsage() { return Math.max(0, env.limit - env.used); },
        };
      },
      getCurrentUser() {
        return { id: 7, name: 'Quest Mullins', email: 'quest@example.com', role: 3, roleId: 'administrator', roleCenter: 'BASIC', subsidiary: 2, department: 0, location: 1, getPreference: () => null };
      },
      getCurrentSession: () => ({ get: () => null, set: () => {} }),
    };
  }

  function makeError() {
    return {
      create(o) { o = o || {}; const e = nsErr(o.name || 'CUSTOM_ERROR', o.message || ''); e.notifyOff = !!o.notifyOff; return e; },
      Type: {},
      SuiteScriptError,
    };
  }

  function makeFormat() {
    const Type = { DATE: 'date', DATETIME: 'datetime', CURRENCY: 'currency', FLOAT: 'float', INTEGER: 'integer', TEXT: 'text', PERCENT: 'percent' };
    return {
      Type,
      parse(o) {
        if (o.type === 'date' || o.type === 'datetime') { const d = parseDate(String(o.value)); if (!d) throw nsErr('INVALID_FLD_VALUE', 'Could not parse date ' + o.value + '. Expected M/D/YYYY.'); return d; }
        if (o.type === 'currency' || o.type === 'float' || o.type === 'percent') return parseFloat(String(o.value).replace(/[$,%]/g, ''));
        if (o.type === 'integer') return parseInt(o.value, 10);
        return o.value;
      },
      format(o) {
        if (o.type === 'date') return fmtDate(o.value instanceof Date ? o.value : new Date(o.value));
        if (o.type === 'datetime') { const d = o.value instanceof Date ? o.value : new Date(o.value); return fmtDate(d) + ' ' + d.toTimeString().slice(0, 5); }
        if (o.type === 'currency') return Number(o.value).toFixed(2);
        return String(o.value);
      },
    };
  }

  function makeEmail(env) {
    return {
      send(o) {
        o = o || {};
        if (!o.author) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'email.send needs an author (an employee internal ID).');
        if (!o.recipients) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'email.send needs recipients.');
        env.charge(20, 'email.send');
        env.emails.push({ author: o.author, recipients: [].concat(o.recipients), subject: o.subject || '', body: o.body || '', attachments: (o.attachments || []).map((a) => (a && a.name) || String(a)) });
      },
    };
  }

  function makeFile(env) {
    const Type = { CSV: 'CSV', PLAINTEXT: 'PLAINTEXT', JSON: 'JSON', HTMLDOC: 'HTMLDOC', PDF: 'PDF', XMLDOC: 'XMLDOC' };
    const mk = (o, id) => ({
      id: id || null, name: o.name, fileType: o.fileType, folder: o.folder, _contents: o.contents || '',
      getContents() { return this._contents; },
      save() {
        if (!this.folder && this.folder !== 0) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'Set file.folder (a folder internal ID) before save().');
        env.charge(20, 'file.save');
        const nid = this.id || (Object.keys(env.db.files).length + 900);
        this.id = nid;
        env.db.files[nid] = { id: nid, name: this.name, fileType: this.fileType, folder: this.folder, contents: this._contents };
        return nid;
      },
      get size() { return this._contents.length; },
    });
    return {
      Type,
      create(o) { o = o || {}; if (!o.name || !o.fileType) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'file.create needs name and fileType.'); env.note('file.create'); return mk(o); },
      load(o) {
        const id = typeof o === 'object' ? o.id : o;
        env.charge(10, 'file.load');
        const f = env.db.files[id];
        if (!f) throw nsErr('RCRD_DSNT_EXIST', 'No file with id ' + id);
        return mk({ name: f.name, fileType: f.fileType, folder: f.folder, contents: f.contents }, f.id);
      },
    };
  }

  function makeHttps(env) {
    const call = (method) => (o) => {
      o = o || {};
      if (!o.url) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'https.' + method + ' needs a url.');
      env.charge(10, 'https.' + method);
      env.https.push({ method: method.toUpperCase(), url: o.url, headers: o.headers || {}, body: o.body });
      const mock = env.httpMocks[o.url];
      if (typeof mock === 'function') return mock({ method: method.toUpperCase(), headers: o.headers || {}, body: o.body });
      if (mock) return mock;
      return { code: 404, body: '{"error":"No mock endpoint for ' + o.url + '"}', headers: {} };
    };
    return { get: call('get'), post: call('post'), put: call('put'), delete: call('delete'), request: (o) => call(String(o.method || 'get').toLowerCase())(o), Method: { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE' } };
  }

  function makeTask(env) {
    const TaskType = { SCHEDULED_SCRIPT: 'SCHEDULED_SCRIPT', MAP_REDUCE: 'MAP_REDUCE', CSV_IMPORT: 'CSV_IMPORT', SEARCH: 'SEARCH' };
    return {
      TaskType,
      create(o) {
        const t = Object.assign({}, o || {});
        t.submit = () => { env.charge(20, 'task.submit'); env.tasks.push({ taskType: t.taskType, scriptId: t.scriptId, deploymentId: t.deploymentId, params: t.params || {} }); return 'TASK_' + env.tasks.length; };
        return t;
      },
      checkStatus: () => ({ status: 'COMPLETE' }),
    };
  }

  function makeServerWidget(env) {
    const FieldType = { TEXT: 'text', TEXTAREA: 'textarea', INTEGER: 'integer', FLOAT: 'float', CURRENCY: 'currency', DATE: 'date', CHECKBOX: 'checkbox', SELECT: 'select', EMAIL: 'email', INLINEHTML: 'inlinehtml', LONGTEXT: 'longtext', HELP: 'help' };
    const FieldDisplayType = { NORMAL: 'normal', INLINE: 'inline', HIDDEN: 'hidden', DISABLED: 'disabled', READONLY: 'readonly' };
    function createForm(o) {
      const form = { _form: true, title: (o && o.title) || '', fields: [], buttons: [], submit: null, clientScriptModulePath: null };
      form.addField = (f) => {
        if (!f || !f.id || !f.type || !f.label) throw nsErr('SSS_MISSING_REQD_ARGUMENT', 'addField needs id, type and label.');
        if (!/^custpage_/.test(f.id)) throw nsErr('SSS_INVALID_FIELD_ID', "Field id '" + f.id + "' must start with custpage_.");
        const field = { id: f.id, type: f.type, label: f.label, source: f.source || null, isMandatory: false, defaultValue: '', displayType: 'normal', options: [] };
        field.updateDisplayType = (d) => { field.displayType = d.displayType; return field; };
        field.addSelectOption = (opt) => { field.options.push(opt); };
        form.fields.push(field);
        return field;
      };
      form.addSubmitButton = (b) => { form.submit = { label: (b && b.label) || 'Submit' }; return form.submit; };
      form.addButton = (b) => { const btn = { id: b.id, label: b.label, functionName: b.functionName || null }; form.buttons.push(btn); return btn; };
      form.addFieldGroup = () => ({});
      form.addSublist = (s) => ({ id: s.id, addField: () => ({}), setSublistValue: () => {} });
      return form;
    }
    return { createForm, FieldType, FieldDisplayType, createList: (o) => ({ title: o.title, addColumn: () => ({}), addRow: () => {}, addRows: () => {} }) };
  }

  // ---------- module wiring ----------
  const MODULES = ['N/record', 'N/search', 'N/query', 'N/log', 'N/runtime', 'N/error', 'N/format', 'N/email', 'N/file', 'N/https', 'N/http', 'N/task', 'N/ui/serverWidget', 'N/redirect', 'N/url', 'N/ui/dialog', 'N/ui/message', 'N/currentRecord'];

  function makeModules(env) {
    const m = {};
    m['N/record'] = makeRecordModule(env);
    m['N/search'] = makeSearchModule(env);
    m['N/query'] = makeQueryModule(env);
    m['N/log'] = makeLog(env);
    m['N/runtime'] = makeRuntime(env);
    m['N/error'] = makeError();
    m['N/format'] = makeFormat();
    m['N/email'] = makeEmail(env);
    m['N/file'] = makeFile(env);
    m['N/https'] = makeHttps(env);
    m['N/http'] = m['N/https'];
    m['N/task'] = makeTask(env);
    m['N/ui/serverWidget'] = makeServerWidget(env);
    m['N/redirect'] = {
      toRecord(o) { env.redirect = { type: o.type, id: o.id }; },
      toSuitelet(o) { env.redirect = { scriptId: o.scriptId, deploymentId: o.deploymentId }; },
      redirect(o) { env.redirect = { url: o.url }; },
    };
    m['N/url'] = {
      resolveRecord: (o) => '/app/common/entity/' + o.recordType + '.nl?id=' + o.recordId + (o.isEditMode ? '&e=T' : ''),
      resolveScript: (o) => '/app/site/hosting/scriptlet.nl?script=' + o.scriptId + '&deploy=' + o.deploymentId,
    };
    m['N/ui/dialog'] = {
      alert(o) { env.dialogs.push({ kind: 'alert', title: o && o.title, message: o && o.message }); return Promise.resolve(true); },
      confirm(o) { env.dialogs.push({ kind: 'confirm', title: o && o.title, message: o && o.message }); return Promise.resolve(true); },
    };
    m['N/ui/message'] = { create: (o) => ({ show: () => env.dialogs.push({ kind: 'message', title: o.title, message: o.message }) }), Type: { CONFIRMATION: 0, INFORMATION: 1, WARNING: 2, ERROR: 3 } };
    m['N/currentRecord'] = { get: () => env.currentRecord };
    return m;
  }

  function resolve(mods, name) {
    if (!(name in mods)) {
      throw nsErr('MODULE_DOES_NOT_EXIST', "Module '" + name + "' isn't available in Code Lab. Available: " + MODULES.join(', '));
    }
    return mods[name];
  }

  // ---------- running scripts ----------
  function scriptInfo(code) {
    const t = code.match(/@NScriptType\s+(\w+)/);
    const v = code.match(/@NApiVersion\s+([\d.x]+)/);
    return { scriptType: t ? t[1] : null, apiVersion: v ? v[1] : null };
  }

  function errorInfo(e) {
    if (!e) return { name: 'Error', message: 'Unknown error' };
    let line = null;
    const m = String(e.stack || '').match(/<anonymous>:(\d+):(\d+)/);
    if (m) line = Math.max(1, Number(m[1]) - 4);
    return { name: e.name || 'Error', message: e.message || String(e), line };
  }

  // Compiles user code. Returns { entry, plainRan } where entry is what define() returned.
  function compile(code, env, mods) {
    let entry = null, defined = false;
    const define = (deps, factory) => {
      if (typeof deps === 'function') { factory = deps; deps = []; }
      if (!Array.isArray(deps) || typeof factory !== 'function') throw nsErr('SSS_INVALID_DEFINE', 'define() expects (["N/record", ...], (record, ...) => { ... })');
      defined = true;
      entry = factory.apply(null, deps.map((d) => resolve(mods, d)));
    };
    const req = (deps, cb) => {
      if (typeof deps === 'string') return resolve(mods, deps);
      const got = deps.map((d) => resolve(mods, d));
      if (cb) cb.apply(null, got);
      return got;
    };
    const consoleShim = {
      log: (...a) => env.logs.push({ level: 'CONSOLE', title: a.map((x) => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '), details: '', stage: env.stage }),
    };
    consoleShim.info = consoleShim.log; consoleShim.warn = consoleShim.log; consoleShim.error = consoleShim.log;
    const names = ['define', 'require', 'console', 'record', 'search', 'query', 'log', 'runtime', 'error', 'format', 'email', 'file', 'https', 'task', 'serverWidget'];
    const values = [define, req, consoleShim, mods['N/record'], mods['N/search'], mods['N/query'], mods['N/log'], mods['N/runtime'], mods['N/error'], mods['N/format'], mods['N/email'], mods['N/file'], mods['N/https'], mods['N/task'], mods['N/ui/serverWidget']];
    // eslint-disable-next-line no-new-func
    // The block lets scripts declare their own `task`, `file` or `record` variables.
    const fn = new Function(...names, '"use strict";\n{\n' + code + '\n}\n');
    fn(...values);
    return { entry, defined };
  }

  function run(code, opts) {
    const o = opts || {};
    const info = scriptInfo(code);
    const scriptType = o.forceType || (info.scriptType || (/\bdefine\s*\(/.test(code) ? 'Module' : 'Playground'));
    const env = makeEnv({ db: o.db, params: o.params, limit: LIMITS[scriptType] || 10000, scriptType, httpMocks: o.httpMocks, executionContext: o.executionContext });
    if (o.setup) o.setup(env.db, env);
    const mods = makeModules(env);
    const result = { scriptType, apiVersion: info.apiVersion, limit: env.limit, runs: [], env, ok: true, error: null, returned: undefined, entry: null };

    function guard(fn) {
      try { return { value: fn() }; } catch (e) { return { error: errorInfo(e), raw: e }; }
    }

    env.stage = 'compile';
    const compiled = guard(() => compile(code, env, mods));
    if (compiled.error) { result.ok = false; result.error = compiled.error; return finish(); }
    const entry = compiled.value.entry;
    result.entry = entry;
    if (compiled.value.defined && (entry === undefined || entry === null)) {
      result.ok = false;
      result.error = { name: 'NO_ENTRY_POINTS', message: 'Your define() callback returned nothing. Return your entry points, e.g. return { beforeSubmit };' };
      return finish();
    }
    const trigs = o.triggers || (o.trigger ? [o.trigger] : [null]);

    trigs.forEach((trig) => {
      if (!result.ok && result.error && !result.error.continue) return;
      const runRes = runOne(trig);
      result.runs.push(runRes);
      if (runRes.error && !runRes.expectedBlock) { result.ok = false; result.error = runRes.error; }
    });
    return finish();

    function finish() {
      result.logs = env.logs; result.warnings = env.warnings; result.hints = env.hints; result.calls = env.calls;
      result.unitsUsed = env.used; result.stageUsage = env.stageUsage; result.emails = env.emails; result.tasks = env.tasks;
      result.https = env.https; result.dialogs = env.dialogs; result.db = env.db;
      return result;
    }

    function runOne(trig) {
      const t = trig || {};
      const out = { trigger: t, returned: undefined, error: null, blocked: null };
      const base = env.used;
      env.limit = base + (LIMITS[scriptType] || 10000);
      const R = mods['N/record'];
      const need = (name) => {
        if (!entry || typeof entry[name] !== 'function') throw nsErr('MISSING_ENTRY_POINT', 'This test calls your ' + name + ' entry point, but your script doesn\'t return one. Add it to the object you return from define().');
        return entry[name];
      };
      const r = guard(() => {
        switch (scriptType) {
          case 'Playground':
          case 'Module':
            if (t.call) { env.stage = 'test'; out.returned = t.call(entry); }
            return;
          case 'UserEventScript': return runUserEvent(t, out, need, R);
          case 'ClientScript': {
            env.executionContext = 'USERINTERFACE';
            const values = Object.assign({}, t.values || {});
            const cr = R._make(t.recordType || 'salesorder', values, t.lines ? t.lines.map((l) => Object.assign({}, l)) : [], { isDynamic: true, id: t.id || null });
            env.currentRecord = cr;
            env.stage = t.entry;
            const ctx = { currentRecord: cr, fieldId: t.fieldId || null, sublistId: t.sublistId || null, line: t.line == null ? null : t.line, mode: t.mode || 'create' };
            out.returned = need(t.entry)(ctx);
            out.record = cr;
            return;
          }
          case 'ScheduledScript':
            env.executionContext = 'SCHEDULED'; env.stage = 'execute';
            out.returned = need('execute')({ type: t.type || 'ondemand' });
            return;
          case 'MapReduceScript': return runMapReduce(t, out, need);
          case 'Suitelet': {
            env.executionContext = 'SUITELET'; env.stage = 'onRequest';
            const written = [];
            const response = {
              write: (x) => { written.push(typeof x === 'object' ? (x.output !== undefined ? x.output : JSON.stringify(x)) : String(x)); },
              writePage: (form) => { out.page = form; },
              writeLine: (x) => written.push(String((x && x.output) || x) + '\n'),
              setHeader: () => {}, sendRedirect: (x) => { env.redirect = x; },
            };
            const request = { method: t.method || 'GET', parameters: t.parameters || {}, body: t.body || '', headers: t.headers || {} };
            need('onRequest')({ request, response });
            out.written = written.join('');
            out.redirect = env.redirect || null;
            env.redirect = null;
            return;
          }
          case 'Restlet': {
            env.executionContext = 'RESTLET';
            const method = (t.method || 'GET').toLowerCase();
            env.stage = method;
            const arg = method === 'get' || method === 'delete' ? (t.params || {}) : (t.contentType === 'text/plain' ? JSON.stringify(t.body) : (t.body || {}));
            out.returned = need(method)(arg);
            return;
          }
          case 'WorkflowActionScript': {
            env.executionContext = 'WORKFLOW'; env.stage = 'onAction';
            const row = findRow(env, t.recordType || 'purchaseorder', t.id || 3001);
            const nr = R._make(t.recordType || 'purchaseorder', cloneValues(row.values), row.lines.map((l) => Object.assign({}, l)), { id: row.id });
            out.returned = need('onAction')({ newRecord: nr, oldRecord: nr, type: t.type || 'edit', workflowId: 12 });
            return;
          }
          case 'MassUpdateScript':
            env.stage = 'each';
            (t.ids || []).forEach((id) => need('each')({ type: t.recordType, id }));
            return;
          default:
            throw nsErr('UNSUPPORTED_SCRIPT_TYPE', 'Code Lab can run UserEventScript, ClientScript, ScheduledScript, MapReduceScript, Suitelet, Restlet, WorkflowActionScript and MassUpdateScript. Got ' + scriptType + '.');
        }
      });
      if (r.error) out.error = r.error;
      out.unitsUsed = env.used - base;
      return out;
    }

    function runUserEvent(t, out, need, R) {
      env.executionContext = t.executionContext || 'USERINTERFACE';
      const event = t.event || 'create';
      const type = t.recordType || 'salesorder';
      const UserEventType = { CREATE: 'create', EDIT: 'edit', XEDIT: 'xedit', DELETE: 'delete', VIEW: 'view', COPY: 'copy', APPROVE: 'approve', PRINT: 'print', EMAIL: 'email' };
      let newRecord, oldRecord = null;
      if (event === 'create') {
        newRecord = R._make(type, Object.assign({}, t.values || {}), (t.lines || []).map((l) => Object.assign({}, l)), {});
        if (newRecord._lines.item) {
          newRecord._lines.item.forEach((l) => { const it = env.db.item[Number(l.item)]; if ((l.rate === undefined || l.rate === '') && it) l.rate = it.values.baseprice; if (l.quantity === undefined) l.quantity = 1; l.amount = round2(l.quantity * l.rate); });
          newRecord._values.total = round2(newRecord._lines.item.reduce((a, l) => a + (Number(l.amount) || 0), 0));
        }
      } else {
        const row = findRow(env, type, t.id);
        if (!row) throw nsErr('RCRD_DSNT_EXIST', 'Test record missing: ' + type + ' ' + t.id);
        oldRecord = R._make(type, cloneValues(row.values), row.lines ? row.lines.map((l) => Object.assign({}, l)) : null, { id: row.id, readOnly: true });
        const vals = event === 'xedit' ? Object.assign({}, t.changes || {}) : Object.assign(cloneValues(row.values), t.changes || {});
        newRecord = R._make(type, vals, row.lines ? row.lines.map((l) => Object.assign({}, l)) : null, { id: row.id, onlyFields: event === 'xedit' ? t.changes : null });
      }
      const ctx = (form) => ({ type: event, UserEventType, newRecord, oldRecord, form });
      if (t.beforeLoad || event === 'view') {
        if (entry.beforeLoad) {
          env.stage = 'beforeLoad';
          const form = mods['N/ui/serverWidget'].createForm({ title: type });
          entry.beforeLoad(ctx(form));
          out.form = form;
        }
        if (event === 'view') return;
      }
      if (entry.beforeSubmit) {
        env.stage = 'beforeSubmit';
        try { entry.beforeSubmit(ctx()); } catch (e) {
          out.blocked = errorInfo(e);
          if (t.expectBlock) { out.expectedBlock = true; return; }
          throw e;
        }
      }
      if (t.expectBlock) out.notBlocked = true;
      env.stage = 'save';
      if (event === 'delete') { delete env.db[tableFor(type)][newRecord.id]; }
      else if (event === 'xedit') { const row = findRow(env, type, newRecord.id); Object.assign(row.values, newRecord._values); recalc(row); }
      else R._commit(newRecord);
      out.savedId = newRecord.id;
      if (entry.afterSubmit) {
        env.stage = 'afterSubmit';
        const saved = findRow(env, type, newRecord.id);
        const after = saved ? R._make(type, cloneValues(saved.values), saved.lines ? saved.lines.map((l) => Object.assign({}, l)) : null, { id: saved.id, readOnly: true }) : newRecord;
        newRecord = after;
        entry.afterSubmit(ctx());
      }
      if (!entry.beforeSubmit && !entry.afterSubmit && !entry.beforeLoad) {
        throw nsErr('MISSING_ENTRY_POINT', 'A User Event script must return at least one of beforeLoad, beforeSubmit or afterSubmit.');
      }
    }

    function runMapReduce(t, out, need) {
      env.executionContext = 'MAPREDUCE';
      const S = mods['N/search'];
      const stageLimit = { getInputData: 10000, map: 1000, reduce: 5000, summarize: 10000 };
      const perInvocation = (stage, fn) => {
        const before = env.used;
        env.limit = before + stageLimit[stage];
        env.stage = stage;
        try { return fn(); } finally { env.limit = 1e12; }
      };
      env.limit = 1e12;
      const summary = { inputSummary: { error: null, usage: 0 }, mapSummary: { errors: [], keys: [], usage: 0 }, reduceSummary: { errors: [], keys: [], usage: 0 }, output: [], yields: 0, concurrency: 1, seconds: 1 };
      let input;
      const u0 = env.used;
      try { input = perInvocation('getInputData', () => need('getInputData')({ isRestarted: false })); } catch (e) {
        if (e && e.name === 'MISSING_ENTRY_POINT') throw e;
        summary.inputSummary.error = JSON.stringify(errorInfo(e));
      }
      summary.inputSummary.usage = env.used - u0;
      let pairs = [];
      if (input && S._isSearch(input)) {
        env.charge(10, 'getInputData:search');
        pairs = S._resultsToJSON(input).map((r) => [r.id, JSON.stringify(r)]);
      } else if (input && input.type === 'search' && input.id) {
        const sobj = S.load({ id: input.id });
        pairs = S._resultsToJSON(sobj).map((r) => [r.id, JSON.stringify(r)]);
      } else if (Array.isArray(input)) {
        pairs = input.map((v, i) => [String(i), typeof v === 'string' ? v : JSON.stringify(v)]);
      } else if (input && typeof input === 'object' && input.type === 'suiteql') {
        const rows = mods['N/query'].runSuiteQL({ query: input.query, params: input.params }).asMappedResults();
        pairs = rows.map((v, i) => [String(i), JSON.stringify({ types: [], values: Object.values(v) })]);
      } else if (input && typeof input === 'object') {
        pairs = Object.keys(input).map((k) => [k, typeof input[k] === 'string' ? input[k] : JSON.stringify(input[k])]);
      }
      out.inputCount = pairs.length;
      const grouped = new Map();
      const emit = (bucket) => (a, b) => {
        let key, value;
        if (a && typeof a === 'object' && 'key' in a) { key = a.key; value = a.value; } else { key = a; value = b; }
        key = String(key);
        value = typeof value === 'string' ? value : JSON.stringify(value);
        if (!bucket.has(key)) bucket.set(key, []);
        bucket.get(key).push(value);
      };
      if (entry.map) {
        pairs.forEach(([key, value]) => {
          const u = env.used;
          try { perInvocation('map', () => entry.map({ key, value, write: emit(grouped), errors: [], isRestarted: false, executionNo: 1 })); } catch (e) {
            summary.mapSummary.errors.push([key, JSON.stringify(errorInfo(e))]);
          }
          summary.mapSummary.keys.push(key);
          summary.mapSummary.usage += env.used - u;
        });
      } else {
        pairs.forEach(([k, v]) => emit(grouped)(k, v));
      }
      const output = [];
      if (entry.reduce) {
        grouped.forEach((values, key) => {
          const u = env.used;
          try { perInvocation('reduce', () => entry.reduce({ key, values: values.slice(), write: (a, b) => { const kv = a && typeof a === 'object' && 'key' in a ? a : { key: a, value: b }; output.push([String(kv.key), typeof kv.value === 'string' ? kv.value : JSON.stringify(kv.value)]); }, errors: [], isRestarted: false })); } catch (e) {
            summary.reduceSummary.errors.push([key, JSON.stringify(errorInfo(e))]);
          }
          summary.reduceSummary.keys.push(key);
          summary.reduceSummary.usage += env.used - u;
        });
      } else {
        grouped.forEach((values, key) => values.forEach((v) => output.push([key, v])));
      }
      if (!entry.map && !entry.reduce) throw nsErr('MISSING_ENTRY_POINT', 'A Map/Reduce script needs a map or a reduce entry point (or both).');
      const it = (list) => ({ iterator: () => ({ each: (cb) => { for (const [k, v] of list) { if (cb(k, v) === false) break; } } }) });
      const keysIt = (list) => ({ iterator: () => ({ each: (cb) => { for (const k of list) { if (cb(k) === false) break; } } }) });
      const sumObj = {
        inputSummary: summary.inputSummary,
        mapSummary: Object.assign(it(summary.mapSummary.errors), { errors: it(summary.mapSummary.errors), keys: keysIt(summary.mapSummary.keys), usage: summary.mapSummary.usage, concurrency: 1, yields: 0 }),
        reduceSummary: { errors: it(summary.reduceSummary.errors), keys: keysIt(summary.reduceSummary.keys), usage: summary.reduceSummary.usage, concurrency: 1, yields: 0 },
        output: it(output),
        get usage() { return env.used; },
        yields: Math.floor(env.used / 10000), concurrency: 1, seconds: 1, dateCreated: new Date(),
        isRestarted: false,
      };
      if (entry.summarize) {
        try { perInvocation('summarize', () => entry.summarize(sumObj)); } catch (e) { out.summarizeError = errorInfo(e); throw e; }
      }
      out.mapErrors = summary.mapSummary.errors;
      out.reduceErrors = summary.reduceSummary.errors;
      out.reduceKeys = summary.reduceSummary.keys;
      out.mapCount = summary.mapSummary.keys.length;
      out.output = output;
      out.inputError = summary.inputSummary.error;
    }
  }

  // Tables for the "Sample data" browser.
  function describeData() {
    const env = makeEnv({});
    const db = env.db;
    const R = makeRecordModule(env);
    const tr = (type) => Object.values(db.transaction).filter((r) => r.values._type === type);
    const disp = (def, v) => displayOf(env, def, v);
    const C = TYPES.customer.fields, SOF = TYPES.salesorder.fields;
    void R;
    return [
      { title: 'Customers (customer)', columns: ['id', 'companyname', 'email', 'category', 'salesrep', 'creditlimit', 'isinactive'],
        rows: Object.values(db.customer).map((r) => [r.id, r.values.companyname, r.values.email, disp(C.category, r.values.category), disp(C.salesrep, r.values.salesrep), r.values.creditlimit, r.values.isinactive ? 'T' : 'F']) },
      { title: 'Employees (employee)', columns: ['id', 'firstname', 'lastname', 'title', 'supervisor', 'email'],
        rows: Object.values(db.employee).map((r) => [r.id, r.values.firstname, r.values.lastname, r.values.title, disp(TYPES.employee.fields.supervisor, r.values.supervisor), r.values.email]) },
      { title: 'Items (item / inventoryitem / serviceitem)', columns: ['id', 'itemid', 'displayname', 'itemtype', 'baseprice', 'quantityavailable', 'reorderpoint'],
        rows: Object.values(db.item).map((r) => [r.id, r.values.itemid, r.values.displayname, r.values.itemtype, r.values.baseprice, r.values.quantityavailable, r.values.reorderpoint]) },
      { title: 'Sales orders (salesorder)', columns: ['id', 'tranid', 'entity', 'trandate', 'status', 'total', 'lines (item × qty @ rate)', 'memo'],
        rows: tr('salesorder').map((r) => [r.id, r.values.tranid, disp(SOF.entity, r.values.entity) + ' (' + r.values.entity + ')', fmtDate(r.values.trandate), 'SalesOrd:' + r.values.orderstatus + ' ' + statusText(r.values), r.values.total, r.lines.map((l) => l.item + '×' + l.quantity + '@' + l.rate).join(', '), r.values.memo]) },
      { title: 'Invoices (invoice)', columns: ['id', 'tranid', 'entity', 'trandate', 'duedate', 'status', 'total', 'amountremaining', 'createdfrom'],
        rows: tr('invoice').map((r) => [r.id, r.values.tranid, disp(SOF.entity, r.values.entity) + ' (' + r.values.entity + ')', fmtDate(r.values.trandate), fmtDate(r.values.duedate), 'CustInvc:' + r.values.status + ' ' + statusText(r.values), r.values.total, r.values.amountremaining, r.values.createdfrom || '']) },
      { title: 'Purchase orders (purchaseorder)', columns: ['id', 'tranid', 'entity', 'total', 'approvalstatus', 'memo'],
        rows: tr('purchaseorder').map((r) => [r.id, r.values.tranid, disp(TYPES.purchaseorder.fields.entity, r.values.entity), r.values.total, statusText(r.values), r.values.memo]) },
      { title: 'Warranties (customrecord_warranty)', columns: ['id', 'name', 'custrecord_warranty_customer', 'custrecord_warranty_type', 'custrecord_warranty_start', 'custrecord_warranty_end'],
        rows: Object.values(db.customrecord_warranty).map((r) => [r.id, r.values.name, r.values.custrecord_warranty_customer, disp(TYPES.customrecord_warranty.fields.custrecord_warranty_type, r.values.custrecord_warranty_type) + ' (' + r.values.custrecord_warranty_type + ')', fmtDate(r.values.custrecord_warranty_start), fmtDate(r.values.custrecord_warranty_end)]) },
      { title: 'Warranty claims (customrecord_warranty_claim)', columns: ['id', 'name', 'custrecord_claim_warranty', 'custrecord_claim_desc', 'custrecord_claim_date'],
        rows: Object.values(db.customrecord_warranty_claim).map((r) => [r.id, r.values.name, r.values.custrecord_claim_warranty, r.values.custrecord_claim_desc, fmtDate(r.values.custrecord_claim_date)]) },
      { title: 'Other record types you can create', columns: ['type', 'fields'],
        rows: [['task', Object.keys(TYPES.task.fields).join(', ')], ['customrecord_audit_note', Object.keys(TYPES.customrecord_audit_note.fields).join(', ')], ['customrecord_integration_log', Object.keys(TYPES.customrecord_integration_log.fields).join(', ')]] },
      { title: 'Lists', columns: ['list', 'values'],
        rows: Object.keys(LISTS).map((k) => [k, Object.entries(LISTS[k]).map(([id, t]) => id + ' = ' + t).join(', ')]) },
    ];
  }

  const API = { run, seed, describeData, addSalesOrders, fmtDate, parseDate, daysFromToday, today, round2, TYPES, LISTS, STATUS, MODULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.NSRuntime = API;
})(typeof self !== 'undefined' ? self : this);
