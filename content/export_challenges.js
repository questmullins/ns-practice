// Writes the challenge list the study app shows (titles only; Code Lab has the rest).
// Run from the repo root: node content/export_challenges.js
const fs = require('fs');
const path = require('path');
const { CHALLENGES } = require(path.join(__dirname, '../app/src/main/assets/codelab/challenges.js'));

const out = CHALLENGES.map(({ id, chapter, title, summary }) => ({ id, chapter, title, summary }));
const file = path.join(__dirname, '../app/src/main/assets/challenges.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(`Wrote ${file}: ${out.length} challenges`);
