#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "=== Test: SDP Auto Drift Repair ==="

node --input-type=module <<'NODE'
import fs from 'fs';
import path from 'path';

const { SuperpowersPlugin } = await import(process.env.SUPERPOWERS_PLUGIN_FILE);
const project = path.join(process.env.TEST_HOME, 'test-project');
const commandDir = path.join(process.env.OPENCODE_CONFIG_DIR, 'command');
const docsDir = path.join(project, 'docs', 'superduperpowers', 'specs');
fs.mkdirSync(commandDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const boundaryFiles = new Map([
  [path.join(project, 'sentinel.txt'), 'do not touch\n'],
  [path.join(project, '.gitignore'), 'docs/superduperpowers/\n'],
  [path.join(project, '.ignore'), '!docs/superduperpowers/\n'],
  [path.join(docsDir, 'generated.md'), '# Generated spec\n'],
  [path.join(commandDir, 'sdp.md'), 'user command\n'],
  [path.join(process.env.OPENCODE_CONFIG_DIR, 'plugins', 'superpowers.js'), 'legacy shim\n'],
  [path.join(process.env.OPENCODE_CONFIG_DIR, 'opencode.json'), '{"plugin":["superduperpowers@git+file:///example"]}\n']
]);
for (const [filePath, content] of boundaryFiles) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const hooks = await SuperpowersPlugin({ directory: project, worktree: project });
const context = { sessionID: 'ses_autorepair', messageID: 'msg_autorepair', directory: project, worktree: project, agent: 'build' };
const profile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, context));
if (!profile.ok) throw new Error('profile setup failed');

const stateDir = profile.profile.stateDir;
fs.writeFileSync(path.join(stateDir, 'profile.json'), '{not json\n');
const output = { message: { content: 'unchanged' }, parts: [{ type: 'text', text: 'unchanged' }] };
const outputBefore = JSON.stringify(output);

await hooks['chat.message']({ sessionID: 'ses_autorepair', messageID: 'msg_autorepair' }, output);
if (JSON.stringify(output) !== outputBefore) throw new Error('chat.message hook mutated output');

const repairedProfilePath = path.join(stateDir, 'profile.json');
if (!fs.existsSync(repairedProfilePath)) throw new Error('profile was not recreated');
const repaired = JSON.parse(fs.readFileSync(repairedProfilePath, 'utf8'));
if (repaired.sessionId !== 'ses_autorepair') throw new Error('repaired profile session mismatch');
if (repaired.route !== null) throw new Error('auto-repaired profile should leave route unset');
if (!fs.existsSync(path.join(stateDir, 'artifacts.json'))) throw new Error('artifacts not recreated');
const events = fs.readFileSync(path.join(stateDir, 'events.jsonl'), 'utf8');
if (!events.includes('runtime.autoRepair')) throw new Error('repair event missing');

const quarantineRoot = path.join(process.env.OPENCODE_CONFIG_DIR, 'superduperpowers', 'quarantine');
if (!fs.existsSync(quarantineRoot) || fs.readdirSync(quarantineRoot).length === 0) throw new Error('quarantine entry missing');
for (const [filePath, content] of boundaryFiles) {
  if (fs.readFileSync(filePath, 'utf8') !== content) throw new Error(`boundary file was modified: ${filePath}`);
}

const firstQuarantineCount = fs.readdirSync(quarantineRoot).length;
await hooks['chat.message']({ sessionID: 'ses_autorepair', messageID: 'msg_autorepair_2' }, output);
const secondQuarantineCount = fs.readdirSync(quarantineRoot).length;
if (secondQuarantineCount !== firstQuarantineCount) throw new Error('repair ran more than once for the same session');

console.log('auto drift repair behavior ok');
NODE

node --input-type=module <<'NODE'
import fs from 'fs';
import path from 'path';

const { autoRepairRuntimeState, createSdpTools } = await import(path.join(process.env.SUPERPOWERS_DIR, '.opencode/plugins/superduperpowers/sdp-tools.js'));
const result = autoRepairRuntimeState({ configDir: process.env.OPENCODE_CONFIG_DIR, context: { directory: process.env.TEST_HOME } });
if (!result.ok || result.repaired || result.reason !== 'missing-session-id') throw new Error('missing session id should not repair');
const traversal = autoRepairRuntimeState({ configDir: process.env.OPENCODE_CONFIG_DIR, context: { sessionID: '../escape', directory: process.env.TEST_HOME } });
if (traversal.ok || traversal.repaired) throw new Error('path traversal session id should not repair');
if (fs.existsSync(path.join(process.env.OPENCODE_CONFIG_DIR, 'superduperpowers', 'escape'))) throw new Error('path traversal session created runtime files');
for (const sessionID of ['.', 'foo/..', 'foo/../ses_other']) {
  const result = autoRepairRuntimeState({ configDir: process.env.OPENCODE_CONFIG_DIR, context: { sessionID, directory: process.env.TEST_HOME } });
  if (result.ok || result.repaired) throw new Error(`unsafe session id should not repair: ${sessionID}`);
}
const quarantineRoot = path.join(process.env.OPENCODE_CONFIG_DIR, 'superduperpowers', 'quarantine');
const repairFailures = fs.existsSync(quarantineRoot) ? fs.readdirSync(quarantineRoot).filter((entry) => entry.startsWith('repair-failure-')) : [];
if (repairFailures.length === 0) throw new Error('path traversal failure diagnostic was not recorded');
const symlinkConfigDir = path.join(process.env.TEST_HOME, 'symlink-config');
const symlinkTarget = path.join(process.env.TEST_HOME, 'symlink-runtime-target');
fs.mkdirSync(symlinkConfigDir, { recursive: true });
fs.mkdirSync(symlinkTarget, { recursive: true });
fs.symlinkSync(symlinkTarget, path.join(symlinkConfigDir, 'superduperpowers'), 'dir');
const parentSymlink = autoRepairRuntimeState({ configDir: symlinkConfigDir, context: { sessionID: 'ses_parent_symlink', directory: process.env.TEST_HOME } });
if (parentSymlink.ok || parentSymlink.repaired) throw new Error('symlink runtime root should not repair');
if (fs.readdirSync(symlinkTarget).length !== 0) throw new Error('symlink runtime target was modified');
const symlinkTools = createSdpTools({ configDir: symlinkConfigDir });
const symlinkDoctor = JSON.parse(await symlinkTools.sdp_doctor.execute({ operation: 'check' }, { sessionID: 'ses_parent_symlink', directory: process.env.TEST_HOME, worktree: process.env.TEST_HOME }));
const runtimeParents = symlinkDoctor.checks.find((check) => check.id === 'runtime-parents');
if (!runtimeParents || runtimeParents.status !== 'error') throw new Error('runtime parent symlink diagnostic missing');
console.log('missing session id behavior ok');
NODE

node --input-type=module <<'NODE'
import fs from 'fs';
import path from 'path';

const { SuperpowersPlugin } = await import(process.env.SUPERPOWERS_PLUGIN_FILE);
const project = path.join(process.env.TEST_HOME, 'test-project');
const hooks = await SuperpowersPlugin({ directory: project, worktree: project });
const context = { sessionID: 'ses_autorepair_custom_docs', messageID: 'msg_custom_docs', directory: project, worktree: project, agent: 'build' };
const profile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming', docsRoot: 'custom-docs' } }, context));
if (!profile.ok) throw new Error('custom docs profile setup failed');
fs.rmSync(path.join(profile.profile.stateDir, 'events.jsonl'));
await hooks['chat.message']({ sessionID: 'ses_autorepair_custom_docs', messageID: 'msg_custom_docs' }, {});
const repaired = JSON.parse(fs.readFileSync(path.join(profile.profile.stateDir, 'profile.json'), 'utf8'));
if (repaired.docsRoot !== 'custom-docs') throw new Error('auto repair did not preserve custom docsRoot');
if (repaired.sdpDocsRoot !== 'custom-docs/superduperpowers') throw new Error('auto repair did not preserve custom sdpDocsRoot');
console.log('custom docs repair behavior ok');
NODE

node --input-type=module <<'NODE'
import fs from 'fs';
import path from 'path';

const { SuperpowersPlugin } = await import(process.env.SUPERPOWERS_PLUGIN_FILE);
const project = path.join(process.env.TEST_HOME, 'test-project');
const hooks = await SuperpowersPlugin({ directory: project, worktree: project });

const nullContext = { sessionID: 'ses_autorepair_null_profile', messageID: 'msg_null_profile', directory: project, worktree: project, agent: 'build' };
const nullProfile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, nullContext));
if (!nullProfile.ok) throw new Error('null profile setup failed');
fs.writeFileSync(path.join(nullProfile.profile.stateDir, 'profile.json'), 'null\n');
const nullSummary = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'summary' }, nullContext));
if (nullSummary.ok) throw new Error('null profile summary should fail');
await hooks['chat.message']({ sessionID: 'ses_autorepair_null_profile', messageID: 'msg_null_profile' }, {});
const repairedNull = JSON.parse(fs.readFileSync(path.join(nullProfile.profile.stateDir, 'profile.json'), 'utf8'));
if (!repairedNull || typeof repairedNull !== 'object' || repairedNull.sessionId !== 'ses_autorepair_null_profile') throw new Error('null profile was not repaired');

const unsafeContext = { sessionID: 'ses_autorepair_unsafe_docs', messageID: 'msg_unsafe_docs', directory: project, worktree: project, agent: 'build' };
const unsafeProfile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, unsafeContext));
if (!unsafeProfile.ok) throw new Error('unsafe docs profile setup failed');
const unsafe = { ...unsafeProfile.profile, docsRoot: '../outside', sdpDocsRoot: '../outside/superduperpowers', specsDir: '../outside/superduperpowers/specs', plansDir: '../outside/superduperpowers/plans' };
fs.writeFileSync(path.join(unsafeProfile.profile.stateDir, 'profile.json'), `${JSON.stringify(unsafe, null, 2)}\n`);
await hooks['chat.message']({ sessionID: 'ses_autorepair_unsafe_docs', messageID: 'msg_unsafe_docs' }, {});
const repairedUnsafe = JSON.parse(fs.readFileSync(path.join(unsafeProfile.profile.stateDir, 'profile.json'), 'utf8'));
if (repairedUnsafe.docsRoot !== 'docs') throw new Error('unsafe docsRoot was preserved');

const invalidDocsSet = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming', docsRoot: '../outside' } }, { sessionID: 'ses_invalid_docs_set', messageID: 'msg_invalid_docs_set', directory: project, worktree: project, agent: 'build' }));
if (invalidDocsSet.ok) throw new Error('unsafe docsRoot profile input was accepted');
const traversalSummary = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'summary' }, { sessionID: '../escape', messageID: 'msg_traversal_summary', directory: project, worktree: project, agent: 'build' }));
if (traversalSummary.ok) throw new Error('traversal session profile summary should fail');
for (const sessionID of ['.', 'foo/..', 'foo/../ses_other']) {
  const summary = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'summary' }, { sessionID, messageID: 'msg_bad_session', directory: project, worktree: project, agent: 'build' }));
  if (summary.ok) throw new Error(`unsafe session id profile summary should fail: ${sessionID}`);
}
const traversalDoctor = JSON.parse(await hooks.tool.sdp_doctor.execute({ operation: 'check' }, { sessionID: '../escape', messageID: 'msg_traversal_doctor', directory: project, worktree: project, agent: 'build' }));
const runtimeContainment = traversalDoctor.checks.find((check) => check.id === 'runtime-containment');
if (!runtimeContainment || runtimeContainment.status !== 'error') throw new Error('traversal session doctor diagnostic missing');

const artifactsContext = { sessionID: 'ses_autorepair_null_artifacts', messageID: 'msg_null_artifacts', directory: project, worktree: project, agent: 'build' };
const artifactsProfile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, artifactsContext));
if (!artifactsProfile.ok) throw new Error('null artifacts setup failed');
fs.writeFileSync(path.join(artifactsProfile.profile.stateDir, 'artifacts.json'), 'null\n');
await hooks['chat.message']({ sessionID: 'ses_autorepair_null_artifacts', messageID: 'msg_null_artifacts' }, {});
const repairedArtifacts = JSON.parse(fs.readFileSync(path.join(artifactsProfile.profile.stateDir, 'artifacts.json'), 'utf8'));
if (!repairedArtifacts || !Array.isArray(repairedArtifacts.artifacts)) throw new Error('null artifacts were not repaired');
console.log('invalid profile shape repair behavior ok');
NODE

node --input-type=module <<'NODE'
import fs from 'fs';
import path from 'path';

const { SuperpowersPlugin } = await import(process.env.SUPERPOWERS_PLUGIN_FILE);
const project = path.join(process.env.TEST_HOME, 'test-project');
const hooks = await SuperpowersPlugin({ directory: project, worktree: project });
const context = { sessionID: 'ses_autorepair_symlink', messageID: 'msg_symlink', directory: project, worktree: project, agent: 'build' };
const profile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, context));
if (!profile.ok) throw new Error('symlink profile setup failed');
const externalDir = path.join(process.env.TEST_HOME, 'external-state');
fs.mkdirSync(externalDir, { recursive: true });
fs.writeFileSync(path.join(externalDir, 'sentinel.txt'), 'external state\n');
fs.rmSync(profile.profile.stateDir, { recursive: true, force: true });
fs.symlinkSync(externalDir, profile.profile.stateDir, 'dir');
const stateDirSymlinkSet = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, context));
if (stateDirSymlinkSet.ok) throw new Error('stateDir symlink profile set should fail');
const symlinkDoctor = JSON.parse(await hooks.tool.sdp_doctor.execute({ operation: 'check' }, context));
const stateDirCheck = symlinkDoctor.checks.find((check) => check.id === 'state-dir');
if (!stateDirCheck || stateDirCheck.status !== 'error') throw new Error('stateDir symlink diagnostic missing');
await hooks['chat.message']({ sessionID: 'ses_autorepair_symlink', messageID: 'msg_symlink' }, {});
if (fs.lstatSync(profile.profile.stateDir).isSymbolicLink()) throw new Error('symlink stateDir was not replaced');
if (fs.readFileSync(path.join(externalDir, 'sentinel.txt'), 'utf8') !== 'external state\n') throw new Error('symlink target was modified');

const brokenContext = { sessionID: 'ses_autorepair_broken_symlink', messageID: 'msg_broken_symlink', directory: project, worktree: project, agent: 'build' };
const brokenProfile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, brokenContext));
if (!brokenProfile.ok) throw new Error('broken symlink profile setup failed');
const missingTarget = path.join(process.env.TEST_HOME, 'missing-state-target');
fs.rmSync(brokenProfile.profile.stateDir, { recursive: true, force: true });
fs.symlinkSync(missingTarget, brokenProfile.profile.stateDir, 'dir');
await hooks['chat.message']({ sessionID: 'ses_autorepair_broken_symlink', messageID: 'msg_broken_symlink' }, {});
if (fs.lstatSync(brokenProfile.profile.stateDir).isSymbolicLink()) throw new Error('broken symlink stateDir was not replaced');

const fileSymlinkContext = { sessionID: 'ses_autorepair_file_symlink', messageID: 'msg_file_symlink', directory: project, worktree: project, agent: 'build' };
const fileSymlinkProfile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, fileSymlinkContext));
if (!fileSymlinkProfile.ok) throw new Error('file symlink profile setup failed');
const externalEvents = path.join(process.env.TEST_HOME, 'external-events.jsonl');
fs.writeFileSync(externalEvents, '{"external":true}\n');
fs.rmSync(path.join(fileSymlinkProfile.profile.stateDir, 'events.jsonl'));
fs.symlinkSync(externalEvents, path.join(fileSymlinkProfile.profile.stateDir, 'events.jsonl'));
await hooks['chat.message']({ sessionID: 'ses_autorepair_file_symlink', messageID: 'msg_file_symlink' }, {});
if (fs.lstatSync(path.join(fileSymlinkProfile.profile.stateDir, 'events.jsonl')).isSymbolicLink()) throw new Error('symlink events file was not replaced');
if (fs.readFileSync(externalEvents, 'utf8') !== '{"external":true}\n') throw new Error('symlink events target was modified');

const profileSymlinkContext = { sessionID: 'ses_autorepair_profile_symlink', messageID: 'msg_profile_symlink', directory: project, worktree: project, agent: 'build' };
const profileSymlinkProfile = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'set', profile: { route: 'full-brainstorming' } }, profileSymlinkContext));
if (!profileSymlinkProfile.ok) throw new Error('profile symlink setup failed');
const externalProfile = path.join(process.env.TEST_HOME, 'external-profile.json');
fs.writeFileSync(externalProfile, JSON.stringify(profileSymlinkProfile.profile, null, 2));
fs.rmSync(path.join(profileSymlinkProfile.profile.stateDir, 'profile.json'));
fs.symlinkSync(externalProfile, path.join(profileSymlinkProfile.profile.stateDir, 'profile.json'));
const profileSymlinkSummary = JSON.parse(await hooks.tool.sdp_profile.execute({ operation: 'summary' }, profileSymlinkContext));
if (profileSymlinkSummary.ok) throw new Error('profile symlink summary should fail');
const profileSymlinkDoctor = JSON.parse(await hooks.tool.sdp_doctor.execute({ operation: 'check' }, profileSymlinkContext));
const profileCheck = profileSymlinkDoctor.checks.find((check) => check.id === 'profile');
if (!profileCheck || profileCheck.status !== 'error') throw new Error('profile symlink doctor diagnostic missing');
await hooks['chat.message']({ sessionID: 'ses_autorepair_profile_symlink', messageID: 'msg_profile_symlink' }, {});
if (fs.lstatSync(path.join(profileSymlinkProfile.profile.stateDir, 'profile.json')).isSymbolicLink()) throw new Error('symlink profile file was not replaced');
console.log('symlink repair behavior ok');
NODE

echo "=== SDP auto drift repair tests passed ==="
