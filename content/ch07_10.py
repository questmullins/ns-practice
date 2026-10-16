from helpers import *

CH7 = chapter(
    7, "The N/ Modules", "Your SuiteScript toolbox", "Week 5",
    [
        S("Modules at a glance",
          T(["Module", "Purpose"],
            ["N/record", "Create, load, copy, transform, save, delete records; submitFields"],
            ["N/search", "Build or load saved searches, page results, lookupFields"],
            ["N/query", "SuiteQL and the query builder API"],
            ["N/log", "Execution log: debug, audit, error, emergency"],
            ["N/runtime", "Current user, script parameters, remaining governance, execution context"],
            ["N/ui/serverWidget", "Build Suitelet forms and lists; add fields/buttons in beforeLoad"],
            ["N/ui/dialog, N/ui/message", "Client-side alerts and banners"],
            ["N/currentRecord", "The record open in a client script"],
            ["N/https, N/http", "Call external APIs"],
            ["N/file", "Read/write File Cabinet files (CSV, JSON, PDF)"],
            ["N/email, N/render", "Send email; render PDFs and templates"],
            ["N/task", "Queue scheduled, map/reduce, CSV import and search tasks"],
            ["N/format", "Convert dates and numbers between strings and objects"],
            ["N/error", "Create proper NetSuite errors"],
            ["N/url, N/redirect", "Build URLs to records/Suitelets; redirect users"],
            ["N/cache", "Store values across executions cheaply"])),
        S("N/runtime: who, where and how much",
          C("""
const script = runtime.getCurrentScript();
const threshold = script.getParameter({ name: 'custscript_threshold' });
const left = script.getRemainingUsage();

const user = runtime.getCurrentUser(); // user.id, user.role, user.subsidiary
if (runtime.executionContext === runtime.ContextType.CSV_IMPORT) { /* ... */ }
"""),
          P("**Script parameters** (IDs start with `custscript_`) are fields on the script record whose values are set per deployment. Use them instead of hard-coding IDs, emails and thresholds.")),
        S("N/https: calling the outside world",
          P("An **HTTP request** is how programs talk over the web: you send a **method** (GET to read, POST to create, PUT/PATCH to update, DELETE to remove) to a **URL**, and get back a **status code** (200 means OK, 404 not found, 401 not allowed) and a **body**, usually JSON."),
          C("""
const res = https.post({
  url: 'https://api.example.com/orders',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: so.id, total: so.getValue('total') })
});
if (res.code !== 200) throw error.create({ name: 'SYNC_FAILED', message: res.body });
const data = JSON.parse(res.body);
"""),
          TIP("Never hard-code secrets in a script. Store API keys as API Secrets (Setup → Company → API Secrets) or in a protected custom record, and use https.createSecretKey where supported.")),
        S("N/file and N/email",
          C("""
const f = file.create({
  name: 'open_orders.csv', fileType: file.Type.CSV,
  contents: 'id,total\\n1,100\\n', folder: 123
});
const fileId = f.save();

email.send({
  author: -5,                 // an employee internal ID
  recipients: ['ops@example.com'],
  subject: 'Open orders',
  body: 'Attached.',
  attachments: [file.load({ id: fileId })]
});
""")),
        S("N/ui/serverWidget: building pages",
          C("""
const form = serverWidget.createForm({ title: 'Quick Task' });
form.addField({ id: 'custpage_title', type: serverWidget.FieldType.TEXT, label: 'Title' });
form.addSubmitButton({ label: 'Create' });
context.response.writePage(form);
"""),
          P("Fields you add in Suitelets or beforeLoad must start with `custpage_`. They exist only on the page and aren't stored unless you save them somewhere yourself.")),
        S("N/task, N/format, N/cache",
          C("""
// Queue a Map/Reduce from another script
task.create({
  taskType: task.TaskType.MAP_REDUCE,
  scriptId: 'customscript_mr_sync',
  deploymentId: 'customdeploy_mr_sync',
  params: { custscript_since: '2026-01-01' }
}).submit();

// Dates: string <-> Date in the user's format
const d = format.parse({ value: '10/16/2026', type: format.Type.DATE });
const s = format.format({ value: new Date(), type: format.Type.DATE });

// Cache an expensive lookup
const c = cache.getCache({ name: 'rates', scope: cache.Scope.PRIVATE });
const rate = c.get({ key: 'EUR', loader: () => fetchRate('EUR'), ttl: 3600 });
"""),
          WARN("Don't build date strings by hand. Users have different date formats; N/format handles them.")),
        S("Client vs. server modules",
          P("Some modules only work in one place. `N/currentRecord`, `N/ui/dialog` and `N/ui/message` are client-side. `N/task`, `N/file` writes and `N/email` are server-side. Check each module's \"Supported Script Types\" in the Help Center.")),
    ],
    [
        "N/record and N/search are the workhorses; N/query adds SuiteQL.",
        "N/runtime gives parameters (custscript_), user info, execution context and remaining usage.",
        "Use script parameters instead of hard-coded IDs and thresholds.",
        "N/https for outbound calls; never hard-code secrets.",
        "Fields added in Suitelets/beforeLoad start with custpage_.",
        "N/task queues Map/Reduce and scheduled scripts; N/format handles dates; N/cache saves repeat lookups.",
    ],
    LAB("Build a daily open-orders email", "Combine search, file, email and runtime.",
        "Create a Scheduled script with parameters `custscript_recipient` (email) and `custscript_folder` (integer).",
        "Search open sales orders (Pending Fulfillment, Main Line true) and build a CSV string.",
        "Save it to the folder from the parameter with N/file.",
        "Email it with N/email, attaching the file.",
        "Log `getRemainingUsage()` at the start and end to see what each step cost.",
        "Deploy it with a daily schedule in Testing, then run it once with Save & Execute."),
    [
        F("custscript_", "Prefix for script parameter IDs."),
        F("runtime.getCurrentScript().getRemainingUsage()", "Returns the governance units left in this execution."),
        F("custpage_", "Prefix for fields/sublists added on the fly in Suitelets or beforeLoad. Not stored."),
        F("N/task", "Queues scheduled, map/reduce, CSV import and search tasks."),
        F("N/format", "Converts dates/numbers between strings and objects using user preferences."),
        F("N/cache", "Stores values across executions to avoid repeat lookups."),
        F("Client-only modules", "N/currentRecord, N/ui/dialog, N/ui/message."),
        F("runtime.executionContext", "What triggered the script: USER_INTERFACE, CSV_IMPORT, WEBSERVICES, SCHEDULED..."),
    ],
    [
        Q("Which module tells you how many governance units remain?",
          "N/runtime", ["N/log", "N/task", "N/error"],
          "runtime.getCurrentScript().getRemainingUsage()."),
        Q("Script parameter IDs start with which prefix?",
          "custscript_", ["custparam_", "custpage_", "customscript_"],
          "customscript_ is the script record; custscript_ is a parameter on it."),
        Q("You add a field to a Suitelet form. What must its ID start with?",
          "custpage_", ["custbody_", "custscript_", "custform_"],
          "custpage_ fields live only on the rendered page."),
        Q("Which module do you use to call an external REST API?",
          "N/https", ["N/url", "N/redirect", "N/query"],
          "N/https (or N/http) makes outbound requests."),
        Q("Which module should parse a date string typed in the user's preferred format?",
          "N/format", ["N/runtime", "Native Date.parse", "N/util"],
          "format.parse respects the user's date preference."),
        Q("A User Event needs to start a Map/Reduce job. Which module?",
          "N/task", ["N/record", "N/runtime", "N/workflow"],
          "task.create({ taskType: task.TaskType.MAP_REDUCE, ... }).submit()."),
        Q("Which module is ONLY available in client scripts?",
          "N/currentRecord", ["N/record", "N/search", "N/log"],
          "N/currentRecord represents the form open in the browser."),
        Q("What's the problem with this code?",
          "The API key is hard-coded in the script",
          ["https.get can't send headers", "headers must be an array", "Authorization headers are blocked"],
          "Store secrets in API Secrets or a protected record, not in the file anyone with File Cabinet access can read.",
          code="""
https.get({
  url: 'https://api.example.com/rates',
  headers: { Authorization: 'Bearer sk_live_9f8e7d6c' }
});"""),
        Q("How do you detect that a User Event was triggered by a CSV import?",
          "runtime.executionContext === runtime.ContextType.CSV_IMPORT",
          ["context.type === 'csv'", "context.newRecord.isImport", "log.getContext() === 'import'"],
          "executionContext tells you what kicked off the script."),
        Q("Which module sends email from a script?",
          "N/email", ["N/https", "N/render", "N/message"],
          "N/render builds PDFs/templates; N/email sends."),
        Q("Why use script parameters instead of hard-coded values?",
          "Admins can change values per deployment without editing code",
          ["Parameters use fewer governance units", "Hard-coded values are not allowed in 2.1", "Parameters are encrypted automatically"],
          "Different deployments (and sandbox vs. production) can use different values."),
        Q("Which module builds a link to a record or Suitelet?",
          "N/url", ["N/redirect", "N/https", "N/file"],
          "url.resolveRecord / url.resolveScript build links; N/redirect sends the user there."),
    ],
)

CH8 = chapter(
    8, "Governance & Data at Scale", "Scheduled and Map/Reduce scripts", "Week 5",
    [
        S("Why governance exists",
          P("NetSuite is multi-tenant: your scripts share servers with other companies. So every execution gets a budget of **usage units**. Each API call costs units, and running out throws `SSS_USAGE_LIMIT_EXCEEDED`."),
          T(["Script type", "Units per execution"],
            ["Client, User Event, Suitelet, Portlet, Workflow Action", "1,000"],
            ["RESTlet", "5,000"],
            ["Scheduled", "10,000"],
            ["Map/Reduce", "getInputData 10,000; map 1,000; reduce 5,000; summarize 10,000 (per invocation)"]),
          P("There are also time limits and instruction-count limits, not just units.")),
        S("What things cost",
          T(["Operation", "Transaction", "Custom record", "Entity"],
            ["record.load", "10", "2", "5"],
            ["record.save", "20", "4", "10"],
            ["record.submitFields", "10", "2", "5"],
            ["record.delete", "20", "4", "10"]),
          B("`search.lookupFields`: 1 unit.",
            "A search page / `run().each` / `runPaged().fetch`: about 5–10 units.",
            "`query.runSuiteQL`: 10 units.",
            "`email.send`: 20 units. `https.get/post`: 10 units. `task.submit`: 20 units."),
          TIP("Unit costs change between releases. Check the Help Center for current values.")),
        S("Habits that save units",
          B("Use `search.lookupFields` instead of loading a record to read a few values.",
            "Use `submitFields` instead of load + save for body fields.",
            "Never load records inside a loop when one search can fetch everything.",
            "Move anything over a few hundred records into Map/Reduce.",
            "Check `getRemainingUsage()` in long loops and stop gracefully."),
          C("""
// Bad: 10 units per record + 20 per save, inside a loop
ids.forEach((id) => {
  const so = record.load({ type: 'salesorder', id });
  so.setValue({ fieldId: 'memo', value: 'Reviewed' });
  so.save();
});

// Better: 10 units per record, no load
ids.forEach((id) => record.submitFields({
  type: 'salesorder', id, values: { memo: 'Reviewed' }
}));
""")),
        S("Scheduled scripts",
          P("A Scheduled script has one entry point, `execute(context)`. Deploy it on a schedule (daily, weekly, every 15 minutes...) or queue it with `N/task`. It gets 10,000 units and does **not** yield automatically."),
          P("Good for small nightly jobs. If volume might grow, write it as Map/Reduce from the start.")),
        S("Map/Reduce: the four stages",
          N("**getInputData()**: return the data to process: an array, an object, a search object or reference, or a SuiteQL query.",
            "**map(context)**: called once per input item. `context.key` and `context.value` (a JSON string). Write key/value pairs with `context.write()`.",
            "**reduce(context)**: called once per unique key written by map. `context.values` is an array of strings.",
            "**summarize(summary)**: runs once at the end. Read errors and totals, send a report."),
          C("""
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {
  const getInputData = () => search.create({
    type: 'invoice',
    filters: [['mainline', 'is', 'T'], 'AND', ['status', 'anyof', 'CustInvc:A']],
    columns: ['entity', 'amountremaining']
  });

  const map = (context) => {
    const r = JSON.parse(context.value);
    context.write({ key: r.values.entity.value, value: r.values.amountremaining });
  };

  const reduce = (context) => {
    const total = context.values.reduce((s, v) => s + Number(v), 0);
    record.submitFields({ type: 'customer', id: context.key,
      values: { custentity_open_balance: total } });
  };

  const summarize = (summary) => {
    summary.mapSummary.errors.iterator().each((key, err) => {
      log.error(`map ${key}`, err);
      return true;
    });
    log.audit('Done', `Usage: ${summary.usage}, yields: ${summary.yields}`);
  };

  return { getInputData, map, reduce, summarize };
});
"""),
          B("Map/Reduce **yields automatically** between invocations, so total volume isn't limited by one budget.",
            "map and reduce invocations can run **in parallel** (concurrency is set on the deployment, limited by your processors).",
            "You can skip map or reduce, but not both.",
            "An error in one map call doesn't stop the others; read errors in summarize.")),
        S("Choosing Scheduled vs. Map/Reduce",
          T(["", "Scheduled", "Map/Reduce"],
            ["Volume", "Small (hundreds)", "Large (thousands+)"],
            ["Governance", "10,000 units total", "Per-stage budgets, auto-yield"],
            ["Parallelism", "No", "Yes"],
            ["Error isolation", "One error can stop the run", "Per key; reported in summarize"],
            ["Complexity", "Simple", "More structure"])),
    ],
    [
        "Every execution gets a unit budget; running out throws SSS_USAGE_LIMIT_EXCEEDED.",
        "Client/UE/Suitelet 1,000; RESTlet 5,000; Scheduled 10,000; Map/Reduce per stage.",
        "Transactions cost most (load 10, save 20); lookupFields costs 1.",
        "Don't load records in loops; use searches, lookupFields and submitFields.",
        "Map/Reduce: getInputData → map → reduce → summarize; auto-yields and runs in parallel.",
        "Read per-key errors in summarize via mapSummary.errors / reduceSummary.errors.",
    ],
    LAB("Scheduled to Map/Reduce", "Feel why Map/Reduce exists.",
        "Write a Scheduled script that loads every open invoice and sets a custom checkbox with load + save. Log remaining usage after each record.",
        "Run it in a sandbox with lots of invoices and watch it hit SSS_USAGE_LIMIT_EXCEEDED.",
        "Rewrite it with submitFields and note how much further it gets.",
        "Rewrite it as Map/Reduce: getInputData returns the search, map calls submitFields.",
        "Add a summarize that logs usage, yields and any map errors.",
        "Bonus: make reduce group open balance by customer and write it to a custom entity field."),
    [
        F("SSS_USAGE_LIMIT_EXCEEDED", "Error thrown when a script runs out of governance units."),
        F("User Event / Client / Suitelet budget", "1,000 units per execution."),
        F("RESTlet budget", "5,000 units per execution."),
        F("Scheduled budget", "10,000 units per execution."),
        F("record.load on a transaction", "10 units. Save is 20."),
        F("search.lookupFields cost", "1 unit."),
        F("Map/Reduce stages", "getInputData, map, reduce, summarize."),
        F("map context", "context.key, context.value (JSON string), context.write({ key, value })."),
        F("reduce context", "context.key and context.values (array of strings)."),
        F("Does Map/Reduce yield automatically?", "Yes, between invocations. Scheduled scripts don't."),
    ],
    [
        Q("What happens when a script runs out of usage units?",
          "It throws SSS_USAGE_LIMIT_EXCEEDED", ["It pauses until the next hour", "It switches to Testing status", "NetSuite buys more units automatically"],
          "Design scripts to stay under budget or move to Map/Reduce."),
        Q("How many units does a User Event script get per execution?",
          "1,000", ["5,000", "10,000", "Unlimited"],
          "Client, User Event, Suitelet, Portlet and Workflow Action scripts get 1,000."),
        Q("How many units does a RESTlet get per execution?",
          "5,000", ["1,000", "10,000", "2,000"],
          "RESTlets get 5,000."),
        Q("Roughly how many units do record.load + record.save cost on a sales order?",
          "30 (10 + 20)", ["2", "10", "100"],
          "Transactions are the most expensive records."),
        Q("Which is the cheapest way to read a couple of fields from a record?",
          "search.lookupFields (1 unit)", ["record.load (10 units)", "record.copy", "A full saved search per field"],
          "lookupFields is the go-to for quick reads."),
        Q("What's the governance problem here?",
          "It loads and saves a full record for every ID inside a loop",
          ["forEach isn't allowed in SuiteScript", "setValue costs 50 units", "Nothing; this is optimal"],
          "30 units per order on transactions. submitFields cuts it to 10; Map/Reduce removes the ceiling.",
          code="""
ids.forEach((id) => {
  const so = record.load({ type: 'salesorder', id });
  so.setValue({ fieldId: 'memo', value: 'Reviewed' });
  so.save();
});"""),
        Q("In a Map/Reduce map stage, what type is `context.value`?",
          "A string (often JSON you need to parse)", ["A loaded record object", "A search.Result object", "An array"],
          "Always JSON.parse it when getInputData returned objects or search results."),
        Q("In reduce, what is `context.values`?",
          "An array of strings written by map for that key", ["A single string", "A search result set", "The summary object"],
          "reduce runs once per key with every value grouped together."),
        Q("Where do you find errors thrown inside map invocations?",
          "summary.mapSummary.errors in summarize", ["The browser console", "getInputData's return value", "They stop the whole script immediately"],
          "Each key fails independently; summarize reports them."),
        Q("Which statement about Map/Reduce is true?",
          "It yields automatically and can run map/reduce invocations in parallel",
          ["It has a single 10,000 unit budget for the whole run", "It must use both map and reduce", "It only runs on demand, never on a schedule"],
          "That's why it's the tool for volume."),
        Q("Which can getInputData return?",
          "An array, an object, a search or a SuiteQL query", ["Only an array of internal IDs", "Only a saved search ID", "Only a file"],
          "NetSuite iterates whatever you return and feeds it to map."),
        Q("Does a Scheduled script yield automatically when units run low?",
          "No", ["Yes, always", "Only on weekends", "Only when deployed in Released status"],
          "In 2.x, plan for it: reschedule with N/task or use Map/Reduce."),
        Q("How many units does a Scheduled script get?",
          "10,000", ["1,000", "5,000", "100,000"],
          "Enough for small batch jobs."),
        Q("Which writes a key/value pair from map to reduce?",
          "context.write({ key, value })", ["return { key, value }", "context.emit(key, value)", "reduce.push(key, value)"],
          "Values must be strings (objects are serialized)."),
    ],
)

CH9 = chapter(
    9, "Workflows, Suitelets & Integrations", "UI tools and talking to other systems", "Weeks 6–7",
    [
        S("SuiteFlow workflows",
          P("SuiteFlow is a visual **state machine** attached to a record type, built under Customization → Workflow."),
          B("**Initiation**: event-based (on create, on view or update) or scheduled, plus conditions.",
            "**States**: e.g. Pending Approval → Approved → Rejected.",
            "**Actions** inside states: set field value, send email, add button, lock record, create record, show message, or run a Workflow Action script.",
            "**Triggers** decide when actions run: Entry, Exit, Before Record Load, Before Record Submit, After Record Submit, Scheduled.",
            "**Transitions** move between states, triggered by events, buttons or conditions."),
          P("Use workflows for approvals and simple field logic that admins should be able to maintain. Use SuiteScript for heavy logic, loops over lines, external calls or anything performance-sensitive."),
          TIP("A Workflow Action script (entry point `onAction`) lets a workflow call code for the one step it can't do itself, and its return value can be stored in a workflow field.")),
        S("Suitelets",
          P("A Suitelet answers HTTP requests at its own URL with `onRequest(context)`. Build pages with `N/ui/serverWidget` or write raw HTML."),
          C("""
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/redirect'], (ui, record, redirect) => {
  const onRequest = (context) => {
    if (context.request.method === 'GET') {
      const form = ui.createForm({ title: 'New Task' });
      form.addField({ id: 'custpage_title', type: ui.FieldType.TEXT, label: 'Title' })
          .isMandatory = true;
      form.addSubmitButton({ label: 'Create' });
      context.response.writePage(form);
    } else {
      const id = record.create({ type: record.Type.TASK })
        .setValue({ fieldId: 'title', value: context.request.parameters.custpage_title })
        .save();
      redirect.toRecord({ type: record.Type.TASK, id });
    }
  };
  return { onRequest };
});
"""),
          P("GET shows the form; POST handles the submit. Form field values arrive in `context.request.parameters`.")),
        S("Integration options",
          T(["Option", "What it is", "When to use"],
            ["SuiteTalk REST", "Standard REST API for records plus a SuiteQL endpoint", "Default for new CRUD integrations"],
            ["SuiteTalk SOAP", "Older XML/WSDL API", "Legacy integrations and connectors"],
            ["RESTlets", "Your own SuiteScript endpoint", "Custom logic, many operations in one call, custom payloads"],
            ["CSV Import", "Import Assistant or N/task", "Bulk data loads"],
            ["Outbound N/https", "A script calls another system", "Pushing data out of NetSuite"])),
        S("RESTlets",
          C("""
/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/search'], (record, search) => {
  const get = (params) => search.lookupFields({
    type: 'customer', id: params.id, columns: ['companyname', 'email']
  });

  const post = (body) => {
    const id = record.create({ type: 'customer' })
      .setValue({ fieldId: 'companyname', value: body.name })
      .setValue({ fieldId: 'subsidiary', value: body.subsidiary })
      .save();
    return { id };
  };
  return { get, post };
});
"""),
          B("`get` and `delete` receive URL parameters; `post` and `put` receive the request body.",
            "With `Content-Type: application/json`, the body arrives already parsed and returned objects are serialized.",
            "URL: `https://<account>.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=123&deploy=1`.",
            "RESTlets get 5,000 units per call.")),
        S("SuiteTalk REST",
          P("**REST** is a common style of web API: each kind of thing has a URL, and the HTTP method says what to do with it. GET a customer's URL to read it, PATCH it to update it."),
          C("""
GET https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123

POST https://<ACCOUNT_ID>.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql
Prefer: transient
{ "q": "SELECT id, companyname FROM customer WHERE isinactive = 'F'" }
"""),
          P("The record service supports GET, POST (create), PATCH (update), PUT (upsert by external ID) and DELETE. Sandbox account IDs use a hyphen in URLs, like `1234567-sb1`.")),
        S("Authentication",
          B("**Token-Based Authentication (TBA)**: OAuth 1.0a signed requests. An **Integration record** provides the consumer key/secret; an **access token** (tied to a user and role) provides the token ID/secret. Requests are signed with HMAC-SHA256.",
            "**OAuth 2.0**: authorization code flow, or machine-to-machine client credentials using a certificate.",
            "Plain username/password login for web services is no longer supported."),
          P("Turn on the features under Setup → Company → Enable Features → SuiteCloud (REST Web Services, Token-Based Authentication, OAuth 2.0)."),
          WARN("The integration's role decides what it can do. Give it only the permissions it needs, and never use an Administrator token for an integration.")),
    ],
    [
        "SuiteFlow is a state machine: initiation, states, actions with triggers, transitions.",
        "Workflows for approvals and simple logic; scripts for heavy or performance-sensitive logic.",
        "Suitelets: onRequest; GET renders, POST processes; fields come from request.parameters.",
        "RESTlets: get/delete take params, post/put take the body; 5,000 units.",
        "SuiteTalk REST is the default for new integrations; SuiteQL has its own endpoint.",
        "Authenticate with TBA (OAuth 1.0a) or OAuth 2.0, using a least-privilege role.",
    ],
    LAB("Approval workflow plus an API", "Build both halves of weeks 6 and 7.",
        "Build a purchase order workflow: initiate on create when amount > 5,000; states Pending Approval, Approved, Rejected; Approve/Reject buttons for the supervisor; email on rejection.",
        "Add a Workflow Action script that writes an audit note to a custom record when a PO is approved.",
        "Build the Suitelet from this chapter that creates a Task and redirects to it.",
        "Build the RESTlet from this chapter with get and post.",
        "Create an Integration record and an access token for a limited role.",
        "Call the RESTlet and a SuiteTalk REST record GET from Postman using OAuth 1.0 (HMAC-SHA256)."),
    [
        F("Common workflow triggers", "Entry, Exit, Before Record Load, Before Record Submit, After Record Submit, Scheduled."),
        F("Workflow vs. script", "Workflows for approvals and simple logic admins maintain; scripts for heavy logic, line loops, external calls."),
        F("Suitelet GET vs. POST", "GET usually renders the form; POST handles the submitted values."),
        F("RESTlet get/delete input", "URL parameters object."),
        F("RESTlet post/put input", "Request body (parsed if Content-Type is application/json)."),
        F("TBA", "Token-Based Authentication: OAuth 1.0a with consumer key/secret plus token ID/secret."),
        F("SuiteQL REST endpoint", "POST /services/rest/query/v1/suiteql with header Prefer: transient."),
        F("Integration record", "Provides the consumer key and secret for an external application."),
    ],
    [
        Q("What kind of tool is SuiteFlow?",
          "A visual state machine attached to a record type", ["A JavaScript debugger", "A data import tool", "A report writer"],
          "Workflows move records through states with actions and transitions."),
        Q("A finance team wants a PO approval process they can tweak themselves. Best tool?",
          "A SuiteFlow workflow", ["A Map/Reduce script", "A RESTlet", "A client script"],
          "Approvals that admins maintain are SuiteFlow's sweet spot."),
        Q("A workflow needs one step it can't do natively. What do you add?",
          "A Workflow Action script", ["A Portlet", "A second workflow", "A Mass Update script"],
          "The workflow calls it via a custom action; onAction runs your code."),
        Q("In a Suitelet, where do submitted form values arrive?",
          "context.request.parameters", ["context.newRecord", "context.response.body", "runtime.getCurrentUser()"],
          "POST parameters are keyed by the custpage_ field IDs."),
        Q("Which RESTlet entry points receive the request body?",
          "post and put", ["get and delete", "get only", "All four receive the body"],
          "get and delete receive URL parameters instead."),
        Q("What's the default choice for a new integration that creates and updates standard records?",
          "SuiteTalk REST Web Services", ["SuiteTalk SOAP", "Screen scraping", "Emailing CSV files"],
          "Oracle is steering new work toward REST."),
        Q("Token-Based Authentication is based on which standard?",
          "OAuth 1.0a", ["Basic auth", "SAML", "API keys in the URL"],
          "TBA signs each request with consumer and token credentials."),
        Q("Which two credential pairs does a TBA request use?",
          "Consumer key/secret and token ID/secret", ["Username/password and a PIN", "Client ID and a session cookie", "An API key and an account number"],
          "The Integration record gives the consumer pair; the access token gives the token pair."),
        Q("Which header makes SuiteQL REST calls work?",
          "Prefer: transient", ["Accept: suiteql", "X-NetSuite-Query: true", "Content-Type: text/sql"],
          "The SuiteQL endpoint requires Prefer: transient."),
        Q("What's the risk in using an Administrator's access token for an integration?",
          "The integration gets far more access than it needs",
          ["Admin tokens expire every hour", "Admins can't create tokens", "It disables governance"],
          "Use a dedicated least-privilege role."),
        Q("When should you choose a RESTlet over SuiteTalk REST?",
          "When you need custom logic or several operations in a single call",
          ["Whenever you need to read a customer", "When you want no authentication", "Only for SOAP clients"],
          "RESTlets shine for custom payloads and business logic."),
        Q("In this RESTlet call, what is `params.id`?",
          "The value of the id URL parameter",
          ["The request body", "The script ID", "The deployment ID"],
          "get receives the URL query parameters as an object.",
          code="""
// GET .../restlet.nl?script=123&deploy=1&id=42
const get = (params) => search.lookupFields({ type: 'customer', id: params.id, columns: ['email'] });"""),
        Q("Which workflow trigger runs actions just before the record is saved?",
          "Before Record Submit", ["Entry", "After Record Submit", "Before Record Load"],
          "Like a User Event's beforeSubmit, but configured visually."),
        Q("How do sandbox account IDs appear in SuiteTalk URLs?",
          "With a hyphen, e.g. 1234567-sb1", ["With an underscore, e.g. 1234567_SB1", "Without the suffix", "As a separate sandbox domain only"],
          "The account ID 1234567_SB1 becomes 1234567-sb1 in the hostname."),
    ],
)

CH10 = chapter(
    10, "SDF, Environments & Deployment", "Working like a professional", "Week 8",
    [
        S("Customization as code",
          P("**Git** is version control: it records every change to a set of files so you can see history, undo mistakes and work on a team. Code usually lives in a Git repository on a site like GitHub."),
          P("The **SuiteCloud Development Framework (SDF)** lets you keep scripts **and** configuration (custom fields, records, workflows, searches, deployments) in files, in Git, instead of clicking them into each account by hand."),
          C("""
my-project/
  src/
    manifest.xml        # project type, dependencies
    deploy.xml          # what to deploy
    FileCabinet/
      SuiteScripts/     # your .js files
    Objects/            # XML: customscript_*, custbody_*, customrecord_*...
""")),
        S("Project types",
          B("**Account Customization Project (ACP)**: for your own company's account. The usual choice.",
            "**SuiteApp project**: a packaged app (with an ID like `com.mycompany.myapp`) distributed to other accounts, often through the SuiteApp Marketplace."),
          P("The older way to move customizations between accounts is **Bundles** (SuiteBundler). You'll still see them in many companies.")),
        S("The SuiteCloud CLI",
          P("A **CLI** (command-line interface) is a program you run by typing commands in a terminal. The SuiteCloud CLI installs with **npm**, the package manager that comes with **Node.js** (JavaScript for your computer instead of the browser). Neither needs a NetSuite account to install."),
          C("""
npm i -g @oracle/suitecloud-cli

suitecloud project:create -i         # new project (interactive)
suitecloud account:setup             # authenticate to an account
suitecloud object:import             # pull existing objects as XML
suitecloud file:import               # pull File Cabinet files
suitecloud project:validate --server # check before deploying
suitecloud project:deploy            # push to the account
"""),
          P("There are also SuiteCloud extensions for VS Code and WebStorm that wrap the same commands."),
          TIP("Run `project:validate --server` before every deploy. It catches missing dependencies and bad references against the real account.")),
        S("Unit testing",
          P("A **unit test** is a tiny program that calls one function with known inputs and checks the output. **Jest** is the most popular JavaScript test tool. `@oracle/suitecloud-unit-testing` adds Jest with **stubs** (fake versions) of the N/ modules, so you can test script logic without an account."),
          C("""
import record from 'N/record';
import Record from 'N/record/instance';
import script from 'src/FileCabinet/SuiteScripts/ue_default_memo';

jest.mock('N/record');

test('sets memo on create', () => {
  const ctx = { type: 'create', UserEventType: { CREATE: 'create' }, newRecord: Record };
  Record.getValue.mockReturnValue('');
  script.beforeSubmit(ctx);
  expect(Record.setValue).toHaveBeenCalledWith({ fieldId: 'memo', value: 'Created by script' });
});
""")),
        S("Environments",
          T(["Account", "Purpose"],
            ["Production", "The live business. Don't experiment here."],
            ["Sandbox", "A copy of production (data + config) refreshed on request. Account ID has a suffix like 1234567_SB1. Email can be redirected."],
            ["Release Preview", "Temporary account to test your customizations against the next release before it hits production."],
            ["Development account", "A clean account without production data, for building SuiteApps or practicing."]),
          P("NetSuite ships **two major releases a year**. Use Release Preview to catch anything an upgrade breaks before your users do."),
          WARN("A sandbox refresh overwrites the sandbox with a fresh copy of production. Anything built only in the sandbox is lost, which is another reason to keep work in SDF and Git.")),
        S("A healthy release flow",
          N("Develop locally in an SDF project, committed to Git.",
            "Deploy to a sandbox with `suitecloud project:deploy`.",
            "Test with deployments in **Testing** status and real end-user roles.",
            "Get sign-off, then deploy the same project to production.",
            "Flip deployments to **Released** and watch the Execution Log."),
          TIP("Keep account-specific values (internal IDs, emails) in script parameters so the same code works in sandbox and production.")),
    ],
    [
        "SDF keeps scripts and configuration objects in files you can version in Git.",
        "ACP for your own account; SuiteApp projects for distributed apps; Bundles are the legacy route.",
        "CLI: project:create, account:setup, object:import, project:validate --server, project:deploy.",
        "Unit test with @oracle/suitecloud-unit-testing (Jest + N/ stubs).",
        "Production, sandbox (_SB1), Release Preview and development accounts each have a job.",
        "Flow: SDF + Git → sandbox → test in Testing status → production → Released.",
    ],
    LAB("Put your account under version control", "Set up the professional workflow.",
        "Install Node.js and the SuiteCloud CLI.",
        "Run `suitecloud project:create -i` and create an Account Customization Project.",
        "Run `suitecloud account:setup` against your sandbox or dev account.",
        "Import the scripts and custom objects you built in earlier chapters with object:import and file:import.",
        "Commit everything to a Git repo.",
        "Change a script, run `project:validate --server`, then `project:deploy`.",
        "Add one Jest unit test with @oracle/suitecloud-unit-testing and run it."),
    [
        F("SDF", "SuiteCloud Development Framework: customizations as files you version and deploy."),
        F("ACP", "Account Customization Project: SDF project for your own company's account."),
        F("SuiteApp project", "SDF project for a packaged app distributed to other accounts."),
        F("Objects/ folder", "XML definitions of custom objects: scripts, deployments, fields, records, workflows, searches."),
        F("project:validate --server", "Validates the project against the real account before deploying."),
        F("Sandbox account ID", "Production ID plus a suffix like _SB1."),
        F("Release Preview", "Temporary account for testing against the next NetSuite release."),
        F("Releases per year", "Two major releases."),
        F("Bundles", "Legacy way (SuiteBundler) to move customizations between accounts."),
    ],
    [
        Q("What does SDF let you do?",
          "Manage scripts and configuration objects as files in version control",
          ["Run SQL updates against NetSuite", "Raise governance limits", "Skip the need for sandboxes"],
          "Customizations become XML and JS files you can review, diff and deploy."),
        Q("Which project type do you use for your own company's account?",
          "Account Customization Project (ACP)", ["SuiteApp project", "Bundle project", "Release Preview project"],
          "SuiteApp projects are for packaged apps distributed to other accounts."),
        Q("Where do custom field and script deployment definitions live in an SDF project?",
          "In the Objects folder as XML", ["In manifest.xml", "In FileCabinet/SuiteScripts", "In package.json"],
          "Objects/ holds XML for custom objects; FileCabinet/ holds files."),
        Q("Which command checks your project against the real account before deploying?",
          "suitecloud project:validate --server", ["suitecloud project:create", "suitecloud account:setup", "npm test"],
          "Server validation catches missing dependencies and bad references."),
        Q("Which command pulls existing custom objects from an account into your project?",
          "suitecloud object:import", ["suitecloud project:deploy", "suitecloud file:upload", "suitecloud account:pull"],
          "file:import does the same for File Cabinet files."),
        Q("What is a sandbox account?",
          "A copy of production that you can refresh on request",
          ["A blank account with no data", "Production with scripts disabled", "A local emulator"],
          "Sandboxes carry production data and configuration, with a suffix like _SB1."),
        Q("What happens to work built only in a sandbox when it's refreshed?",
          "It's overwritten by the fresh copy of production", ["It's merged into production", "It's archived automatically", "Nothing; refreshes only add data"],
          "Keep work in SDF and Git so a refresh doesn't erase it."),
        Q("What is a Release Preview account for?",
          "Testing your customizations against the next NetSuite release",
          ["Previewing a script before saving it", "Showing customers new features", "Permanent extra sandbox storage"],
          "NetSuite ships two major releases a year; Release Preview lets you test early."),
        Q("Which package adds Jest with N/ module stubs?",
          "@oracle/suitecloud-unit-testing", ["@oracle/suitecloud-cli", "netsuite-jest", "@netsuite/mocks"],
          "It lets you unit test script logic without an account."),
        Q("What's the healthiest order of steps?",
          "SDF + Git → sandbox → test in Testing status → production → Released",
          ["Production → sandbox → Git", "Edit in production, then copy to sandbox", "Deploy to production in Released status, then test"],
          "Test in a safe environment first, with real roles, then release."),
        Q("How do you keep the same code working in sandbox and production when internal IDs differ?",
          "Put account-specific values in script parameters", ["Hard-code both and check the URL", "Use only custom records", "Re-write the script per account"],
          "Parameters are set per deployment, so each account gets its own values."),
        Q("What is the legacy way to move customizations between accounts?",
          "Bundles (SuiteBundler)", ["CSV import", "SuiteQL", "Saved search export"],
          "Bundles are still common, but SDF is the modern approach."),
        Q("How many major NetSuite releases ship per year?",
          "Two", ["One", "Four", "Twelve"],
          "Use Release Preview each time to catch regressions."),
    ],
)
