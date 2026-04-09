const fs = require('fs');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const util = require('util');

const dbPath = 'datos.db';

const csvFiles = [
  { table: 'tc_codigo_actividad', file: 'conjunto_de_datos_ce_nac_2024_csv/catalogos/tc_codigo_actividad.csv' },
  { table: 'tc_entidad_municipio', file: 'conjunto_de_datos_ce_nac_2024_csv/catalogos/tc_entidad_municipio.csv' },
  { table: 'tc_estrato_ce2024', file: 'conjunto_de_datos_ce_nac_2024_csv/catalogos/tc_estrato_ce2024.csv' },
  { table: 'conjunto_de_datos', file: 'conjunto_de_datos_ce_nac_2024_csv/conjunto_de_datos/tr_ce_nac_2024.csv' },
];

console.log('Iniciando proceso de carga...');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Base de datos anterior eliminada, creando una nueva...');
}

const db = new sqlite3.Database(dbPath);

// Promisificamos el método general db.run
const dbRunAsync = util.promisify(db.run).bind(db);

async function loadCSV(table, filepath) {
  if (!fs.existsSync(filepath)) {
    console.warn(`\n[Advertencia] Archivo no encontrado: ${filepath}. Se omite esta tabla.`);
    return;
  }

  console.log(`\nCargando archivo en RAM: ${table} ...`);
  const allRows = [];
  let headersLength = 0;
  let headersNames = [];
  let isHeaderParsed = false;

  // Tubo (pipe) del stream de lectura hacia el parseador CSV
  const stream = fs.createReadStream(filepath).pipe(csv());

  // Usamos un bucle for-await-of para iterar de manera 100% asíncrona sobre el stream (sin callbacks locales de evento)
  for await (const data of stream) {
    if (!isHeaderParsed) {
      // Tomamos las llaves del primer registro como nuestros nombres de columnas
      headersNames = Object.keys(data);
      headersLength = headersNames.length;
      isHeaderParsed = true;
    }
    const rowValues = headersNames.map(h => data[h] === '' ? null : data[h]);
    allRows.push(rowValues);
  }

  // Preparamos los nombres de las columnas para SQLite escapados en string ("Nombre")
  const tableColumns = headersNames.map(h => `"${h.trim()}" TEXT`);
  const colsString = tableColumns.join(', ');

  // Ejecutamos creacion de DB usando await en nuestro envoltorio Promisified
  await dbRunAsync(`CREATE TABLE IF NOT EXISTS ${table} (${colsString});`);

  if (allRows.length === 0) {
    console.log(`✓ Carga de la tabla ${table} completada con 0 registros.`);
    return;
  }

  await dbRunAsync("BEGIN TRANSACTION");

  const placeholders = Array(headersLength).fill('?').join(', ');
  const stmt = db.prepare(`INSERT INTO ${table} VALUES (${placeholders})`);
  
  // Pequeña flecha para envolver stmt.run que asegura mejor soporte que util.promisify aquí
  const runStmtAsync = (params) => new Promise((res, rej) => stmt.run(params, err => err ? rej(err) : res()));

  for (const row of allRows) {
    const paddedRow = row;
    while (paddedRow.length < headersLength) {
      paddedRow.push(null);
    }
    await runStmtAsync(paddedRow.slice(0, headersLength));
  }

  stmt.finalize();
  await dbRunAsync("COMMIT");

  console.log(`✓ Carga de la tabla ${table} completada con ${allRows.length} registros.`);
}

async function processAll() {
  for (const item of csvFiles) {
    try {
      // Uso constante de await en todo nuestro loop
      await loadCSV(item.table, item.file);
    } catch (e) {
      console.log(`No se pudo procesar ${item.file}: ${e.message}`);
      await dbRunAsync("ROLLBACK").catch(() => null);
    }
  }
  console.log('\nToda la informacion (datos y catálogos) se ha cargado correctamente en datos.db');
  db.close();
}

// Inicialización asincrónica principal
processAll();
