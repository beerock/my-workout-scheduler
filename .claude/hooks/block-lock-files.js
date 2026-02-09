// Hook: Block edits to lock files
// Used by: PreToolUse hook in .claude/settings.json
let data = '';
process.stdin.on('data', (chunk) => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input || {}).file_path || '';
    if (/package-lock\.json|yarn\.lock|pnpm-lock\.yaml/.test(filePath)) {
      process.stderr.write('BLOCKED: Lock files must not be edited directly - run npm install instead\n');
      process.exit(2);
    }
  } catch (e) {
    // If we can't parse input, allow the operation
  }
});
