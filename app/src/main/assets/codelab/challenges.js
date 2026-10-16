/*
 * Code Lab challenges. Each one has a brief that teaches from zero, starter code,
 * a reference solution, how to run it, and a check() that grades the result.
 *
 * check(res, h) returns a list of [passed, label] pairs.
 * Brief strings support **bold**, `code` and lines starting with "- " for bullets.
 */
(function (root) {
  'use strict';

  const NS = () => root.NSRuntime || (typeof require === 'function' ? require('./runtime.js') : null);
  const UE = '/**\n * @NApiVersion 2.1\n * @NScriptType UserEventScript\n */\n';
  const CS = '/**\n * @NApiVersion 2.1\n * @NScriptType ClientScript\n */\n';
  const SS = '/**\n * @NApiVersion 2.1\n * @NScriptType ScheduledScript\n */\n';
  const MR = '/**\n * @NApiVersion 2.1\n * @NScriptType MapReduceScript\n */\n';
  const SL = '/**\n * @NApiVersion 2.1\n * @NScriptType Suitelet\n */\n';
  const RL = '/**\n * @NApiVersion 2.1\n * @NScriptType Restlet\n */\n';
  const WA = '/**\n * @NApiVersion 2.1\n * @NScriptType WorkflowActionScript\n */\n';

  const ok = (res) => [res.ok, res.ok ? 'Script ran without errors' : 'Script ran without errors (it stopped with ' + (res.error && res.error.name) + ')'];

  const CHALLENGES = [
    // ---------------- Chapter 0: JavaScript from zero ----------------
    {
      id: 'c0-1', chapter: 0, title: 'Hello, log',
      summary: 'Variables, strings and your first log line.',
      brief: [
        'A **variable** is a named box that holds a value. JavaScript has two ways to make one: `const` for a box you never refill, and `let` for one you will change.',
        'A **string** is text in quotes: `\'Acme Corp\'`. A **template literal** uses backticks and lets you drop values in with `${...}`: `` `Hi ${name}` ``.',
        'In NetSuite you print debug output with `log.debug(title, details)`. It shows up in the Logs panel after you run.',
        '**Your task**',
        '- Make a `const` called `customerName` holding `\'Acme Corp\'`.',
        '- Make a `let` called `orderCount` holding `3`, then add 1 to it with `orderCount = orderCount + 1;`',
        "- Log it: ``log.debug('Summary', `${customerName} has ${orderCount} orders`);``",
      ],
      starter: "// Make your variables here\n\n\n// Then log the summary\n",
      solution: "const customerName = 'Acme Corp';\nlet orderCount = 3;\norderCount = orderCount + 1;\nlog.debug('Summary', `${customerName} has ${orderCount} orders`);\n",
      hints: ['Strings need quotes. Numbers do not: `let orderCount = 3;`', 'The template literal uses backticks (`` ` ``). On a phone, tap the `` ` ` `` button in the symbol bar above the keyboard.'],
      run: {},
      check(res, h) {
        return [ok(res), [h.logHas('Acme Corp has 4 orders'), "A log says 'Acme Corp has 4 orders'"], [/\bconst\s+customerName/.test(h.code), 'customerName is declared with const'], [/\blet\s+orderCount/.test(h.code), 'orderCount is declared with let']];
      },
    },
    {
      id: 'c0-2', chapter: 0, title: 'Arrays and loops',
      summary: 'Add up a list of order totals.',
      brief: [
        'An **array** is an ordered list in square brackets: `[185, 195, 1055]`. Positions start at **0**, so `totals[0]` is 185. `totals.length` is how many items it holds.',
        'A **for loop** repeats code once per item:',
        '`for (let i = 0; i < totals.length; i++) { ... }` means: start i at 0, keep going while i is less than the length, add 1 each time.',
        '**Your task**',
        '- Add up every number in `totals` into a variable `sum`.',
        '- Count how many totals are greater than 250 into `bigOrders`.',
        "- Log both: `log.debug('Total', sum);` and `log.debug('Big orders', bigOrders);`",
      ],
      starter: "const totals = [185, 195, 1055, 300];\nlet sum = 0;\nlet bigOrders = 0;\n\n// Loop over totals here\n\n\nlog.debug('Total', sum);\nlog.debug('Big orders', bigOrders);\n",
      solution: "const totals = [185, 195, 1055, 300];\nlet sum = 0;\nlet bigOrders = 0;\nfor (let i = 0; i < totals.length; i++) {\n  sum = sum + totals[i];\n  if (totals[i] > 250) {\n    bigOrders = bigOrders + 1;\n  }\n}\nlog.debug('Total', sum);\nlog.debug('Big orders', bigOrders);\n",
      hints: ['Inside the loop, the current item is `totals[i]`.', 'Use `if (totals[i] > 250) { bigOrders = bigOrders + 1; }`'],
      run: {},
      check(res, h) { return [ok(res), [h.log('Total', '1735'), 'Total is 1735'], [h.log('Big orders', '2'), 'Big orders is 2']]; },
    },
    {
      id: 'c0-3', chapter: 0, title: 'Objects and functions',
      summary: 'Model order lines as objects and total them with a function.',
      brief: [
        'An **object** groups named values in curly braces: `{ item: \'WIDGET-S\', quantity: 40, rate: 12 }`. Read a value with a dot: `line.quantity`.',
        'A **function** is reusable code that takes inputs and **returns** an output. The modern short form is an **arrow function**:',
        '`const double = (n) => n * 2;` so `double(4)` returns 8.',
        'NetSuite records are full of this: a sales order has lines, and each line is basically an object with item, quantity and rate.',
        '**Your task**',
        '- Write `const lineAmount = (line) => ...` that returns `line.quantity * line.rate`.',
        "- Loop over `lines`, log each amount with `log.debug(line.item, lineAmount(line))`, and add them up.",
        "- Log the total: `log.debug('Order total', total);` (it should be 1055).",
      ],
      starter: "const lines = [\n  { item: 'WIDGET-S', quantity: 40, rate: 12 },\n  { item: 'BOLT-100', quantity: 100, rate: 4.25 },\n  { item: 'WIDGET-L', quantity: 5, rate: 30 },\n];\n\n// const lineAmount = ...\n\nlet total = 0;\n// loop here\n\nlog.debug('Order total', total);\n",
      solution: "const lines = [\n  { item: 'WIDGET-S', quantity: 40, rate: 12 },\n  { item: 'BOLT-100', quantity: 100, rate: 4.25 },\n  { item: 'WIDGET-L', quantity: 5, rate: 30 },\n];\nconst lineAmount = (line) => line.quantity * line.rate;\nlet total = 0;\nfor (const line of lines) {\n  log.debug(line.item, lineAmount(line));\n  total += lineAmount(line);\n}\nlog.debug('Order total', total);\n",
      hints: ['`for (const line of lines) { ... }` loops over each object directly.', '`total += x` is short for `total = total + x`.'],
      run: {},
      check(res, h) { return [ok(res), [/lineAmount\s*=/.test(h.code), 'You defined lineAmount'], [h.log('WIDGET-S', '480') && h.log('BOLT-100', '425') && h.log('WIDGET-L', '150'), 'Each line amount is logged'], [h.log('Order total', '1055'), 'Order total is 1055']]; },
    },
    {
      id: 'c0-4', chapter: 0, title: 'JSON, decisions and errors',
      summary: 'Parse JSON, branch with if/else, and catch an error.',
      brief: [
        '**JSON** is text that looks like a JavaScript object. Systems send it to each other over the internet. `JSON.parse(text)` turns JSON text into an object; `JSON.stringify(obj)` does the reverse.',
        '`if (condition) { ... } else { ... }` runs one block or the other.',
        'Code can fail. `try { risky } catch (e) { handle }` catches the failure so your script keeps going. `e.message` says what went wrong.',
        '**Your task**',
        '- Parse `raw` into an object called `invoice`.',
        "- If `invoice.amountRemaining` is more than 500, `log.audit('Collections', 'Invoice 2003 needs a call')`. Otherwise `log.debug('OK', 'No action')`.",
        "- Then try to `JSON.parse(broken)` inside try/catch, and in the catch run `log.error('Bad JSON', e.message)`.",
      ],
      starter: "const raw = '{\"id\":2003,\"status\":\"Open\",\"amountRemaining\":800}';\nconst broken = '{\"id\": 2004, status: Open}';\n\n// 1. parse raw\n\n// 2. if / else\n\n// 3. try / catch around JSON.parse(broken)\n",
      solution: "const raw = '{\"id\":2003,\"status\":\"Open\",\"amountRemaining\":800}';\nconst broken = '{\"id\": 2004, status: Open}';\nconst invoice = JSON.parse(raw);\nif (invoice.amountRemaining > 500) {\n  log.audit('Collections', 'Invoice 2003 needs a call');\n} else {\n  log.debug('OK', 'No action');\n}\ntry {\n  JSON.parse(broken);\n} catch (e) {\n  log.error('Bad JSON', e.message);\n}\n",
      hints: ['JSON keys must be in double quotes, which is why `broken` fails to parse.'],
      run: {},
      check(res, h) { return [ok(res), [h.logLevel('AUDIT', 'needs a call'), "An audit log says the invoice needs a call"], [h.logs.some((l) => l.level === 'ERROR' && l.title === 'Bad JSON'), "An error log titled 'Bad JSON'"], [/try\s*{/.test(h.code), 'You used try/catch']]; },
    },

    // ---------------- Chapter 1 ----------------
    {
      id: 'c1-1', chapter: 1, title: 'Follow the paper trail',
      summary: 'Load an invoice and walk back to its sales order.',
      brief: [
        'Every NetSuite **record** (a customer, an order, an invoice) has a **type** and an **internal ID** number. `record.load({ type, id })` fetches one so you can read its fields.',
        'Invoices remember which sales order they came from in the **createdfrom** field. Following that link is how you trace order-to-cash.',
        'In Code Lab, `record`, `search`, `log` and the other N/ modules are ready to use in quick scripts like this one. Real script files load them with `define()`, which you will learn in Chapter 5.',
        '**Your task**',
        '- Load invoice 2001: `record.load({ type: record.Type.INVOICE, id: 2001 })`.',
        "- Read its `createdfrom` value with `getValue({ fieldId: 'createdfrom' })`.",
        "- Load that sales order and log its `tranid` (the document number) with title 'Source order'.",
        "- Log the customer name with title 'Customer' using `getText({ fieldId: 'entity' })`.",
      ],
      starter: "const invoice = record.load({ type: record.Type.INVOICE, id: 2001 });\n\n// read createdfrom, load the sales order, log tranid and customer\n",
      solution: "const invoice = record.load({ type: record.Type.INVOICE, id: 2001 });\nconst soId = invoice.getValue({ fieldId: 'createdfrom' });\nconst so = record.load({ type: record.Type.SALES_ORDER, id: soId });\nlog.debug('Source order', so.getValue({ fieldId: 'tranid' }));\nlog.debug('Customer', so.getText({ fieldId: 'entity' }));\n",
      hints: ['createdfrom holds the sales order\'s internal ID (1005).', 'Open Sample data to see every record and its fields.'],
      run: {},
      check(res, h) { return [ok(res), [h.log('Source order', 'SO1005'), "Logged 'Source order' = SO1005"], [h.log('Customer', 'Acme Corp'), "Logged 'Customer' = Acme Corp"], [h.calls('record.load') >= 2, 'Loaded both records']]; },
    },
    {
      id: 'c1-2', chapter: 1, title: 'Bill a sales order',
      summary: 'Turn a sales order into an invoice with record.transform.',
      brief: [
        'In order-to-cash, billing creates an **invoice** from a **sales order**. In code that is `record.transform`: it copies the customer, lines and other details into a new record and links them with createdfrom.',
        '`record.transform({ fromType, fromId, toType })` returns an unsaved invoice. `.save()` writes it and returns the new internal ID.',
        '**Your task**',
        '- Transform sales order 1002 into an invoice.',
        "- Save it and log the new ID with title 'Invoice created'.",
      ],
      starter: "// const invoice = record.transform({ ... });\n",
      solution: "const invoice = record.transform({\n  fromType: record.Type.SALES_ORDER,\n  fromId: 1002,\n  toType: record.Type.INVOICE,\n});\nconst id = invoice.save();\nlog.debug('Invoice created', id);\n",
      hints: ['The types are record.Type.SALES_ORDER and record.Type.INVOICE.'],
      run: {},
      check(res, h) {
        const inv = h.find('transaction', (r) => r.values._type === 'invoice' && Number(r.values.createdfrom) === 1002);
        return [ok(res), [h.calls('record.transform') >= 1, 'Used record.transform'], [!!inv, 'A new invoice links back to sales order 1002'], [!!inv && h.log('Invoice created', String(inv.id)), 'Logged the new invoice ID']];
      },
    },

    // ---------------- Chapter 2 ----------------
    {
      id: 'c2-1', chapter: 2, title: 'Value vs. text',
      summary: 'See the difference between getValue and getText.',
      brief: [
        'A **list field** (like Customer on an order) stores an internal ID but shows a name. `getValue` returns the stored ID. `getText` returns the name a person sees.',
        '**Your task**',
        '- Load sales order 1003.',
        "- Log `getValue({ fieldId: 'entity' })` with title 'Customer ID'.",
        "- Log `getText({ fieldId: 'entity' })` with title 'Customer name'.",
      ],
      starter: "const so = record.load({ type: record.Type.SALES_ORDER, id: 1003 });\n",
      solution: "const so = record.load({ type: record.Type.SALES_ORDER, id: 1003 });\nlog.debug('Customer ID', so.getValue({ fieldId: 'entity' }));\nlog.debug('Customer name', so.getText({ fieldId: 'entity' }));\n",
      hints: ["The field ID for Customer on transactions is 'entity'."],
      run: {},
      check(res, h) { return [ok(res), [h.log('Customer ID', '102'), "'Customer ID' is 102"], [h.log('Customer name', 'Globex Inc'), "'Customer name' is Globex Inc"]]; },
    },
    {
      id: 'c2-2', chapter: 2, title: 'Walk the lines',
      summary: 'Loop through a sublist, then save a summary on the order.',
      brief: [
        'A **sublist** is a table inside a record. A sales order\'s `item` sublist has one row per product. Rows are numbered from **0**.',
        "`getLineCount({ sublistId: 'item' })` says how many rows. `getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i })` reads one cell.",
        'The starter has a classic bug from old SuiteScript 1.0, where lines started at 1. Run it first and read the error.',
        '**Your task**',
        '- Fix the loop so it reads every line.',
        "- Add up the quantities, then set the memo to `Lines: 3, units: 145` (built from your numbers) and save the order.",
      ],
      starter: "const so = record.load({ type: record.Type.SALES_ORDER, id: 1003 });\nconst count = so.getLineCount({ sublistId: 'item' });\nlet units = 0;\nfor (let i = 1; i <= count; i++) {\n  units += so.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });\n}\nso.setValue({ fieldId: 'memo', value: `Lines: ${count}, units: ${units}` });\nso.save();\n",
      solution: "const so = record.load({ type: record.Type.SALES_ORDER, id: 1003 });\nconst count = so.getLineCount({ sublistId: 'item' });\nlet units = 0;\nfor (let i = 0; i < count; i++) {\n  units += so.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });\n}\nso.setValue({ fieldId: 'memo', value: `Lines: ${count}, units: ${units}` });\nso.save();\n",
      hints: ['Start at 0 and stop before count: `i = 0; i < count`.'],
      run: {},
      check(res, h) { const so = h.get('transaction', 1003); return [ok(res), [so.values.memo === 'Lines: 3, units: 145', "Sales order 1003's memo is 'Lines: 3, units: 145'"]]; },
    },
    {
      id: 'c2-3', chapter: 2, title: 'Mind the sourcing order',
      summary: 'Create an order in dynamic mode without losing your price.',
      brief: [
        '**Sourcing** is NetSuite filling in fields for you. Pick a customer and the sales rep and terms appear. Pick an item and its price fills the rate.',
        '**Dynamic mode** (`isDynamic: true`) sources as you go, just like the screen. Lines are added one at a time with `selectNewLine`, `setCurrentSublistValue` and `commitLine`.',
        'The starter sets the discounted rate *before* the item, so sourcing overwrites it. Run it and check the saved rate in the logs.',
        '**Your task**',
        '- Create a sales order for customer 102 with one line: item 202, quantity 5, at a discounted rate of 27.',
        "- Save it and log the ID with title 'Order'.",
      ],
      starter: "const so = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });\nso.setValue({ fieldId: 'entity', value: 102 });\nso.selectNewLine({ sublistId: 'item' });\nso.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: 27 });\nso.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: 202 });\nso.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 5 });\nso.commitLine({ sublistId: 'item' });\nconst id = so.save();\nlog.debug('Order', id);\nlog.debug('Saved rate', record.load({ type: 'salesorder', id }).getSublistValue({ sublistId: 'item', fieldId: 'rate', line: 0 }));\n",
      solution: "const so = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });\nso.setValue({ fieldId: 'entity', value: 102 });\nso.selectNewLine({ sublistId: 'item' });\nso.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: 202 });\nso.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 5 });\nso.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: 27 });\nso.commitLine({ sublistId: 'item' });\nconst id = so.save();\nlog.debug('Order', id);\n",
      hints: ['Set the item first, then override the rate.'],
      run: {},
      check(res, h) {
        const so = h.find('transaction', (r) => r.values._type === 'salesorder' && r.id > 5000);
        const line = so && so.lines[0];
        return [ok(res), [!!so && Number(so.values.entity) === 102, 'A new order for customer 102 was saved'], [!!line && Number(line.item) === 202 && Number(line.quantity) === 5, 'Line is item 202, quantity 5'], [!!line && Number(line.rate) === 27, 'The saved rate is 27, not the sourced 30'], [!!so && Number(so.values.salesrep) === 7, 'Sales rep was sourced from the customer (dynamic mode)']];
      },
    },

    // ---------------- Chapter 3 ----------------
    {
      id: 'c3-1', chapter: 3, title: 'Your first custom record',
      summary: 'Create a warranty in a custom record type.',
      brief: [
        'A **custom record type** is a table your company adds to NetSuite. Its type ID starts with `customrecord_` and its fields start with `custrecord_`.',
        'This account has `customrecord_warranty` with a customer, a warranty type (a list: 1 Standard, 2 Extended, 3 Lifetime), and start and end dates.',
        '**Date fields need JavaScript Date objects.** `new Date()` is right now. To add days: `new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000)`.',
        '**Your task**',
        "- Create a `customrecord_warranty` named 'W-0002' for customer 102 with type 2 (Extended).",
        '- Start today, end 365 days from today. Save it.',
      ],
      starter: "const w = record.create({ type: 'customrecord_warranty' });\n// set name, custrecord_warranty_customer, custrecord_warranty_type,\n// custrecord_warranty_start, custrecord_warranty_end, then save\n",
      solution: "const start = new Date();\nconst end = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);\nconst w = record.create({ type: 'customrecord_warranty' });\nw.setValue({ fieldId: 'name', value: 'W-0002' });\nw.setValue({ fieldId: 'custrecord_warranty_customer', value: 102 });\nw.setValue({ fieldId: 'custrecord_warranty_type', value: 2 });\nw.setValue({ fieldId: 'custrecord_warranty_start', value: start });\nw.setValue({ fieldId: 'custrecord_warranty_end', value: end });\nconst id = w.save();\nlog.debug('Warranty', id);\n",
      hints: ["Passing a string like '10/16/2026' to a date field fails. Use a Date object."],
      run: {},
      check(res, h) {
        const w = h.find('customrecord_warranty', (r) => r.values.name === 'W-0002');
        const v = w && w.values;
        const days = v && v.custrecord_warranty_start instanceof Date && v.custrecord_warranty_end instanceof Date ? Math.round((v.custrecord_warranty_end - v.custrecord_warranty_start) / 86400000) : null;
        return [ok(res), [!!w, "Warranty 'W-0002' exists"], [!!v && Number(v.custrecord_warranty_customer) === 102 && Number(v.custrecord_warranty_type) === 2, 'Customer 102, type Extended (2)'], [days !== null && days >= 364 && days <= 366, 'Ends 365 days after it starts']];
      },
    },
    {
      id: 'c3-2', chapter: 3, title: 'Parent and child',
      summary: 'Add a claim to a warranty and count its claims.',
      brief: [
        'Custom records can link to each other. A claim has `custrecord_claim_warranty`, which points at its parent warranty. Marked **Record is Parent**, those claims show as a list on the warranty.',
        'To find records that match a condition you use a **search**. `search.create({ type, filters, columns })` builds one. A filter is `[fieldId, operator, value]`, for example `[\'custrecord_claim_warranty\', \'anyof\', 1]`.',
        '`.run().each(callback)` calls your function once per result. **Return true** to keep going.',
        '**Your task**',
        "- Create a `customrecord_warranty_claim` for warranty 1: name 'C-0002', description 'Gear missing teeth', date today.",
        "- Search claims on warranty 1, count them, and log the count with title 'Claims on W-0001'.",
      ],
      starter: "// 1. create the claim\n\n// 2. search and count\nlet count = 0;\n\nlog.debug('Claims on W-0001', count);\n",
      solution: "const claim = record.create({ type: 'customrecord_warranty_claim' });\nclaim.setValue({ fieldId: 'name', value: 'C-0002' });\nclaim.setValue({ fieldId: 'custrecord_claim_warranty', value: 1 });\nclaim.setValue({ fieldId: 'custrecord_claim_desc', value: 'Gear missing teeth' });\nclaim.setValue({ fieldId: 'custrecord_claim_date', value: new Date() });\nclaim.save();\n\nlet count = 0;\nsearch.create({\n  type: 'customrecord_warranty_claim',\n  filters: [['custrecord_claim_warranty', 'anyof', 1]],\n  columns: ['name'],\n}).run().each(() => {\n  count++;\n  return true;\n});\nlog.debug('Claims on W-0001', count);\n",
      hints: ['If your count is 1, check that the each() callback returns true.'],
      run: {},
      check(res, h) { return [ok(res), [!!h.find('customrecord_warranty_claim', (r) => r.values.name === 'C-0002' && Number(r.values.custrecord_claim_warranty) === 1), "Claim 'C-0002' is linked to warranty 1"], [h.log('Claims on W-0001', '2'), 'Counted 2 claims']]; },
    },

    // ---------------- Chapter 4 ----------------
    {
      id: 'c4-1', chapter: 4, title: 'Open orders for Acme',
      summary: 'Fix the Main Line trap in a transaction search.',
      brief: [
        'Transaction searches return one row for the header (the **main line**) **plus one row per item line**. Without a Main Line filter, each order shows up several times.',
        "Status filters use codes: Pending Fulfillment on a sales order is `'SalesOrd:B'`.",
        'Run the starter and look at the logs: the orders repeat.',
        '**Your task**',
        "- Keep the filters for customer 101 and status Pending Fulfillment, and add `['mainline', 'is', 'T']`.",
        "- Log each order once with title 'Open order' and the tranid as details.",
      ],
      starter: "search.create({\n  type: search.Type.SALES_ORDER,\n  filters: [\n    ['entity', 'anyof', 101], 'AND',\n    ['status', 'anyof', 'SalesOrd:B'],\n  ],\n  columns: ['tranid', 'amount'],\n}).run().each((r) => {\n  log.debug('Open order', r.getValue('tranid'));\n  return true;\n});\n",
      solution: "search.create({\n  type: search.Type.SALES_ORDER,\n  filters: [\n    ['mainline', 'is', 'T'], 'AND',\n    ['entity', 'anyof', 101], 'AND',\n    ['status', 'anyof', 'SalesOrd:B'],\n  ],\n  columns: ['tranid', 'amount'],\n}).run().each((r) => {\n  log.debug('Open order', r.getValue('tranid'));\n  return true;\n});\n",
      hints: ["Filters are joined with 'AND' between each one."],
      run: {},
      check(res, h) {
        const got = h.logs.filter((l) => l.title === 'Open order').map((l) => l.details);
        const once = (t) => got.filter((g) => g === t).length === 1;
        return [ok(res), [once('SO1001') && once('SO1002'), 'SO1001 and SO1002 each appear exactly once'], [got.length === 2, 'No other orders logged']];
      },
    },
    {
      id: 'c4-2', chapter: 4, title: 'Who owes us the most?',
      summary: 'Group and sum with a summary search.',
      brief: [
        'A **summary search** works like a pivot table. One column is **GROUP** (one result row per value), others are **SUM**, **COUNT** and so on.',
        "Build summary columns with `search.createColumn({ name: 'entity', summary: search.Summary.GROUP })`.",
        "Read them back with the same name and summary: `r.getText({ name: 'entity', summary: search.Summary.GROUP })`.",
        '**Your task**',
        "- Search invoices with Main Line true and status Open (`'CustInvc:A'`).",
        '- Group by customer (`entity`) and sum `amountremaining`.',
        '- For each result, log the customer **name** as the title and the summed amount as details.',
      ],
      starter: "const s = search.create({\n  type: search.Type.INVOICE,\n  filters: [],\n  columns: [],\n});\n",
      solution: "const s = search.create({\n  type: search.Type.INVOICE,\n  filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'CustInvc:A']],\n  columns: [\n    search.createColumn({ name: 'entity', summary: search.Summary.GROUP }),\n    search.createColumn({ name: 'amountremaining', summary: search.Summary.SUM }),\n  ],\n});\ns.run().each((r) => {\n  log.debug(\n    r.getText({ name: 'entity', summary: search.Summary.GROUP }),\n    r.getValue({ name: 'amountremaining', summary: search.Summary.SUM })\n  );\n  return true;\n});\n",
      hints: ['Every column needs a summary once any column has one.', 'Use getText for the name, getValue for the sum.'],
      run: {},
      check(res, h) { return [ok(res), [h.log('Globex Inc', '800'), 'Globex Inc owes 800'], [h.log('Initech LLC', '300'), 'Initech LLC owes 300'], [h.log('Umbrella Co', '95') && h.log('Acme Corp', '50'), 'Umbrella Co owes 95 and Acme Corp 50']]; },
    },
    {
      id: 'c4-3', chapter: 4, title: 'SuiteQL with a parameter',
      summary: 'Query open invoices with SQL and a ? placeholder.',
      brief: [
        '**SQL** is the standard language for asking a database questions: `SELECT columns FROM table WHERE condition`. **SuiteQL** is NetSuite\'s read-only version of it.',
        "`BUILTIN.DF(field)` turns an ID into its display name. Invoices are `type = 'CustInvc'` in the `transaction` table.",
        'Never paste values into SQL text. Use `?` and pass the values in `params`. That avoids broken quotes and injection attacks.',
        'This script gets its minimum amount from a **script parameter**, a setting an admin fills in: `runtime.getCurrentScript().getParameter({ name: \'custscript_min_amount\' })`.',
        '**Your task**',
        '- Read `custscript_min_amount` (it is 100 here).',
        "- Run SuiteQL selecting `tranid`, `BUILTIN.DF(entity) AS customer` and `foreignamountremaining` from `transaction` where type is 'CustInvc' and `foreignamountremaining >= ?`.",
        '- Log each row with the tranid as title and the customer as details.',
      ],
      starter: "const min = 0; // read the parameter instead\nconst rows = query.runSuiteQL({\n  query: \"SELECT tranid FROM transaction\",\n}).asMappedResults();\nrows.forEach((row) => log.debug(row.tranid, row.customer));\n",
      solution: "const min = runtime.getCurrentScript().getParameter({ name: 'custscript_min_amount' });\nconst rows = query.runSuiteQL({\n  query: `SELECT tranid, BUILTIN.DF(entity) AS customer, foreignamountremaining\n          FROM transaction\n          WHERE type = 'CustInvc' AND foreignamountremaining >= ?\n          ORDER BY foreignamountremaining DESC`,\n  params: [min],\n}).asMappedResults();\nrows.forEach((row) => log.debug(row.tranid, row.customer));\n",
      hints: ['asMappedResults() gives you plain objects keyed by column name or alias.'],
      run: { params: { custscript_min_amount: 100 } },
      check(res, h) {
        return [ok(res), [h.calls('getParameter:custscript_min_amount') >= 1, 'Read custscript_min_amount'], [h.log('INV2003', 'Globex Inc') && h.log('INV2002', 'Initech LLC'), 'INV2003 (Globex) and INV2002 (Initech) are listed'], [!h.logs.some((l) => ['INV2001', 'INV2005', 'INV2004', 'SO1001'].includes(l.title)), 'Nothing under 100 or that isn\'t an invoice']];
      },
    },

    // ---------------- Chapter 5 ----------------
    {
      id: 'c5-1', chapter: 5, title: 'Your first User Event',
      summary: 'Default a memo when a sales order is created.',
      brief: [
        'Real script files are **modules**. The comment block at the top (JSDoc tags) tells NetSuite the API version and script type. `define([modules], callback)` loads the N/ modules you ask for and passes them in.',
        'Your callback **returns an object of entry points**: the functions NetSuite should call. A **User Event** script can return `beforeLoad`, `beforeSubmit` and `afterSubmit`.',
        '`beforeSubmit(context)` runs just before a record saves. `context.newRecord` is the record. `context.type` says why it is saving (create, edit, delete...).',
        'Code Lab tests this by creating and editing sales orders.',
        '**Your task**',
        "- When `context.type` is CREATE and the memo is empty, set the memo to 'Created by script'.",
        '- Leave orders that already have a memo, and edits, alone.',
      ],
      starter: UE + "define(['N/log'], (log) => {\n  const beforeSubmit = (context) => {\n    // your code\n  };\n\n  return { beforeSubmit };\n});\n",
      solution: UE + "define(['N/log'], (log) => {\n  const beforeSubmit = (context) => {\n    if (context.type !== context.UserEventType.CREATE) return;\n    const so = context.newRecord;\n    if (!so.getValue({ fieldId: 'memo' })) {\n      so.setValue({ fieldId: 'memo', value: 'Created by script' });\n    }\n  };\n\n  return { beforeSubmit };\n});\n",
      hints: ['Compare with `context.UserEventType.CREATE`.', '`!value` is true for an empty string.'],
      run: { triggers: [
        { event: 'create', values: { entity: 101 }, lines: [{ item: 201, quantity: 2 }] },
        { event: 'create', values: { entity: 102, memo: 'Keep me' }, lines: [{ item: 205, quantity: 10 }] },
        { event: 'edit', id: 1001, changes: { otherrefnum: 'PO-1' } },
      ] },
      check(res, h) {
        const [a, b] = res.runs.map((r) => r.savedId && h.get('transaction', r.savedId));
        return [ok(res), [!!a && a.values.memo === 'Created by script', 'New order with no memo gets the default'], [!!b && b.values.memo === 'Keep me', 'An existing memo is kept'], [h.get('transaction', 1001).values.memo === '', 'Editing an order doesn\'t change its memo']];
      },
    },
    {
      id: 'c5-2', chapter: 5, title: 'Block risky orders',
      summary: 'Throw an error to stop a save.',
      brief: [
        'Throwing an error in `beforeSubmit` cancels the save and shows your message to the user. It is how you enforce a business rule.',
        "Make proper errors with N/error: `error.create({ name: 'MISSING_PO', message: '...', notifyOff: true })` and `throw` it.",
        "`otherrefnum` is the customer's PO number field. `total` is the order total.",
        '**Your task**',
        "- If an order's total is over 10,000 and it has no PO number, throw an error named 'MISSING_PO'.",
        '- Otherwise let it save. Code Lab tests a big order without a PO, a big order with one, and a small order.',
      ],
      starter: UE + "define(['N/error'], (error) => {\n  const beforeSubmit = (context) => {\n    const so = context.newRecord;\n    // your rule here\n  };\n  return { beforeSubmit };\n});\n",
      solution: UE + "define(['N/error'], (error) => {\n  const beforeSubmit = (context) => {\n    const so = context.newRecord;\n    const total = so.getValue({ fieldId: 'total' });\n    const po = so.getValue({ fieldId: 'otherrefnum' });\n    if (total > 10000 && !po) {\n      throw error.create({\n        name: 'MISSING_PO',\n        message: 'Orders over $10,000 need a PO number.',\n        notifyOff: true,\n      });\n    }\n  };\n  return { beforeSubmit };\n});\n",
      hints: ['Use `throw error.create({ ... })`. Returning false does nothing in a User Event.'],
      run: { triggers: [
        { event: 'create', values: { entity: 102 }, lines: [{ item: 203, quantity: 200 }], expectBlock: true },
        { event: 'create', values: { entity: 102, otherrefnum: 'PO-778' }, lines: [{ item: 203, quantity: 200 }] },
        { event: 'create', values: { entity: 103 }, lines: [{ item: 201, quantity: 3 }] },
      ] },
      check(res, h) {
        const [big, withPo, small] = res.runs;
        return [
          [!!big && big.expectedBlock && big.blocked && big.blocked.name === 'MISSING_PO', 'A $15,000 order with no PO is blocked with MISSING_PO'],
          [!!withPo && !!withPo.savedId, 'A $15,000 order with a PO saves'],
          [!!small && !!small.savedId, 'A small order saves'],
        ];
      },
    },
    {
      id: 'c5-3', chapter: 5, title: 'Cheap updates',
      summary: 'Update records with submitFields instead of load and save.',
      brief: [
        'Every API call costs **usage units**, and each script has a budget (Chapter 8). Loading and saving a sales order costs 10 + 20 = 30 units.',
        "`record.submitFields({ type, id, values: { memo: 'x' } })` updates header fields without loading the record: 10 units.",
        '**Your task**',
        "- Set the memo to 'Reviewed' on sales orders 1001, 1002 and 1003 using submitFields only.",
      ],
      starter: "const ids = [1001, 1002, 1003];\nids.forEach((id) => {\n  const so = record.load({ type: record.Type.SALES_ORDER, id });\n  so.setValue({ fieldId: 'memo', value: 'Reviewed' });\n  so.save();\n});\n",
      solution: "const ids = [1001, 1002, 1003];\nids.forEach((id) => {\n  record.submitFields({\n    type: record.Type.SALES_ORDER,\n    id,\n    values: { memo: 'Reviewed' },\n  });\n});\n",
      hints: ['`{ id }` is short for `{ id: id }`.'],
      run: {},
      check(res, h) {
        const all = [1001, 1002, 1003].every((id) => h.get('transaction', id).values.memo === 'Reviewed');
        return [ok(res), [all, 'All three orders say Reviewed'], [h.calls('record.load') === 0 && h.calls('record.save') === 0, 'No record.load or record.save used'], [res.unitsUsed <= 30, 'Used 30 units or fewer (load + save would be 90)']];
      },
    },

    // ---------------- Chapter 6 ----------------
    {
      id: 'c6-1', chapter: 6, title: 'Follow-up task after save',
      summary: 'Use afterSubmit when you need the new record\'s ID.',
      brief: [
        'In `beforeSubmit` on create, the record has **no internal ID yet**, because it has not been saved. In `afterSubmit` it has been saved, so `context.newRecord.id` exists.',
        'Rule of thumb: change *this* record in beforeSubmit; create or update *other* records in afterSubmit.',
        'The starter tries to link a task in beforeSubmit. Run it and read the error.',
        '**Your task**',
        "- After a sales order is created, create a `task` with title `Call customer about SO####` (use the order's tranid), `transaction` = the order ID, `company` = the order's customer, and `assigned` = 7.",
      ],
      starter: UE + "define(['N/record'], (record) => {\n  const beforeSubmit = (context) => {\n    if (context.type !== context.UserEventType.CREATE) return;\n    const so = context.newRecord;\n    const task = record.create({ type: record.Type.TASK });\n    task.setValue({ fieldId: 'title', value: 'Call customer about ' + so.getValue({ fieldId: 'tranid' }) });\n    task.setValue({ fieldId: 'transaction', value: so.id });\n    task.save();\n  };\n  return { beforeSubmit };\n});\n",
      solution: UE + "define(['N/record'], (record) => {\n  const afterSubmit = (context) => {\n    if (context.type !== context.UserEventType.CREATE) return;\n    const so = context.newRecord;\n    const task = record.create({ type: record.Type.TASK });\n    task.setValue({ fieldId: 'title', value: `Call customer about ${so.getValue({ fieldId: 'tranid' })}` });\n    task.setValue({ fieldId: 'transaction', value: so.id });\n    task.setValue({ fieldId: 'company', value: so.getValue({ fieldId: 'entity' }) });\n    task.setValue({ fieldId: 'assigned', value: 7 });\n    task.save();\n  };\n  return { afterSubmit };\n});\n",
      hints: ['Rename beforeSubmit to afterSubmit (in both places).', 'Without a transaction value the task saves but links to nothing, which is the silent version of this bug.'],
      run: { trigger: { event: 'create', values: { entity: 104 }, lines: [{ item: 202, quantity: 1 }] } },
      check(res, h) {
        const id = res.runs[0] && res.runs[0].savedId;
        const t = id && h.find('task', (r) => Number(r.values.transaction) === id);
        return [ok(res), [!!t, 'A task links to the new order'], [!!t && t.values.title === 'Call customer about SO' + id, 'Title names the order number'], [!!t && Number(t.values.company) === 104 && Number(t.values.assigned) === 7, 'Company is the customer and it is assigned to employee 7']];
      },
    },
    {
      id: 'c6-2', chapter: 6, title: 'Validate as they type',
      summary: 'A client script that rejects bad field values.',
      brief: [
        '**Client scripts** run in the user\'s browser while they fill in a form. `validateField(context)` runs when a field changes. Return **true** to accept, **false** to reject.',
        '`context.fieldId` says which field changed. `context.currentRecord` is the form; read values with `getValue`.',
        'Every field change goes through validateField, so always return true for fields you are not checking.',
        '**Your task**',
        '- For `custbody_discount_pct`, reject values below 0 or above 50.',
        '- Accept everything else.',
      ],
      starter: CS + "define([], () => {\n  const validateField = (context) => {\n    if (context.fieldId === 'custbody_discount_pct') {\n      const pct = context.currentRecord.getValue({ fieldId: 'custbody_discount_pct' });\n      return pct >= 0;\n    }\n  };\n  return { validateField };\n});\n",
      solution: CS + "define([], () => {\n  const validateField = (context) => {\n    if (context.fieldId === 'custbody_discount_pct') {\n      const pct = context.currentRecord.getValue({ fieldId: 'custbody_discount_pct' });\n      return pct >= 0 && pct <= 50;\n    }\n    return true;\n  };\n  return { validateField };\n});\n",
      hints: ['Add `return true;` at the end for every other field.'],
      run: { triggers: [
        { entry: 'validateField', fieldId: 'custbody_discount_pct', values: { entity: 101, custbody_discount_pct: -5 } },
        { entry: 'validateField', fieldId: 'custbody_discount_pct', values: { entity: 101, custbody_discount_pct: 60 } },
        { entry: 'validateField', fieldId: 'custbody_discount_pct', values: { entity: 101, custbody_discount_pct: 15 } },
        { entry: 'validateField', fieldId: 'memo', values: { entity: 101, memo: 'Hello' } },
      ] },
      check(res) {
        const r = res.runs.map((x) => x.returned);
        return [ok(res), [r[0] === false, '-5% is rejected'], [r[1] === false, '60% is rejected'], [r[2] === true, '15% is accepted'], [r[3] === true, 'Other fields are accepted (returns true)']];
      },
    },
    {
      id: 'c6-3', chapter: 6, title: 'Rush orders need a reason',
      summary: 'Block a save from the browser with saveRecord.',
      brief: [
        '`saveRecord(context)` runs when the user clicks Save. Return **false** to stop the save; **true** to let it continue.',
        "`N/ui/dialog` shows a pop-up: `dialog.alert({ title: '...', message: '...' })`.",
        "`custbody_rush_order` is a checkbox: `getValue` returns `true` or `false`.",
        '**Your task**',
        '- If the order is a rush order and the memo is empty, show an alert and return false.',
        '- Otherwise return true.',
      ],
      starter: CS + "define(['N/ui/dialog'], (dialog) => {\n  const saveRecord = (context) => {\n    const rec = context.currentRecord;\n    // your code\n  };\n  return { saveRecord };\n});\n",
      solution: CS + "define(['N/ui/dialog'], (dialog) => {\n  const saveRecord = (context) => {\n    const rec = context.currentRecord;\n    const rush = rec.getValue({ fieldId: 'custbody_rush_order' });\n    const memo = rec.getValue({ fieldId: 'memo' });\n    if (rush && !memo) {\n      dialog.alert({ title: 'Memo needed', message: 'Explain why this order is a rush.' });\n      return false;\n    }\n    return true;\n  };\n  return { saveRecord };\n});\n",
      hints: ['Returning nothing counts as false, so the normal path needs `return true;`.'],
      run: { triggers: [
        { entry: 'saveRecord', values: { entity: 101, custbody_rush_order: true, memo: '' } },
        { entry: 'saveRecord', values: { entity: 101, custbody_rush_order: true, memo: 'Trade show Friday' } },
        { entry: 'saveRecord', values: { entity: 101, custbody_rush_order: false, memo: '' } },
      ] },
      check(res) {
        const r = res.runs.map((x) => x.returned);
        return [ok(res), [r[0] === false, 'Rush order with no memo is blocked'], [res.dialogs.length >= 1, 'An alert explains why'], [r[1] === true && r[2] === true, 'Other orders save']];
      },
    },

    // ---------------- Chapter 7 ----------------
    {
      id: 'c7-1', chapter: 7, title: 'Settings, not hard-coding',
      summary: 'Read a threshold from a script parameter.',
      brief: [
        'A **script parameter** is a setting on the script record (ID starts with `custscript_`). Admins can change it per deployment without touching code.',
        "Read one with `runtime.getCurrentScript().getParameter({ name: 'custscript_min_total' })`.",
        "On a transaction search, the main line's `amount` column is the order total. `greaterthanorequalto` means >=.",
        '**Your task**',
        '- Read `custscript_min_total` (400 in this test).',
        "- Count invoices (main line) whose amount is at least that, and log the count with title 'Big invoices'.",
      ],
      starter: "const min = 400; // read the parameter instead\nlet count = 0;\n\nlog.debug('Big invoices', count);\n",
      solution: "const min = runtime.getCurrentScript().getParameter({ name: 'custscript_min_total' });\nlet count = 0;\nsearch.create({\n  type: search.Type.INVOICE,\n  filters: [['mainline', 'is', 'T'], 'AND', ['amount', 'greaterthanorequalto', min]],\n  columns: ['tranid'],\n}).run().each(() => { count++; return true; });\nlog.debug('Big invoices', count);\n",
      hints: ['Remember mainline, or you will count lines too.'],
      run: { params: { custscript_min_total: 400 } },
      check(res, h) { return [ok(res), [h.calls('getParameter:custscript_min_total') >= 1, 'Read custscript_min_total'], [h.log('Big invoices', '2'), 'Counted 2 invoices of 400 or more']]; },
    },
    {
      id: 'c7-2', chapter: 7, title: 'Call an outside API',
      summary: 'Use N/https with a key stored as a parameter.',
      brief: [
        'An **API** is a way for programs to talk over the internet. You send an HTTP request to a URL and get back a status code (200 means OK) and a body, usually JSON.',
        "`https.get({ url, headers })` sends a GET request. Most APIs want a key in a header like `Authorization: 'Bearer <key>'`.",
        '**Never paste secrets into code.** Anyone who can see the file can steal them. Read the key from a parameter instead.',
        '**Your task**',
        "- Read `custscript_api_key`, then GET `https://api.example.com/rates` with header `Authorization: 'Bearer ' + key`.",
        "- If the response code isn't 200, throw an error. Otherwise parse the body and log `rates.EUR` with title 'EUR rate'.",
      ],
      starter: "const res = https.get({\n  url: 'https://api.example.com/rates',\n  headers: { Authorization: 'Bearer demo-key-123' },\n});\nlog.debug('Response', res.body);\n",
      solution: "const key = runtime.getCurrentScript().getParameter({ name: 'custscript_api_key' });\nconst res = https.get({\n  url: 'https://api.example.com/rates',\n  headers: { Authorization: 'Bearer ' + key },\n});\nif (res.code !== 200) {\n  throw error.create({ name: 'RATES_FAILED', message: res.body });\n}\nconst data = JSON.parse(res.body);\nlog.debug('EUR rate', data.rates.EUR);\n",
      hints: ['res.body is a string. JSON.parse it first.'],
      run: {
        params: { custscript_api_key: 'demo-key-123' },
        httpMocks: { 'https://api.example.com/rates': (req) => (req.headers.Authorization === 'Bearer demo-key-123' ? { code: 200, body: '{"base":"USD","rates":{"EUR":0.92,"GBP":0.79}}', headers: {} } : { code: 401, body: '{"error":"Missing or bad API key"}', headers: {} }) },
      },
      check(res, h) { return [ok(res), [h.log('EUR rate', '0.92'), 'Logged the EUR rate (0.92)'], [!/demo-key-123/.test(h.code), 'The key is not written in the code'], [/res\.code|\.code\s*!==?\s*200|code\s*===?\s*200/.test(h.code), 'Checks the response code']]; },
    },
    {
      id: 'c7-3', chapter: 7, title: 'Email a CSV report',
      summary: 'Search, build a file, save it and email it.',
      brief: [
        'A **CSV** file is a spreadsheet as plain text: one row per line, commas between columns.',
        "`file.create({ name, fileType: file.Type.CSV, contents, folder })` makes a file; `.save()` stores it in the File Cabinet and returns its ID.",
        "`email.send({ author, recipients, subject, body, attachments })` sends mail. `author` is an employee ID. Attach files with `file.load({ id })`.",
        '**Your task**',
        "- Search open sales orders (main line, `'SalesOrd:B'`) and build CSV text that starts with `tranid,customer,total` and has one line per order.",
        "- Save it as `open_orders.csv` in the folder from parameter `custscript_folder`.",
        "- Email it from employee 7 to `ops@example.com` with subject 'Open orders', attaching the file.",
      ],
      starter: "let csv = 'tranid,customer,total\\n';\n// 1. search and add lines\n\n// 2. create and save the file\n\n// 3. send the email\n",
      solution: "let csv = 'tranid,customer,total\\n';\nsearch.create({\n  type: search.Type.SALES_ORDER,\n  filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'SalesOrd:B']],\n  columns: ['tranid', 'entity', 'amount'],\n}).run().each((r) => {\n  csv += `${r.getValue('tranid')},${r.getText('entity')},${r.getValue('amount')}\\n`;\n  return true;\n});\nconst f = file.create({\n  name: 'open_orders.csv',\n  fileType: file.Type.CSV,\n  contents: csv,\n  folder: runtime.getCurrentScript().getParameter({ name: 'custscript_folder' }),\n});\nconst fileId = f.save();\nemail.send({\n  author: 7,\n  recipients: ['ops@example.com'],\n  subject: 'Open orders',\n  body: 'Open orders are attached.',\n  attachments: [file.load({ id: fileId })],\n});\n",
      hints: ['`\\n` inside a string is a new line.'],
      run: { params: { custscript_folder: 42 } },
      check(res, h) {
        const f = Object.values(res.db.files).find((x) => x.name === 'open_orders.csv');
        const em = res.emails.find((e) => e.recipients.includes('ops@example.com'));
        return [ok(res), [!!f && f.folder === 42, 'open_orders.csv saved in folder 42'], [!!f && /^tranid,customer,total/.test(f.contents) && ['SO1001', 'SO1002', 'SO1003'].every((t) => f.contents.includes(t)), 'CSV has the header and all 3 open orders'], [!!em && em.subject === 'Open orders' && em.attachments.includes('open_orders.csv'), 'Email sent with the file attached']];
      },
    },

    // ---------------- Chapter 8 ----------------
    {
      id: 'c8-1', chapter: 8, title: 'Out of units',
      summary: 'Rescue a scheduled script that hits the usage limit.',
      brief: [
        'This account has 800 extra open sales orders. A **Scheduled script** gets 10,000 units. The starter loads and saves every order: 30 units each, so it dies around order 330 with `SSS_USAGE_LIMIT_EXCEEDED`.',
        'Run it and look at the error and the units meter.',
        '**Your task**',
        '- Mark every open sales order (status `SalesOrd:B`) with `custbody_reviewed = true` without running out of units.',
      ],
      starter: SS + "define(['N/search', 'N/record', 'N/log'], (search, record, log) => {\n  const execute = () => {\n    search.create({\n      type: search.Type.SALES_ORDER,\n      filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'SalesOrd:B']],\n      columns: ['tranid'],\n    }).run().each((r) => {\n      const so = record.load({ type: record.Type.SALES_ORDER, id: r.id });\n      so.setValue({ fieldId: 'custbody_reviewed', value: true });\n      so.save();\n      return true;\n    });\n  };\n  return { execute };\n});\n",
      solution: SS + "define(['N/search', 'N/record', 'N/log'], (search, record, log) => {\n  const execute = () => {\n    search.create({\n      type: search.Type.SALES_ORDER,\n      filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'SalesOrd:B']],\n      columns: ['tranid'],\n    }).run().each((r) => {\n      record.submitFields({\n        type: record.Type.SALES_ORDER,\n        id: r.id,\n        values: { custbody_reviewed: true },\n      });\n      return true;\n    });\n  };\n  return { execute };\n});\n",
      hints: ['submitFields costs 10 units on a transaction instead of 30.'],
      run: { setup: (db) => NS().addSalesOrders(db, 800) },
      check(res, h) {
        const open = Object.values(res.db.transaction).filter((r) => r.values._type === 'salesorder' && r.values.orderstatus === 'B');
        return [ok(res), [open.length > 800 && open.every((r) => r.values.custbody_reviewed === true), 'Every open order is marked reviewed (' + open.filter((r) => r.values.custbody_reviewed === true).length + ' of ' + open.length + ')'], [res.unitsUsed <= 10000, 'Stayed within 10,000 units']];
      },
    },
    {
      id: 'c8-2', chapter: 8, title: 'One search beats a thousand loads',
      summary: 'Use a joined search column instead of loading records.',
      brief: [
        'You need the email address of every customer with an open order. The starter loads each order and then each customer: 15 units per order. With 600 extra orders, that blows the budget.',
        'A search can reach into related records with a **join**. On a sales order search, `{ name: \'email\', join: \'customer\' }` returns the customer\'s email in the same results. The whole search costs 10 units.',
        'A **Set** keeps only unique values: `const s = new Set(); s.add(x); s.size`.',
        '**Your task**',
        "- Collect the unique customer emails on open orders and log the count with title 'Unique emails'.",
      ],
      starter: SS + "define(['N/search', 'N/record', 'N/log'], (search, record, log) => {\n  const execute = () => {\n    const emails = new Set();\n    search.create({\n      type: search.Type.SALES_ORDER,\n      filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'SalesOrd:B']],\n      columns: ['entity'],\n    }).run().each((r) => {\n      const so = record.load({ type: record.Type.SALES_ORDER, id: r.id });\n      const cust = record.load({ type: record.Type.CUSTOMER, id: so.getValue('entity') });\n      emails.add(cust.getValue('email'));\n      return true;\n    });\n    log.debug('Unique emails', emails.size);\n  };\n  return { execute };\n});\n",
      solution: SS + "define(['N/search', 'N/log'], (search, log) => {\n  const execute = () => {\n    const emails = new Set();\n    search.create({\n      type: search.Type.SALES_ORDER,\n      filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'SalesOrd:B']],\n      columns: [search.createColumn({ name: 'email', join: 'customer' })],\n    }).run().each((r) => {\n      emails.add(r.getValue({ name: 'email', join: 'customer' }));\n      return true;\n    });\n    log.debug('Unique emails', emails.size);\n  };\n  return { execute };\n});\n",
      hints: ["Read the joined value with the same object: `r.getValue({ name: 'email', join: 'customer' })`."],
      run: { setup: (db) => NS().addSalesOrders(db, 600) },
      check(res, h) { return [ok(res), [h.log('Unique emails', '4'), 'Found 4 unique emails'], [h.calls('record.load') === 0, 'No record.load calls'], [res.unitsUsed <= 100, 'Used 100 units or fewer']]; },
    },
    {
      id: 'c8-3', chapter: 8, title: 'Map/Reduce open balances',
      summary: 'Total each customer\'s open invoices in parallel stages.',
      brief: [
        '**Map/Reduce** splits big jobs into stages NetSuite can run in parallel, each with its own unit budget:',
        '- `getInputData()` returns what to process, here a search of open invoices.',
        '- `map(context)` runs once per result. `context.value` is a JSON string of the result; select fields look like `{ value, text }`. Call `context.write({ key, value })` to group things.',
        '- `reduce(context)` runs once per key with every value written for it in `context.values` (an array of strings).',
        '- `summarize(summary)` runs at the end for reporting.',
        '**Your task**',
        '- getInputData: invoices, main line, status `CustInvc:A`, columns `entity` and `amountremaining`.',
        '- map: write key = customer ID, value = amount remaining.',
        "- reduce: add up the values and save the total on the customer with submitFields into `custentity_open_balance`.",
      ],
      starter: MR + "define(['N/search', 'N/record', 'N/log'], (search, record, log) => {\n  const getInputData = () => {\n    // return a search\n  };\n\n  const map = (context) => {\n    const result = JSON.parse(context.value);\n    // context.write({ key: ..., value: ... });\n  };\n\n  const reduce = (context) => {\n    // add up context.values and update the customer\n  };\n\n  const summarize = (summary) => {\n    log.audit('Done', 'Usage: ' + summary.usage);\n  };\n\n  return { getInputData, map, reduce, summarize };\n});\n",
      solution: MR + "define(['N/search', 'N/record', 'N/log'], (search, record, log) => {\n  const getInputData = () => search.create({\n    type: search.Type.INVOICE,\n    filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'CustInvc:A']],\n    columns: ['entity', 'amountremaining'],\n  });\n\n  const map = (context) => {\n    const result = JSON.parse(context.value);\n    context.write({ key: result.values.entity.value, value: result.values.amountremaining });\n  };\n\n  const reduce = (context) => {\n    const total = context.values.reduce((sum, v) => sum + Number(v), 0);\n    record.submitFields({\n      type: record.Type.CUSTOMER,\n      id: context.key,\n      values: { custentity_open_balance: total },\n    });\n  };\n\n  const summarize = (summary) => {\n    log.audit('Done', 'Usage: ' + summary.usage);\n  };\n\n  return { getInputData, map, reduce, summarize };\n});\n",
      hints: ['entity is a select field, so in map it is `result.values.entity.value`.', 'Values arrive as strings. Use Number(v) before adding.'],
      run: {},
      check(res, h) {
        const bal = (id) => Number(h.get('customer', id).values.custentity_open_balance);
        const run0 = res.runs[0] || {};
        return [ok(res), [bal(101) === 50 && bal(102) === 800, 'Acme = 50, Globex = 800'], [bal(103) === 300 && bal(104) === 95, 'Initech = 300, Umbrella = 95'], [(run0.reduceKeys || []).length === 4, 'reduce ran once per customer (4 keys)'], [!(run0.mapErrors || []).length, 'No map errors']];
      },
    },

    // ---------------- Chapter 9 ----------------
    {
      id: 'c9-1', chapter: 9, title: 'A Suitelet form',
      summary: 'Show a form on GET and create a record on POST.',
      brief: [
        'A **Suitelet** is a script with its own web page. `onRequest(context)` runs for every visit. A **GET** request means someone opened the page; a **POST** means they submitted the form.',
        "`serverWidget.createForm({ title })` builds a NetSuite-style form. `form.addField({ id: 'custpage_title', type: serverWidget.FieldType.TEXT, label: 'Title' })` adds a field (IDs must start with `custpage_`). `form.addSubmitButton({ label })` adds the button. `context.response.writePage(form)` shows it.",
        'On POST, submitted values are in `context.request.parameters`, keyed by field ID.',
        '**Your task**',
        '- GET: show a form titled \'New Task\' with a mandatory `custpage_title` text field and a submit button.',
        '- POST: create a task with that title, then `redirect.toRecord({ type: record.Type.TASK, id })`.',
      ],
      starter: SL + "define(['N/ui/serverWidget', 'N/record', 'N/redirect'], (serverWidget, record, redirect) => {\n  const onRequest = (context) => {\n    if (context.request.method === 'GET') {\n      // build and write the form\n    } else {\n      // create the task and redirect\n    }\n  };\n  return { onRequest };\n});\n",
      solution: SL + "define(['N/ui/serverWidget', 'N/record', 'N/redirect'], (serverWidget, record, redirect) => {\n  const onRequest = (context) => {\n    if (context.request.method === 'GET') {\n      const form = serverWidget.createForm({ title: 'New Task' });\n      const field = form.addField({ id: 'custpage_title', type: serverWidget.FieldType.TEXT, label: 'Title' });\n      field.isMandatory = true;\n      form.addSubmitButton({ label: 'Create' });\n      context.response.writePage(form);\n    } else {\n      const task = record.create({ type: record.Type.TASK });\n      task.setValue({ fieldId: 'title', value: context.request.parameters.custpage_title });\n      const id = task.save();\n      redirect.toRecord({ type: record.Type.TASK, id });\n    }\n  };\n  return { onRequest };\n});\n",
      hints: ['Set `field.isMandatory = true;` on the object addField returns.'],
      run: { triggers: [{ method: 'GET' }, { method: 'POST', parameters: { custpage_title: 'Ship samples to Globex' } }] },
      check(res, h) {
        const page = res.runs[0] && res.runs[0].page;
        const fld = page && page.fields.find((x) => x.id === 'custpage_title');
        const t = h.find('task', (r) => r.values.title === 'Ship samples to Globex');
        const red = res.runs[1] && res.runs[1].redirect;
        return [ok(res), [!!fld && fld.isMandatory && !!page.submit, 'GET shows the form with a mandatory title and a submit button'], [!!t, 'POST creates the task'], [!!red && !!t && Number(red.id) === t.id, 'POST redirects to the new task']];
      },
    },
    {
      id: 'c9-2', chapter: 9, title: 'A RESTlet API',
      summary: 'Answer GET and POST requests from another system.',
      brief: [
        'A **RESTlet** is your own API endpoint inside NetSuite. Other systems call it over HTTP.',
        '- `get(params)` receives URL parameters (like `?id=102`) as an object.',
        '- `post(body)` receives the request body; with JSON it arrives already parsed.',
        '- Whatever you return is sent back to the caller.',
        "`search.lookupFields({ type, id, columns: ['companyname', 'email'] })` reads a few fields for 1 unit.",
        '**Your task**',
        '- get: return `{ name, email }` for the customer whose ID is in `params.id`.',
        '- post: create a customer from `body.name`, `body.email` and `body.subsidiary`, and return `{ id }`.',
      ],
      starter: RL + "define(['N/record', 'N/search'], (record, search) => {\n  const get = (params) => {\n  };\n\n  const post = (body) => {\n  };\n\n  return { get, post };\n});\n",
      solution: RL + "define(['N/record', 'N/search'], (record, search) => {\n  const get = (params) => {\n    const f = search.lookupFields({ type: search.Type.CUSTOMER, id: params.id, columns: ['companyname', 'email'] });\n    return { name: f.companyname, email: f.email };\n  };\n\n  const post = (body) => {\n    const c = record.create({ type: record.Type.CUSTOMER });\n    c.setValue({ fieldId: 'companyname', value: body.name });\n    c.setValue({ fieldId: 'email', value: body.email });\n    c.setValue({ fieldId: 'subsidiary', value: body.subsidiary });\n    return { id: c.save() };\n  };\n\n  return { get, post };\n});\n",
      hints: ['Customers need a subsidiary or the save fails.'],
      run: { triggers: [{ method: 'GET', params: { id: '102' } }, { method: 'POST', body: { name: 'Wayne Enterprises', email: 'ap@wayne.example', subsidiary: 2 } }] },
      check(res, h) {
        const g = res.runs[0] && res.runs[0].returned;
        const p = res.runs[1] && res.runs[1].returned;
        const c = p && h.get('customer', p.id);
        return [ok(res), [!!g && g.name === 'Globex Inc' && g.email === 'orders@globex.example', 'GET returns Globex Inc and its email'], [!!c && c.values.companyname === 'Wayne Enterprises', 'POST creates Wayne Enterprises and returns its id'], [h.calls('record.load') === 0, 'GET used lookupFields, not record.load']];
      },
    },
    {
      id: 'c9-3', chapter: 9, title: 'Workflow action script',
      summary: 'Write the one step a workflow can\'t do by itself.',
      brief: [
        '**SuiteFlow** workflows are built by clicking, not coding. When a workflow needs something it can\'t do, it calls a **Workflow Action script**. Its entry point is `onAction(context)`, and `context.newRecord` is the record the workflow is running on.',
        'Whatever onAction returns can be stored in a workflow field.',
        '`runtime.getCurrentUser().name` is the person who triggered it.',
        '**Your task**',
        "- When a purchase order is approved, create a `customrecord_audit_note` with name `Approval PO3001` (built from the tranid), `custrecord_note_transaction` = the PO's ID, and `custrecord_note_text` = `Approved by <user name>`.",
        "- Return 'DONE'.",
      ],
      starter: WA + "define(['N/record', 'N/runtime'], (record, runtime) => {\n  const onAction = (context) => {\n    const po = context.newRecord;\n  };\n  return { onAction };\n});\n",
      solution: WA + "define(['N/record', 'N/runtime'], (record, runtime) => {\n  const onAction = (context) => {\n    const po = context.newRecord;\n    const note = record.create({ type: 'customrecord_audit_note' });\n    note.setValue({ fieldId: 'name', value: 'Approval ' + po.getValue({ fieldId: 'tranid' }) });\n    note.setValue({ fieldId: 'custrecord_note_transaction', value: po.id });\n    note.setValue({ fieldId: 'custrecord_note_text', value: 'Approved by ' + runtime.getCurrentUser().name });\n    note.save();\n    return 'DONE';\n  };\n  return { onAction };\n});\n",
      hints: [],
      run: { trigger: { recordType: 'purchaseorder', id: 3001 } },
      check(res, h) {
        const n = h.find('customrecord_audit_note', () => true);
        return [ok(res), [!!n && n.values.name === 'Approval PO3001' && Number(n.values.custrecord_note_transaction) === 3001, 'Audit note named Approval PO3001 links to the PO'], [!!n && n.values.custrecord_note_text === 'Approved by Quest Mullins', "Note text is 'Approved by Quest Mullins'"], [res.runs[0] && res.runs[0].returned === 'DONE', "Returned 'DONE'"]];
      },
    },

    // ---------------- Chapter 10 ----------------
    {
      id: 'c10-1', chapter: 10, title: 'Same code, every account',
      summary: 'Replace a hard-coded production ID with a parameter.',
      brief: [
        'Internal IDs differ between production and sandbox. Code that hard-codes a production ID breaks the moment it runs anywhere else.',
        'The starter assigns tasks to employee 412, who exists in production but not in this sandbox. Run it to see the error.',
        '**Your task**',
        "- Read the assignee from the parameter `custscript_assignee` (9 in this sandbox) and create a task titled 'Weekly stock check' assigned to that employee.",
      ],
      starter: "const task = record.create({ type: record.Type.TASK });\ntask.setValue({ fieldId: 'title', value: 'Weekly stock check' });\ntask.setValue({ fieldId: 'assigned', value: 412 });\ntask.save();\n",
      solution: "const assignee = runtime.getCurrentScript().getParameter({ name: 'custscript_assignee' });\nconst task = record.create({ type: record.Type.TASK });\ntask.setValue({ fieldId: 'title', value: 'Weekly stock check' });\ntask.setValue({ fieldId: 'assigned', value: assignee });\ntask.save();\n",
      hints: [],
      run: { params: { custscript_assignee: 9 } },
      check(res, h) { const t = h.find('task', (r) => r.values.title === 'Weekly stock check'); return [ok(res), [!!t && Number(t.values.assigned) === 9, 'Task assigned to employee 9'], [!/412/.test(h.code), 'No hard-coded 412'], [h.calls('getParameter:custscript_assignee') >= 1, 'Read custscript_assignee']]; },
    },
    {
      id: 'c10-2', chapter: 10, title: 'Write testable code',
      summary: 'Build a library module and pass its unit tests.',
      brief: [
        'A **unit test** calls one small function with known inputs and checks the output. Professional NetSuite teams run tests with Jest and SDF before every deploy.',
        'Code is easy to test when the logic lives in plain functions. A **library module** is a `define()` file with no script type that returns functions for other scripts to use.',
        '**Your task**',
        "- Return `{ commission }` where `commission(total, tier)` gives 10% for 'gold', 7% for 'silver' and 5% for anything else.",
        '- Totals of 0 or less earn 0. Round to 2 decimals: `Math.round(x * 100) / 100`.',
        'Code Lab runs six tests against your function.',
      ],
      starter: "/**\n * @NApiVersion 2.1\n */\ndefine([], () => {\n  const commission = (total, tier) => {\n    return 0;\n  };\n  return { commission };\n});\n",
      solution: "/**\n * @NApiVersion 2.1\n */\ndefine([], () => {\n  const RATES = { gold: 0.10, silver: 0.07 };\n  const commission = (total, tier) => {\n    if (total <= 0) return 0;\n    const rate = RATES[tier] || 0.05;\n    return Math.round(total * rate * 100) / 100;\n  };\n  return { commission };\n});\n",
      hints: ['An object can map tiers to rates: `{ gold: 0.10, silver: 0.07 }`.'],
      run: { triggers: [
        { call: (e) => e.commission(1000, 'gold') },
        { call: (e) => e.commission(1000, 'silver') },
        { call: (e) => e.commission(1000, 'bronze') },
        { call: (e) => e.commission(0, 'gold') },
        { call: (e) => e.commission(-50, 'silver') },
        { call: (e) => e.commission(333.33, 'gold') },
      ] },
      check(res) {
        const r = res.runs.map((x) => x.returned);
        const want = [100, 70, 50, 0, 0, 33.33];
        const labels = ['commission(1000, gold) = 100', 'commission(1000, silver) = 70', 'commission(1000, bronze) = 50', 'commission(0, gold) = 0', 'commission(-50, silver) = 0', 'commission(333.33, gold) = 33.33'];
        return [ok(res)].concat(want.map((w, i) => [r[i] === w, labels[i] + (r[i] === w ? '' : ' (got ' + JSON.stringify(r[i]) + ')')]));
      },
    },
  ];

  function helpers(res, code) {
    const logs = res.logs || [];
    const s = (x) => String(x);
    return {
      code,
      logs,
      log: (title, details) => logs.some((l) => l.title === s(title) && l.details === s(details)),
      logHas: (text) => logs.some((l) => (l.title + ' ' + l.details).includes(text)),
      logLevel: (level, text) => logs.some((l) => l.level === level && (l.title + ' ' + l.details).includes(text)),
      calls: (name) => (res.calls && res.calls[name]) || 0,
      get: (table, id) => res.db[table][Number(id)],
      find: (table, pred) => Object.values(res.db[table]).find(pred) || null,
    };
  }

  function grade(challenge, code) {
    const res = NS().run(code, Object.assign({}, challenge.run));
    let checks;
    try {
      checks = challenge.check(res, helpers(res, code)).map(([pass, label]) => ({ pass: !!pass, label }));
    } catch (e) {
      checks = [{ pass: false, label: 'Grader could not read your results: ' + e.message }];
    }
    return { res, checks, passed: checks.length > 0 && checks.every((c) => c.pass) };
  }

  const API = { CHALLENGES, grade, helpers };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.NSChallenges = API;
})(typeof self !== 'undefined' ? self : this);
