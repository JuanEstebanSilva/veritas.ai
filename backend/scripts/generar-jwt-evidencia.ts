import { generarToken, verificarToken } from '../src/utils/jwt.util';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const tokenAdmin = generarToken({
  id: '1',
  email: 'admin@veritas.ai',
  rol: 'administrador'
});

const tokenEstudiante = generarToken({
  id: '2',
  email: 'estudiante@veritas.ai',
  rol: 'estudiante'
});

console.log('======================================================================');
console.log('🔑 VERITAS AI — TOKEN JWT GENERADO PARA ADMINISTRADOR:');
console.log('======================================================================');
console.log(tokenAdmin);
console.log('\n📋 DECODIFICACIÓN CRIPTOGRÁFICA DEL TOKEN ADMIN:');
console.log(JSON.stringify(verificarToken(tokenAdmin), null, 2));

console.log('\n======================================================================');
console.log('🔑 VERITAS AI — TOKEN JWT GENERADO PARA ESTUDIANTE:');
console.log('======================================================================');
console.log(tokenEstudiante);
console.log('\n📋 DECODIFICACIÓN CRIPTOGRÁFICA DEL TOKEN ESTUDIANTE:');
console.log(JSON.stringify(verificarToken(tokenEstudiante), null, 2));
console.log('======================================================================');
