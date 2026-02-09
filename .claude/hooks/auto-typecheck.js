// Hook: Auto-typecheck TypeScript files after edit
// Used by: PostToolUse hook in .claude/settings.json
const { execFileSync } = require('child_process');

let data = '';
process.stdin.on('data', (chunk) => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input || {}).file_path || '';

    // Only typecheck TS/TSX files
    if (!/\.(ts|tsx)$/.test(filePath)) return;

    execFileSync('npx', ['tsc', '--noEmit', '--pretty'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    });
  } catch (e) {
    // If typecheck finds issues, output them but don't block (exit 0)
    if (e.stdout) process.stdout.write(e.stdout);
    if (e.stderr) process.stderr.write(e.stderr);
  }
});
