import { tool } from '@opencode-ai/plugin';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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
const allowedRouteValues = ['full-brainstorming', 'quick-implementation', 'none'];
const allowedTestingIntensityValues = ['full-regression', 'major-behavior', 'existing-tests-only'];
const nullableDecisionKeys = new Set(['route', 'executionMethod', 'executionStrategy']);
const stringProfileInputKeys = new Set([
  'createdAt',
  'updatedAt',
  'messageId',
  'route',
  'docsRoot',
  'generatedDocsPolicy',
  'workflowCommitPolicy',
  'executionMethod',
  'executionStrategy',
  'branchPolicy',
  'testingIntensity',
  'questionPolicy',
  'productName',
  'programmaticName',
  'skillNamespace',
  'sdpDocsRoot',
  'specsDir',
  'plansDir',
  'runtimeRoot',
  'stateRoot',
  'stateDir',
  'worktreeRoot'
]);

const toPosixPath = (value) => value.split(path.sep).join('/');
const nowIso = () => new Date().toISOString();

const projectKeyFor = (directory) => {
  const normalized = path.resolve(directory || process.cwd());
  const base = path.basename(normalized).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  const hash = crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 10);
  return `${base}-${hash}`;
};

export const getRuntimePaths = (configDir, sessionID, directory) => {
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

const validateProfile = (profile, { allowIncomplete = false } = {}) => {
  const errors = [];
  for (const key of Object.keys(profile)) {
    if (!SDP_PROFILE_KEYS.has(key)) errors.push(`unknown profile field: ${key}`);
  }
  if (profile.schemaVersion !== SDP_SCHEMA_VERSION) errors.push('schemaVersion must be 1');
  if (!profile.productName || profile.productName !== 'SuperDuperPowers') errors.push('productName must be SuperDuperPowers');
  if (!(allowIncomplete && profile.route === null) && !allowedRouteValues.includes(profile.route)) errors.push('invalid route');
  if (!allowedTestingIntensityValues.includes(profile.testingIntensity)) errors.push('invalid testingIntensity');
  if (!['local-only'].includes(profile.generatedDocsPolicy)) errors.push('invalid generatedDocsPolicy');
  if (hasSecretLikeKey(profile)) errors.push('profile contains secret-like key');
  return { ok: errors.length === 0, errors };
};

const stableJson = (value) => JSON.stringify(value);

const validateProfileInput = (value, { allowFull = false, comparisonProfile = null } = {}) => {
  const errors = [];
  if (!value) return { ok: true, errors };
  if (typeof value !== 'object' || Array.isArray(value)) return { ok: false, errors: ['profile input must be an object'] };
  const allowedKeys = allowFull ? SDP_PROFILE_KEYS : SDP_MUTABLE_PROFILE_KEYS;
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) errors.push(`unsupported profile field: ${key}`);
    if (stringProfileInputKeys.has(key) && value[key] !== null && typeof value[key] !== 'string') errors.push(`profile field must be a string: ${key}`);
    if (nullableDecisionKeys.has(key) && value[key] === null) continue;
    if (key === 'route' && value[key] !== undefined && !allowedRouteValues.includes(value[key])) errors.push('invalid route');
    if (key === 'testingIntensity' && value[key] !== undefined && !allowedTestingIntensityValues.includes(value[key])) errors.push('invalid testingIntensity');
    if (key === 'generatedDocsPolicy' && value[key] !== undefined && value[key] !== 'local-only') errors.push('invalid generatedDocsPolicy');
    if (key === 'cleanupPolicy' && (typeof value[key] !== 'object' || value[key] === null || Array.isArray(value[key]))) errors.push('cleanupPolicy must be an object');
    if (allowFull && key === 'schemaVersion' && value[key] !== SDP_SCHEMA_VERSION) errors.push('schemaVersion must be 1');
    if (allowFull && key === 'invocationAliases' && !Array.isArray(value[key])) errors.push('invocationAliases must be an array');
    if (allowFull && ['project', 'harness'].includes(key) && (typeof value[key] !== 'object' || value[key] === null || Array.isArray(value[key]))) errors.push(`${key} must be an object`);
    if (allowFull && comparisonProfile && !SDP_MUTABLE_PROFILE_KEYS.has(key) && !['updatedAt', 'messageId'].includes(key)) {
      if (stableJson(value[key]) !== stableJson(comparisonProfile[key])) errors.push(`profile field does not match active context: ${key}`);
    }
  }
  if (hasSecretLikeKey(value)) errors.push('profile contains secret-like key');
  return { ok: errors.length === 0, errors };
};

export const profileSummaryText = (profile) => `SuperDuperPowers profile: route=${profile.route || 'unset'}, docs=${profile.sdpDocsRoot}, runtime=${profile.runtimeRoot}, executionMethod=${profile.executionMethod || 'unset'}, executionStrategy=${profile.executionStrategy || 'unset'}, testingIntensity=${profile.testingIntensity}, branchPolicy=${profile.branchPolicy}.`;

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

const readJsonFile = (filePath) => {
  try {
    return { value: JSON.parse(fs.readFileSync(filePath, 'utf8')), errors: [] };
  } catch (error) {
    return { value: null, errors: [`invalid JSON in ${path.basename(filePath)}: ${error.message}`] };
  }
};

const validateRelatedStateFiles = (stateDir) => {
  const errors = [];
  if (!stateDir) return errors;

  const artifactsPath = path.join(stateDir, 'artifacts.json');
  if (!fs.existsSync(artifactsPath)) {
    errors.push('missing artifacts.json');
  } else {
    const artifacts = readJsonFile(artifactsPath);
    errors.push(...artifacts.errors);
    if (artifacts.value) {
      if (artifacts.value.schemaVersion !== SDP_SCHEMA_VERSION) errors.push('artifacts.json schemaVersion must be 1');
      if (!Array.isArray(artifacts.value.artifacts)) errors.push('artifacts.json artifacts must be an array');
    }
  }

  const eventsPath = path.join(stateDir, 'events.jsonl');
  if (!fs.existsSync(eventsPath)) {
    errors.push('missing events.jsonl');
  } else {
    const lines = fs.readFileSync(eventsPath, 'utf8').split(/\r?\n/).filter(Boolean);
    lines.forEach((line, index) => {
      try {
        const event = JSON.parse(line);
        if (!event || typeof event !== 'object' || Array.isArray(event)) errors.push(`events.jsonl line ${index + 1} must be an object`);
      } catch (error) {
        errors.push(`invalid JSON in events.jsonl line ${index + 1}: ${error.message}`);
      }
    });
  }

  return errors;
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

const createProfileTool = (configDir) => tool({
  description: 'Manage the active SuperDuperPowers workflow profile for this OpenCode session.',
  args: {
    operation: tool.schema.enum(['get', 'set', 'merge', 'summary', 'validate', 'repair', 'clear', 'cleanup']),
    profile: tool.schema.record(tool.schema.string(), tool.schema.any()).optional(),
    updates: tool.schema.record(tool.schema.string(), tool.schema.any()).optional(),
    retentionDays: tool.schema.number().int().positive().optional()
  },
  async execute(args, context) {
    const operation = args.operation;
    const incomingProfile = args.profile || {};
    const profileInputOperation = ['set', 'repair'].includes(operation);
    const preValidation = profileInputOperation ? validateProfileInput(incomingProfile, { allowFull: true }) : { ok: true, errors: [] };
    if (!preValidation.ok) return JSON.stringify({ ok: false, errors: preValidation.errors }, null, 2);
    const baseProfile = buildDefaultProfile({ configDir, context, profile: profileInputOperation ? incomingProfile : {} });
    const stateDir = baseProfile.stateDir;

    if (!context.sessionID && ['set', 'merge', 'clear', 'repair'].includes(operation)) {
      return JSON.stringify({ ok: false, reason: 'missing-session-id', unsavedProfile: baseProfile }, null, 2);
    }

    const profilePath = stateDir ? path.join(stateDir, 'profile.json') : null;
    const readExisting = () => {
      if (!profilePath || !fs.existsSync(profilePath)) return null;
      const parsed = readJsonFile(profilePath);
      if (parsed.errors.length > 0) return { corrupted: true, errors: parsed.errors };
      return parsed.value;
    };

    if (operation === 'get') {
      const existing = readExisting();
      if (existing?.corrupted) return JSON.stringify({ ok: false, reason: 'corrupt-profile', errors: existing.errors }, null, 2);
      return JSON.stringify({ ok: true, profile: existing || baseProfile }, null, 2);
    }

    if (operation === 'set') {
      const profile = buildDefaultProfile({ configDir, context, profile: incomingProfile });
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
      if (existing?.corrupted) return JSON.stringify({ ok: false, reason: 'corrupt-profile', errors: existing.errors }, null, 2);
      const updates = args.updates || {};
      const docsRoot = typeof updates.docsRoot === 'string' ? updates.docsRoot.replace(/\/$/, '') : null;
      const profile = {
        ...existing,
        ...updates,
        sdpDocsRoot: docsRoot ? `${docsRoot}/superduperpowers` : existing.sdpDocsRoot,
        specsDir: docsRoot ? `${docsRoot}/superduperpowers/specs` : existing.specsDir,
        plansDir: docsRoot ? `${docsRoot}/superduperpowers/plans` : existing.plansDir,
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
      if (profile?.corrupted) return JSON.stringify({ ok: false, reason: 'corrupt-profile', errors: profile.errors }, null, 2);
      return JSON.stringify({ ok: true, summary: profileSummaryText(profile), profile }, null, 2);
    }

    if (operation === 'validate') {
      const existing = readExisting();
      if (existing?.corrupted) return JSON.stringify({ ok: false, errors: existing.errors, profile: null }, null, 2);
      const profile = existing || baseProfile;
      const errors = [...validateProfile(profile, { allowIncomplete: !existing }).errors];
      if (existing) errors.push(...validateRelatedStateFiles(stateDir));
      return JSON.stringify({ ok: errors.length === 0, errors, profile }, null, 2);
    }

    if (operation === 'clear') {
      if (stateDir && fs.existsSync(stateDir)) fs.rmSync(stateDir, { recursive: true, force: true });
      return JSON.stringify({ ok: true, cleared: stateDir }, null, 2);
    }

    if (operation === 'repair') {
      const validation = validateProfile(baseProfile);
      if (!validation.ok) return JSON.stringify({ ok: false, errors: validation.errors }, null, 2);
      const quarantineDir = path.join(baseProfile.runtimeRoot, 'quarantine', `${Date.now()}-${context.sessionID}`);
      if (stateDir && fs.existsSync(stateDir)) {
        fs.mkdirSync(path.dirname(quarantineDir), { recursive: true });
        fs.renameSync(stateDir, quarantineDir);
      }
      writeJsonAtomic(profilePath, baseProfile);
      writeJsonAtomic(path.join(stateDir, 'artifacts.json'), { schemaVersion: SDP_SCHEMA_VERSION, artifacts: [] });
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
});

const createSetupHygieneTool = () => tool({
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
});

const createBranchContextTool = () => tool({
  description: 'Inspect git branch safety for SuperDuperPowers execution without changing branches.',
  args: {
    strategy: tool.schema.enum(['worktree', 'feature-branch', 'current-branch']).optional()
  },
  async execute(args, context) {
    const directory = context.directory || context.worktree || process.cwd();
    const git = getGitContext(directory);
    const recommendedAction = recommendBranchAction(git);
    return JSON.stringify({ ok: true, strategy: args.strategy || null, git, recommendedAction }, null, 2);
  }
});

export const createSdpTools = ({ configDir }) => ({
  sdp_profile: createProfileTool(configDir),
  sdp_setup_hygiene: createSetupHygieneTool(),
  sdp_branch_context: createBranchContextTool()
});
