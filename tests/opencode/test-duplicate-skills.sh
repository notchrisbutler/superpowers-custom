#!/usr/bin/env bash
# Test: Duplicate Native Skill Behavior
# Verifies that bundled skills are available alongside personal/project skills.
# NOTE: These tests require OpenCode to be installed and configured
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Duplicate Native Skill Behavior ==="

run_with_optional_timeout() {
    if command -v timeout &> /dev/null; then
        timeout 60s "$@"
    elif command -v gtimeout &> /dev/null; then
        gtimeout 60s "$@"
    else
        "$@"
    fi
}

output_matches() {
    grep -qi "$1" <<< "$output"
}

print_matching_output() {
    grep -i "$1" <<< "$output" | sed -n '1,10p' || true
}

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Create the same skill "duplicate-test" in all three locations with different markers.
echo "Setting up duplicate skill test fixtures..."

# 1. Create in superpowers location
mkdir -p "$SUPERPOWERS_SKILLS_DIR/duplicate-test"
cat > "$SUPERPOWERS_SKILLS_DIR/duplicate-test/SKILL.md" <<'EOF'
---
name: duplicate-test
description: Superpowers version of duplicate test skill
---
# Duplicate Test Skill (Superpowers Version)

This is the SUPERPOWERS version of the duplicate test skill.

DUPLICATE_MARKER_SUPERPOWERS_VERSION
EOF

# 2. Create in personal location
mkdir -p "$OPENCODE_CONFIG_DIR/skills/duplicate-test"
cat > "$OPENCODE_CONFIG_DIR/skills/duplicate-test/SKILL.md" <<'EOF'
---
name: duplicate-test
description: Personal version of duplicate test skill
---
# Duplicate Test Skill (Personal Version)

This is the PERSONAL version of the duplicate test skill.

DUPLICATE_MARKER_PERSONAL_VERSION
EOF

# 3. Create in project location
mkdir -p "$TEST_HOME/test-project/.opencode/skills/duplicate-test"
cat > "$TEST_HOME/test-project/.opencode/skills/duplicate-test/SKILL.md" <<'EOF'
---
name: duplicate-test
description: Project version of duplicate test skill
---
# Duplicate Test Skill (Project Version)

This is the PROJECT version of the duplicate test skill.

DUPLICATE_MARKER_PROJECT_VERSION
EOF

echo "  Created duplicate-test skill in all three locations"

# Test 1: Verify fixture setup
echo ""
echo "Test 1: Verifying test fixtures..."

if [ -f "$SUPERPOWERS_SKILLS_DIR/duplicate-test/SKILL.md" ]; then
    echo "  [PASS] Superpowers version exists"
else
    echo "  [FAIL] Superpowers version missing"
    exit 1
fi

if [ -f "$OPENCODE_CONFIG_DIR/skills/duplicate-test/SKILL.md" ]; then
    echo "  [PASS] Personal version exists"
else
    echo "  [FAIL] Personal version missing"
    exit 1
fi

if [ -f "$TEST_HOME/test-project/.opencode/skills/duplicate-test/SKILL.md" ]; then
    echo "  [PASS] Project version exists"
else
    echo "  [FAIL] Project version missing"
    exit 1
fi

# Check if opencode is available for integration tests
if ! command -v opencode &> /dev/null; then
    echo ""
    echo "  [SKIP] OpenCode not installed - skipping integration tests"
    echo "  To run these tests, install OpenCode: https://opencode.ai"
    echo ""
    echo "=== Duplicate skill fixture tests passed (integration tests skipped) ==="
    exit 0
fi

# Test 2: Test that bundled skills are available through native skill paths
echo ""
echo "Test 2: Testing bundled skill availability..."
echo "  Running from outside project directory..."

# Run from HOME (not in project). OpenCode's native skill resolver owns
# precedence; this plugin's contract is to make bundled skills discoverable.
cd "$HOME"
output=$(run_with_optional_timeout opencode run "Use the skill tool to load the duplicate-test skill. Show me the exact content including any DUPLICATE_MARKER text." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [FAIL] OpenCode returned non-zero exit code: $exit_code"
    exit 1
}

if output_matches "DUPLICATE_MARKER_PERSONAL_VERSION"; then
    echo "  [PASS] native skill resolver loaded personal duplicate-test skill"
elif output_matches "DUPLICATE_MARKER_SUPERPOWERS_VERSION"; then
    echo "  [PASS] native skill resolver loaded bundled duplicate-test skill"
else
    echo "  [FAIL] Could not verify duplicate marker in output"
    echo "  Output snippet:"
    print_matching_output "duplicate\|personal\|superpowers"
    exit 1
fi

# Test 3: Test project context behavior with duplicate native skills
echo ""
echo "Test 3: Testing project duplicate skill context..."
echo "  Running from project directory..."

# Run from project directory. OpenCode's native skill resolver controls duplicate
# resolution; the plugin should not break project-context skill loading.
cd "$TEST_HOME/test-project"
output=$(run_with_optional_timeout opencode run "Use the skill tool to load the duplicate-test skill. Show me the exact content including any DUPLICATE_MARKER text." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [FAIL] OpenCode returned non-zero exit code: $exit_code"
    exit 1
}

if output_matches "DUPLICATE_MARKER_PROJECT_VERSION"; then
    echo "  [PASS] native skill resolver loaded project duplicate-test skill"
elif output_matches "DUPLICATE_MARKER_PERSONAL_VERSION"; then
    echo "  [PASS] native skill resolver loaded personal duplicate-test skill"
elif output_matches "DUPLICATE_MARKER_SUPERPOWERS_VERSION"; then
    echo "  [PASS] native skill resolver loaded bundled duplicate-test skill"
else
    echo "  [FAIL] Could not verify duplicate marker in output"
    echo "  Output snippet:"
    print_matching_output "duplicate\|project\|personal"
    exit 1
fi

# Test 4: Test project context from outside project
echo ""
echo "Test 4: Testing project context outside project..."

cd "$HOME"  # Run from outside project context
output=$(run_with_optional_timeout opencode run "Use the skill tool to load duplicate-test and show me the exact content." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
        echo "  [FAIL] OpenCode timed out after 60s"
        exit 1
    fi
    echo "  [FAIL] OpenCode returned non-zero exit code: $exit_code"
    exit 1
}

if output_matches "DUPLICATE_MARKER_PERSONAL_VERSION\|DUPLICATE_MARKER_SUPERPOWERS_VERSION"; then
    echo "  [PASS] outside project context loads non-project duplicate-test skill"
elif output_matches "DUPLICATE_MARKER_PROJECT_VERSION"; then
    echo "  [FAIL] outside project context loaded project duplicate-test skill"
    exit 1
else
    echo "  [FAIL] outside project context behavior could not be verified from output"
    exit 1
fi

echo ""
echo "=== All duplicate skill tests passed ==="
