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
    SUM(CAST(d.H001A AS INTEGER)) AS PERSONAL_OCUPADO,
    
    -- 1. PLUSVALÍA NETA REAL (MDP)
    -- Ingresos Totales - (Gastos Totales + Salarios)
    -- Usamos M000A (Ingresos) para que la resta sea absoluta
    ROUND(SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL))), 2) AS PLUSVALIA_NETA_MDP,

    -- 2. TASA DE EXPLOTACIÓN CORREGIDA
    -- (Plusvalía Neta / Salarios)
    ROUND(((SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL)))) / 
          NULLIF(SUM(CAST(d.J000A AS REAL)), 0)) * 100, 2) || '%' AS TASA_EXPLOTACION,

    -- 3. TASA DE GANANCIA (Rentabilidad sobre la inversión total)
    -- Plusvalía Neta / (Acervo de Capital + Gastos + Salarios)
    ROUND(((SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL)))) / 
          NULLIF(SUM(CAST(d.Q000A AS REAL)) + SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL)), 0)) * 100, 2) || '%' AS TASA_GANANCIA_NETA,

    -- 4. DESGLOSE DE LA JORNADA DE 8 HORAS (Sobre Ingresos Totales)
    -- Cuánto tiempo de la jornada se va a cada rubro
    ROUND((SUM(CAST(d.J000A AS REAL)) / NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_PARA_SALARIO,
    ROUND((SUM(CAST(d.A700A AS REAL)) / NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_PARA_GASTOS_E_IMPUESTOS,
    ROUND(((SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL)))) / 
          NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_PLUSVALIA_PURA

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
