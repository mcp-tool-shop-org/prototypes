<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/runforge-desktop/readme.png" alt="RunForge Desktop" width="400"></p>

<h1 align="center">RunForge Desktop</h1>

<p align="center">
  <a href="https://www.nuget.org/packages/RunForgeDesktop.Core"><img src="https://img.shields.io/nuget/v/RunForgeDesktop.Core?label=RunForgeDesktop.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/mcp-tool-shop-org/runforge-desktop/releases"><img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows" alt="Platform"></a>
  <a href="https://mcp-tool-shop-org.github.io/runforge-desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**RunForge Desktop** es una aplicación de escritorio nativa de Windows para crear, supervisar e inspeccionar ejecuciones de entrenamiento de modelos de aprendizaje automático (ML).

Proporciona un panel de control visual para experimentos de ML: creación de ejecuciones, supervisión del progreso del entrenamiento en tiempo real con gráficos y exploración de ejecuciones completadas con inspección completa de los artefactos.

> **Código fuente principal (artefactos, esquemas, garantías):**
> https://github.com/mcp-tool-shop-org/runforge-vscode

---

## ¿Por qué?

La mayoría de las herramientas de seguimiento de experimentos de ML son plataformas SaaS basadas en la nube que requieren cuentas, recopilan datos de telemetría y añaden complejidad. RunForge Desktop adopta un enfoque diferente: **todo se ejecuta localmente en su máquina**.

Con RunForge Desktop, puede:

- **Crear** ejecuciones de entrenamiento con configuraciones predefinidas.
- **Supervisar** el entrenamiento en tiempo real con gráficos y registros.
- **Explorar** las ejecuciones completadas y sus resultados.
- **Inspeccionar** métricas, registros y artefactos.
- **Gestionar** las ejecuciones (cancelar, ver resultados, copiar comandos).

Todas las ejecuciones de entrenamiento se realizan localmente en su máquina utilizando Python. Sin nube. Sin telemetría. Sin cuentas.

---

## Paquetes NuGet

| Paquete | Descripción |
| --------- | ------------- |
| [RunForgeDesktop.Core](https://www.nuget.org/packages/RunForgeDesktop.Core) | Modelos y servicios principales para la gestión de ejecuciones de entrenamiento de ML: ciclo de vida de la ejecución, optimización de hiperparámetros, supervisión en tiempo real e inspección de artefactos. |

```bash
dotnet add package RunForgeDesktop.Core
```

---

## Guía de inicio rápido

### Instalación

**Opción 1: Paquete MSIX (Recomendado)**
1. Descargue el archivo `.msix` desde [Releases](https://github.com/mcp-tool-shop-org/runforge-desktop/releases)
2. Haga doble clic para instalar.
3. Inicie la aplicación desde el menú de inicio.

**Opción 2: Compilación desde el código fuente**
```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

Consulte [docs/INSTALL.md](docs/INSTALL.md) para obtener opciones de instalación detalladas.

### Uso

1. **Inicie** RunForge Desktop.
2. **Seleccione el espacio de trabajo:** Haga clic en "Seleccionar espacio de trabajo" y elija una carpeta para sus experimentos de ML.
3. **Comience el entrenamiento:** Haga clic en "Entrenar" para configurar y ejecutar una ejecución de entrenamiento.
4. **Supervise en tiempo real:** Observe el progreso del entrenamiento con gráficos de pérdida en tiempo real y registros.
5. **Explore las ejecuciones:** Vea todas las ejecuciones, filtrando por estado.
6. **Inspeccione los detalles:** Haga clic en cualquier ejecución para ver métricas, artefactos y resultados.

---

## Características

### Creación de ejecuciones de entrenamiento
- Configure las ejecuciones de entrenamiento con configuraciones predefinidas de épocas (Rápida, Estándar, Extendida, Personalizada).
- Selección de dispositivo GPU/CPU con detección automática.
- Configuración avanzada: tamaño de lote, tasa de aprendizaje, optimizador, programador.
- Opcional: ruta de conjunto de datos personalizado.

### Optimización de hiperparámetros (MultiRun)
- Ejecute múltiples experimentos con diferentes combinaciones de hiperparámetros.
- Configure tasas de aprendizaje, tamaños de lote y optimizadores como listas separadas por comas.
- Búsqueda automática en cuadrícula de todas las combinaciones.
- Realice un seguimiento de la configuración con mejor rendimiento según la pérdida final.

### Supervisión en tiempo real
- Gráfico de pérdida en tiempo real con actualizaciones automáticas.
- Transmisión en vivo de registros del proceso de entrenamiento.
- Seguimiento del progreso (época, paso, tiempo transcurrido).
- Posibilidad de cancelar el entrenamiento en cualquier momento.

### Exploración de ejecuciones
- Explore las ejecuciones con ordenación de las más recientes primero.
- Filtre por estado: Pendiente, En ejecución, Completada, Fallida, Cancelada.
- Vea los detalles y resultados de la ejecución.

### Inspección de ejecuciones
- **Métricas:** Curvas de pérdida, precisión, estadísticas de entrenamiento.
- **Registros:** Salida estándar/error estándar completa del proceso de entrenamiento.
- **Artefactos:** Abra la carpeta de salida, copie el comando de entrenamiento.

### Diagnóstico
- Vea la versión de la aplicación, el marco de trabajo y el uso de memoria.
- Vea la ruta del espacio de trabajo y la configuración de Python.
- Copie el diagnóstico al portapapeles para obtener soporte.

---

## Principios fundamentales

### Local-first
Todas las ejecuciones de entrenamiento se realizan en su máquina. No se requiere conexión a la nube.

### Transparente
Vea exactamente lo que está sucediendo: registros en tiempo real, métricas en tiempo real, control total del proceso.

### Sencillo
Un espacio de trabajo, configuraciones predefinidas claras, sin archivos de configuración que administrar.

### Auditable
Todos los resultados de las ejecuciones se guardan en el disco para su inspección y reproducibilidad.

---

## Cómo funciona

```
RunForge Desktop
  │
  ├── Select Workspace (any folder)
  │
  ├── Create Run (preset + device + optional dataset)
  │
  ├── Spawn Python training process
  │
  ▼
.ml/
  └── runs/
      └── 20240101-123456-myrun-abc1/
          ├── run.json       (manifest)
          ├── metrics.jsonl  (live metrics)
          ├── stdout.log     (live logs)
          └── stderr.log     (errors)
```

RunForge Desktop gestiona todo el ciclo de vida: creación, ejecución, monitoreo e inspección.

---

## Requisitos del sistema

| Requisito. | Value |
| ------------- | ------- |
| OS | Windows 10 (1809+) o Windows 11. |
| Arquitectura. | x64 |
| Entorno de ejecución. | .NET 10 (incluido en MSIX). |
| Python. | 3.10+ (para entrenamiento). |
| GPU | Opcional (CUDA para entrenamiento con GPU). |
| Espacio en disco. | ~100 MB. |

---

## Plataforma y empaquetado

| Atributo. | Value |
| ----------- | ------- |
| Plataforma. | Windows 10/11. |
| Framework de interfaz de usuario. | .NET MAUI. |
| Empaquetado. | MSIX (autocontenido). |
| Instalación/desinstalación. | Limpia, aislada, reversible. |

La aplicación sigue los modelos de permisos estándar de Windows para el acceso a archivos.

---

## Estado del proyecto

| Atributo. | Value |
| ----------- | ------- |
| Versión actual. | v1.0.0. |
| Scope | Entrenamiento, monitoreo e inspección de modelos de aprendizaje automático. |

Consulte [RELEASE_NOTES_v0.4.0.md](RELEASE_NOTES_v0.4.0.md) para ver los cambios recientes.

---

## Desarrollo

### Requisitos previos

- SDK de .NET 10.
- Windows 10/11.
- Visual Studio 2022 (17.12+) con carga de trabajo de MAUI, o VS Code con la extensión .NET MAUI.

### Compilación

```powershell
# Debug build
dotnet build

# Run tests
dotnet test

# Release build
.\scripts\build-release.cmd
```

### Estructura del proyecto

```
runforge-desktop/
├── src/
│   ├── RunForgeDesktop/          # MAUI app (UI, ViewModels)
│   └── RunForgeDesktop.Core/     # Core services, models
├── tests/
│   └── RunForgeDesktop.Core.Tests/
├── docs/
│   ├── PHASE-DESKTOP-0.1-ACCEPTANCE.md
│   └── INSTALL.md
└── scripts/
    ├── build-msix.ps1
    └── build-release.cmd
```

---

## Relación con RunForge Core

Todos los esquemas, garantías y formatos de archivos se definen y se mantienen fijos en:

> https://github.com/mcp-tool-shop-org/runforge-vscode

Este repositorio contiene:
- Ninguna lógica de entrenamiento.
- Ninguna definición de esquema.
- Ninguna propiedad del contrato.

RunForge Desktop **consume** fielmente esos archivos.

---

## Público objetivo

- Desarrolladores que entrenan modelos localmente en Windows.
- Investigadores que necesitan un seguimiento de experimentos simple y que se pueda inspeccionar.
- Cualquiera que desee una interfaz de usuario nativa de Windows para el entrenamiento de modelos de aprendizaje automático.
- Equipos que desean flujos de trabajo de aprendizaje automático locales y sin conexión a la nube.

---

## Licencia

Licencia MIT. Consulte [LICENSE](LICENSE) para obtener más detalles.

---

## Pruebas de confiabilidad

RunForge viene con un conjunto de pruebas de confiabilidad que se pueden ejecutar localmente para validar el encolamiento, la pausa/reanudación, la cancelación, la recuperación de fallos, la equidad, la resistencia a la deriva del disco y el comportamiento de reconexión del escritorio.

| Prueba. | Focus |
| ---------- | ------- |
| G1 | Cumplimiento de max_parallel. |
| G2 | Pausa/Reanudación. |
| G3 | Determinismo de la cancelación. |
| G4 | Recuperación de fallos. |
| G5 | Programación equitativa. |
| G6 | Resistencia a la deriva del disco. |
| G7 | Reconexión del escritorio. |
| G8-G10. | Soporte para GPU (v0.4.0+). |

Consulte: [`docs/GAUNTLETS.md`](docs/GAUNTLETS.md)

---

## Contribuciones

Las contribuciones son bienvenidas. Por favor, respete los principios básicos:

- Manténgalo simple y enfocado en el uso local.
- Sin dependencias de la nube ni telemetría.
- Mensajes de error claros y que permitan tomar medidas.

---

## Soporte

- **Problemas/Incidencias**: [GitHub Issues](https://github.com/mcp-tool-shop-org/runforge-desktop/issues)
- **Diagnóstico**: Utilice la página de Diagnóstico para copiar la información del sistema y adjuntarla a los informes de errores.
