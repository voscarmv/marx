Aquí tienes el **README.md** definitivo. He actualizado las métricas para incluir el desglose cuádruple de la jornada laboral, separando específicamente el tiempo destinado a **impuestos y finanzas**, lo que permite un análisis mucho más fino frente a los contraargumentos clásicos.

---

# Análisis de Economía Política (Censo Económico 2024 - INEGI)

Este proyecto implementa un modelo de análisis basado en la economía política para los microdatos del Censo Económico 2024 de México. El objetivo es mapear las categorías contables del INEGI a las categorías de capital y plusvalía, permitiendo visualizar la distribución real de la riqueza generada.

## 1. Variables Fuente (INEGI)

Para los cálculos se utilizan las siguientes columnas base del diccionario de datos:

| Columna | Nombre Original INEGI | Concepto Económico | Descripción |
| :--- | :--- | :--- | :--- |
| `M000A` | Ingresos totales | **Producción Total** | El valor bruto total generado por la unidad económica. |
| `J000A` | Total de remuneraciones | **Capital Variable ($v$)** | Salarios, prestaciones y cuotas de seguridad social. |
| `K000A` | Gastos por consumo | **Capital Circulante** | Costos de operación (materias primas, renta, luz, etc.). |
| `A700A` | Total de gastos | **Gastos Totales** | Incluye `K000A` + Impuestos, intereses y donaciones. |
| `Q000A` | Acervo de activos fijos | **Capital Constante ($c$)** | Inversión en maquinaria, edificios y equipo. |

---

## 2. Columnas Calculadas y Fórmulas

### A. Plusvalía Neta Real ($S_n$)
Es el excedente que queda tras cubrir la nómina (`J000A`) y todos los gastos operativos y fiscales (`A700A`).
* **Fórmula:** `M000A - (J000A + A700A)`

### B. Carga Fiscal y Financiera ($T$)
Representa la parte del valor generado que se transfiere al Estado (impuestos) o al sector bancario (intereses).
* **Fórmula:** `A700A - K000A`

### C. Cuota de Plusvalía (Tasa de Explotación)
Mide la relación entre la ganancia neta del capitalista y el salario del trabajador.
* **Fórmula:** $$\frac{S_n}{J000A} \times 100$$

---

## 3. Desglose de la Jornada Laboral (8 Horas)

Este modelo divide las 8 horas de un turno estándar en cuatro rubros para entender a dónde va el esfuerzo del trabajador:



#### I. Horas para Salario (Trabajo Necesario)
* **Fórmula:** `(J000A / M000A) * 8`
* **Descripción:** Tiempo necesario para producir el valor de su propio sueldo.

#### II. Horas para Operación (Reposición de Insumos)
* **Fórmula:** `(K000A / M000A) * 8`
* **Descripción:** Tiempo para pagar los materiales, servicios y mantenimientos de la empresa.

#### III. Horas para Impuestos y Finanzas (El Estado/Bancos)
* **Fórmula:** `((A700A - K000A) / M000A) * 8`
* **Descripción:** Tiempo destinado exclusivamente a cubrir la carga fiscal y los costos financieros.

#### IV. Horas de Plusvalía Pura (Ganancia Neta)
* **Fórmula:** `(S_n / M000A) * 8`
* **Descripción:** Tiempo de trabajo excedente que se traduce en utilidad limpia para el propietario.

---

## 4. Ejecución del Proyecto

1. **Instalación:**
   ```bash
   npm install sqlite3 csv-parser
   ```
2. **Importación:** Carga los archivos CSV a la base SQLite local.
   ```bash
   node load.js
   ```
3. **Reporte:** Genera el análisis por rama económica.
   ```bash
   node query.js > reporte_final.csv
   ```

## 5. Ejemplo de Interpretación
Si un subsector arroja:
* **HRS_SALARIO:** 1.0 hr
* **HRS_OPERACION:** 2.5 hrs
* **HRS_IMPUESTOS:** 0.5 hrs
* **HRS_PLUSVALIA:** 4.0 hrs

**Conclusión:** El trabajador tarda 1 hora en ganar su sueldo, 2.5 horas en pagar los gastos de la fábrica y media hora en pagar los impuestos al gobierno. Las **4 horas restantes** (la mitad de su turno) trabaja gratis para generar utilidad neta al dueño.

---
**Fuente:** Metodología adaptada de Karl Marx con datos oficiales de los Censos Económicos 2024 (INEGI).