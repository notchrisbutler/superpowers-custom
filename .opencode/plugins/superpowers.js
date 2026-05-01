/**
 * SuperDuperPowers plugin for OpenCode.ai
 *
 * Injects SuperDuperPowers bootstrap context via user-message transform.
 * Auto-registers skills and reviewer agents, and exposes workflow tools.
 */

import { tool } from '@opencode-ai/plugin';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDP_SCHEMA_VERSION = 1;
const SDP_RUNTIME_DIR = 'superduperpowers';
const SDP_DEFAULT_RETENTION_DAYS = 30;
const SDP_DOC_ROOT_CANDIDATES = ['docs', 'documents', 'documentation', '.docs', '.documents', '.documentation'];
const SDP_DOCS_DIR = 'superduperpowers';
const SDP_PROFILE_KEYS = new Set([
  'schemaVersion',
  'createdAt',
  'updatedAt',
  'sessionId',
  'messageId',
  'productName',
  'programmaticName',
  'skillNamespace',
  'invocationAliases',
  'route',
  'docsRoot',
  'sdpDocsRoot',
  'specsDir',
  'plansDir',
  'runtimeRoot',
  'stateRoot',
  'stateDir',
  'worktreeRoot',
  'generatedDocsPolicy',
  'workflowCommitPolicy',
  'executionMethod',
  'executionStrategy',
  'branchPolicy',
  'testingIntensity',
  'questionPolicy',
  'cleanupPolicy',
  'project',
  'harness'
]);
const SDP_MUTABLE_PROFILE_KEYS = new Set([
  'createdAt',
  'route',
  'docsRoot',
  'generatedDocsPolicy',
  'workflowCommitPolicy',
  'executionMethod',
  'executionStrategy',
  'branchPolicy',
  'testingIntensity',
  'questionPolicy',
  'cleanupPolicy'
]);
const SDP_ALIASES = [
  'superpowers',
  'Superpowers',
  'SuperPowers',
  'superduperpowers',
  'SuperDuperPowers',
  '/superpowers',
  '/superduperpowers',
  '/brainstorm'
];

// Simple frontmatter extraction (avoid dependency on skills-core for bootstrap)
const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  const lines = frontmatterStr.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const rawValue = line.slice(colonIdx + 1).trim();
      if (rawValue === '|' || rawValue === '>') {
        const block = [];
        while (i + 1 < lines.length && (/^\s/.test(lines[i + 1]) || lines[i + 1] === '')) {
          i++;
          block.push(lines[i].replace(/^ {2}/, ''));
        }
        frontmatter[key] = block.join('\n').trim();
        continue;
      }
      const value = rawValue.replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

// Normalize a path: trim whitespace, expand ~, resolve to absolute
const normalizePath = (p, homeDir) => {
  if (!p || typeof p !== 'string') return null;
  let normalized = p.trim();
  if (!normalized) return null;
  if (normalized.startsWith('~/')) {
    normalized = path.join(homeDir, normalized.slice(2));
  } else if (normalized === '~') {
    normalized = homeDir;
  }
  return path.resolve(normalized);
};

const toPosixPath = (value) => value.split(path.sep).join('/');

const nowIso = () => new Date().toISOString();

const projectKeyFor = (directory) => {
  const normalized = path.resolve(directory || process.cwd());
  const base = path.basename(normalized).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  const hash = crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 10);
  return `${base}-${hash}`;
};

const getRuntimePaths = (configDir, sessionID, directory) => {
  const runtimeRoot = path.join(configDir, SDP_RUNTIME_DIR);
  const stateRoot = path.join(runtimeRoot, 'state');
  const stateDir = sessionID ? path.join(stateRoot, sessionID) : null;
  const projectKey = projectKeyFor(directory);
  const worktreeRoot = path.join(runtimeRoot, 'worktrees', projectKey);
  const quarantineRoot = path.join(runtimeRoot, 'quarantine');
  return { runtimeRoot, stateRoot, stateDir, worktreeRoot, quarantineRoot, projectKey };
};

const selectDocsRoot = (directory, override) => {
  if (override) return override.replace(/\/$/, '');
  for (const candidate of SDP_DOC_ROOT_CANDIDATES) {
    if (fs.existsSync(path.join(directory, candidate)) && fs.statSync(path.join(directory, candidate)).isDirectory()) return candidate;
  }
  return 'docs';
};

const buildDefaultProfile = ({ configDir, context, profile = {} }) => {
  const directory = context.directory || context.worktree || process.cwd();
  const docsRoot = selectDocsRoot(directory, profile.docsRoot);
  const paths = getRuntimePaths(configDir, context.sessionID, directory);
  const timestamp = nowIso();
  return {
    schemaVersion: SDP_SCHEMA_VERSION,
    createdAt: profile.createdAt || timestamp,
    updatedAt: timestamp,
    sessionId: context.sessionID || null,
    messageId: context.messageID || null,
    productName: 'SuperDuperPowers',
    programmaticName: 'superduperpowers',
    skillNamespace: 'superpowers',
    invocationAliases: SDP_ALIASES,
    route: profile.route || null,
    docsRoot,
    sdpDocsRoot: `${docsRoot}/superduperpowers`,
    specsDir: `${docsRoot}/superduperpowers/specs`,
    plansDir: `${docsRoot}/superduperpowers/plans`,
    runtimeRoot: paths.runtimeRoot,
    stateRoot: paths.stateRoot,
    stateDir: paths.stateDir,
    worktreeRoot: paths.worktreeRoot,
    generatedDocsPolicy: profile.generatedDocsPolicy || 'local-only',
    workflowCommitPolicy: profile.workflowCommitPolicy || 'implementation-commits-only',
    executionMethod: profile.executionMethod || null,
    executionStrategy: profile.executionStrategy || null,
    branchPolicy: profile.branchPolicy || 'no-default-branch-work-without-explicit-consent',
    testingIntensity: profile.testingIntensity || 'major-behavior',
    questionPolicy: profile.questionPolicy || 'ask-before-execution-avoid-during-execution',
    cleanupPolicy: profile.cleanupPolicy || { mode: 'session-aware', retentionDays: SDP_DEFAULT_RETENTION_DAYS },
    project: {
      root: directory,
      projectKey: paths.projectKey
    },
    harness: {
      name: 'opencode',
      configDir
    }
  };
};

const hasSecretLikeKey = (value) => {
  if (!value || typeof value !== 'object') return false;
  for (const [key, nested] of Object.entries(value)) {
    if (/secret|token|password|api[_-]?key/i.test(key)) return true;
    if (hasSecretLikeKey(nested)) return true;
  }
  return false;
};

const validateProfile = (profile) => {
  const errors = [];
  for (const key of Object.keys(profile)) {
    if (!SDP_PROFILE_KEYS.has(key)) errors.push(`unknown profile field: ${key}`);
  }
  if (profile.schemaVersion !== SDP_SCHEMA_VERSION) errors.push('schemaVersion must be 1');
  if (!profile.productName || profile.productName !== 'SuperDuperPowers') errors.push('productName must be SuperDuperPowers');
  if (!['full-brainstorming', 'quick-implementation', 'none', null].includes(profile.route)) errors.push('invalid route');
  if (!['full-regression', 'major-behavior', 'existing-tests-only'].includes(profile.testingIntensity)) errors.push('invalid testingIntensity');
  if (!['local-only'].includes(profile.generatedDocsPolicy)) errors.push('invalid generatedDocsPolicy');
  if (hasSecretLikeKey(profile)) errors.push('profile contains secret-like key');
  return { ok: errors.length === 0, errors };
};

const stableJson = (value) => JSON.stringify(value);

const validateProfileInput = (value, { allowFull = false, comparisonProfile = null } = {}) => {
  const errors = [];
  if (!value || typeof value !== 'object') return { ok: true, errors };
  const allowedKeys = allowFull ? SDP_PROFILE_KEYS : SDP_MUTABLE_PROFILE_KEYS;
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) errors.push(`unsupported profile field: ${key}`);
    if (allowFull && comparisonProfile && !SDP_MUTABLE_PROFILE_KEYS.has(key) && !['updatedAt', 'messageId'].includes(key)) {
      if (stableJson(value[key]) !== stableJson(comparisonProfile[key])) errors.push(`profile field does not match active context: ${key}`);
    }
  }
  if (hasSecretLikeKey(value)) errors.push('profile contains secret-like key');
  return { ok: errors.length === 0, errors };
};

const profileSummaryText = (profile) => `SuperDuperPowers profile: route=${profile.route || 'unset'}, docs=${profile.sdpDocsRoot}, runtime=${profile.runtimeRoot}, executionMethod=${profile.executionMethod || 'unset'}, executionStrategy=${profile.executionStrategy || 'unset'}, testingIntensity=${profile.testingIntensity}, branchPolicy=${profile.branchPolicy}.`;

const listKnownOpenCodeSessions = () => {
  try {
    const output = execFileSync('opencode', ['session', 'list', '--format', 'json', '--max-count', '10000'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return new Set(JSON.parse(output).map((session) => session.id).filter(Boolean));
  } catch {
    return null;
  }
};

const writeJsonAtomic = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(value, null, 2)}\n`);
  JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
  fs.renameSync(tmpPath, filePath);
};

const appendEvent = (stateDir, event) => {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.appendFileSync(path.join(stateDir, 'events.jsonl'), `${JSON.stringify({ timestamp: nowIso(), ...event })}\n`);
};

const ensureTrailingNewline = (content) => content.endsWith('\n') ? content : `${content}\n`;

const readTextIfExists = (filePath) => fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

const appendMissingLines = (filePath, lines) => {
  const existing = readTextIfExists(filePath);
  const changed = [];
  let next = existing ? ensureTrailingNewline(existing) : '';
  const existingLines = existing.split(/\r?\n/);
  for (const line of lines) {
    if (!existingLines.includes(line)) {
      next += `${line}\n`;
      changed.push(line);
    }
  }
  if (changed.length > 0 || !fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, next);
  }
  return changed;
};

const docsEntriesFor = (directory, docsRootArg) => {
  const docsRoot = selectDocsRoot(directory, docsRootArg);
  const docsPath = toPosixPath(path.posix.join(docsRoot, SDP_DOCS_DIR));
  return {
    docsRoot,
    entries: {
      gitignore: [`${docsPath}/`],
      ignore: [`!${docsPath}/`]
    }
  };
};

const runGit = (cwd, args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

const getGitContext = (directory) => {
  const root = runGit(directory, ['rev-parse', '--show-toplevel']);
  if (!root) return { present: false };
  const currentBranch = runGit(root, ['branch', '--show-current']) || null;
  const defaultFromOrigin = runGit(root, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
  const defaultBranch = defaultFromOrigin ? defaultFromOrigin.replace('refs/remotes/origin/', '') : (['main', 'master'].includes(currentBranch) ? currentBranch : null);
  const upstream = runGit(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const status = runGit(root, ['status', '--porcelain=v1']) || '';
  const dirtySummary = status ? status.split('\n') : [];
  let aheadBehind = null;
  if (upstream) {
    const counts = runGit(root, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]);
    if (counts) {
      const [behind, ahead] = counts.split(/\s+/).map((value) => Number(value));
      aheadBehind = { ahead, behind };
    }
  }
  return {
    present: true,
    root,
    currentBranch,
    defaultBranch,
    isDefaultBranch: currentBranch === 'main' || currentBranch === 'master' || (!!defaultBranch && currentBranch === defaultBranch),
    ambiguous: !currentBranch,
    upstream,
    aheadBehind,
    dirty: status.length > 0,
    dirtySummary,
    likelyUnrelatedChanges: dirtySummary
  };
};

const recommendBranchAction = (git) => {
  if (!git.present) return 'block';
  if (git.ambiguous) return 'ask-user';
  if (git.dirty) return 'ask-user';
  if (git.isDefaultBranch) return 'create-feature-branch';
  if (git.aheadBehind?.behind > 0) return 'ask-user';
  return 'continue';
};

export const SuperpowersPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const superpowersAgentsDir = path.resolve(__dirname, '../../agents');
  const superpowersSkillsDir = path.resolve(__dirname, '../../skills');
  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');

  const loadBundledAgents = () => {
    if (!fs.existsSync(superpowersAgentsDir)) return {};

    const agents = {};
    for (const file of fs.readdirSync(superpowersAgentsDir)) {
      if (!file.endsWith('.md')) continue;

      const agentPath = path.join(superpowersAgentsDir, file);
      const { frontmatter, content } = extractAndStripFrontmatter(fs.readFileSync(agentPath, 'utf8'));
      const name = frontmatter.name || path.basename(file, '.md');
      const description = frontmatter.description;
      const prompt = content.trim();

      if (!name || !description || !prompt) continue;

      const agent = {
        description,
        mode: 'subagent',
        prompt,
        permission: {
          edit: 'deny',
          todowrite: 'deny'
        }
      };

      if (frontmatter.model && frontmatter.model !== 'inherit') {
        agent.model = frontmatter.model;
      }

      agents[name] = agent;
    }

    return agents;
  };

  // Helper to generate bootstrap content
  const getBootstrapContent = () => {
    // Try to load using-superpowers skill
    const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;

    const fullContent = fs.readFileSync(skillPath, 'utf8');
    const { content } = extractAndStripFrontmatter(fullContent);

    const toolMapping = `**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`todowrite\`
- \`Task\` tool with subagents → Use OpenCode's \`task\` tool with the named \`subagent_type\` when available; use @mentions for manual user-invoked subagents
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools
- SuperDuperPowers workflow profile/state → Use \`sdp_profile\` when available; otherwise carry decisions explicitly in prompts and generated docs
- SuperDuperPowers generated-doc hygiene → Use \`sdp_setup_hygiene\` when available before writing project-local generated specs/plans
- SuperDuperPowers branch preflight → Use \`sdp_branch_context\` when available before execution starts
- Invocation aliases include \`superpowers\`, \`superduperpowers\`, \`/superpowers\`, \`/superduperpowers\`, and \`/brainstorm\`

Use OpenCode's native \`skill\` tool to list and load skills.`;

    return `<EXTREMELY_IMPORTANT>
You have SuperDuperPowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
  };

  return {
    tool: {
      sdp_profile: tool({
        description: 'Manage the active SuperDuperPowers workflow profile for this OpenCode session.',
        args: {
          operation: tool.schema.enum(['get', 'set', 'merge', 'summary', 'validate', 'repair', 'clear', 'cleanup']),
          profile: tool.schema.record(tool.schema.any()).optional(),
          updates: tool.schema.record(tool.schema.any()).optional(),
          retentionDays: tool.schema.number().int().positive().optional()
        },
        async execute(args, context) {
          const operation = args.operation;
          const baseProfile = buildDefaultProfile({ configDir, context, profile: args.profile || {} });
          const stateDir = baseProfile.stateDir;

          if (!context.sessionID && ['set', 'merge', 'clear', 'repair'].includes(operation)) {
            return JSON.stringify({ ok: false, reason: 'missing-session-id', unsavedProfile: baseProfile }, null, 2);
          }

          const profilePath = stateDir ? path.join(stateDir, 'profile.json') : null;
          const readExisting = () => {
            if (!profilePath || !fs.existsSync(profilePath)) return null;
            return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
          };

          if (operation === 'get') {
            const existing = readExisting();
            return JSON.stringify({ ok: true, profile: existing || baseProfile }, null, 2);
          }

          if (operation === 'set') {
            const profile = buildDefaultProfile({ configDir, context, profile: args.profile || {} });
            const inputValidation = validateProfileInput(args.profile || {}, { allowFull: true, comparisonProfile: profile });
            if (!inputValidation.ok) return JSON.stringify({ ok: false, errors: inputValidation.errors }, null, 2);
            const validation = validateProfile(profile);
            if (!validation.ok) return JSON.stringify({ ok: false, errors: validation.errors }, null, 2);
            writeJsonAtomic(profilePath, profile);
            writeJsonAtomic(path.join(stateDir, 'artifacts.json'), { schemaVersion: SDP_SCHEMA_VERSION, artifacts: [] });
            appendEvent(stateDir, { type: 'profile.set', messageID: context.messageID || null });
            return JSON.stringify({ ok: true, profile }, null, 2);
          }

          if (operation === 'merge') {
            const inputValidation = validateProfileInput(args.updates || {});
            if (!inputValidation.ok) return JSON.stringify({ ok: false, errors: inputValidation.errors }, null, 2);
            const existing = readExisting() || baseProfile;
            const updates = args.updates || {};
            const profile = {
              ...existing,
              ...updates,
              sdpDocsRoot: updates.docsRoot ? `${updates.docsRoot.replace(/\/$/, '')}/superduperpowers` : existing.sdpDocsRoot,
              specsDir: updates.docsRoot ? `${updates.docsRoot.replace(/\/$/, '')}/superduperpowers/specs` : existing.specsDir,
              plansDir: updates.docsRoot ? `${updates.docsRoot.replace(/\/$/, '')}/superduperpowers/plans` : existing.plansDir,
              updatedAt: nowIso()
            };
            const validation = validateProfile(profile);
            if (!validation.ok) return JSON.stringify({ ok: false, errors: validation.errors }, null, 2);
            writeJsonAtomic(profilePath, profile);
            appendEvent(stateDir, { type: 'profile.merge', updates: Object.keys(args.updates || {}) });
            return JSON.stringify({ ok: true, profile }, null, 2);
          }

          if (operation === 'summary') {
            const profile = readExisting() || baseProfile;
            return JSON.stringify({
              ok: true,
              summary: profileSummaryText(profile),
              profile
            }, null, 2);
          }

          if (operation === 'validate') {
            const profile = readExisting() || baseProfile;
            const validation = validateProfile(profile);
            return JSON.stringify({ ok: validation.ok, errors: validation.errors, profile }, null, 2);
          }

          if (operation === 'clear') {
            if (stateDir && fs.existsSync(stateDir)) fs.rmSync(stateDir, { recursive: true, force: true });
            return JSON.stringify({ ok: true, cleared: stateDir }, null, 2);
          }

          if (operation === 'repair') {
            const quarantineDir = path.join(baseProfile.runtimeRoot, 'quarantine', `${Date.now()}-${context.sessionID}`);
            if (stateDir && fs.existsSync(stateDir)) {
              fs.mkdirSync(path.dirname(quarantineDir), { recursive: true });
              fs.renameSync(stateDir, quarantineDir);
            }
            writeJsonAtomic(profilePath, baseProfile);
            appendEvent(stateDir, { type: 'profile.repair', quarantineDir });
            return JSON.stringify({ ok: true, profile: baseProfile, quarantineDir }, null, 2);
          }

          if (operation === 'cleanup') {
            const retentionDays = args.retentionDays || SDP_DEFAULT_RETENTION_DAYS;
            const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
            const knownSessions = listKnownOpenCodeSessions();
            const removed = [];
            const kept = [];
            if (fs.existsSync(baseProfile.stateRoot)) {
              for (const entry of fs.readdirSync(baseProfile.stateRoot, { withFileTypes: true })) {
                if (!entry.isDirectory()) continue;
                const dir = path.join(baseProfile.stateRoot, entry.name);
                if (entry.name === context.sessionID) {
                  kept.push(dir);
                  continue;
                }
                const stat = fs.statSync(dir);
                if ((knownSessions && !knownSessions.has(entry.name)) || stat.mtimeMs < cutoff) {
                  fs.rmSync(dir, { recursive: true, force: true });
                  removed.push(dir);
                } else {
                  kept.push(dir);
                }
              }
            }
            return JSON.stringify({ ok: true, removed, kept, retentionDays }, null, 2);
          }

          return JSON.stringify({ ok: false, reason: `unsupported operation ${operation}` }, null, 2);
        }
      }),
      sdp_setup_hygiene: tool({
        description: 'Check or apply project-local SuperDuperPowers generated-doc ignore hygiene.',
        args: {
          operation: tool.schema.enum(['check', 'apply', 'explain']),
          docsRoot: tool.schema.string().optional()
        },
        async execute(args, context) {
          const directory = context.directory || context.worktree || process.cwd();
          const { docsRoot, entries } = docsEntriesFor(directory, args.docsRoot);
          const gitignorePath = path.join(directory, '.gitignore');
          const ignorePath = path.join(directory, '.ignore');

          const missingFor = (filePath, required) => {
            const existing = readTextIfExists(filePath).split(/\r?\n/);
            return required.filter((entry) => !existing.includes(entry));
          };

          if (args.operation === 'explain') {
            return JSON.stringify({ ok: true, docsRoot, entries, reason: 'Generated SuperDuperPowers specs and plans are local-only but must remain readable to OpenCode.' }, null, 2);
          }

          if (args.operation === 'check') {
            const missing = {
              gitignore: missingFor(gitignorePath, entries.gitignore),
              ignore: missingFor(ignorePath, entries.ignore)
            };
            const ok = missing.gitignore.length === 0 && missing.ignore.length === 0;
            return JSON.stringify({ ok, docsRoot, entries, missing }, null, 2);
          }

          if (args.operation === 'apply') {
            const changed = [];
            const gitignoreChanged = appendMissingLines(gitignorePath, entries.gitignore);
            const ignoreChanged = appendMissingLines(ignorePath, entries.ignore);
            changed.push(...gitignoreChanged.map((entry) => ({ file: '.gitignore', entry })));
            changed.push(...ignoreChanged.map((entry) => ({ file: '.ignore', entry })));
            return JSON.stringify({ ok: true, docsRoot, entries, changed }, null, 2);
          }

          return JSON.stringify({ ok: false, reason: `unsupported operation ${args.operation}` }, null, 2);
        }
      }),
      sdp_branch_context: tool({
        description: 'Inspect git branch safety for SuperDuperPowers execution without changing branches.',
        args: {
          strategy: tool.schema.enum(['worktree', 'feature-branch', 'current-branch']).optional()
        },
        async execute(args, context) {
          const directory = context.directory || context.worktree || process.cwd();
          const git = getGitContext(directory);
          const recommendedAction = recommendBranchAction(git);
          return JSON.stringify({
            ok: true,
            strategy: args.strategy || null,
            git,
            recommendedAction
          }, null, 2);
        }
      })
    },

    // Inject skills path into live config so OpenCode discovers superpowers skills
    // without requiring manual symlinks or config file edits.
    // This works because Config.get() returns a cached singleton — modifications
    // here are visible when skills are lazily discovered later.
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(superpowersSkillsDir)) {
        config.skills.paths.push(superpowersSkillsDir);
      }

      config.agent = config.agent || {};
      const bundledAgents = loadBundledAgents();
      for (const [name, agent] of Object.entries(bundledAgents)) {
        if (!config.agent[name]) {
          config.agent[name] = agent;
        }
      }
    },

    // Inject bootstrap into the first user message of each session.
    // Using a user message instead of a system message avoids:
    //   1. Token bloat from system messages repeated every turn (#750)
    //   2. Multiple system messages breaking Qwen and other models (#894)
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find(m => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;
      // Only inject once
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('EXTREMELY_IMPORTANT'))) return;
      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    },

    'experimental.session.compacting': async (input, output) => {
      const sessionID = input?.sessionID || input?.session?.id || output?.sessionID || output?.session?.id;
      if (!sessionID) return output;
      const activeDirectory = input?.directory || input?.worktree || directory || process.cwd();
      const paths = getRuntimePaths(configDir, sessionID, activeDirectory);
      const profilePath = path.join(paths.stateDir, 'profile.json');
      if (!fs.existsSync(profilePath)) return output;

      const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
      const summary = profileSummaryText(profile);
      if (output && typeof output === 'object') {
        output.superduperpowersProfileSummary = summary;
        if (Array.isArray(output.messages)) {
          output.messages.unshift({ role: 'system', content: summary });
        }
      }
      return output;
    }
  };
};
