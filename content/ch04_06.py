from helpers import *

CH4 = chapter(
    4, "Saved Searches & SuiteQL", "Querying NetSuite data", "Week 2",
    [
        S("Why searches come first",
          P("Saved searches are NetSuite's query builder and the single most useful skill to learn early. Admins use them for reports and dashboards; scripts use them to find records to process.")),
        S("Parts of a search",
          B("**Type**: Transaction, Customer, Item, a custom record, and so on.",
            "**Criteria**: filters such as Type is Sales Order, Status is Pending Fulfillment, Main Line is true.",
            "**Results**: the columns to return, optionally with a **summary type** (Group, Count, Sum, Minimum, Maximum, Average).",
            "**Available Filters**: filters users can change when they run the search.",
            "**Audience**: who can see and run it."),
          P("Saved searches get script IDs starting with `customsearch` so scripts can load them by ID.")),
        S("The Main Line trap",
          P("Transaction searches return **one row per line** by default: one for the header (the main line) plus rows for each item, tax and shipping line."),
          B("**Main Line = true**: one row per transaction (header only).",
            "**Main Line = false**: only line rows, for line-level detail like item and quantity."),
          WARN("Duplicate rows in a transaction search almost always mean Main Line isn't set. Beginners hit this constantly.")),
        S("Joins and formulas",
          P("Searches can reach into related records with **joins**. In a transaction search, the Customer fields join lets you show the customer's email or category."),
          P("**Formula** columns and criteria use SQL-like expressions with field IDs in braces:"),
          C("""
CASE WHEN {amount} > 1000 THEN 'Big' ELSE 'Small' END
NVL({custbody_rush_order}, 'F')
TO_CHAR({trandate}, 'YYYY-MM')
{today} - {duedate}   -- days overdue
"""),
          TIP("Group by a TO_CHAR({trandate}, 'YYYY-MM') formula and Sum the amount to get sales by month.")),
        S("Searches in SuiteScript",
          P("The `N/search` module creates or loads searches. Filters can be written as **filter expressions**: arrays joined by `'AND'` / `'OR'`."),
          C("""
search.create({
  type: search.Type.SALES_ORDER,
  filters: [
    ['mainline', 'is', 'T'], 'AND',
    ['status', 'anyof', 'SalesOrd:B'] // Pending Fulfillment
  ],
  columns: ['tranid', 'entity', 'total']
}).run().each((r) => {
  log.debug(r.getValue('tranid'), r.getText('entity'));
  return true; // keep iterating
});
"""),
          B("`run().each()` stops after **4,000** results. Return `true` to keep going.",
            "`run().getRange({ start, end })` returns at most **1,000** rows per call.",
            "`runPaged({ pageSize })` handles large result sets: up to 1,000 rows per page.",
            "`search.load({ id: 'customsearch_open_orders' })` loads an existing saved search.",
            "`search.lookupFields()` reads a few fields from one record cheaply.")),
        S("SuiteQL",
          P("**SuiteQL** is a SQL dialect (based on SQL-92 / Oracle syntax) over NetSuite's analytics data source. It is **read-only** and great for joins that searches make awkward. Run it with `N/query` or the REST SuiteQL endpoint."),
          C("""
SELECT t.id, t.tranid,
       BUILTIN.DF(t.entity) AS customer,
       t.foreigntotal
FROM transaction t
WHERE t.type = 'SalesOrd'
  AND t.trandate >= ADD_MONTHS(SYSDATE, -1)
"""),
          C("""
const rows = query.runSuiteQL({
  query: 'SELECT id, companyname FROM customer WHERE isinactive = ?',
  params: ['F']
}).asMappedResults(); // [{ id: 12, companyname: 'Acme' }, ...]
"""),
          B("`BUILTIN.DF(field)` returns a field's display value instead of its ID.",
            "Use `?` placeholders with `params` instead of string concatenation.",
            "`runSuiteQL` returns up to 5,000 rows; use `runSuiteQLPaged` for more.",
            "Transaction type values are codes like `SalesOrd`, `CustInvc`, `PurchOrd`."),
          TIP("Explore table and column names in the Records Catalog (Setup → Records Catalog).")),
    ],
    [
        "Saved searches have a type, criteria, result columns (with optional summaries) and an audience.",
        "Set Main Line on transaction searches or you'll get one row per line.",
        "Formulas use {fieldid} syntax with SQL functions like CASE, NVL and TO_CHAR.",
        "run().each() caps at 4,000 results; use runPaged for more.",
        "SuiteQL is read-only SQL over the analytics data source; use BUILTIN.DF for display values and ? params.",
    ],
    LAB("Build four essential searches", "Get fluent with criteria, results and summaries.",
        "Open sales orders by customer: Transaction search, Type = Sales Order, Status = Pending Fulfillment, Main Line = true. Results: Customer, Number, Date, Amount.",
        "Overdue invoices: Type = Invoice, Status = Open, Main Line = true, Due Date before 30 days ago. Add a formula column `{today} - {duedate}` for days overdue.",
        "Items below reorder point: Item search, criteria with a formula `{quantityavailable} < {reorderpoint}` (Formula (Numeric) = 1 using CASE).",
        "Sales by month: Transaction search, Type = Invoice, Main Line = true. Results: formula TO_CHAR({trandate}, 'YYYY-MM') with summary Group and Amount with summary Sum.",
        "Remove Main Line from search 1 and watch the duplicate rows appear. Put it back.",
        "Rewrite search 1 as SuiteQL and run it in a SuiteQL tool or via N/query in the debugger."),
    [
        F("Main Line = true", "One row per transaction (the header line only)."),
        F("Summary types", "Group, Count, Sum, Minimum, Maximum, Average."),
        F("run().each() limit", "4,000 results. Return true from the callback to continue."),
        F("getRange limit", "1,000 rows per call."),
        F("BUILTIN.DF()", "SuiteQL function returning a field's display value instead of its internal ID."),
        F("Is SuiteQL read-only?", "Yes. It can only SELECT."),
        F("Sales order type code in searches/SuiteQL", "SalesOrd"),
        F("search.lookupFields", "Cheap way to read a few field values from a single record."),
    ],
    [
        Q("A transaction search shows each sales order 4 times. What's the most likely fix?",
          "Set Main Line = true", ["Add a Group summary to every column", "Switch the search type to Customer", "Remove the Status filter"],
          "Without Main Line, transaction searches return the header plus every line."),
        Q("You want only line-level detail (item, quantity) from transactions. Which criteria?",
          "Main Line = false", ["Main Line = true", "Line Sequence = 0", "Shipping Line = true"],
          "Main Line = false excludes the header row and returns lines."),
        Q("How many results can `run().each()` iterate before it stops?",
          "4,000", ["1,000", "10,000", "Unlimited"],
          "Use `runPaged()` for larger result sets."),
        Q("What's wrong with this callback?",
          "It doesn't return true, so iteration stops after the first result",
          ["each() requires an async function", "getValue needs a fieldId object", "Nothing; it processes all results"],
          "each() continues only while the callback returns true.",
          code="""
search.create({ type: 'customer', columns: ['companyname'] })
  .run().each((r) => {
    names.push(r.getValue('companyname'));
  });"""),
        Q("What does `BUILTIN.DF(t.entity)` return in SuiteQL?",
          "The customer's display name", ["The customer's internal ID", "The customer's default address", "A boolean for whether entity is set"],
          "DF = display field. It converts an ID into its display text."),
        Q("Which statement about SuiteQL is true?",
          "It is read-only", ["It can UPDATE records in bulk", "It requires SOAP web services", "It only works in client scripts"],
          "SuiteQL only queries. Writes go through records (N/record, REST, CSV import...)."),
        Q("Which summary type would you use to total invoice amounts per customer?",
          "Group on customer, Sum on amount", ["Count on customer, Group on amount", "Maximum on both", "Average on customer"],
          "Group the dimension and Sum the measure."),
        Q("Which formula returns 'Big' when amount exceeds 1,000?",
          "CASE WHEN {amount} > 1000 THEN 'Big' END",
          ["IF(amount > 1000, 'Big')", "{amount > 1000 ? 'Big'}", "WHEN amount > 1000 RETURN 'Big'"],
          "Saved search formulas use SQL CASE syntax with {fieldid} references."),
        Q("What's the safest way to pass a user-supplied value into SuiteQL?",
          "A ? placeholder with the params array",
          ["String concatenation", "Template literals", "Encoding the value in base64"],
          "Parameters avoid injection and quoting bugs."),
        Q("What is the maximum number of rows `getRange()` returns per call?",
          "1,000", ["100", "4,000", "5,000"],
          "Request ranges of up to 1,000 at a time."),
        Q("Which is the cheapest way to read three field values from one known record?",
          "search.lookupFields", ["record.load", "A saved search with runPaged", "record.copy"],
          "lookupFields costs 1 unit and doesn't load the full record."),
        Q("Where can you browse SuiteQL table and column names?",
          "The Records Catalog", ["The File Cabinet", "The Execution Log", "Setup → Enable Features"],
          "Setup → Records Catalog documents records, fields and joins for SuiteQL."),
        Q("In SuiteQL, what `type` value identifies invoices in the transaction table?",
          "'CustInvc'", ["'invoice'", "'Invoice'", "'INV'"],
          "Transaction type codes include SalesOrd, CustInvc, PurchOrd, VendBill, ItemShip."),
        Q("How many rows does `query.runSuiteQL` return at most?",
          "5,000", ["1,000", "4,000", "Unlimited"],
          "Use `runSuiteQLPaged` beyond that."),
    ],
)

CH5 = chapter(
    5, "SuiteScript 2.1 Basics", "Your first scripts", "Week 4",
    [
        S("What SuiteScript is",
          P("SuiteScript is JavaScript that NetSuite runs on its servers (or in the browser, for client scripts). Use **version 2.1**, which supports modern syntax: `const`/`let`, arrow functions, template literals, destructuring and more."),
          P("Version 1.0 (functions like `nlapiLoadRecord`) is legacy. You'll see it in old accounts but shouldn't write new 1.0 code.")),
        S("Anatomy of a script file",
          P("Every file uses AMD-style `define()` plus JSDoc tags that tell NetSuite what it is."),
          C("""
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {
  const beforeSubmit = (context) => {
    if (context.type !== context.UserEventType.CREATE) return;
    const so = context.newRecord;
    if (!so.getValue({ fieldId: 'memo' })) {
      so.setValue({ fieldId: 'memo', value: 'Created by script' });
    }
  };
  return { beforeSubmit };
});
"""),
          B("`@NApiVersion 2.1`: the SuiteScript version.",
            "`@NScriptType`: the script type (UserEventScript, ClientScript, ScheduledScript, MapReduceScript, Suitelet, Restlet...).",
            "`define([...modules], callback)`: loads N/ modules and returns an object of **entry points**.",
            "The returned keys (`beforeSubmit`) must match the entry point names for that script type.")),
        S("Getting a script running",
          N("**Upload the file** to the File Cabinet, usually under `SuiteScripts/`.",
            "**Create the script record**: Customization → Scripting → Scripts → New, and pick the file. NetSuite reads the JSDoc tags.",
            "**Create a deployment**: which record types it runs on, status (**Testing** or **Released**), log level, audience (roles) and Execute As Role."),
          TIP("Testing status runs the script only for its owner. Flip to Released when it's ready for everyone in the audience.")),
        S("Logging and debugging",
          P("`log.debug(title, details)` writes to the deployment's **Execution Log** tab. Levels are debug, audit, error and emergency, and the deployment's Log Level setting filters what gets saved."),
          C("""
log.debug('Order loaded', { id: so.id, total: so.getValue('total') });
log.error('Failed to sync', e.message);
"""),
          WARN("If your log.debug calls don't appear, check the deployment's Log Level. If it's set to Error, debug and audit entries are dropped.")),
        S("Working with records",
          C("""
// Load, change, save
const cust = record.load({ type: record.Type.CUSTOMER, id: 123 });
cust.setValue({ fieldId: 'comments', value: 'VIP' });
const id = cust.save();

// Update body fields without loading the record
record.submitFields({
  type: record.Type.SALES_ORDER, id: 456,
  values: { memo: 'Rush' }
});

// Create
const task = record.create({ type: record.Type.TASK });
task.setValue({ fieldId: 'title', value: 'Call customer' });
task.save();

// Read sublist lines
const n = so.getLineCount({ sublistId: 'item' });
for (let i = 0; i < n; i++) {
  const qty = so.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
}
"""),
          B("Sublist lines are **zero-indexed** in 2.x.",
            "`save()` returns the internal ID of the saved record.",
            "`record.transform({ fromType, fromId, toType })` creates a record from another, e.g. sales order to invoice.",
            "`record.copy` and `record.delete` do what they say.")),
        S("Standard vs. dynamic mode",
          P("**Standard mode** (the default) lets you set values in any order; sourcing and calculations happen on save. You set sublist values by line index with `setSublistValue`."),
          P("**Dynamic mode** (`isDynamic: true`) behaves like a user in the UI: fields source as you set them, so order matters. Sublists are edited one line at a time."),
          C("""
const so = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });
so.setValue({ fieldId: 'entity', value: 342 }); // sources terms, address...
so.selectNewLine({ sublistId: 'item' });
so.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: 77 });
so.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 2 });
so.commitLine({ sublistId: 'item' });
so.save();
"""),
          TIP("Use dynamic mode when you need sourced values (prices, tax, addresses) available before save, the way the UI shows them.")),
        S("Errors",
          P("Wrap risky work in `try/catch` and throw meaningful errors with `N/error`. An uncaught error in beforeSubmit stops the save and shows the message to the user, which is exactly how you block bad data."),
          C("""
throw error.create({
  name: 'MISSING_PO',
  message: 'Orders over $10,000 need a PO number.',
  notifyOff: true
});
""")),
    ],
    [
        "Write SuiteScript 2.1: AMD define(), @NApiVersion and @NScriptType JSDoc tags, returned entry points.",
        "A script needs a file in the File Cabinet, a script record and a deployment.",
        "Testing status runs only for the owner; Released runs for the audience.",
        "log.debug writes to the Execution Log, filtered by the deployment's log level.",
        "submitFields updates body fields without a load; sublist lines are zero-indexed.",
        "Standard mode sources on save; dynamic mode sources as you go and uses select/commit for lines.",
    ],
    LAB("Ship your first User Event", "Upload, deploy and debug a real script.",
        "Save the memo-defaulting script from this chapter as `ue_default_memo.js`.",
        "Upload it to SuiteScripts in the File Cabinet.",
        "Create a script record for it, then a deployment on Sales Order with status Testing and log level Debug.",
        "Add a `log.debug('beforeSubmit', context.type)` line, re-upload and create a sales order with no memo.",
        "Confirm the memo was set, then read the Execution Log on the deployment.",
        "Edit the order and confirm the script exits early (type is EDIT, not CREATE).",
        "Change it to throw an N/error when the order total is over 10,000 with no PO number (`otherrefnum`). Test that the save is blocked."),
    [
        F("@NApiVersion", "JSDoc tag declaring the SuiteScript version (use 2.1)."),
        F("@NScriptType", "JSDoc tag declaring the script type, like UserEventScript or ClientScript."),
        F("Three objects to run a script", "Script file in the File Cabinet, script record, script deployment."),
        F("Testing vs. Released", "Testing runs only for the script owner. Released runs for the deployment's audience."),
        F("Where do log.debug entries go?", "The Execution Log tab on the script deployment (and script record)."),
        F("record.submitFields", "Updates body fields on a record without loading it. Cheaper than load + save."),
        F("Dynamic mode sublist methods", "selectNewLine / selectLine, setCurrentSublistValue, commitLine."),
        F("What does record.save() return?", "The internal ID of the saved record."),
        F("Sublist line index base in 2.x", "Zero (first line is 0)."),
    ],
    [
        Q("Which JSDoc tag tells NetSuite the script type?",
          "@NScriptType", ["@NApiVersion", "@NModuleScope", "@NEntryPoint"],
          "@NScriptType declares UserEventScript, ClientScript, etc. @NApiVersion sets 2.1."),
        Q("Which three things are needed to run a server script?",
          "A file in the File Cabinet, a script record and a deployment",
          ["A file, a workflow and a role", "A saved search, a script record and a form", "Only the file in SuiteScripts"],
          "The deployment decides where and for whom it runs."),
        Q("A deployment is set to Testing. Who triggers the script?",
          "Only the script owner", ["Everyone in the audience", "Only administrators", "Nobody until it is Released"],
          "Testing is a safe way to try a script in a shared account."),
        Q("Your log.debug calls never show up, but log.error calls do. Why?",
          "The deployment's log level is set higher than Debug",
          ["log.debug only works in client scripts", "Debug logs are deleted after an hour", "log.debug needs three arguments"],
          "Set the deployment's Log Level to Debug while developing."),
        Q("What does this code do?",
          "Updates the memo without loading the full record",
          ["Loads the record and saves it twice", "Creates a new sales order", "Only works on custom records"],
          "submitFields is the efficient way to update body fields.",
          code="record.submitFields({ type: record.Type.SALES_ORDER, id: 456, values: { memo: 'Rush' } });"),
        Q("What index is the first line of a sublist in SuiteScript 2.x?",
          "0", ["1", "-1", "It depends on the sublist"],
          "2.x is zero-based. (1.0 was one-based, a common migration bug.)"),
        Q("In dynamic mode, which call finalizes a sublist line?",
          "commitLine", ["saveLine", "insertLine", "setSublistValue"],
          "selectNewLine → setCurrentSublistValue → commitLine."),
        Q("When would you choose dynamic mode?",
          "When you need sourced values to appear as you set fields, like in the UI",
          ["When you want the script to use fewer units", "When updating only one body field", "When running in a client script"],
          "Dynamic mode sources as you go; standard mode sources on save."),
        Q("What's missing from this script file?",
          "The function must be returned as an entry point",
          ["A semicolon after define", "The N/log module is required in every script", "A @NModuleScope tag"],
          "NetSuite calls only the entry points the module returns: `return { beforeSubmit };`",
          code="""
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'], (record) => {
  const beforeSubmit = (context) => { /* ... */ };
});"""),
        Q("How do you block a record from saving with a clear message in beforeSubmit?",
          "Throw an error (e.g. with N/error)", ["Return false", "Call context.cancel()", "Set newRecord to null"],
          "An uncaught error in beforeSubmit stops the save and shows the message."),
        Q("Which method creates an invoice from an existing sales order?",
          "record.transform", ["record.copy", "record.create with createdfrom set", "record.convert"],
          "transform({ fromType: 'salesorder', fromId, toType: 'invoice' })."),
        Q("Which SuiteScript version should new code use?",
          "2.1", ["1.0", "2.0 only", "3.0"],
          "2.1 supports modern ES syntax. 1.0 is legacy."),
        Q("What does `cust.save()` return?",
          "The record's internal ID", ["true or false", "The record object", "Nothing"],
          "Useful for linking new records together."),
        Q("Where is the right place to look for a script's log output?",
          "The Execution Log tab on the deployment", ["The browser console only", "System Notes on the record", "The File Cabinet"],
          "Server-side logs go to the Execution Log. Client script logs also appear there."),
    ],
)

CH6 = chapter(
    6, "Script Types & Entry Points", "Picking the right tool", "Week 4",
    [
        S("The script type decides when your code runs",
          P("Each script type has its own **entry points**: the function names NetSuite calls. You return them from `define()`."),
          T(["Type", "Runs", "Entry points", "Typical use"],
            ["User Event", "Server, when a record is loaded or saved", "beforeLoad, beforeSubmit, afterSubmit", "Validate or default on save, add buttons, create related records"],
            ["Client", "Browser, on the form", "pageInit, fieldChanged, validateField, saveRecord...", "Live UI behavior and validation"],
            ["Scheduled", "Server, on a schedule or queued", "execute", "Batch jobs with small volumes"],
            ["Map/Reduce", "Server, in parallel stages", "getInputData, map, reduce, summarize", "Processing thousands of records"],
            ["Suitelet", "Server, at its own URL", "onRequest", "Custom pages and internal tools"],
            ["RESTlet", "Server, HTTP endpoint", "get, post, put, delete", "Custom APIs"],
            ["Workflow Action", "Server, from SuiteFlow", "onAction", "Logic a workflow can't express"],
            ["Mass Update", "Server, per record in a mass update", "each", "Bulk fixes from the UI"],
            ["Portlet", "Dashboard", "render", "Dashboard widgets"])),
        S("User Event scripts",
          B("**beforeLoad(context)**: before the record is shown. Add buttons or fields with `context.form`, or set defaults on create.",
            "**beforeSubmit(context)**: before the record is written. Change `context.newRecord` or throw to block the save. On create, the record has **no ID yet**.",
            "**afterSubmit(context)**: after the record is committed. The ID exists; use it to create or update **other** records. Changing `newRecord` here does nothing."),
          P("`context.type` tells you the event: `CREATE`, `EDIT`, `DELETE`, `XEDIT` (inline edit or submitFields), `COPY`, `VIEW` and others. `context.oldRecord` holds the values before an edit."),
          C("""
const afterSubmit = (context) => {
  if (context.type !== context.UserEventType.CREATE) return;
  const so = context.newRecord;
  record.create({ type: record.Type.TASK })
    .setValue({ fieldId: 'title', value: `Welcome call for ${so.id}` })
    .setValue({ fieldId: 'transaction', value: so.id })
    .save();
};
"""),
          WARN("A record saved by another User Event script does NOT trigger User Events. This prevents infinite loops but surprises people. Also, on XEDIT newRecord only contains the changed fields.")),
        S("Client scripts",
          P("Client scripts run in the browser on a form. They get `context.currentRecord` (from N/currentRecord)."),
          T(["Entry point", "Fires when", "Return"],
            ["pageInit", "The form loads", "—"],
            ["fieldChanged", "A field value changes", "—"],
            ["postSourcing", "Sourcing finishes after a field change", "—"],
            ["validateField", "Before a field change is accepted", "true to accept, false to reject"],
            ["lineInit", "A sublist line is selected", "—"],
            ["validateLine", "Before a line is added", "true / false"],
            ["sublistChanged", "A sublist is changed", "—"],
            ["saveRecord", "The user clicks Save", "true to save, false to block"]),
          C("""
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], (dialog) => {
  const saveRecord = (context) => {
    const rec = context.currentRecord;
    if (rec.getValue('custbody_rush_order') && !rec.getValue('memo')) {
      dialog.alert({ title: 'Memo needed', message: 'Explain why this is a rush.' });
      return false;
    }
    return true;
  };
  return { saveRecord };
});
"""),
          WARN("Client validation is convenience, not security. Imports, web services and other scripts bypass the browser. Enforce rules that matter in a User Event too.")),
        S("Choosing the right type",
          B("Change the record being saved → **User Event beforeSubmit**.",
            "Touch other records after a save → **User Event afterSubmit**.",
            "Instant feedback while a user types → **Client script**.",
            "Process a few hundred records nightly → **Scheduled**.",
            "Process thousands of records → **Map/Reduce**.",
            "A custom page or tool → **Suitelet**.",
            "Another system needs to call NetSuite with custom logic → **RESTlet**."),
          TIP("If a script behaves differently from CSV imports or integrations, check `runtime.executionContext` and the deployment's execution context settings.")),
    ],
    [
        "User Event: beforeLoad (form), beforeSubmit (change or block the record), afterSubmit (touch other records).",
        "On create, beforeSubmit has no ID yet; afterSubmit does.",
        "Records saved by another User Event script don't trigger User Events.",
        "Client validateField, validateLine and saveRecord must return true or false.",
        "Client validation can be bypassed; enforce critical rules on the server.",
        "Map/Reduce for volume, Scheduled for small batches, Suitelet for pages, RESTlet for APIs.",
    ],
    LAB("One record, three scripts", "Feel the difference between UE stages and client entry points.",
        "Write a User Event with all three entry points that logs `context.type` and whether `newRecord.id` is set.",
        "Deploy it on Sales Order (Testing) and create, edit, inline-edit and view an order. Compare the logs.",
        "In beforeLoad, add a button with `context.form.addButton({ id: 'custpage_hello', label: 'Hello' })` on VIEW only.",
        "In afterSubmit on CREATE, create a follow-up Task linked to the order.",
        "Write a client script with validateField that rejects a negative `custbody_discount_pct`, and saveRecord that blocks rush orders without a memo.",
        "Import a sales order by CSV and observe which scripts run and which don't."),
    [
        F("beforeLoad", "UE entry point before the record is displayed. Use context.form to add buttons/fields."),
        F("beforeSubmit", "UE entry point before the record is written. Modify newRecord or throw to block."),
        F("afterSubmit", "UE entry point after commit. The ID exists. Update other records here."),
        F("XEDIT", "UserEventType for inline edits and submitFields; newRecord has only changed fields."),
        F("validateField return value", "true to accept the change, false to reject it."),
        F("saveRecord return value", "true lets the save continue, false blocks it."),
        F("Map/Reduce entry points", "getInputData, map, reduce, summarize."),
        F("Suitelet entry point", "onRequest(context)."),
        F("RESTlet entry points", "get, post, put, delete."),
        F("Workflow Action entry point", "onAction(context)."),
    ],
    [
        Q("You need to default a field on the record being saved. Which entry point?",
          "beforeSubmit", ["afterSubmit", "beforeLoad", "pageInit"],
          "beforeSubmit can still modify newRecord before it's written."),
        Q("In beforeSubmit on CREATE, what is `context.newRecord.id`?",
          "Not set yet, because the record hasn't been saved", ["The next available internal ID", "0", "The ID of the source transaction"],
          "Use afterSubmit when you need the new record's ID."),
        Q("A script sets a field on `context.newRecord` in afterSubmit but the change never saves. Why?",
          "The record is already committed; afterSubmit changes to newRecord are ignored",
          ["afterSubmit is read-only for custom fields only", "setValue needs isDynamic", "The deployment is in Testing"],
          "Use record.submitFields or load/save to change it after commit."),
        Q("Record A's User Event saves Record B. Record B has its own User Event. Does B's run?",
          "No; records saved by a User Event script don't trigger User Events",
          ["Yes, always", "Only beforeSubmit runs", "Only if B is a custom record"],
          "This rule prevents infinite loops. Workflows or a scheduled/MR script can be alternatives."),
        Q("Which entry point lets you add a custom button to a form?",
          "beforeLoad (via context.form.addButton)", ["afterSubmit", "saveRecord", "validateLine"],
          "beforeLoad gets the form object (N/ui/serverWidget) before it renders."),
        Q("What must a client `saveRecord` function return to allow the save?",
          "true", ["Nothing", "The record ID", "context.currentRecord"],
          "Returning false (or nothing) blocks the save."),
        Q("A client script prevents negative quantities, but bad data still arrives via CSV import. Why?",
          "Client scripts only run in the browser; imports bypass them",
          ["CSV imports ignore all scripts", "validateField only runs on create", "The client script needs Released status"],
          "Enforce critical rules in a User Event, which runs for imports and web services too."),
        Q("What does `context.type === 'xedit'` mean in a User Event?",
          "The record was inline-edited or updated via submitFields",
          ["The record was exported", "The record was edited by an external system only", "The record is being deleted"],
          "On XEDIT, newRecord carries only the changed fields."),
        Q("You need to process 50,000 invoices. Which script type?",
          "Map/Reduce", ["Scheduled", "User Event", "Client"],
          "Map/Reduce handles volume, parallelism and governance yielding."),
        Q("Which script type gives you a custom page at its own URL?",
          "Suitelet", ["RESTlet", "Portlet", "Mass Update"],
          "Suitelets serve forms, lists or raw HTML at an internal or external URL."),
        Q("Which client entry point fires after sourcing completes for a changed field?",
          "postSourcing", ["fieldChanged", "pageInit", "lineInit"],
          "fieldChanged fires immediately; postSourcing fires once dependent fields have sourced."),
        Q("Which entry point does a Workflow Action script use?",
          "onAction", ["execute", "each", "onRequest"],
          "Workflow Action scripts run when a workflow calls them via a Custom Action."),
        Q("Which object holds the field values from before an edit in a User Event?",
          "context.oldRecord", ["context.previousRecord", "context.newRecord.original", "context.form"],
          "Compare oldRecord and newRecord to detect what changed."),
        Q("What's wrong with this validateField?",
          "It never returns true, so every field change is rejected",
          ["validateField can't read fieldId", "It should use getText", "Nothing is wrong"],
          "Always return true when the value is acceptable.",
          code="""
const validateField = (context) => {
  if (context.fieldId === 'custbody_discount_pct') {
    return context.currentRecord.getValue('custbody_discount_pct') >= 0;
  }
};"""),
    ],
)
