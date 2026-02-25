// Hook: Warn when editing files on main branch
// Used by: PostToolUse hook in .claude/settings.json
const { execFileSync } = require('child_process');
let data = '';
process.stdin.on('data', (chunk) => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
    if (branch === 'main') {
      process.stdout.write('WARNING: You are editing files on main branch!\n');
    }
  } catch (e) {
    // If git fails, allow silently
  }
});
