import { execSync } from 'child_process';

try {
  console.log('Running npm install to sync package-lock.json...');
  const output = execSync('npm install --package-lock-only', {
    cwd: '/vercel/share/v0-project',
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(output);
  console.log('package-lock.json has been updated successfully.');
} catch (error) {
  console.error('Error:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout);
  if (error.stderr) console.log('stderr:', error.stderr);
}
