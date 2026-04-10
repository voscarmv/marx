Aquí tienes el archivo **README.md** completo, corregido y listo para usar. He unificado las fórmulas de Marx con la realidad de los datos del INEGI (incluyendo los impuestos y gastos operativos que mencionabas) para que el análisis sea mucho más robusto.

---

# Análisis de Economía Política (Censo Económico 2024 - INEGI)

Este proyecto implementa un modelo de análisis marxista y contable sobre los microdatos del Censo Económico 2024 de México. El objetivo es desglosar la creación de valor, identificando cuánto se destina a salarios, cuánto a costos operativos/impuestos y cuánto constituye la plusvalía neta.

## 1. Variables Fuente (INEGI)

Para los cálculos se utilizan las siguientes columnas base del diccionario de datos:

| Columna | Nombre Original INEGI | Concepto Marxista | Descripción |
| :--- | :--- | :--- | :--- |
| `M000A` | Ingresos totales | **Producción Total** | El valor bruto total generado antes de cualquier deducción. |
| `J000A` | Total de remuneraciones | **Capital Variable ($v$)** | Salarios, prestaciones y cuotas de seguridad social pagadas. |
| `A700A` | Total de gastos | **Costos Externos** | Insumos, rentas, servicios, intereses e **impuestos**. |
| `Q000A` | Acervo total de activos fijos | **Capital Constante ($c_{fijo}$)** | Inversión total en maquinaria, edificios y herramientas. |
| `Q000B` | Depreciación total | **Consumo de Capital** | Valor transferido al producto por el desgaste de la infraestructura. |

---

## 2. Columnas Calculadas y Fórmulas

### A. Plusvalía Neta ($S_n$)
Es la masa de valor que queda en manos del capitalista después de pagar la fuerza de trabajo y cubrir todos los gastos operativos, financieros y fiscales.
* **Fórmula:** `M000A - (J000A + A700A)`
* **Interpretación:** Es la utilidad neta real. Al restar `A700A`, se incluyen los impuestos y costos operativos, respondiendo a los contraargumentos comunes sobre la carga fiscal del empresario.

### B. Tasa de Explotación (Cuota de Plusvalía)
Mide la proporción entre el trabajo excedente (ganancia) y el trabajo necesario (salario).
* **Fórmula:** $$\frac{M000A - (J000A + A700A)}{J000A} \times 100$$
* **Interpretación:** Indica qué porcentaje del valor que se queda el patrón representa respecto a lo que se le paga al trabajador.

### C. Tasa de Ganancia Neta
Mide la rentabilidad real sobre todo el capital invertido (maquinaria + gastos de operación + salarios).
* **Fórmula:** $$\frac{M000A - (J000A + A700A)}{Q000A + A700A + J000A} \times 100$$

---

## 3. Desglose de la Jornada Laboral (8 Horas)

Este modelo permite visualizar cómo se reparte el tiempo de vida del trabajador en un turno estándar.



#### I. Horas para Salario (Trabajo Necesario)
* **Fórmula:** `(J000A / M000A) * 8`
* **Descripción:** Tiempo que el trabajador labora para generar el valor de su propio sueldo y prestaciones.

#### II. Horas para Gastos e Impuestos (Mantenimiento del Sistema)
* **Fórmula:** `(A700A / M000A) * 8`
* **Descripción:** Tiempo destinado a pagar insumos, servicios externos, rentas y las obligaciones fiscales (impuestos) de la unidad económica.

#### III. Horas de Plusvalía Neta (Trabajo Excedente)
* **Fórmula:** `((M000A - (J000A + A700A)) / M000A) * 8`
* **Descripción:** Horas que el trabajador labora "gratis" para el dueño, una vez descontados su salario y todos los costos de operación.

---

## 4. Instrucciones de Ejecución

1. **Requisitos:** Tener instalado [Node.js](https://nodejs.org/).
2. **Instalación de Librerías:**
   ```bash
   npm install sqlite3 csv-parser
   ```
3. **Paso 1: Cargar Datos:** Construye la base relacional `datos.db` a partir de los CSV del INEGI.
   ```bash
   node load.js
   ```
4. **Paso 2: Ejecutar Análisis:** Genera el reporte final en formato CSV.
   ```bash
   node query.js > reporte_economia_politica.csv
   ```

---

## 5. Ejemplo de Interpretación
Si en un subsector (ej. Fabricación de equipo de transporte) el resultado es:
* **HRS_PARA_SALARIO:** 1.0 hrs
* **HRS_PARA_GASTOS_IMPUESTOS:** 3.0 hrs
* **HRS_PLUSVALIA_NETA:** 4.0 hrs

**Conclusión:** El trabajador "se paga solo" en la primera hora de su turno. Las siguientes 3 horas mantiene la fábrica funcionando y paga los impuestos al Estado. Las últimas **4 horas** de la jornada genera riqueza neta para el capitalista.

---
**Fuentes:**
- INEGI: Censos Económicos 2024.
- Metodología: El Capital (Karl Marx) adaptado a Contabilidad Nacional moderna.