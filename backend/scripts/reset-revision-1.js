const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { consultar, pool } = require('../src/config/database');

async function main() {
  const res = await consultar("UPDATE revisiones SET estado = 'programada' WHERE id = 1");
  console.log('✅ Revisión 1 reseteada a estado programada. Filas afectadas:', res.rowCount);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
});
