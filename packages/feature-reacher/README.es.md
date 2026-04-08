<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/feature-reacher/readme.png" alt="Feature-Reacher" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/feature-reacher/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Identifique las funcionalidades subutilizadas antes de que se conviertan en deuda técnica.**

Feature-Reacher analiza los elementos de su producto (notas de la versión, documentación, preguntas frecuentes) y genera una **Evaluación de Riesgo de Adopción**: una lista clasificada y respaldada por evidencia de funcionalidades que los usuarios podrían no descubrir.

---

## ¿Qué es esto?

Una herramienta de diagnóstico que:
- Importa documentación de productos y notas de la versión.
- Extrae menciones de funcionalidades con evidencia.
- Asigna una puntuación a las funcionalidades según su antigüedad, visibilidad y densidad de documentación.
- Genera diagnósticos de riesgo de adopción con recomendaciones.

## ¿Qué NO es esto?

- Una plataforma de análisis (no importa datos de uso).
- Un sistema de "feature flags".
- Un panel conectado a su código fuente.
- Una inteligencia artificial que adivina lo que los usuarios quieren.

Esto es **inteligencia explicable**: cada diagnóstico viene con evidencia citada y un razonamiento claro.

---

## ¿Qué ofrece la Fase 1?

- **Carga de elementos**: Pegue texto o cargue archivos .txt/.md.
- **Extracción de funcionalidades**: Encabezados, listas con viñetas, frases repetidas.
- **Heurísticas de puntuación**: Decaimiento por antigüedad, señales de visibilidad, densidad de documentación.
- **Motor de diagnóstico**: 6 tipos de diagnósticos con señales de activación y evidencia.
- **Evaluación clasificada**: Funcionalidades ordenadas por riesgo de adopción.
- **Recomendaciones de acción**: Acciones copiables para cada diagnóstico.
- **Exportación**: Informes de texto plano e HTML imprimibles.

## ¿Qué añade la Fase 2 (Repetibilidad y Retención)?

- **Historial de evaluaciones**: Todas las evaluaciones se guardan en IndexedDB, con opciones para ver, renombrar y eliminar.
- **Activación de guardado automático**: Ejecute las evaluaciones una vez y guárdelas automáticamente (o manualmente).
- **Conjuntos de elementos**: Colecciones con nombre para flujos de trabajo de evaluación repetibles.
- **Comparación de evaluaciones**: Comparación lado a lado que muestra los riesgos nuevos/resueltos y los cambios en el diagnóstico.
- **Tendencias de funcionalidades**: Visualización tipo "sparkline" de la trayectoria del riesgo a lo largo del tiempo.
- **Resumen ejecutivo**: Resumen basado en plantillas para compartir con socios (sin IA).
- **Conjunto de pruebas**: Jest + ts-jest con pruebas de seguridad.

## ¿Qué añade la Fase 3 (Lista para el mercado)?

- **Página de inicio pública**: `/landing` con propuestas de valor y llamadas a la acción.
- **Modo de demostración**: `/demo` carga automáticamente datos de muestra para una experiencia instantánea.
- **Páginas legales**: Política de privacidad, términos de servicio, información de contacto de soporte.
- **Panel de manejo de datos**: Transparencia sobre el almacenamiento local con opción de eliminación.
- **Tour de incorporación**: Tour guiado de 4 pasos para nuevos usuarios.
- **Página de metodología**: `/methodology` explica el sistema de puntuación (sin exageraciones sobre la IA).
- **Límites de errores**: Experiencia de usuario resistente a fallos con exportación de diagnóstico.
- **Utilidades de accesibilidad**: Navegación con teclado, asistentes ARIA, soporte para lectores de pantalla.
- **Recursos para el mercado**: Texto para la ficha, documentos PDF, lista de verificación de envío.

## ¿Qué NO hace esta herramienta intencionalmente?

- Se conecta a plataformas de análisis.
- Se integra con GitHub, Jira u otras herramientas.
- Utiliza modelos de aprendizaje automático para la detección de funcionalidades.
- Proporciona monitoreo en tiempo real.
- Requiere autenticación o cuentas.
- Utiliza IA para la generación de narrativas (solo plantillas deterministas).

Esto es por diseño. La Fase 3 demuestra la preparación para el mercado antes de agregar integraciones.

---

## Cómo empezar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Prueba rápida

1. Pegue algunas notas de la versión o documentación.
2. Haga clic en "Ejecutar evaluación".
3. Revise la lista de funcionalidades clasificada.
4. Expanda las funcionalidades para ver la evidencia y las recomendaciones.
5. Exporte el informe.

### Flujos de trabajo de la Fase 2

**Flujo de repetibilidad:**
1. Ejecute la evaluación → se guarda automáticamente en el Historial.
2. Vaya a `/history` para ver las evaluaciones guardadas.
3. Guarde una colección de elementos para ejecuciones repetidas.
4. Compare dos evaluaciones en `/compare`.
5. Vea las tendencias en `/trends`.

**Flujo de compartir con socios:**
1. Ejecute la evaluación → haga clic en "Exportar" → "Resumen ejecutivo".
2. O compare dos evaluaciones → "Exportar informe de comparación".

---

## Estructura del proyecto

```
/src/app       # Next.js app router pages
/src/domain    # Core feature model and business logic
/src/analysis  # Diagnostics, heuristics, scoring, diff, trend
/src/storage   # IndexedDB persistence layer
/src/ui        # Reusable UI components
/tests         # Jest test suite
/docs          # Project documentation
```

### Archivos Clave

- `src/domain/feature.ts` - Modelo canónico de característica.
- `src/domain/diagnosis.ts` - Tipos de diagnóstico y severidad.
- `src/analysis/extractor.ts` - Heurísticas de extracción de características.
- `src/analysis/scoring.ts` - Puntuación de relevancia/visibilidad.
- `src/analysis/diagnose.ts` - Motor de diagnóstico.
- `src/analysis/ranking.ts` - Clasificación de riesgos y generación de informes.
- `src/analysis/actions.ts` - Recomendaciones de acciones.
- `src/analysis/export.ts` - Generación de informes y resumen ejecutivo.
- `src/analysis/diff.ts` - Motor de comparación de informes.
- `src/analysis/trend.ts` - Análisis de tendencias de características.
- `src/storage/types.ts` - Tipos de persistencia.
- `src/storage/indexeddb.ts` - Implementación de IndexedDB.

---

## Arquitectura

```
Artifact Upload → Text Normalization → Feature Extraction
                                              ↓
                                       Evidence Linking
                                              ↓
                                    Heuristic Scoring
                                              ↓
                                    Diagnosis Generation
                                              ↓
                                      Risk Ranking
                                              ↓
                                    Audit Report + Actions
```

### Principios de Diseño

1. **Sin "magia"**: Cada diagnóstico es explicable con evidencia citada.
2. **Heurísticas primero**: No se utiliza aprendizaje automático hasta que las heurísticas demuestren ser insuficientes.
3. **Determinista**: La misma entrada siempre produce la misma salida.
4. **Transparente**: Los usuarios pueden rastrear cualquier conclusión hasta su origen.

---

## Licencia

MIT

---

## Etiquetas de Lanzamiento

```bash
git checkout phase-1-foundation    # Phase 1: Core diagnostic engine
git checkout phase-2-repeatability # Phase 2: Persistence, compare, trends
git checkout phase-3-marketplace   # Phase 3: Marketplace-ready packaging
git checkout phase-3.5-teams-tab   # Phase 3.5: Teams tab integration
```

## Ejecución de Pruebas

```bash
npm test
```

Las pruebas verifican las restricciones: las puntuaciones de riesgo están limitadas de 0 a 1, los ID de los informes están formateados correctamente, y se manejan de forma adecuada los casos especiales.
