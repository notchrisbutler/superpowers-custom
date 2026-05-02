/**
 * SuperDuperPowers plugin for OpenCode.ai
 *
 * Injects SuperDuperPowers bootstrap context via user-message transform.
 * Auto-registers skills and reviewer agents, and exposes workflow tools.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { createSdpTools, getRuntimePaths, profileSummaryText } from './superduperpowers/sdp-tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    tool: createSdpTools({ configDir }),

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
