// Hook: Block edits to .env files
// Used by: PreToolUse hook in .claude/settings.json
let data = '';
process.stdin.on('data', (chunk) => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input || {}).file_path || '';
    if (/\.env/.test(filePath)) {
      process.stderr.write('BLOCKED: .env files must not be edited by Claude\n');
      process.exit(2);
    }
  } catch (e) {
    // If we can't parse input, allow the operation
  }
});
