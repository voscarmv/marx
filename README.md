# Análisis de Economía Política (Censo Económico 2024 - INEGI)

Este proyecto implementa un modelo de análisis basado en la economía política para los microdatos del Censo Económico 2024 de México. El objetivo es mapear las categorías contables del INEGI a las categorías de capital y plusvalía, permitiendo visualizar la distribución real de la riqueza generada.

## Instalación y Configuración

1. **Requisitos:** Asegúrate de tener instalado [Node.js](https://nodejs.org/).
2. **Descargar Dependencias:**
   Ejecuta el siguiente comando para instalar las librerías necesarias de SQLite3 y de parseo veloz de streams:
   ```bash
   npm install sqlite3 csv-parser
   ```
3. **Colocar Datos Fuente:** Asegúrate de que la carpeta de datos extraídos del INEGI (`conjunto_de_datos_ce_nac_2024_csv`) exista en la ruta base del proyecto.

## Ejecución del Análisis

El proyecto consta de dos fases. Puedes correr todo automáticamente usando el script proporcionado:
```bash
bash run.sh
```

Alternativamente, el proceso paso a paso es:
1. **Cargar los datos masivos (Paso 1):** Construye la base relacional local `datos.db` a partir de los CSV del censo mediante flujos (streams) en memoria de alta eficiencia.
   ```bash
   node load.js
   ```
2. **Ejecutar Modelo (Paso 2):** Lee la base de datos aplicando las métricas de este diccionario y genera un reporte tabular directo en CSV.
   ```bash
   node query_rama2.js > reporte_final.csv
   ```

---

## 1. Variables Fuente (INEGI)

Para los cálculos se utilizan las siguientes columnas base del diccionario de datos:

| Columna | Nombre Original INEGI | Concepto Económico | Descripción |
| :--- | :--- | :--- | :--- |
| `M000A` | Ingresos totales | **Producción Total** | El valor bruto total generado por la unidad económica. |
| `J000A` | Total de remuneraciones | **Capital Variable ($v$)** | Salarios, prestaciones y cuotas de seguridad social. |
| `K000A` | Gastos por consumo | **Capital Circulante** | Costos de operación (materias primas, renta, luz, etc.). |
| `A700A` | Total de gastos | **Gastos Totales** | Incluye `K000A` + Impuestos, intereses y donaciones. |

---

## 2. Columnas Calculadas y Fórmulas

### A. Plusvalía Neta Real ($S_n$)
Es el excedente que queda tras cubrir la nómina (`J000A`) y todos los gastos operativos y fiscales (`A700A`).
* **Fórmula:** `M000A - (A700A + J000A)`
* **Implementación SQL (`query_rama2.js`):**
  ```sql
  ROUND(SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL))), 2) AS PLUSVALIA_NETA_MDP
  ```

### B. Cuota de Plusvalía (Tasa de Explotación)
Mide la relación entre la ganancia neta del capitalista y el salario del trabajador.
* **Fórmula:** $$\frac{S_n}{J000A} \times 100$$
* **Implementación SQL (`query_rama2.js`):**
  ```sql
  ROUND(((SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL)))) / 
        NULLIF(SUM(CAST(d.J000A AS REAL)), 0)) * 100, 2) || '%' AS CUOTA_PLUSVALIA
  ```

---

## 3. Desglose de la Jornada Laboral (8 Horas)

Este modelo divide las 8 horas de un turno estándar en cuatro rubros para entender a dónde va el esfuerzo del trabajador:

#### I. Horas para Salario (Trabajo Necesario)
* **Fórmula:** `(J000A / M000A) * 8`
* **Implementación SQL (`query_rama2.js`):**
  ```sql
  ROUND((SUM(CAST(d.J000A AS REAL)) / NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_SALARIO
  ```
* **Descripción:** Tiempo necesario para producir el valor de su propio sueldo.

#### II. Horas para Operación (Reposición de Insumos)
* **Fórmula:** `(K000A / M000A) * 8`
* **Implementación SQL (`query_rama2.js`):**
  ```sql
  ROUND((SUM(CAST(d.K000A AS REAL)) / NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_OPERACION
  ```
* **Descripción:** Tiempo para pagar los materiales, servicios y mantenimientos de la empresa.

#### III. Horas para Impuestos y Finanzas (El Estado/Bancos)
* **Fórmula:** `((A700A - K000A) / M000A) * 8`
* **Implementación SQL (`query_rama2.js`):**
  ```sql
  ROUND(((SUM(CAST(d.A700A AS REAL)) - SUM(CAST(d.K000A AS REAL))) / 
        NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_IMPUESTOS_Y_FINANZAS
  ```
* **Descripción:** Tiempo destinado exclusivamente a cubrir la carga fiscal y los costos financieros.

#### IV. Horas de Plusvalía Pura (Ganancia Neta)
* **Fórmula:** `(S_n / M000A) * 8`
* **Implementación SQL (`query_rama2.js`):**
  ```sql
  ROUND(((SUM(CAST(d.M000A AS REAL)) - (SUM(CAST(d.A700A AS REAL)) + SUM(CAST(d.J000A AS REAL)))) / 
        NULLIF(SUM(CAST(d.M000A AS REAL)), 0)) * 8, 2) AS HRS_PLUSVALIA_PURA
  ```
* **Descripción:** Tiempo de trabajo excedente que se traduce en utilidad limpia para el propietario.

---

## 4. Ejemplo de Interpretación
Si un subsector arroja:
* **HRS_SALARIO:** 1.0 hr
* **HRS_OPERACION:** 2.5 hrs
* **HRS_IMPUESTOS_Y_FINANZAS:** 0.5 hrs
* **HRS_PLUSVALIA_PURA:** 4.0 hrs

**Conclusión:** El trabajador tarda 1 hora en ganar su sueldo, 2.5 horas en pagar los gastos de la fábrica y media hora en pagar los impuestos al gobierno. Las **4 horas restantes** (la mitad de su turno) trabaja gratis para generar utilidad neta al dueño.

Estos datos reales para México están en el archivo `rama2.csv` en este repositorio.

## 5. Fuentes

- Metodología adaptada de Karl Marx con datos oficiales de los Censos Económicos 2024 (INEGI).
- https://www.inegi.org.mx/programas/ce/2024/#datos_abiertos
- https://www.inegi.org.mx/contenidos/programas/ce/2024/datosabiertos/conjunto_de_datos_ce_nac_2024_csv.zip
