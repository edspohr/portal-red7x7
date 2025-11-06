import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..');

[path.resolve(projectRoot, '.env'), path.resolve(repoRoot, '.env')].forEach((envPath) => {
  dotenv.config({ path: envPath, override: false });
});

const args = process.argv.slice(2);

const getArgValue = (flag) => {
  const exactIndex = args.indexOf(flag);
  if (exactIndex !== -1 && args[exactIndex + 1] && !args[exactIndex + 1].startsWith('--')) {
    return args[exactIndex + 1];
  }
  const prefixed = args.find((value) => value.startsWith(`${flag}=`));
  if (prefixed) {
    return prefixed.split('=')[1];
  }
  return undefined;
};

const databaseUrl = getArgValue('--url') || process.env.DATABASE_URL;
const shouldSeed = args.includes('--seed');
const skipMigrate = args.includes('--skip-migrate');

if (!databaseUrl) {
  console.error('❌  No se encontró DATABASE_URL. Proporciona la cadena con --url o en backend/.env');
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;

const runCommand = (command, commandArgs, options = {}) =>
  new Promise((resolve, reject) => {
    const subprocess = spawn(command, commandArgs, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    subprocess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`El comando "${command} ${commandArgs.join(' ')}" salió con código ${code}`));
        return;
      }
      resolve();
    });
  });

const run = async () => {
  console.log('🔧 Preparando base de datos para Red7x7...');
  if (!skipMigrate) {
    console.log('➡️  Ejecutando migraciones');
    await runCommand('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: projectRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  } else {
    console.log('⏭️  Se omitió migrate deploy por --skip-migrate');
  }

  if (shouldSeed) {
    console.log('🌱 Sembrando datos de ejemplo');
    await runCommand('npm', ['run', 'prisma:seed', '--silent'], {
      cwd: projectRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  }

  console.log('✅ Base de datos lista.');
};

run().catch((error) => {
  console.error('❌  Hubo un problema preparando la base de datos');
  console.error(error.message);
  process.exit(1);
});
