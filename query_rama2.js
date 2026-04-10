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
    TRIM(d.RAMA) AS RAMA,
    c3.DESC_CODIGO AS NOMBRE_RAMA,
    SUM(CAST(d.UE AS INTEGER)) AS ESTABLECIMIENTOS,
    
    -- 1. CÁLCULO DE PLUSVALÍA NETA (Lo que queda tras pagar TODO)
    ROUND(SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL))), 2) AS PLUSVALIA_NETA_MDP,

    -- 2. DESGLOSE DE LA JORNADA DE 8 HORAS
    -- A. Horas para el trabajador (Salario)
    ROUND((SUM(CAST(d.J000A AS REAL)) / NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_SALARIO,
    
    -- B. Horas para mantener la empresa (Insumos, renta, luz - K000A)
    ROUND((SUM(CAST(d.K000A AS REAL)) / NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_OPERACION,
    
    -- C. Horas para el Estado y Bancos (Impuestos y Financieros - A700A menos K000A)
    ROUND(((SUM(CAST(d.A700A AS REAL)) - SUM(CAST(d.K000A AS REAL))) / 
          NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_IMPUESTOS_Y_FINANZAS,
    
    -- D. Horas de Plusvalía (Ganancia limpia para el dueño)
    ROUND(((SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL)))) / 
          NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_PLUSVALIA_PURA,

    -- 3. TASAS DE RENDIMIENTO
    ROUND(((SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL)))) / 
          NULLIF(SUM(CAST(d.J000A AS REAL)), 0)) * 100, 2) || '%' AS CUOTA_PLUSVALIA

FROM conjunto_de_datos d
LEFT JOIN tc_codigo_actividad c1 ON TRIM(d.SECTOR) = TRIM(c1.CODIGO)
LEFT JOIN tc_codigo_actividad c3 ON TRIM(d.RAMA) = TRIM(c3.CODIGO)
WHERE d.RAMA IS NOT NULL 
  AND d.CLASE IS NOT NULL 
GROUP BY d.RAMA
ORDER BY PLUSVALIA_NETA_MDP DESC;
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
