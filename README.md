# Diccionario de Análisis de Economía Política (Censo Económico 2024)

Este documento describe las métricas calculadas para analizar la relación entre el trabajo, el capital y la plusvalía en los subsectores económicos de México, utilizando el esquema de base de datos del CE2024.

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
* **Interpretación:** Es el excedente "limpio" generado por los trabajadores.

### B. Tasa de Explotación (Cuota de Plusvalía)
Mide la proporción entre el trabajo excedente y el trabajo necesario.
* **Fórmula:** $$(\frac{A131A - J000A}{J000A}) \times 100$$
* **Interpretación:** Indica qué porcentaje de la riqueza creada por el trabajador es apropiada por el patrón en relación con lo que el trabajador recibe como salario.

### C. Tasa de Ganancia Neta
Mide la rentabilidad real del capital invertido.
* **Fórmula:** $$\frac{A131A - J000A - Q000B}{Q000A + J000A} \times 100$$
* **Interpretación:** Relaciona la plusvalía neta con la inversión total (Capital Constante + Capital Variable).

---

## 3. Desglose de la Jornada Laboral (8 Horas)

Este análisis asume una jornada estándar para visualizar cómo se reparte el tiempo de vida del trabajador.



#### I. Horas para Salario (Trabajo Necesario)
* **Fórmula:** `(J000A / A131A) * 8`
* **Descripción:** Tiempo que el trabajador tarda en producir un valor equivalente a su propio sueldo.

#### II. Horas para Infraestructura (Costo Operativo)
* **Fórmula:** `(Q000B / A131A) * 8`
* **Descripción:** Tiempo de la jornada destinado exclusivamente a pagar el desgaste de las máquinas, rentas y mantenimiento técnico de la empresa.

#### III. Horas de Plusvalía Neta (Trabajo Excedente)
* **Fórmula:** `((A131A - J000A - Q000B) / A131A) * 8`
* **Descripción:** Horas que el trabajador labora "gratis" para el patrón, una vez cubiertos su salario y los costos operativos.

---

## 4. Ejemplo de Interpretación
Si en un subsector el resultado es:
* **HRS_PARA_SALARIO:** 1.5 hrs
* **HRS_PARA_INFRAESTRUCTURA:** 0.5 hrs
* **HRS_PLUSVALIA_NETA:** 6.0 hrs

**Conclusión:** El trabajador "se paga solo" en los primeros 90 minutos de su turno; los siguientes 30 minutos mantiene la fábrica, y las últimas **6 horas** genera riqueza pura para el accionista o dueño.