import { tool } from '@opencode-ai/plugin';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { expectedCommandNames } from './sdp-registration.js';

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

const isPathInside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const isSafePathSegment = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value);

export const validateRuntimePathContainment = (paths) => {
  const errors = [];
  const sessionID = paths.sessionID || paths.sessionId || null;
  if (sessionID && !isSafePathSegment(sessionID)) errors.push('sessionID must be a safe path segment');
  if (paths.stateDir) {
    const relative = path.relative(paths.stateRoot, paths.stateDir);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) errors.push('stateDir is outside SuperDuperPowers state root');
  }
  if (paths.quarantineDir && !isPathInside(paths.quarantineRoot, paths.quarantineDir)) errors.push('quarantineDir is outside SuperDuperPowers quarantine root');
  if (paths.repairTempDir && !isPathInside(paths.quarantineRoot, paths.repairTempDir)) errors.push('repairTempDir is outside SuperDuperPowers quarantine root');
  return errors;
};

const safePathSegment = (value) => String(value || 'unknown').replace(/[^A-Za-z0-9_.-]/g, '_');

const isSafeProjectRelativePath = (value) => {
  if (!value || typeof value !== 'string' || path.isAbsolute(value)) return false;
  return !value.split(/[\\/]+/).some((segment) => segment === '..');
};

const validateRuntimeParentPaths = ({ runtimeRoot, stateRoot, quarantineRoot }) => {
  const errors = [];
  for (const [label, dirPath] of Object.entries({ runtimeRoot, stateRoot, quarantineRoot })) {
    if (!dirPath) continue;
    try {
      const stat = fs.lstatSync(dirPath);
      if (stat.isSymbolicLink()) errors.push(`${label} must not be a symlink`);
      if (!stat.isDirectory()) errors.push(`${label} must be a directory`);
    } catch (error) {
      if (error.code !== 'ENOENT') errors.push(`invalid ${label}: ${error.message}`);
    }
  }
  return errors;
};

const doctorCheck = (checks, id, status, message, details = {}) => {
  checks.push({ id, status, message, details });
};

const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

const dirExists = (dirPath) => {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
};

const readTextSafe = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
};

const summarizeDoctor = (checks) => ({
  ok: checks.every((check) => check.status !== 'error'),
  errors: checks.filter((check) => check.status === 'error').length,
  warnings: checks.filter((check) => check.status === 'warning').length,
  recommendations: checks
    .filter((check) => check.status !== 'ok')
    .map((check) => ({ id: check.id, recommendation: check.recommendation || check.message })),
  checks
});

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
  return { runtimeRoot, stateRoot, stateDir, worktreeRoot, quarantineRoot, projectKey, sessionID };
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
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return { ok: false, errors: ['profile must be an object'] };
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
    if (key === 'docsRoot' && value[key] !== undefined && !isSafeProjectRelativePath(value[key])) errors.push('invalid docsRoot');
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
  const eventsPath = path.join(stateDir, 'events.jsonl');
  const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | (fs.constants.O_NOFOLLOW || 0);
  const fd = fs.openSync(eventsPath, flags, 0o666);
  try {
    fs.writeSync(fd, `${JSON.stringify({ timestamp: nowIso(), ...event })}\n`);
  } finally {
    fs.closeSync(fd);
  }
};

const readJsonFile = (filePath) => {
  try {
    return { value: JSON.parse(fs.readFileSync(filePath, 'utf8')), errors: [] };
  } catch (error) {
    return { value: null, errors: [`invalid JSON in ${path.basename(filePath)}: ${error.message}`] };
  }
};

const inspectRuntimeStateFile = (filePath) => {
  try {
    const stat = fs.lstatSync(filePath);
    const errors = [];
    if (stat.isSymbolicLink()) errors.push(`${path.basename(filePath)} must not be a symlink`);
    if (!stat.isFile()) errors.push(`${path.basename(filePath)} must be a file`);
    return { exists: true, errors };
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false, errors: [] };
    return { exists: false, errors: [`invalid ${path.basename(filePath)}: ${error.message}`] };
  }
};

const validateEventAppendTarget = (stateDir) => {
  const eventsPath = path.join(stateDir, 'events.jsonl');
  const inspection = inspectRuntimeStateFile(eventsPath);
  return inspection.exists ? inspection.errors : [];
};

export const readProfileJsonSafe = (profilePath) => {
  const profileFile = inspectRuntimeStateFile(profilePath);
  if (!profileFile.exists) return { value: null, errors: [] };
  if (profileFile.errors.length > 0) return { value: null, errors: profileFile.errors };
  const parsed = readJsonFile(profilePath);
  if (parsed.errors.length > 0) return parsed;
  if (!parsed.value || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) return { value: null, errors: ['profile must be an object'] };
  return parsed;
};

const validateJsonLinesFile = (filePath) => {
  const errors = [];
  const inspection = inspectRuntimeStateFile(filePath);
  if (!inspection.exists) return [`missing ${path.basename(filePath)}`];
  if (inspection.errors.length > 0) return inspection.errors;
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
    lines.forEach((line, index) => {
      try {
        const event = JSON.parse(line);
        if (!event || typeof event !== 'object' || Array.isArray(event)) errors.push(`${path.basename(filePath)} line ${index + 1} must be an object`);
      } catch (error) {
        errors.push(`invalid JSON in ${path.basename(filePath)} line ${index + 1}: ${error.message}`);
      }
    });
  } catch (error) {
    errors.push(`invalid ${path.basename(filePath)}: ${error.message}`);
  }
  return errors;
};

const validateRelatedStateFiles = (stateDir) => {
  const errors = [];
  if (!stateDir) return errors;

  const artifactsPath = path.join(stateDir, 'artifacts.json');
  const artifactsFile = inspectRuntimeStateFile(artifactsPath);
  if (!artifactsFile.exists) {
    errors.push('missing artifacts.json');
  } else {
    errors.push(...artifactsFile.errors);
    const artifacts = artifactsFile.errors.length === 0 ? readJsonFile(artifactsPath) : { value: null, errors: [] };
    errors.push(...artifacts.errors);
    if (artifacts.errors.length === 0 && (!artifacts.value || typeof artifacts.value !== 'object' || Array.isArray(artifacts.value))) {
      errors.push('artifacts.json must be an object');
    } else if (artifacts.value) {
      if (artifacts.value.schemaVersion !== SDP_SCHEMA_VERSION) errors.push('artifacts.json schemaVersion must be 1');
      if (!Array.isArray(artifacts.value.artifacts)) errors.push('artifacts.json artifacts must be an array');
    }
  }

  const eventsPath = path.join(stateDir, 'events.jsonl');
  errors.push(...validateJsonLinesFile(eventsPath));

  return errors;
};

const inspectRuntimeDrift = (configDir, context) => {
  const directory = context.directory || context.worktree || process.cwd();
  const baseProfile = buildDefaultProfile({ configDir, context: { ...context, directory }, profile: {} });
  const stateDir = baseProfile.stateDir;
  const parentPathErrors = validateRuntimeParentPaths(baseProfile);
  if (parentPathErrors.length > 0) return { drifted: true, reason: 'invalid-runtime-path', baseProfile, errors: parentPathErrors };
  const containmentErrors = validateRuntimePathContainment(baseProfile);
  if (containmentErrors.length > 0) return { drifted: true, reason: 'invalid-runtime-path', baseProfile, errors: containmentErrors };
  if (stateDir && !isPathInside(baseProfile.stateRoot, stateDir)) {
    return { drifted: true, reason: 'invalid-runtime-path', baseProfile, errors: ['stateDir is outside SuperDuperPowers runtime state'] };
  }
  if (!stateDir) return { drifted: false, reason: 'state-not-initialized', baseProfile, errors: [] };
  try {
    const stateDirStat = fs.lstatSync(stateDir);
    if (stateDirStat.isSymbolicLink()) return { drifted: true, reason: 'runtime-state-drift', baseProfile, errors: ['stateDir must not be a symlink'] };
    if (!stateDirStat.isDirectory()) return { drifted: true, reason: 'runtime-state-drift', baseProfile, errors: ['stateDir must be a directory'] };
  } catch (error) {
    if (error.code === 'ENOENT') return { drifted: false, reason: 'state-not-initialized', baseProfile, errors: [] };
    return { drifted: true, reason: 'runtime-state-drift', baseProfile, errors: [`invalid stateDir: ${error.message}`] };
  }

  const errors = [];
  const profilePath = path.join(stateDir, 'profile.json');
  const artifactsPath = path.join(stateDir, 'artifacts.json');
  const eventsPath = path.join(stateDir, 'events.jsonl');

  const profileFile = inspectRuntimeStateFile(profilePath);
  const artifactsFile = inspectRuntimeStateFile(artifactsPath);
  errors.push(...profileFile.errors, ...artifactsFile.errors);
  const profile = profileFile.exists && profileFile.errors.length === 0 ? readJsonFile(profilePath) : { value: null, errors: profileFile.exists ? [] : ['missing profile.json'] };
  const expectedProfile = profile.value && isSafeProjectRelativePath(profile.value.docsRoot)
    ? buildDefaultProfile({ configDir, context: { ...context, directory }, profile: { docsRoot: profile.value.docsRoot } })
    : baseProfile;
  errors.push(...profile.errors);
  if (profile.errors.length === 0 && (!profile.value || typeof profile.value !== 'object' || Array.isArray(profile.value))) {
    errors.push('profile must be an object');
  } else if (profile.value) {
    errors.push(...validateProfile(profile.value, { allowIncomplete: profile.value.route === null }).errors);
    if (!isSafeProjectRelativePath(profile.value.docsRoot)) errors.push('profile docsRoot must be a project-relative path');
    if (profile.value.sessionId !== context.sessionID) errors.push('profile sessionId does not match active session');
    if (profile.value.docsRoot !== expectedProfile.docsRoot) errors.push('profile docsRoot does not match active docs root');
    if (profile.value.runtimeRoot !== expectedProfile.runtimeRoot) errors.push('profile runtimeRoot does not match active config directory');
    if (profile.value.stateRoot !== expectedProfile.stateRoot) errors.push('profile stateRoot does not match active config directory');
    if (profile.value.stateDir !== expectedProfile.stateDir) errors.push('profile stateDir does not match active session');
    if (profile.value.worktreeRoot !== expectedProfile.worktreeRoot) errors.push('profile worktreeRoot does not match active directory');
    if (profile.value.sdpDocsRoot !== expectedProfile.sdpDocsRoot) errors.push('profile sdpDocsRoot does not match active docs root');
    if (profile.value.specsDir !== expectedProfile.specsDir) errors.push('profile specsDir does not match active docs root');
    if (profile.value.plansDir !== expectedProfile.plansDir) errors.push('profile plansDir does not match active docs root');
    if (profile.value.harness?.configDir !== configDir) errors.push('profile harness configDir does not match active config directory');
    if (profile.value.project?.root !== directory) errors.push('profile project root does not match active directory');
    if (profile.value.project?.projectKey !== expectedProfile.project.projectKey) errors.push('profile projectKey does not match active directory');
  }

  if (!artifactsFile.exists) {
    errors.push('missing artifacts.json');
  } else {
    const artifacts = artifactsFile.errors.length === 0 ? readJsonFile(artifactsPath) : { value: null, errors: [] };
    errors.push(...artifacts.errors);
    if (artifacts.errors.length === 0 && (!artifacts.value || typeof artifacts.value !== 'object' || Array.isArray(artifacts.value))) {
      errors.push('artifacts.json must be an object');
    } else if (artifacts.value) {
      if (artifacts.value.schemaVersion !== SDP_SCHEMA_VERSION) errors.push('artifacts.json schemaVersion must be 1');
      if (!Array.isArray(artifacts.value.artifacts)) errors.push('artifacts.json artifacts must be an array');
    }
  }

  errors.push(...validateJsonLinesFile(eventsPath));

  return { drifted: errors.length > 0, reason: errors.length > 0 ? 'runtime-state-drift' : 'ok', baseProfile: expectedProfile, errors };
};

const recordRepairFailure = (baseProfile, context, errors) => {
  try {
    const failurePath = path.join(baseProfile.runtimeRoot, 'quarantine', `repair-failure-${Date.now()}-${safePathSegment(context.sessionID)}.json`);
    writeJsonAtomic(failurePath, { timestamp: nowIso(), sessionID: context.sessionID, errors });
    return failurePath;
  } catch {
    return null;
  }
};

const recordRepairFailureIfSafe = (baseProfile, context, errors) => {
  const parentErrors = validateRuntimeParentPaths({
    runtimeRoot: baseProfile.runtimeRoot,
    stateRoot: baseProfile.stateRoot,
    quarantineRoot: path.join(baseProfile.runtimeRoot, 'quarantine')
  });
  if (parentErrors.length > 0) return null;
  return recordRepairFailure(baseProfile, context, errors);
};

export const autoRepairRuntimeState = ({ configDir, context }) => {
  if (!context?.sessionID) return { ok: true, repaired: false, reason: 'missing-session-id' };
  const inspection = inspectRuntimeDrift(configDir, context);
  if (!inspection.drifted) return { ok: true, repaired: false, reason: inspection.reason };

  const stateDir = inspection.baseProfile.stateDir;
  const stateRoot = inspection.baseProfile.stateRoot;
  const quarantineRoot = path.join(inspection.baseProfile.runtimeRoot, 'quarantine');
  const repairId = `${Date.now()}-${process.pid}-${safePathSegment(context.sessionID)}-${crypto.randomBytes(4).toString('hex')}`;
  const quarantineDir = path.join(quarantineRoot, repairId);
  const repairTempDir = path.join(quarantineRoot, `repairing-${repairId}`);
  const parentPathErrors = validateRuntimeParentPaths({ runtimeRoot: inspection.baseProfile.runtimeRoot, stateRoot, quarantineRoot });
  if (parentPathErrors.length > 0) {
    return { ok: false, repaired: false, stateDir, quarantineDir, errors: [...inspection.errors, ...parentPathErrors] };
  }
  const containmentErrors = validateRuntimePathContainment({ ...inspection.baseProfile, quarantineRoot, quarantineDir, repairTempDir });
  if (!stateDir || containmentErrors.length > 0) {
    const errors = [...inspection.errors, ...(containmentErrors.length > 0 ? containmentErrors : ['repair path is outside SuperDuperPowers runtime state'])];
    const failurePath = recordRepairFailureIfSafe(inspection.baseProfile, context, errors);
    return { ok: false, repaired: false, stateDir, quarantineDir, failurePath, errors };
  }
  let movedToQuarantine = false;
  let createdReplacementState = false;
  const repairMarker = `.repairing-${repairId}`;
  const repairMarkerPath = path.join(stateDir, repairMarker);
  try {
    let stateDirExists = false;
    try {
      fs.lstatSync(stateDir);
      stateDirExists = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (stateDirExists) {
      fs.mkdirSync(path.dirname(quarantineDir), { recursive: true });
      fs.renameSync(stateDir, quarantineDir);
      movedToQuarantine = true;
    }
    const repairedProfile = { ...inspection.baseProfile, route: null, updatedAt: nowIso() };
    writeJsonAtomic(path.join(repairTempDir, 'profile.json'), repairedProfile);
    writeJsonAtomic(path.join(repairTempDir, 'artifacts.json'), { schemaVersion: SDP_SCHEMA_VERSION, artifacts: [] });
    appendEvent(repairTempDir, { type: 'runtime.autoRepair', messageID: context.messageID || null, errors: inspection.errors, quarantineDir });
    fs.mkdirSync(stateDir);
    createdReplacementState = true;
    fs.writeFileSync(repairMarkerPath, repairId, { flag: 'wx' });
    for (const file of ['profile.json', 'artifacts.json', 'events.jsonl']) {
      fs.copyFileSync(path.join(repairTempDir, file), path.join(stateDir, file), fs.constants.COPYFILE_EXCL);
    }
    fs.rmSync(repairMarkerPath, { force: true });
    fs.rmSync(repairTempDir, { recursive: true, force: true });
    return { ok: true, repaired: true, stateDir, quarantineDir, errors: inspection.errors };
  } catch (error) {
    const errors = [...inspection.errors, error.message];
    let restored = false;
    try {
      if (fs.existsSync(repairTempDir)) fs.rmSync(repairTempDir, { recursive: true, force: true });
      if (createdReplacementState && fs.existsSync(stateDir) && !fs.existsSync(repairMarkerPath) && fs.readdirSync(stateDir).length === 0) {
        fs.rmSync(stateDir, { recursive: true, force: true });
      }
      if (createdReplacementState && fs.existsSync(repairMarkerPath) && fs.readFileSync(repairMarkerPath, 'utf8') === repairId) {
        const entries = fs.readdirSync(stateDir);
        const expectedEntries = new Set([repairMarker, 'profile.json', 'artifacts.json', 'events.jsonl']);
        if (entries.every((entry) => expectedEntries.has(entry))) {
          fs.rmSync(stateDir, { recursive: true, force: true });
        }
      }
      if (movedToQuarantine && !fs.existsSync(stateDir) && fs.existsSync(quarantineDir)) {
        fs.renameSync(quarantineDir, stateDir);
        restored = true;
      }
    } catch (restoreError) {
      errors.push(`failed to restore quarantined state: ${restoreError.message}`);
    }
    const failurePath = recordRepairFailure(inspection.baseProfile, context, errors);
    return { ok: false, repaired: false, stateDir, quarantineDir, restored, failurePath, errors };
  }
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
    const containmentErrors = validateRuntimePathContainment(baseProfile);
    if (containmentErrors.length > 0) return JSON.stringify({ ok: false, errors: containmentErrors }, null, 2);
    const parentPathErrors = validateRuntimeParentPaths({
      runtimeRoot: baseProfile.runtimeRoot,
      stateRoot: baseProfile.stateRoot,
      quarantineRoot: path.join(baseProfile.runtimeRoot, 'quarantine')
    });
    if (parentPathErrors.length > 0) return JSON.stringify({ ok: false, errors: parentPathErrors }, null, 2);
    if (stateDir) {
      try {
        const stateDirStat = fs.lstatSync(stateDir);
        if (stateDirStat.isSymbolicLink()) return JSON.stringify({ ok: false, errors: ['stateDir must not be a symlink'] }, null, 2);
        if (!stateDirStat.isDirectory()) return JSON.stringify({ ok: false, errors: ['stateDir must be a directory'] }, null, 2);
      } catch (error) {
        if (error.code !== 'ENOENT') return JSON.stringify({ ok: false, errors: [`invalid stateDir: ${error.message}`] }, null, 2);
      }
    }
    if (stateDir && ['set', 'merge'].includes(operation)) {
      const eventTargetErrors = validateEventAppendTarget(stateDir);
      if (eventTargetErrors.length > 0) return JSON.stringify({ ok: false, errors: eventTargetErrors }, null, 2);
    }

    if (!context.sessionID && ['set', 'merge', 'clear', 'repair'].includes(operation)) {
      return JSON.stringify({ ok: false, reason: 'missing-session-id', unsavedProfile: baseProfile }, null, 2);
    }

    const profilePath = stateDir ? path.join(stateDir, 'profile.json') : null;
    const readExisting = () => {
      if (!profilePath) return null;
      const parsed = readProfileJsonSafe(profilePath);
      if (!parsed.value && parsed.errors.length === 0) return null;
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

const createDoctorTool = (configDir, packageInfo, getRegistrationReport) => tool({
  description: 'Diagnose SuperDuperPowers OpenCode plugin installation and runtime state without modifying files.',
  args: {
    operation: tool.schema.enum(['check'])
  },
  async execute(args, context) {
    const checks = [];
    const directory = context.directory || context.worktree || process.cwd();
    const paths = getRuntimePaths(configDir, context.sessionID, directory);
    const registration = getRegistrationReport() || null;
    const packageRoot = packageInfo.packageRoot || null;
    const skillsDir = packageInfo.skillsDir || null;
    const agentsDir = packageInfo.agentsDir || null;

    doctorCheck(checks, 'operation', args.operation === 'check' ? 'ok' : 'error', `operation=${args.operation}`);
    doctorCheck(checks, 'package-root', packageRoot && dirExists(packageRoot) ? 'ok' : 'error', packageRoot ? `package root ${packageRoot}` : 'package root unavailable', { packageRoot });
    doctorCheck(checks, 'skills-dir', skillsDir && dirExists(skillsDir) ? 'ok' : 'error', skillsDir ? `skills dir ${skillsDir}` : 'skills dir unavailable', { skillsDir });

    const skillsPathStatus = registration?.skillsPath?.status || null;
    doctorCheck(
      checks,
      'skills-registration',
      !registration ? 'warning' : (skillsPathStatus ? 'ok' : 'error'),
      !registration ? 'registration report unavailable until config hook runs' : (skillsPathStatus ? `skills path ${skillsPathStatus}` : 'skills path registration missing'),
      { skillsPath: registration?.skillsPath || null }
    );

    const requiredSkills = ['using-superpowers', 'brainstorming', 'writing-plans', 'executing-plans', 'subagent-driven-development', 'requesting-spec-review', 'requesting-code-review', 'verification-before-completion'];
    const missingSkills = requiredSkills.filter((name) => !skillsDir || !fileExists(path.join(skillsDir, name, 'SKILL.md')));
    doctorCheck(checks, 'required-skills', missingSkills.length === 0 ? 'ok' : 'error', missingSkills.length === 0 ? 'required skills exist' : `missing skills: ${missingSkills.join(', ')}`, { requiredSkills, missingSkills });

    const requiredAgents = ['code-reviewer', 'spec-reviewer', 'lite-code-reviewer', 'lite-spec-reviewer'];
    const missingAgents = requiredAgents.filter((name) => !agentsDir || !fileExists(path.join(agentsDir, `${name}.md`)));
    doctorCheck(checks, 'reviewer-agents', missingAgents.length === 0 ? 'ok' : 'error', missingAgents.length === 0 ? 'reviewer agents exist' : `missing agents: ${missingAgents.join(', ')}`, { requiredAgents, missingAgents });

    const registeredAgents = registration?.agents || {};
    const missingAgentRegistrations = registration ? requiredAgents.filter((name) => !registeredAgents[name]) : [];
    doctorCheck(
      checks,
      'agent-registration',
      !registration ? 'warning' : (missingAgentRegistrations.length === 0 ? 'ok' : 'error'),
      !registration ? 'registration report unavailable until config hook runs' : (missingAgentRegistrations.length === 0 ? 'reviewer agents registered or preserved' : `missing reviewer agent registrations: ${missingAgentRegistrations.join(', ')}`),
      { agents: registeredAgents, missingAgentRegistrations }
    );

    const expectedCommands = expectedCommandNames();
    const registeredCommands = registration?.commands || {};
    const missingCommands = registration ? expectedCommands.filter((name) => !registeredCommands[name]) : [];
    doctorCheck(checks, 'commands', !registration ? 'warning' : (missingCommands.length === 0 ? 'ok' : 'error'), !registration ? 'registration report unavailable until config hook runs' : (missingCommands.length === 0 ? 'expected commands registered or preserved' : `missing command registrations: ${missingCommands.join(', ')}`), { commands: registeredCommands, missingCommands });

    const preservedCommands = Object.entries(registeredCommands).filter(([, status]) => status === 'preserved').map(([name]) => name);
    if (preservedCommands.length > 0) {
      doctorCheck(checks, 'command-overrides', 'warning', `user-defined commands preserved: ${preservedCommands.join(', ')}`, { preservedCommands });
    }

    const tools = ['sdp_profile', 'sdp_setup_hygiene', 'sdp_branch_context', 'sdp_doctor'];
    doctorCheck(checks, 'tools', 'ok', `expected tools exposed: ${tools.join(', ')}`, { tools });

    const runtimeParentErrors = validateRuntimeParentPaths(paths);
    doctorCheck(checks, 'runtime-parents', runtimeParentErrors.length === 0 ? 'ok' : 'error', runtimeParentErrors.length === 0 ? 'runtime parent paths are safe' : runtimeParentErrors.join('; '), { errors: runtimeParentErrors });

    const containmentErrors = validateRuntimePathContainment(paths);
    doctorCheck(checks, 'runtime-containment', containmentErrors.length === 0 ? 'ok' : 'error', containmentErrors.length === 0 ? 'runtime state paths stay inside owned roots' : containmentErrors.join('; '), { errors: containmentErrors });

    const profilePath = paths.stateDir ? path.join(paths.stateDir, 'profile.json') : null;
    const stateDirErrors = [];
    if (runtimeParentErrors.length > 0 || containmentErrors.length > 0) {
      stateDirErrors.push('stateDir not inspected because runtime paths are unsafe');
    } else if (paths.stateDir) {
      try {
        const stateDirStat = fs.lstatSync(paths.stateDir);
        if (stateDirStat.isSymbolicLink()) stateDirErrors.push('stateDir must not be a symlink');
        if (!stateDirStat.isDirectory()) stateDirErrors.push('stateDir must be a directory');
      } catch (error) {
        if (error.code !== 'ENOENT') stateDirErrors.push(`invalid stateDir: ${error.message}`);
      }
    }
    doctorCheck(checks, 'state-dir', stateDirErrors.length === 0 ? 'ok' : 'error', stateDirErrors.length === 0 ? 'active stateDir is safe to inspect' : stateDirErrors.join('; '), { stateDir: paths.stateDir, errors: stateDirErrors });

    if (stateDirErrors.length > 0) {
      doctorCheck(checks, 'profile', 'error', 'active profile not read because stateDir is unsafe', { profilePath, errors: stateDirErrors });
    } else if (profilePath) {
      const parsed = readProfileJsonSafe(profilePath);
      if (!parsed.value && parsed.errors.length === 0) {
        doctorCheck(checks, 'profile', 'warning', 'active profile has not been initialized', { profilePath });
      } else if (parsed.errors.length > 0) {
        doctorCheck(checks, 'profile', 'error', parsed.errors.join('; '), { profilePath, errors: parsed.errors });
      } else {
        const errors = [...validateProfile(parsed.value, { allowIncomplete: parsed.value?.route === null }).errors, ...validateRelatedStateFiles(paths.stateDir)];
        doctorCheck(checks, 'profile', errors.length === 0 ? 'ok' : 'error', errors.length === 0 ? 'active profile validates' : errors.join('; '), { profilePath, errors });
      }
    } else {
      doctorCheck(checks, 'profile', 'warning', 'active profile has not been initialized', { profilePath });
    }

    doctorCheck(checks, 'runtime-root', dirExists(paths.runtimeRoot) ? 'ok' : 'warning', dirExists(paths.runtimeRoot) ? `runtime root exists: ${paths.runtimeRoot}` : `runtime root not created yet: ${paths.runtimeRoot}`, { runtimeRoot: paths.runtimeRoot });

    const legacyShim = path.join(configDir, 'plugins', 'superpowers.js');
    doctorCheck(checks, 'legacy-shim', fileExists(legacyShim) ? 'warning' : 'ok', fileExists(legacyShim) ? `legacy shim exists: ${legacyShim}` : 'legacy superpowers.js shim not found', { legacyShim });

    const configText = `${readTextSafe(path.join(configDir, 'opencode.json'))}\n${readTextSafe(path.join(configDir, 'opencode.jsonc'))}`;
    const duplicateRisk = /superpowers\.js/.test(configText) || (/superduperpowers/.test(configText) && fileExists(legacyShim));
    doctorCheck(checks, 'duplicate-plugin-risk', duplicateRisk ? 'warning' : 'ok', duplicateRisk ? 'possible mixed legacy/package plugin load detected' : 'no mixed legacy/package plugin risk detected from known files', { checkedConfigDir: configDir });

    const hygiene = docsEntriesFor(directory, null);
    const gitignore = readTextSafe(path.join(directory, '.gitignore')).split(/\r?\n/);
    const ignore = readTextSafe(path.join(directory, '.ignore')).split(/\r?\n/);
    const missingHygiene = {
      gitignore: hygiene.entries.gitignore.filter((entry) => !gitignore.includes(entry)),
      ignore: hygiene.entries.ignore.filter((entry) => !ignore.includes(entry))
    };
    doctorCheck(checks, 'generated-doc-hygiene', missingHygiene.gitignore.length === 0 && missingHygiene.ignore.length === 0 ? 'ok' : 'warning', missingHygiene.gitignore.length === 0 && missingHygiene.ignore.length === 0 ? 'generated-doc hygiene entries are present' : 'generated-doc hygiene entries are missing', { docsRoot: hygiene.docsRoot, missing: missingHygiene });

    const quarantines = runtimeParentErrors.length === 0 && dirExists(paths.quarantineRoot) ? fs.readdirSync(paths.quarantineRoot).filter(Boolean) : [];
    const repairFailures = quarantines.filter((entry) => entry.startsWith('repair-failure-'));
    doctorCheck(
      checks,
      'repair-history',
      runtimeParentErrors.length > 0 ? 'error' : (repairFailures.length > 0 ? 'error' : (quarantines.length === 0 ? 'ok' : 'warning')),
      runtimeParentErrors.length > 0 ? 'repair history not read because runtime parent paths are unsafe' : (repairFailures.length > 0 ? `failed automatic repairs found: ${repairFailures.length}` : (quarantines.length === 0 ? 'no quarantined runtime state found' : `quarantined runtime state entries: ${quarantines.length}`)),
      { quarantineRoot: paths.quarantineRoot, quarantines, repairFailures }
    );

    return JSON.stringify(summarizeDoctor(checks), null, 2);
  }
});

export const createSdpTools = ({ configDir, packageInfo = {}, getRegistrationReport = () => null }) => ({
  sdp_profile: createProfileTool(configDir),
  sdp_setup_hygiene: createSetupHygieneTool(),
  sdp_branch_context: createBranchContextTool(),
  sdp_doctor: createDoctorTool(configDir, packageInfo, getRegistrationReport)
});
