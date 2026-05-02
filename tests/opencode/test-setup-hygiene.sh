#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "=== Test: SDP Setup Hygiene ==="

node --input-type=module <<'NODE'
import fs from 'fs';
import path from 'path';

const { SuperpowersPlugin } = await import(process.env.SUPERPOWERS_PLUGIN_FILE);
const hooks = await SuperpowersPlugin({});
const hygiene = hooks.tool?.sdp_setup_hygiene;
if (!hygiene) throw new Error('missing sdp_setup_hygiene tool');

const project = path.join(process.env.TEST_HOME, 'hygiene-project');
fs.mkdirSync(path.join(project, 'docs'), { recursive: true });
fs.writeFileSync(path.join(project, '.gitignore'), '# existing\nnode_modules/\n');
fs.writeFileSync(path.join(project, '.ignore'), '# existing ignore\n');
const context = { directory: project, worktree: project, sessionID: 'ses_hygiene', messageID: 'msg_hygiene' };

const checkBefore = JSON.parse(await hygiene.execute({ operation: 'check' }, context));
if (checkBefore.ok !== false) throw new Error('check should report missing entries');
if (!checkBefore.missing.gitignore.includes('docs/superduperpowers/')) throw new Error('missing gitignore entry not reported');
if (!checkBefore.missing.ignore.includes('!docs/superduperpowers/')) throw new Error('missing ignore entry not reported');

const apply = JSON.parse(await hygiene.execute({ operation: 'apply' }, context));
if (!apply.ok) throw new Error(`apply failed: ${JSON.stringify(apply)}`);
const gitignore = fs.readFileSync(path.join(project, '.gitignore'), 'utf8');
const ignore = fs.readFileSync(path.join(project, '.ignore'), 'utf8');
if (!gitignore.includes('docs/superduperpowers/')) throw new Error('gitignore entry not written');
if (!ignore.includes('!docs/superduperpowers/')) throw new Error('ignore allow entry not written');
if (gitignore.includes('.opencode/worktrees') || gitignore.includes('.opencode/superduperpowers/state')) throw new Error('unexpected project-local runtime ignore entry');

const secondApply = JSON.parse(await hygiene.execute({ operation: 'apply' }, context));
if (secondApply.changed.length !== 0) throw new Error('apply is not idempotent');

const docs2 = path.join(process.env.TEST_HOME, 'hygiene-project-documents');
fs.mkdirSync(path.join(docs2, 'documents'), { recursive: true });
const context2 = { ...context, directory: docs2, worktree: docs2 };
const explain = JSON.parse(await hygiene.execute({ operation: 'explain' }, context2));
if (!explain.entries.gitignore.includes('documents/superduperpowers/')) throw new Error('documents docs root not selected');

console.log('setup hygiene behavior ok');
NODE

echo "=== SDP setup hygiene tests passed ==="
