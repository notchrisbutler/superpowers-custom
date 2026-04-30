#!/usr/bin/env bash
# Test: Plugin Loading
# Verifies that the superpowers plugin loads correctly in OpenCode
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Plugin Loading ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

plugin_link="$OPENCODE_CONFIG_DIR/plugins/superpowers.js"

# Test 1: Verify plugin file exists and is registered
echo "Test 1: Checking plugin registration..."
if [ -L "$plugin_link" ]; then
    echo "  [PASS] Plugin symlink exists"
else
    echo "  [FAIL] Plugin symlink not found at $plugin_link"
    exit 1
fi

# Verify symlink target exists
if [ -f "$(readlink -f "$plugin_link")" ]; then
    echo "  [PASS] Plugin symlink target exists"
else
    echo "  [FAIL] Plugin symlink target does not exist"
    exit 1
fi

# Test 2: Verify skills directory is populated
echo "Test 2: Checking skills directory..."
skill_count=$(find "$SUPERPOWERS_SKILLS_DIR" -name "SKILL.md" | wc -l)
if [ "$skill_count" -gt 0 ]; then
    echo "  [PASS] Found $skill_count skills"
else
    echo "  [FAIL] No skills found in $SUPERPOWERS_SKILLS_DIR"
    exit 1
fi

# Test 3: Check using-superpowers skill exists (critical for bootstrap)
echo "Test 3: Checking using-superpowers skill (required for bootstrap)..."
if [ -f "$SUPERPOWERS_SKILLS_DIR/using-superpowers/SKILL.md" ]; then
    echo "  [PASS] using-superpowers skill exists"
else
    echo "  [FAIL] using-superpowers skill not found (required for bootstrap)"
    exit 1
fi

# Test 4: Verify plugin JavaScript syntax (basic check)
echo "Test 4: Checking plugin JavaScript syntax..."
if node --check "$SUPERPOWERS_PLUGIN_FILE" 2>/dev/null; then
    echo "  [PASS] Plugin JavaScript syntax is valid"
else
    echo "  [FAIL] Plugin has JavaScript syntax errors"
    exit 1
fi

# Test 5: Verify bundled reviewer agents are installed
echo "Test 5: Checking bundled reviewer agents..."
for agent in code-reviewer spec-reviewer lite-code-reviewer lite-spec-reviewer; do
    if [ ! -f "$SUPERPOWERS_DIR/agents/$agent.md" ]; then
        echo "  [FAIL] Missing bundled agent: $agent"
        exit 1
    fi
done
echo "  [PASS] Bundled reviewer agents exist"

# Test 6: Verify plugin registers named reviewer agents in OpenCode config
echo "Test 6: Checking named reviewer agent registration..."
agent_output=$(node --input-type=module <<'NODE'
const { SuperpowersPlugin } = await import(process.env.SUPERPOWERS_PLUGIN_FILE);

const hooks = await SuperpowersPlugin({});
const config = {};
await hooks.config(config);

for (const name of ['code-reviewer', 'spec-reviewer', 'lite-code-reviewer', 'lite-spec-reviewer']) {
  const agent = config.agent?.[name];
  if (!agent) throw new Error(`missing ${name}`);
  if (agent.mode !== 'subagent') throw new Error(`${name} is not a subagent`);
  if (!agent.description) throw new Error(`${name} is missing description`);
  if (!agent.prompt) throw new Error(`${name} is missing prompt`);
  if (agent.permission?.edit !== 'deny') throw new Error(`${name} can edit files`);
}

console.log(Object.keys(config.agent).sort().join('\n'));
NODE
) || {
    echo "  [FAIL] Plugin did not register named reviewer agents"
    exit 1
}
if echo "$agent_output" | grep -q "code-reviewer" && echo "$agent_output" | grep -q "spec-reviewer"; then
    echo "  [PASS] Named reviewer agents registered"
else
    echo "  [FAIL] Expected reviewer agents not found in config"
    exit 1
fi

# Test 7: Verify bootstrap text does not reference a hardcoded skills path
echo "Test 7: Checking bootstrap does not advertise a wrong skills path..."
if grep -q 'configDir}/skills/superpowers/' "$SUPERPOWERS_PLUGIN_FILE"; then
    echo "  [FAIL] Plugin still references old configDir skills path"
    exit 1
else
    echo "  [PASS] Plugin does not advertise a misleading skills path"
fi

# Test 8: Verify personal test skill was created
echo "Test 8: Checking test fixtures..."
if [ -f "$OPENCODE_CONFIG_DIR/skills/personal-test/SKILL.md" ]; then
    echo "  [PASS] Personal test skill fixture created"
else
    echo "  [FAIL] Personal test skill fixture not found"
    exit 1
fi

echo ""
echo "=== All plugin loading tests passed ==="
