from helpers import *

CH0 = chapter(
    0, "JavaScript from Zero", "The coding basics SuiteScript is built on", "Start here",
    [
        S("What code is, and which language",
          P("A **program** is a list of instructions a computer follows exactly, top to bottom. You write them in a **programming language**, a strict, tiny vocabulary the computer understands."),
          P("NetSuite's scripting language, **SuiteScript**, is **JavaScript** with NetSuite's own add-ons. It is **not Java**. The names are similar for marketing reasons from the 1990s, but they are different languages."),
          T(["", "JavaScript", "Java"],
            ["Used by NetSuite?", "Yes, SuiteScript is JavaScript", "No"],
            ["Variables", "`let total = 5;`", "`int total = 5;`"],
            ["Runs", "In browsers and on servers (NetSuite, Node.js)", "Android apps, enterprise back ends"],
            ["Practice it", "Code Lab, freeCodeCamp, any browser", "Not needed for NetSuite"]),
          TIP("When a job post says SuiteScript, it means JavaScript. Every hour you spend on JavaScript counts.")),
        S("Values and variables",
          P("A **value** is a piece of data. The basic kinds (called **types**):"),
          B("**Number**: `42`, `12.5`, `-3`.",
            "**String**: text in quotes, `'Acme Corp'` or `\"Acme Corp\"`.",
            "**Boolean**: `true` or `false`. NetSuite checkboxes are booleans.",
            "**null** and **undefined**: \"no value\". You'll see both."),
          P("A **variable** is a named box for a value. Use `const` when the box never gets a new value, and `let` when it will. (Old code uses `var`; avoid it.)"),
          C("""
const customer = 'Acme Corp';
let openOrders = 2;
openOrders = openOrders + 1;   // now 3
const message = `${customer} has ${openOrders} open orders`;
"""),
          P("That last line is a **template literal**: backticks with `${...}` placeholders. It's the easiest way to build text from values."),
          P("`//` starts a **comment**: a note for humans that the computer ignores.")),
        S("Comparing and deciding",
          B("`=` **assigns** a value. `===` **compares** two values. Mixing them up is the most common beginner bug.",
            "`!==` means \"not equal\". `>`, `<`, `>=`, `<=` compare numbers.",
            "`&&` means AND, `||` means OR, `!` means NOT."),
          C("""
if (total > 10000 && !poNumber) {
  // runs only when both are true
} else {
  // runs otherwise
}
"""),
          P("**Truthy and falsy**: in an `if`, the values `false`, `0`, `''` (empty string), `null` and `undefined` count as false. Everything else counts as true. So `if (!memo)` means \"if the memo is empty\".")),
        S("Arrays and loops",
          P("An **array** is an ordered list: `const totals = [185, 195, 1055];`. Positions (called **indexes**) start at **0**, so `totals[0]` is 185. `totals.length` is 3."),
          C("""
for (let i = 0; i < totals.length; i++) {
  log.debug('Total ' + i, totals[i]);
}

for (const t of totals) { /* t is each value */ }

totals.push(300);                          // add to the end
const big = totals.filter((t) => t > 250); // [1055, 300]
const sum = totals.reduce((a, t) => a + t, 0);
"""),
          P("A **loop** repeats code. The classic `for` loop reads: start `i` at 0; keep going while `i` is less than the length; add 1 each time (`i++`)."),
          WARN("NetSuite sublist lines also start at 0. Old SuiteScript 1.0 started at 1, which is why you'll see off-by-one bugs in older code.")),
        S("Objects",
          P("An **object** groups named values (called **properties**) in curly braces. Read one with a dot."),
          C("""
const line = { item: 'WIDGET-S', quantity: 40, rate: 12 };
line.quantity;          // 40
line.amount = line.quantity * line.rate;  // add a property

const order = {
  tranid: 'SO1003',
  customer: { id: 102, name: 'Globex Inc' },  // objects can nest
  lines: [line],
};
order.customer.name;    // 'Globex Inc'
"""),
          P("Almost every SuiteScript call takes an object of options, like `record.load({ type: 'salesorder', id: 1003 })`. That's why you'll type `({ ... })` constantly.")),
        S("Functions",
          P("A **function** is a named, reusable block of code. It takes inputs (**parameters**) and can give back an output with `return`."),
          C("""
function lineAmount(line) {
  return line.quantity * line.rate;
}

// The same thing as an arrow function, the style SuiteScript 2.1 code uses:
const lineAmount2 = (line) => line.quantity * line.rate;

lineAmount({ quantity: 2, rate: 30 });   // 60
"""),
          P("A **callback** is a function you hand to another function so it can call it later. NetSuite does this constantly: `results.each((r) => { ...; return true; })` calls your arrow function once per search result."),
          TIP("If you see `=>`, you're looking at a function.")),
        S("JSON and errors",
          P("**JSON** (JavaScript Object Notation) is text shaped like an object. Systems send JSON to each other over the internet, and NetSuite stores and returns it constantly."),
          C("""
const text = '{"id": 2003, "open": true}';
const obj = JSON.parse(text);        // text -> object
const back = JSON.stringify(obj);    // object -> text
"""),
          P("When something goes wrong, JavaScript **throws an error** and stops. `try/catch` lets you catch it and decide what to do. You can also `throw` your own errors to stop bad data."),
          C("""
try {
  const data = JSON.parse(badText);
} catch (e) {
  log.error('Could not read data', e.message);
}
""")),
        S("How a SuiteScript file is laid out",
          P("Every SuiteScript file follows the same shape. You'll meet it properly in Chapter 5, but here's the map:"),
          C("""
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {
  const beforeSubmit = (context) => {
    // your code
  };
  return { beforeSubmit };
});
"""),
          B("The `/** ... */` comment holds **tags** that tell NetSuite the version and the script type.",
            "`define([...], callback)` loads NetSuite **modules** (toolkits like `N/record` for records) and passes them to your function.",
            "Your function returns an object of **entry points**: functions NetSuite calls at the right moment.")),
    ],
    [
        "SuiteScript is JavaScript, not Java.",
        "const for values that don't change, let for ones that do; `${}` in backticks builds text.",
        "= assigns, === compares. '', 0, null, undefined and false are falsy.",
        "Arrays and sublists start at index 0.",
        "Objects hold named properties; SuiteScript calls take an options object: ({ ... }).",
        "Functions take parameters and return values; => marks an arrow function; callbacks are functions passed in.",
        "JSON.parse turns text into objects; try/catch handles errors.",
    ],
    LAB("Keep practicing JavaScript", "Build fluency beyond Code Lab.",
        "Finish the four Chapter 0 challenges in Code Lab first.",
        "freeCodeCamp's JavaScript Algorithms and Data Structures course (free) drills the same basics.",
        "Practice array methods (map, filter, reduce) until you can write them without looking.",
        "Read other people's SuiteScript samples in the NetSuite Help Center and explain each line out loud."),
    [
        F("Is SuiteScript Java?", "No. SuiteScript is JavaScript with NetSuite's modules."),
        F("const vs. let", "const can't be reassigned; let can."),
        F("= vs. ===", "= assigns a value; === compares two values."),
        F("Falsy values", "false, 0, '' (empty string), null, undefined (and NaN)."),
        F("First index of an array", "0"),
        F("Template literal", "Backtick string with ${} placeholders: `Hi ${name}`."),
        F("Arrow function", "Short function syntax: (x) => x * 2"),
        F("Callback", "A function passed to another function to be called later."),
        F("JSON.parse / JSON.stringify", "Text → object / object → text."),
        F("try/catch", "Runs code and catches errors so you can handle them."),
    ],
    [
        Q("What language is SuiteScript?",
          "JavaScript", ["Java", "Python", "SQL"],
          "SuiteScript is JavaScript plus NetSuite's N/ modules. Java is a different language."),
        Q("Which line creates a variable you plan to change later?",
          "let count = 0;", ["const count = 0;", "count == 0;", "var: count = 0"],
          "let allows reassignment. const doesn't."),
        Q("What does this log?",
          "Acme has 3 orders", ["${name} has ${n} orders", "name has n orders", "An error"],
          "Backtick strings replace ${...} with the values.",
          code="const name = 'Acme';\nconst n = 3;\nlog.debug('x', `${name} has ${n} orders`);"),
        Q("Which operator checks whether two values are equal?",
          "===", ["=", "=>", "!="],
          "= assigns, => starts an arrow function, === compares."),
        Q("What is `totals[0]` when `const totals = [185, 195, 1055];`?",
          "185", ["195", "undefined", "1055"],
          "Arrays start at index 0."),
        Q("Which of these is falsy?",
          "'' (an empty string)", ["'0'", "[]", "'false'"],
          "Empty strings are falsy. Non-empty strings, even '0' and 'false', are truthy, and so are arrays."),
        Q("What does this return?",
          "60", ["'2 * 30'", "undefined", "32"],
          "The arrow function multiplies quantity by rate.",
          code="const lineAmount = (line) => line.quantity * line.rate;\nlineAmount({ quantity: 2, rate: 30 });"),
        Q("How do you read the name in `const c = { id: 7, name: 'Quest' };`?",
          "c.name", ["c[name]", "c->name", "name(c)"],
          "Dot notation reads a property. (c['name'] with quotes also works.)"),
        Q("What does JSON.parse do?",
          "Turns JSON text into a JavaScript object", ["Turns an object into text", "Checks a script for syntax errors", "Sends data to an API"],
          "JSON.stringify goes the other way."),
        Q("What is a callback?",
          "A function you pass to another function to be called later",
          ["A phone number stored on a customer", "An error handler only", "A loop that runs backwards"],
          "search results' each() takes a callback and calls it once per result."),
        Q("What happens when code inside `try { }` throws an error?",
          "The catch block runs with the error", ["The script always stops", "The error is ignored silently", "The try block runs again"],
          "catch (e) receives the error so you can log or handle it."),
        Q("In a SuiteScript file, what does define() do?",
          "Loads NetSuite modules and passes them to your function",
          ["Declares a new custom field", "Deploys the script", "Defines a saved search"],
          "define(['N/record'], (record) => { ... }) gives your code the record module."),
    ],
)
