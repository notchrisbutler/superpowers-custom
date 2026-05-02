#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "=== Test: SDP Branch Context ==="

node --input-type=module <<'NODE'
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const { SuperpowersPlugin } = await import(process.env.SUPERPOWERS_PLUGIN_FILE);
const hooks = await SuperpowersPlugin({});
const branchContext = hooks.tool?.sdp_branch_context;
if (!branchContext) throw new Error('missing sdp_branch_context tool');

const noGit = path.join(process.env.TEST_HOME, 'no-git');
fs.mkdirSync(noGit, { recursive: true });
const noGitResult = JSON.parse(await branchContext.execute({}, { directory: noGit, worktree: noGit, sessionID: 'ses_branch', messageID: 'msg_branch' }));
if (noGitResult.git.present !== false) throw new Error('no-git repo not detected');

const repo = path.join(process.env.TEST_HOME, 'branch-repo');
fs.mkdirSync(repo, { recursive: true });
execFileSync('git', ['init', '-b', 'main'], { cwd: repo });
execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repo });
execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: repo });
fs.writeFileSync(path.join(repo, 'README.md'), '# test\n');
execFileSync('git', ['add', 'README.md'], { cwd: repo });
execFileSync('git', ['commit', '-m', 'initial'], { cwd: repo });

const mainResult = JSON.parse(await branchContext.execute({ strategy: 'feature-branch' }, { directory: repo, worktree: repo, sessionID: 'ses_branch', messageID: 'msg_branch' }));
if (!mainResult.git.isDefaultBranch) throw new Error('main not flagged as default branch');
if (mainResult.recommendedAction !== 'create-feature-branch') throw new Error(`unexpected main recommendation ${mainResult.recommendedAction}`);

execFileSync('git', ['checkout', '-b', 'feat/workflow-profile'], { cwd: repo });
const featureResult = JSON.parse(await branchContext.execute({ strategy: 'feature-branch' }, { directory: repo, worktree: repo, sessionID: 'ses_branch', messageID: 'msg_branch' }));
if (featureResult.recommendedAction !== 'continue') throw new Error(`unexpected feature recommendation ${featureResult.recommendedAction}`);
if (!Array.isArray(featureResult.git.likelyUnrelatedChanges)) throw new Error('likelyUnrelatedChanges missing');

execFileSync('git', ['checkout', '--detach', 'HEAD'], { cwd: repo });
const detachedResult = JSON.parse(await branchContext.execute({ strategy: 'feature-branch' }, { directory: repo, worktree: repo, sessionID: 'ses_branch', messageID: 'msg_branch' }));
if (detachedResult.recommendedAction === 'continue') throw new Error('detached HEAD should not continue');
execFileSync('git', ['checkout', 'feat/workflow-profile'], { cwd: repo });

fs.writeFileSync(path.join(repo, 'scratch.txt'), 'dirty\n');
const dirtyResult = JSON.parse(await branchContext.execute({ strategy: 'feature-branch' }, { directory: repo, worktree: repo, sessionID: 'ses_branch', messageID: 'msg_branch' }));
if (dirtyResult.recommendedAction !== 'ask-user') throw new Error('dirty tree should ask user');
if (!dirtyResult.git.likelyUnrelatedChanges.some((entry) => entry.includes('scratch.txt'))) throw new Error('dirty file not reported as likely unrelated');

console.log('branch context behavior ok');
NODE

echo "=== SDP branch context tests passed ==="
