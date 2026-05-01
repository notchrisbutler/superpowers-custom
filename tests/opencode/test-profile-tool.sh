#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "=== Test: SDP Profile Tool ==="

node --input-type=module <<'NODE'
import fs from 'fs';
import path from 'path';

const { SuperpowersPlugin } = await import(process.env.SUPERPOWERS_PLUGIN_FILE);
const hooks = await SuperpowersPlugin({});
const profileTool = hooks.tool?.sdp_profile;
if (!profileTool) throw new Error('missing sdp_profile tool');

const context = {
  sessionID: 'ses_testprofile123',
  messageID: 'msg_testprofile123',
  directory: path.join(process.env.TEST_HOME, 'test-project'),
  worktree: path.join(process.env.TEST_HOME, 'test-project')
};

const setResult = JSON.parse(await profileTool.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, context));
if (!setResult.ok) throw new Error(`set failed: ${JSON.stringify(setResult)}`);
if (!setResult.profile?.stateDir?.includes('/superduperpowers/state/ses_testprofile123')) throw new Error('profile stateDir not under config runtime root');

const profilePath = path.join(process.env.OPENCODE_CONFIG_DIR, 'superduperpowers', 'state', 'ses_testprofile123', 'profile.json');
if (!fs.existsSync(profilePath)) throw new Error(`profile not written to ${profilePath}`);
const persisted = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
if (persisted.schemaVersion !== 1) throw new Error('schemaVersion missing');
if (persisted.testingIntensity !== 'major-behavior') throw new Error('default testingIntensity missing');
if (persisted.runtimeRoot !== path.join(process.env.OPENCODE_CONFIG_DIR, 'superduperpowers')) throw new Error('runtimeRoot mismatch');
if (fs.existsSync(path.join(process.env.OPENCODE_CONFIG_DIR, 'superduperpowers', 'current.json'))) throw new Error('global current pointer created');

const noSession = JSON.parse(await profileTool.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, { ...context, sessionID: undefined }));
if (noSession.ok) throw new Error('write without sessionID unexpectedly succeeded');
if (!noSession.unsavedProfile) throw new Error('missing unsavedProfile fallback');

const mergeResult = JSON.parse(await profileTool.execute({ operation: 'merge', updates: { executionMethod: 'inline' } }, context));
if (mergeResult.profile.executionMethod !== 'inline') throw new Error('merge did not persist executionMethod');

const summaryResult = JSON.parse(await profileTool.execute({ operation: 'summary' }, context));
if (!summaryResult.summary.includes('testingIntensity=major-behavior')) throw new Error('summary missing testing intensity');

const validationResult = JSON.parse(await profileTool.execute({ operation: 'validate' }, context));
if (!validationResult.ok) throw new Error(`validate failed: ${JSON.stringify(validationResult.errors)}`);

const invalidSet = JSON.parse(await profileTool.execute({ operation: 'set', profile: { apiKey: 'secret' } }, context));
if (invalidSet.ok) throw new Error('secret-like set profile key was accepted');

const immutable = JSON.parse(await profileTool.execute({ operation: 'merge', updates: { runtimeRoot: '/tmp/wrong' } }, context));
if (immutable.ok) throw new Error('immutable derived field was accepted');

const invalid = JSON.parse(await profileTool.execute({ operation: 'merge', updates: { apiKey: 'secret' } }, context));
if (invalid.ok) throw new Error('secret-like profile key was accepted');

const unknown = JSON.parse(await profileTool.execute({ operation: 'merge', updates: { customField: true } }, context));
if (unknown.ok) throw new Error('unknown profile field was accepted');

const oldDir = path.join(process.env.OPENCODE_CONFIG_DIR, 'superduperpowers', 'state', 'ses_oldprofile');
fs.mkdirSync(oldDir, { recursive: true });
fs.writeFileSync(path.join(oldDir, 'profile.json'), '{}\n');
const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
fs.utimesSync(oldDir, old, old);
const cleanup = JSON.parse(await profileTool.execute({ operation: 'cleanup', retentionDays: 30 }, context));
if (!cleanup.removed.some((entry) => entry.endsWith('ses_oldprofile'))) throw new Error('cleanup did not remove old state');
if (!fs.existsSync(profilePath)) throw new Error('cleanup removed active profile');

console.log('profile tool behavior ok');
NODE

echo "=== SDP profile tool tests passed ==="
