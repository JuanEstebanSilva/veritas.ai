import fs from 'fs';
import path from 'path';
import { CryptoVault } from '../src/utils/cryptoVault';

const args = process.argv.slice(2);
const command = args[0];

const SENSITIVE_VARS = [
  'SERPER_API_KEY',
  'GOOGLE_SEARCH_API_KEY',
  'GOOGLE_SEARCH_CX',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'TAVILY_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'API_KEY_POSTMAN',
  'API_KEY_WEB',
  'API_KEY_MOVIL',
  'AI_API_KEY'
];

function printHelp() {
  console.log(`
===========================================================
🔐 Veritas AI — CryptoVault CLI de Ciberseguridad
===========================================================
Uso:
  npx ts-node scripts/vaultCli.ts encrypt "<secreto>"
  npx ts-node scripts/vaultCli.ts decrypt "<enc:...>"
  npx ts-node scripts/vaultCli.ts secure-env
  npx ts-node scripts/vaultCli.ts check-env

Descripción:
  encrypt     Cifra una clave o secreto a formato AES-256-GCM.
  decrypt     Descifra una clave cifrada en formato enc:...
  secure-env  Escanea el archivo .env y cifra todas las API keys sensibles in-place.
  check-env   Verifica el estado de cifrado de las variables en .env sin mostrar las claves.
===========================================================
`);
}

function encryptSingle(val: string) {
  if (!val) {
    console.error('Debes proporcionar el secreto a cifrar.');
    process.exit(1);
  }
  const encrypted = CryptoVault.encrypt(val);
  console.log('\n🔒 Secreto Cifrado (AES-256-GCM):');
  console.log(encrypted);
  console.log('\nPuedes pegar este valor directamente en tu archivo .env.\n');
}

function decryptSingle(val: string) {
  if (!val) {
    console.error('Debes proporcionar el texto cifrado enc:...');
    process.exit(1);
  }
  const decrypted = CryptoVault.decrypt(val);
  console.log('\n🔓 Secreto Descifrado:');
  console.log(decrypted);
  console.log('\n');
}

function getEnvPath(): string {
  const backendEnv = path.resolve(__dirname, '../.env');
  if (fs.existsSync(backendEnv)) return backendEnv;
  const rootEnv = path.resolve(__dirname, '../../.env');
  return rootEnv;
}

function secureEnvFile() {
  const envPath = getEnvPath();
  if (!fs.existsSync(envPath)) {
    console.error('No se encontró el archivo .env en:', envPath);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  let modifiedCount = 0;

  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) return line;

    const varName = line.substring(0, eqIdx).trim();
    let rawVal = line.substring(eqIdx + 1).trim();

    // Eliminar comillas externas si existen
    if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
      rawVal = rawVal.substring(1, rawVal.length - 1);
    }

    if (SENSITIVE_VARS.includes(varName)) {
      if (rawVal.length > 0 && !rawVal.startsWith('enc:')) {
        const encrypted = CryptoVault.encrypt(rawVal);
        modifiedCount++;
        console.log(`  🔒 Cifrando ${varName}: [${CryptoVault.mask(rawVal)}] -> [PROTEGIDO]`);
        return `${varName}="${encrypted}"`;
      }
    }

    return line;
  });

  if (modifiedCount > 0) {
    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
    console.log(`\n✓ ¡Éxito! Se cifraron ${modifiedCount} secretos en el archivo .env.`);
    console.log('Ahora tus API keys están completamente encriptadas con AES-256-GCM.\n');
  } else {
    console.log('\n✓ Todas las API keys y secretos sensibles ya se encontraban cifrados o vacíos.\n');
  }
}

function checkEnvFile() {
  const envPath = getEnvPath();
  if (!fs.existsSync(envPath)) {
    console.error('No se encontró el archivo .env en:', envPath);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');

  console.log('\n📋 Auditoría de Variables de Entorno Sensibles:');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const varName = line.substring(0, eqIdx).trim();
    let rawVal = line.substring(eqIdx + 1).trim();

    if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
      rawVal = rawVal.substring(1, rawVal.length - 1);
    }

    if (SENSITIVE_VARS.includes(varName)) {
      const status = !rawVal
        ? '⚪ Vacía'
        : rawVal.startsWith('enc:')
        ? '🟢 Cifrada (AES-256-GCM)'
        : '🔴 Texto Plano (Vulnerable)';
      console.log(`  ${varName.padEnd(25)} -> ${status}`);
    }
  }
  console.log('');
}

switch (command) {
  case 'encrypt':
    encryptSingle(args[1]);
    break;
  case 'decrypt':
    decryptSingle(args[1]);
    break;
  case 'secure-env':
    secureEnvFile();
    break;
  case 'check-env':
    checkEnvFile();
    break;
  default:
    printHelp();
    break;
}
