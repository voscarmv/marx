const sqlite3 = require('sqlite3').verbose();
const util = require('util');

const dbPath = './datos.db';

async function createSchema() {
  const db = new sqlite3.Database(dbPath);
  const dbRunAsync = util.promisify(db.run).bind(db);

  const schemas = [
    `CREATE TABLE IF NOT EXISTS tc_codigo_actividad (
      "CODIGO" TEXT, 
      "DESC_CODIGO" TEXT, 
      "CLASIFICADOR_CODIGO" TEXT, 
      "" TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS tc_entidad_municipio (
      "CVEGEO" TEXT, 
      "E03" TEXT, 
      "NOM_ENT" TEXT, 
      "NOM_ABR" TEXT, 
      "E04" TEXT, 
      "NOM_MUN" TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS tc_estrato_ce2024 (
      "ID_ESTRATO" TEXT, 
      "DESC_ESTRATO" TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS conjunto_de_datos (
      "E03" TEXT, "E04" TEXT, "SECTOR" TEXT, "SUBSECTOR" TEXT, "RAMA" TEXT, "SUBRAMA" TEXT, "CLASE" TEXT, 
      "ID_ESTRATO" TEXT, "CODIGO" TEXT, "UE" TEXT, "H001A" TEXT, "H000A" TEXT, "H010A" TEXT, "H020A" TEXT, 
      "I000A" TEXT, "J000A" TEXT, "K000A" TEXT, "M000A" TEXT, "A111A" TEXT, "A121A" TEXT, "A131A" TEXT, 
      "A211A" TEXT, "A221A" TEXT, "P000C" TEXT, "Q000A" TEXT, "Q000B" TEXT, "A700A" TEXT, "A800A" TEXT, 
      "Q000C" TEXT, "Q000D" TEXT, "P000A" TEXT, "P000B" TEXT, "O010A" TEXT, "O020A" TEXT, "M700A" TEXT, 
      "P030C" TEXT, "A511A" TEXT, "M020A" TEXT, "M050A" TEXT, "M091A" TEXT, "H001B" TEXT, "H001C" TEXT, 
      "H001D" TEXT, "H000B" TEXT, "H000C" TEXT, "H000D" TEXT, "H010B" TEXT, "H010C" TEXT, "H010D" TEXT, 
      "H101A" TEXT, "H101B" TEXT, "H101C" TEXT, "H101D" TEXT, "H203A" TEXT, "H203B" TEXT, "H203C" TEXT, 
      "H203D" TEXT, "H020B" TEXT, "H020C" TEXT, "H020D" TEXT, "I000B" TEXT, "I000C" TEXT, "I000D" TEXT, 
      "I100A" TEXT, "I100B" TEXT, "I100C" TEXT, "I100D" TEXT, "I200A" TEXT, "I200B" TEXT, "I200C" TEXT, 
      "I200D" TEXT, "J010A" TEXT, "J203A" TEXT, "J300A" TEXT, "J400A" TEXT, "J500A" TEXT, "J600A" TEXT, 
      "K010A" TEXT, "K020A" TEXT, "K030A" TEXT, "K311A" TEXT, "K042A" TEXT, "K412A" TEXT, "K050A" TEXT, 
      "K610A" TEXT, "K620A" TEXT, "K060A" TEXT, "K070A" TEXT, "K810A" TEXT, "K820A" TEXT, "K910A" TEXT, 
      "K950A" TEXT, "K096A" TEXT, "K976A" TEXT, "K090A" TEXT, "M010A" TEXT, "M030A" TEXT, "M090A" TEXT, 
      "P100A" TEXT, "P100B" TEXT, "P030A" TEXT, "P030B" TEXT, "Q010A" TEXT, "Q020A" TEXT, "Q030A" TEXT, 
      "Q400A" TEXT, "Q900A" TEXT
    );`
  ];

  console.log('Creando estructura de tablas en la base de datos...');

  for (const query of schemas) {
    try {
      await dbRunAsync(query);
      console.log('✓ Tabla validada / creada con éxito.');
    } catch (err) {
      console.error('Error creando tabla:', err.message);
    }
  }

  console.log('El esquema de datos quedó configurado al 100%.');
  db.close();
}

createSchema();
