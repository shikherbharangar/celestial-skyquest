// Source deployment through Vercel's API. Credentials are never logged or copied into uploads.
import { existsSync } from 'node:fs';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { build } from 'esbuild';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error(
    'Set VERCEL_TOKEN securely in environment settings or .env.local, then run npm run deploy.',
  );
  process.exit(1);
}
const team = process.env.VERCEL_TEAM_ID;
const projectName = 'celestial-skyquest';
const query = team ? `?teamId=${encodeURIComponent(team)}` : '';
async function api(path, method = 'GET', body, allowMissing = false) {
  const response = await fetch(`https://api.vercel.com${path}${query}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok)
    throw new Error(
      `Vercel ${method} ${path} returned HTTP ${response.status}. Check token scope, team access, and account limits.`,
    );
  return response.json();
}
async function sourceFiles() {
  const root = process.cwd();
  const files = [];
  const allowed = [
    'src',
    'public',
    'api',
    'server',
    'scripts/dev.mjs',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'vercel.json',
    '.gitignore',
    '.vercelignore',
    'index.html',
  ];
  async function collect(path) {
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error('Deployment does not follow symlinks.');
    if (stat.isDirectory()) {
      for (const item of await readdir(path)) await collect(join(path, item));
      return;
    }
    const file = relative(root, path).replaceAll('\\', '/');
    if (/^api\/.*\.ts$/.test(file)) {
      const result = await build({
        entryPoints: [path],
        bundle: true,
        platform: 'node',
        format: 'esm',
        target: 'node24',
        write: false,
      });
      files.push({
        file: file.replace(/\.ts$/, '.js'),
        data: Buffer.from(result.outputFiles[0].contents).toString('base64'),
        encoding: 'base64',
      });
      return;
    }
    if (
      file
        .split('/')
        .some((part) => part.startsWith('.env') || ['.git', 'node_modules'].includes(part))
    )
      throw new Error('A private file was excluded from deployment.');
    files.push({ file, data: (await readFile(path)).toString('base64'), encoding: 'base64' });
  }
  for (const path of allowed) await collect(resolve(root, path));
  return files;
}
async function deploy() {
  let project = await api(`/v9/projects/${projectName}`, 'GET', undefined, true);
  if (!project)
    project = await api('/v11/projects', 'POST', {
      name: projectName,
      framework: 'vite',
      nodeVersion: '24.x',
    });
  console.log(`Vercel project: ${projectName}`);
  const settings = await api(`/v10/projects/${encodeURIComponent(project.id)}/env`);
  const configured = settings.envs?.some(
    (item) =>
      item.key === 'GEMMA_API_KEY' &&
      Array.isArray(item.target) &&
      item.target.includes('production'),
  );
  if (!configured)
    throw new Error(
      `Project ${projectName} is prepared. In its Vercel Settings > Environment Variables, add GEMMA_API_KEY for Production, then rerun npm run deploy. Cloud proxy credentials are not copied into Vercel.`,
    );
  const files = await sourceFiles();
  console.log(`Uploading ${files.length} source files. No .env files or credentials are included.`);
  const deployment = await api('/v13/deployments', 'POST', {
    name: projectName,
    project: project.id,
    target: 'production',
    files,
    projectSettings: { framework: 'vite', buildCommand: 'npm run build', outputDirectory: 'dist' },
  });
  const id = deployment.id ?? deployment.uid;
  if (!id)
    throw new Error(
      'Vercel did not return a deployment ID. No successful deployment is being claimed.',
    );
  let previous = '';
  for (let attempt = 0; attempt < 180; attempt++) {
    const current = await api(`/v13/deployments/${encodeURIComponent(id)}`);
    if (current.readyState !== previous) {
      previous = current.readyState;
      console.log(`Deployment: ${previous}`);
    }
    if (current.readyState === 'READY') {
      const host =
        current.alias?.find((alias) => alias === `${projectName}.vercel.app`) ?? current.url;
      if (typeof host !== 'string' || !host.endsWith('.vercel.app') || /[\s/:]/.test(host))
        throw new Error('Vercel returned an unexpected deployment hostname.');
      const url = `https://${host}`;
      const health = await fetch(`${url}/api/config`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
      });
      if (!health.ok)
        throw new Error(
          `Deployment exists at ${url}, but its public API is not accessible (HTTP ${health.status}). Check Vercel deployment protection.`,
        );
      if (!health.headers.get('content-type')?.includes('application/json'))
        throw new Error(`Deployment exists at ${url}, but the API did not return JSON.`);
      const config = await health.json();
      if (!config.liveAvailable)
        throw new Error(
          `Deployment exists at ${url}, but GEMMA_API_KEY is unavailable to the function. Check Production environment settings.`,
        );
      console.log(`Public deployment: ${url}`);
      console.log(
        'Next: test an actual sky photo in Live Gemma mode; configuration availability alone does not establish identification accuracy.',
      );
      return;
    }
    if (['ERROR', 'CANCELED'].includes(current.readyState))
      throw new Error('Vercel could not finish the deployment. Inspect the project build logs.');
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  throw new Error('Vercel is still building. Check the project deployment status before retrying.');
}
deploy().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
