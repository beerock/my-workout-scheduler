// Hook: Auto-lint TypeScript/JavaScript files after edit
// Used by: PostToolUse hook in .claude/settings.json
const { execFileSync } = require('child_process');

let data = '';
process.stdin.on('data', (chunk) => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input || {}).file_path || '';

    // Only lint TS/JS/TSX/JSX files
    if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return;

    execFileSync('npx', ['next', 'lint', '--file', filePath, '--quiet'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    });
  } catch (e) {
    // If lint finds issues, output them but don't block (exit 0)
    if (e.stderr) process.stderr.write(e.stderr);
    if (e.stdout) process.stdout.write(e.stdout);
  }
});
