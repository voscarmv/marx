# Análisis de Economía Política (Censo Económico 2024)

Este documento describe las métricas calculadas para analizar la relación entre el trabajo, el capital y la plusvalía en los subsectores económicos de México, utilizando el esquema de base de datos del CE2024.

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
   node query.js > reporte.csv
   ```

---

## 1. Variables Fuente (INEGI)
Para los cálculos se utilizan las siguientes columnas base:

| Columna | Nombre Original | Concepto Marxista | Descripción |
| :--- | :--- | :--- | :--- |
| `A131A` | Valor Agregado Censal Bruto | **Nuevo Valor ($V + S$)** | Valor creado por la fuerza de trabajo tras descontar insumos. |
| `J000A` | Total de Remuneraciones | **Capital Variable ($V$)** | Salarios, prestaciones y seguridad social pagada. |
| `Q000A` | Acervo total de activos fijos | **Capital Constante ($C$)** | Valor de maquinaria, edificios y medios de producción. |
| `Q000B` | Depreciación total | **Consumo de Capital** | Valor de la infraestructura que se transfiere al producto por desgaste. |

---

## 2. Columnas Calculadas y Fórmulas

### A. Plusvalía Neta (Sₙ)
Es la masa de valor que queda en manos del capitalista después de pagar la fuerza de trabajo y cubrir los costos de mantenimiento de la infraestructura.
* **Fórmula:** `A131A - J000A - Q000B`
* **Implementación SQL (`query.js`):**
  ```sql
  ROUND(CAST(d.A131A AS REAL) - CAST(d.J000A AS REAL) - CAST(d.Q000B AS REAL), 2) AS PLUSVALIA_NETA_MDP
  ```
* **Interpretación:** Es el excedente "limpio" generado por los trabajadores.

### B. Tasa de Explotación (Cuota de Plusvalía)
Mide la proporción entre el trabajo excedente y el trabajo necesario.
* **Fórmula:** $$(\frac{A131A - J000A}{J000A}) \times 100$$
* **Implementación SQL (`query.js`):**
  ```sql
  ROUND(((CAST(d.A131A AS REAL) - CAST(d.J000A AS REAL)) / NULLIF(CAST(d.J000A AS REAL), 0)) * 100, 2) || '%' AS TASA_EXPLOTACION
  ```
* **Interpretación:** Indica qué porcentaje de la riqueza creada por el trabajador es apropiada por el patrón en relación con lo que el trabajador recibe como salario.

### C. Tasa de Ganancia Neta
Mide la rentabilidad real del capital invertido.
* **Fórmula:** $$\frac{A131A - J000A - Q000B}{Q000A + J000A} \times 100$$
* **Implementación SQL (`query.js`):**
  ```sql
  ROUND(((CAST(d.A131A AS REAL) - CAST(d.J000A AS REAL) - CAST(d.Q000B AS REAL)) / 
        NULLIF(CAST(d.Q000A AS REAL) + CAST(d.J000A AS REAL), 0)) * 100, 2) || '%' AS TASA_GANANCIA_NETA
  ```
* **Interpretación:** Relaciona la plusvalía neta con la inversión total (Capital Constante + Capital Variable).

---

## 3. Desglose de la Jornada Laboral (8 Horas)

Este análisis asume una jornada estándar para visualizar cómo se reparte el tiempo de vida del trabajador.



#### I. Horas para Salario (Trabajo Necesario)
* **Fórmula:** `(J000A / A131A) * 8`
* **Implementación SQL (`query.js`):**
  ```sql
  ROUND((CAST(d.J000A AS REAL) / NULLIF(CAST(d.A131A AS REAL), 0)) * 8, 2) AS HRS_PARA_SALARIO
  ```
* **Descripción:** Tiempo que el trabajador tarda en producir un valor equivalente a su propio sueldo.

#### II. Horas para Infraestructura (Costo Operativo)
* **Fórmula:** `(Q000B / A131A) * 8`
* **Implementación SQL (`query.js`):**
  ```sql
  ROUND((CAST(d.Q000B AS REAL) / NULLIF(CAST(d.A131A AS REAL), 0)) * 8, 2) AS HRS_PARA_INFRAESTRUCTURA
  ```
* **Descripción:** Tiempo de la jornada destinado exclusivamente a pagar el desgaste de las máquinas, rentas y mantenimiento técnico de la empresa.

#### III. Horas de Plusvalía Neta (Trabajo Excedente)
* **Fórmula:** `((A131A - J000A - Q000B) / A131A) * 8`
* **Implementación SQL (`query.js`):**
  ```sql
  ROUND(((CAST(d.A131A AS REAL) - CAST(d.J000A AS REAL) - CAST(d.Q000B AS REAL)) / 
        NULLIF(CAST(d.A131A AS REAL), 0)) * 8, 2) AS HRS_PLUSVALIA_NETA
  ```
* **Descripción:** Horas que el trabajador labora "gratis" para el patrón, una vez cubiertos su salario y los costos operativos.

---

## 4. Ejemplo de Interpretación
Si en un subsector el resultado es:
* **HRS_PARA_SALARIO:** 1.5 hrs
* **HRS_PARA_INFRAESTRUCTURA:** 0.5 hrs
* **HRS_PLUSVALIA_NETA:** 6.0 hrs

**Conclusión:** El trabajador "se paga solo" en los primeros 90 minutos de su turno; los siguientes 30 minutos mantiene la fábrica, y las últimas **6 horas** genera riqueza pura para el accionista o dueño.

Estos datos reales para México están en el archivo `datos.csv` en este repositorio.

## 5. Fuentes

- https://www.inegi.org.mx/programas/ce/2024/#datos_abiertos
- https://www.inegi.org.mx/contenidos/programas/ce/2024/datosabiertos/conjunto_de_datos_ce_nac_2024_csv.zip
