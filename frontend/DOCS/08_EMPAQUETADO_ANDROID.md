# /DOCS/08_EMPAQUETADO_ANDROID.md: Guía de Empaquetado Android con Capacitor

Esta guía detalla los pasos para compilar la aplicación uWuzi-Assist (React + Vite) en un archivo `.apk` para Android utilizando Capacitor.

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu entorno de desarrollo:

1.  **Node.js:** Versión LTS recomendada. Puedes descargarlo desde [nodejs.org](https://nodejs.org/).
2.  **Android Studio:** La IDE oficial para el desarrollo de Android. Asegúrate de que incluya:
    *   Android SDK.
    *   Herramientas de línea de comando del SDK de Android (Android SDK Command-line Tools).
    *   Un JDK (Java Development Kit), generalmente viene con Android Studio o se puede instalar por separado (OpenJDK es una buena opción).
3.  **Navegador Web:** Chrome o Edge para la inicialización de Capacitor si es necesario.

## Paso 1: Construir la Aplicación Web

Primero, necesitas generar el bundle de producción de tu aplicación React. Desde la raíz de tu proyecto uWuzi-Assist, ejecuta:

```bash
npm run build
```

Este comando (asumiendo que es el script configurado en tu `package.json` para Vite) compilará tu aplicación y generará los archivos estáticos en la carpeta `dist/` (o la carpeta que tengas configurada como `build.outDir` en tu `vite.config.ts`).

## Paso 2: Inicializar Capacitor y Añadir la Plataforma Android

Capacitor se integra directamente en tu proyecto web existente.

1.  **Inicializar Capacitor:**
    En la raíz de tu proyecto, ejecuta el siguiente comando. Reemplaza `[appName]` con el nombre de tu aplicación (ej. "uWuzi Assist") y `[appId]` con un identificador único de paquete en formato de dominio inverso (ej. `com.uwuzi.assist`).

    ```bash
    npx cap init "uWuzi Assist" "com.uwuzi.assist" --web-dir=dist
    ```
    *   `--web-dir=dist`: Es crucial especificar que tu directorio web (donde están los archivos estáticos de producción) es `dist/`.

2.  **Instalar dependencias de Capacitor (si es la primera vez):**
    Capacitor podría pedirte instalar `@capacitor/core` y `@capacitor/cli`. Sigue las instrucciones en pantalla.

    ```bash
    npm install @capacitor/core @capacitor/cli
    # o pnpm install @capacitor/core @capacitor/cli
    # o yarn add @capacitor/core @capacitor/cli
    ```

3.  **Añadir la plataforma Android:**
    Esto creará una carpeta `android/` en la raíz de tu proyecto que contendrá un proyecto nativo de Android.

    ```bash
    npx cap add android
    ```

4.  **Sincronizar los Assets Web:**
    Cada vez que realices cambios en tu código web y lo reconstruyas (con `npm run build`), debes sincronizar estos cambios con el proyecto nativo de Android:

    ```bash
    npx cap sync
    ```
    Esto copia los assets web a la carpeta del proyecto Android y actualiza las dependencias de plugins de Capacitor.

## Paso 3: Abrir el Proyecto en Android Studio

Una vez que Capacitor haya creado el proyecto Android, puedes abrirlo en Android Studio:

1.  Abre Android Studio.
2.  Selecciona "Open an existing Android Studio project" (o "File" > "Open...").
3.  Navega hasta la raíz de tu proyecto uWuzi-Assist y selecciona la carpeta `android/` que fue creada por Capacitor.
4.  Android Studio importará el proyecto y podría tardar un poco en sincronizar Gradle y descargar dependencias.

## Paso 4: Generar un APK Firmado para Release

Para generar un APK que pueda ser instalado en dispositivos Android, necesitas firmarlo.

1.  **En Android Studio, con tu proyecto Android abierto:**
    *   Ve a `Build` en la barra de menú superior.
    *   Selecciona `Generate Signed Bundle / APK...`.

2.  **En el diálogo que aparece:**
    *   Selecciona **APK** y haz clic en `Next`.
    *   **Key store path:**
        *   Si ya tienes un keystore, selecciónalo.
        *   Si no, haz clic en `Create new...` y sigue los pasos para crear un nuevo keystore. Guarda este archivo en un lugar seguro y recuerda las contraseñas. Necesitarás este mismo keystore para futuras actualizaciones de tu app.
    *   Introduce la **Key store password**, **Key alias** y **Key password**.
    *   Haz clic en `Next`.

3.  **Opciones de Destino y Build:**
    *   Elige una **Destination Folder** para tu APK.
    *   Selecciona el **Build Variant** `release`.
    *   Asegúrate de que las **Signature versions** (V1 y V2) estén seleccionadas para mayor compatibilidad.
    *   Haz clic en `Finish` (o `Create` en versiones más antiguas de Android Studio).

Android Studio comenzará el proceso de compilación. Una vez finalizado, encontrarás tu APK firmado (usualmente llamado `app-release.apk` o similar) en la carpeta de destino que especificaste (por ejemplo, `android/app/release/`).

Este APK está listo para ser instalado en dispositivos Android.

## Actualizaciones Futuras

Para futuras actualizaciones de tu aplicación:

1.  Realiza los cambios en tu código React.
2.  Ejecuta `npm run build`.
3.  Ejecuta `npx cap sync`.
4.  Abre la carpeta `android/` en Android Studio.
5.  Genera un nuevo APK firmado usando el mismo keystore.
