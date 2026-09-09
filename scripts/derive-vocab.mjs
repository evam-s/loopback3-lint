// Prints candidate vocabulary lists from installed LoopBack 3 source.
// Output is a STARTING POINT for human review, never a finished dictionary.
// Run: node scripts/derive-vocab.mjs
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const JUGGLER = '.vocab-src/node_modules/loopback-datasource-juggler';
const LOOPBACK = '.vocab-src/node_modules/loopback';
const BOOT = '.vocab-src/node_modules/loopback-boot';

function section(title, body) {
  console.log(`\n===== ${title} =====`);
  console.log(body.trim());
}

function tryExec(cmd) {
  try {
    return execSync(cmd).toString();
  } catch (err) {
    return `(command failed or produced no output: ${err.message})`;
  }
}

section(
  'where operators (model-utils.js `operators` map)',
  tryExec(`grep -n -A 20 "^const operators = {" ${JUGGLER}/lib/model-utils.js`),
);
section(
  'logical operators (model-utils.js)',
  tryExec(`grep -n "p === 'and'" ${JUGGLER}/lib/model-utils.js`),
);
section(
  'geo operator (geo.js)',
  tryExec(`grep -n "nearFilter\\|filter.near" ${JUGGLER}/lib/geo.js | head -5`),
);
section(
  'relation types (relation-definition.js)',
  tryExec(`grep -n -A 10 "^const RelationTypes = {" ${JUGGLER}/lib/relation-definition.js`),
);
section(
  'operation hook call sites (REVIEW: includes dynamic concatenation)',
  tryExec(`grep -rn "notifyObserversOf(" ${JUGGLER}/lib/*.js`),
);
section(
  'ACL constants (acl.js)',
  tryExec(`grep -n "^ACL\\.\\|ACL\\.[A-Z_]* =" ${LOOPBACK}/common/models/acl.js | head -40`),
);
section(
  'built-in model names',
  tryExec(`ls ${LOOPBACK}/common/models/*.json`),
);

// --- Additional sections beyond the brief's Step 2, needed for the
// remaining dictionaries required by Step 7/8. ---

section(
  'loopback-boot phase names (compiler.js / executor.js)',
  tryExec(`grep -rn "phase\\|:before\\|:after" ${BOOT}/lib/executor.js | head -40`),
);
section(
  'loopback-boot: list of lib files (for locating phase constants)',
  tryExec(`ls ${BOOT}/lib`),
);
section(
  'ACL full file dump for manual review',
  tryExec(`cat ${LOOPBACK}/common/models/acl.json`),
);
section(
  'ACL model js (constants beyond simple grep)',
  tryExec(`grep -n "ALLOW\\|DENY\\|ALARM\\|AUDIT\\|EXECUTE\\|READ\\|WRITE\\|ALL\\|OWNER\\|RELATED\\|EVERYONE\\|APP\\|APPLICATION\\|ROLE\\|SCOPE\\|USER" ${LOOPBACK}/common/models/acl.js | head -80`),
);
section(
  'PersistedModel / Model top-level keys (model.js base properties)',
  tryExec(`grep -n "options\\.\\|settings\\.\\|properties\\." ${JUGGLER}/lib/model-builder.js | head -60`),
);
section(
  'model-builder.js define() signature',
  tryExec(`grep -n -A 5 "ModelBuilder.prototype.define" ${JUGGLER}/lib/model-builder.js`),
);
section(
  'DataType / property types (datatype.js or model-builder.js)',
  tryExec(`grep -rn "String\\|Number\\|Boolean\\|Date\\|Buffer\\|GeoPoint\\|Array\\|Object\\|Any" ${JUGGLER}/lib/datatype.js`),
);
section(
  'datatype.js full dump',
  tryExec(`cat ${JUGGLER}/lib/datatype.js`),
);
section(
  'built-in model filenames (full path)',
  tryExec(`ls -1 ${LOOPBACK}/common/models/`),
);
section(
  'loopback dependencies (for connector package names)',
  tryExec(`node -e "console.log(Object.keys(require('${LOOPBACK}/package.json').dependencies||{}).filter(d=>d.includes('connector')).join('\\n'))"`),
);
section(
  'juggler dependencies (for connector-ish deps)',
  tryExec(`node -e "console.log(Object.keys(require('${JUGGLER}/package.json').dependencies||{}).join('\\n'))"`),
);
section(
  'datasource.js common keys (createDataSource / DataSource constructor options)',
  tryExec(`grep -n "connector\\|host\\|port\\|url\\|database\\|username\\|password\\|debug\\|lazyConnect\\|connectionTimeout" ${JUGGLER}/lib/datasource.js | head -60`),
);
