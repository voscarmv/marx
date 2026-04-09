const sqlite3 = require('sqlite3').verbose();
const util = require('util');

const dbPath = 'datos.db';

async function runQuery() {
  // Inicializamos la conexión a la base de datos
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

  // Promisificamos el método all() para usar async/await, y atamos el contexto al db
  const dbAllAsync = util.promisify(db.all).bind(db);

  // ================================================================================
  // EDITA TU QUERY RAW AQUÍ
  // ================================================================================
  const miQueryRaw = `
SELECT 
    TRIM(d.SECTOR) AS SECTOR,
    c1.DESC_CODIGO AS NOMBRE_SECTOR,
    TRIM(d.SUBSECTOR) AS SUBSECTOR,
    c2.DESC_CODIGO AS NOMBRE_SUBSECTOR,
    CAST(d.UE AS INTEGER) AS ESTABLECIMIENTOS,
    CAST(d.H001A AS INTEGER) AS PERSONAL_OCUPADO,
    
    -- 1. Tasa de explotación (s/v): Plusvalía Bruta entre Salarios
    ROUND(((CAST(d.A131A AS REAL) - CAST(d.J000A AS REAL)) / NULLIF(CAST(d.J000A AS REAL), 0)) * 100, 2) || '%' AS TASA_EXPLOTACION,

    -- 2. Tasa de ganancia [s_neta / (C + v)]: Plusvalía neta sobre inversión total
    ROUND(((CAST(d.A131A AS REAL) - CAST(d.J000A AS REAL) - CAST(d.Q000B AS REAL)) / 
          NULLIF(CAST(d.Q000A AS REAL) + CAST(d.J000A AS REAL), 0)) * 100, 2) || '%' AS TASA_GANANCIA_NETA,

    -- 3. DIVISIÓN DE LA JORNADA DE 8 HORAS
    -- Horas para cubrir su propio salario (Trabajo Necesario)
    ROUND((CAST(d.J000A AS REAL) / NULLIF(CAST(d.A131A AS REAL), 0)) * 8, 2) AS HRS_PARA_SALARIO,
    
    -- Horas para pagar infraestructura y costos operativos (Reposición de Capital Constante)
    ROUND((CAST(d.Q000B AS REAL) / NULLIF(CAST(d.A131A AS REAL), 0)) * 8, 2) AS HRS_PARA_INFRAESTRUCTURA,
    
    -- Horas que "salen sobrando" (Plusvalía Neta / Trabajo Excedente Puro)
    ROUND(((CAST(d.A131A AS REAL) - CAST(d.J000A AS REAL) - CAST(d.Q000B AS REAL)) / 
          NULLIF(CAST(d.A131A AS REAL), 0)) * 8, 2) AS HRS_PLUSVALIA_NETA,

    -- 4. COSTO OPERATIVO (Depreciación de activos en MDP)
    ROUND(CAST(d.Q000B AS REAL), 2) AS COSTO_INFRAESTRUCTURA_MDP,

    -- 5. PLUSVALÍA NETA DEDUCIDA (Lo que queda tras salarios y costos de capital)
    ROUND(CAST(d.A131A AS REAL) - CAST(d.J000A AS REAL) - CAST(d.Q000B AS REAL), 2) AS PLUSVALIA_NETA_MDP

FROM conjunto_de_datos d
LEFT JOIN tc_codigo_actividad c1 ON TRIM(d.SECTOR) = TRIM(c1.CODIGO)
LEFT JOIN tc_codigo_actividad c2 ON TRIM(d.SUBSECTOR) = TRIM(c2.CODIGO)
WHERE d.SUBSECTOR IS NOT NULL 
  AND d.RAMA IS NULL 
  AND d.ID_ESTRATO IS NULL
ORDER BY ESTABLECIMIENTOS DESC
  `;
  // ================================================================================

  //console.error(`\nEjecutando la siguiente consulta:\n${miQueryRaw}`);
  //console.error(`--------------------------------------------------`);

  try {
    // Usamos el poder de await para evitar los callbacks
    const rows = await dbAllAsync(miQueryRaw, []);

    if (rows.length === 0) {
      //console.error("La consulta no arrojó resultados.");
    } else {
      // Extraemos los encabezados dinámicamente de las llaves del primer registro
      const headers = Object.keys(rows[0]);

      // Imprimimos la fila de encabezados en stdout
      console.log(headers.join(','));

      // Imprimimos todos los registros
      rows.forEach(row => {
        const rowValues = headers.map(h => {
          let val = row[h];
          if (val === null || val === undefined) return '';
          val = String(val);
          // Escapar comillas dobles, saltos de línea o comas que existan en strings (ej. los nombres de sectores)
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = '"' + val.replace(/"/g, '""') + '"';
          }
          return val;
        });
        console.log(rowValues.join(','));
      });
    }
  } catch (err) {
    console.error("Error ejecutando la consulta:", err.message);
  } finally {
    db.close();
  }
}

// Ejecutamos la función asíncrona principal
runQuery();
