import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// List cwd contents and locate any .git
console.log('Current CWD:', process.cwd());
console.log('Files in CWD:', fs.readdirSync(process.cwd()));

// See if we have a parent git directory or any other folders
try {
  console.log('Parent files:', fs.readdirSync('..'));
} catch (e) {}

// Let's inspect git log from the cloned repo to see what commits it has!
const tempDir = path.join(process.cwd(), 'temp-repo-check');
try {
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, {recursive: true, force: true});
  execSync('git clone --bare https://github.com/FahadIbrahim93/BugSmasher-HopeTheory temp-repo-check', {stdio: 'ignore'});
  console.log('Commits in FahadIbrahim93/BugSmasher-HopeTheory:');
  const log = execSync('git --git-dir=temp-repo-check log -n 30 --oneline').toString();
  console.log(log);
} catch (e: any) {
  console.error('Error listing commits:', e.message);
} finally {
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, {recursive: true, force: true});
}
