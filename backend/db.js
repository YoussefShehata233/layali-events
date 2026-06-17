const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'db.json');
function readDb() { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); }
function writeDb(data) { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); }
function nextId(items, prefix) {
  const max = items.reduce((largest, item) => Math.max(largest, Number(String(item.id).replace(prefix, '')) || 0), 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}
module.exports = { readDb, writeDb, nextId };
