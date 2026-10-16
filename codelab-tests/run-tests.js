// Checks every Code Lab challenge: the reference solution must pass and the
// starter code must not. Run with: node codelab-tests/run-tests.js
const path = require('path');
const { CHALLENGES, grade } = require(path.join(__dirname, '../app/src/main/assets/codelab/challenges.js'));

let failures = 0;
const ids = new Set();
for (const c of CHALLENGES) {
  if (ids.has(c.id)) { console.log('DUPLICATE ID', c.id); failures++; }
  ids.add(c.id);
  const sol = grade(c, c.solution);
  const start = grade(c, c.starter);
  const solOk = sol.passed;
  const starterFails = !start.passed;
  const mark = solOk && starterFails ? 'ok  ' : 'FAIL';
  console.log(`${mark} ${c.id.padEnd(6)} ${c.title}`);
  if (!solOk) {
    failures++;
    console.log('   solution error:', sol.res.error);
    sol.checks.filter((x) => !x.pass).forEach((x) => console.log('   ✗', x.label));
    console.log('   logs:', sol.res.logs.slice(0, 8).map((l) => `${l.title} | ${l.details}`));
    console.log('   warnings:', sol.res.warnings.slice(0, 5));
  }
  if (!starterFails) { failures++; console.log('   starter unexpectedly passes'); }
}
console.log(`\n${CHALLENGES.length} challenges, ${failures} problem(s)`);
process.exit(failures ? 1 : 0);
