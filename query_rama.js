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
    TRIM(d.RAMA) AS RAMA,
    c3.DESC_CODIGO AS NOMBRE_RAMA,
    -- Agrupamos y sumamos las unidades y el personal
    SUM(CAST(d.UE AS INTEGER)) AS ESTABLECIMIENTOS,
    SUM(CAST(d.H001A AS INTEGER)) AS PERSONAL_OCUPADO,
    
    -- 1. TASA DE EXPLOTACIÓN (Basada en los totales sumados de la rama)
    ROUND(((SUM(CAST(d.A131A AS REAL)) - SUM(CAST(d.J000A AS REAL))) / 
          NULLIF(SUM(CAST(d.J000A AS REAL)), 0)) * 100, 2) || '%' AS TASA_EXPLOTACION,

    -- 2. TASA DE GANANCIA NETA
    ROUND(((SUM(CAST(d.A131A AS REAL)) - SUM(CAST(d.J000A AS REAL)) - SUM(CAST(d.Q000B AS REAL))) / 
          NULLIF(SUM(CAST(d.Q000A AS REAL)) + SUM(CAST(d.J000A AS REAL)), 0)) * 100, 2) || '%' AS TASA_GANANCIA_NETA,

    -- 3. DIVISIÓN DE LA JORNADA DE 8 HORAS
    ROUND((SUM(CAST(d.J000A AS REAL)) / NULLIF(SUM(CAST(d.A131A AS REAL)), 0)) * 8, 2) AS HRS_PARA_SALARIO,
    ROUND((SUM(CAST(d.Q000B AS REAL)) / NULLIF(SUM(CAST(d.A131A AS REAL)), 0)) * 8, 2) AS HRS_PARA_INFRAESTRUCTURA,
    ROUND(((SUM(CAST(d.A131A AS REAL)) - SUM(CAST(d.J000A AS REAL)) - SUM(CAST(d.Q000B AS REAL))) / 
          NULLIF(SUM(CAST(d.A131A AS REAL)), 0)) * 8, 2) AS HRS_PLUSVALIA_NETA,

    -- 4. TOTALES EN MDP
    ROUND(SUM(CAST(d.Q000B AS REAL)), 2) AS COSTO_INFRAESTRUCTURA_MDP,
    ROUND(SUM(CAST(d.A131A AS REAL)) - SUM(CAST(d.J000A AS REAL)) - SUM(CAST(d.Q000B AS REAL)), 2) AS PLUSVALIA_NETA_MDP

FROM conjunto_de_datos d
LEFT JOIN tc_codigo_actividad c1 ON TRIM(d.SECTOR) = TRIM(c1.CODIGO)
LEFT JOIN tc_codigo_actividad c3 ON TRIM(d.RAMA) = TRIM(c3.CODIGO)
WHERE d.RAMA IS NOT NULL 
  AND d.CLASE IS NOT NULL -- Aquí incluimos las clases para que el SUM() recoja todo el valor de la rama
  AND d.ID_ESTRATO IS NOT NULL -- Sumamos todos los estratos para tener el total real de la rama
GROUP BY d.RAMA -- <--- ESTA ES LA CLAVE: Un solo renglón por rama
ORDER BY ESTABLECIMIENTOS DESC;
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
