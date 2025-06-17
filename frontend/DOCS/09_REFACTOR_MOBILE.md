# /DOCS/09_REFACTOR_MOBILE.md: Documentación de Refactorización Mobile-First

Este documento describe los cambios arquitectónicos y de componentes realizados para transformar uWuzi-Assist en una aplicación "mobile-first", optimizada para su uso en dispositivos móviles y preparada para ser empaquetada como un APK de Android.

## Resumen de la Refactorización

El objetivo principal fue adaptar la interfaz de usuario y la experiencia de usuario para pantallas pequeñas, asegurando una navegación fluida y un rendimiento óptimo en móviles. Esto implicó cambios en el layout, la navegación, el manejo de interacciones y la optimización de componentes.

## Fase 2: Refactorización de Layout y Navegación Responsiva

Los cambios clave en esta fase se centraron en la estructura fundamental de la aplicación para móviles.

### 1. Navegación Principal: `HomeSidebar` a `Sheet` Móvil
*   **Componente Afectado:** `src/components/ui/sidebar.tsx`, `src/views/HomeView.tsx`, `src/views/DashboardView.tsx`, `src/components/home/HomeHeader.tsx`, `src/components/dashboard/DashboardHeader.tsx`.
*   **Descripción:**
    *   La `HomeSidebar`, que anteriormente era una barra lateral fija, ahora se transforma en un componente `Sheet` (cajón deslizable) en pantallas con un ancho menor a `1024px`.
    *   Se añadió un `SidebarTrigger` (botón de hamburguesa) a las cabeceras de `HomeView` y `DashboardView`, visible solo en pantallas `<1024px`, para controlar la apertura del `Sheet`.
    *   En pantallas `>=1024px`, la `HomeSidebar` sigue funcionando como una barra lateral fija.
    *   La lógica para determinar el modo móvil dentro de `components/ui/sidebar.tsx` fue actualizada para usar `window.matchMedia('(max-width: 1023px)')` en lugar del hook `useIsMobile`.

### 2. Eliminación del Hook `useIsMobile`
*   **Componente Afectado:** `src/hooks/use-mobile.tsx` (eliminado), `src/components/ui/sidebar.tsx`, `src/components/ChatInput.tsx`, `src/views/DashboardView.tsx`.
*   **Descripción:**
    *   El hook genérico `useIsMobile` (que usaba un breakpoint de 768px) fue eliminado.
    *   En su lugar, se adoptaron dos estrategias:
        *   Para la lógica de renderizado condicional de componentes (como el `Sheet` vs. sidebar fija), se utilizó `window.matchMedia('(max-width: 1023px)')` directamente en el componente relevante (`sidebar.tsx`).
        *   Para aplicar estilos responsivos, se utilizaron clases de utilidad de Tailwind CSS (ej. `lg:hidden`, `flex-col lg:flex-row`).

### 3. Adaptación de Layouts de Vistas Principales
*   **`DashboardView.tsx`**:
    *   El layout de múltiples columnas (`lg:grid-cols-3`) se mantiene para escritorio, colapsando a una sola columna en móvil de forma natural.
    *   La lógica para mostrar el `DayDetailPanel` fue refactorizada para no depender de `useIsMobile`. Ahora, en pantallas `<1024px`, se muestra dentro de un `Drawer` (controlado por clases `lg:hidden`), y en pantallas `>=1024px` se muestra como un panel lateral si hay una fecha seleccionada (controlado por clases `hidden lg:block`).
*   **`HomeView.tsx`**:
    *   Se confirmó que el layout de `ChatFilters` y `ChatList` (dentro de un contenedor `max-w-4xl`) se apila verticalmente de forma adecuada en pantallas pequeñas.

### 4. Refactorización de `ChatInput.tsx`
*   **Componente Afectado:** `src/components/ChatInput.tsx`.
*   **Descripción:**
    *   Se eliminó el uso del hook `useIsMobile`.
    *   Las clases CSS condicionales (`.mobile`, `.desktop`) fueron reemplazadas por clases responsivas de Tailwind CSS directamente en el JSX (ej. `flex-col lg:flex-row`).
    *   La lógica para el input de cámara (`capture="environment"`) fue modificada para usar una detección semántica de dispositivo táctil (`window.matchMedia('(hover: none) and (pointer: coarse)')`) en lugar de basarse en el ancho de la pantalla. Esto asegura que `capture="environment"` se use en dispositivos móviles y tablets, mientras que en escritorio se usa el componente `CameraCapture` con previsualización.

## Fase 3: Optimización de la Experiencia de Usuario (UX) Móvil

Esta fase se enfocó en pulir la experiencia móvil.

### 1. Gestos Táctiles
*   **Decisión:** Se investigó la posibilidad de añadir un gesto de "deslizar desde el borde" para abrir el `Sheet` de navegación.
*   **Resultado:** La librería `vaul` (utilizada para el `Sheet`) no ofrece esta funcionalidad de forma nativa. Implementarlo requeriría lógica de gestos personalizada y potencialmente librerías adicionales. Se decidió omitir esta característica por ahora, ya que el `SidebarTrigger` (botón de hamburguesa) provee el acceso necesario. La funcionalidad de arrastrar para cerrar el `Sheet` sí está presente por defecto.

### 2. Rendimiento de `ChatList.tsx`
*   **Componente Afectado:** `src/components/home/ChatList.tsx`.
*   **Descripción:**
    *   Para manejar eficientemente un número potencialmente grande de conversaciones, se implementó la virtualización de listas utilizando la librería `@tanstack/react-virtual`.
    *   Esto asegura que solo los elementos de chat visibles en pantalla se rendericen en el DOM, mejorando significativamente el rendimiento del scroll y el uso de memoria.
    *   **Nota Importante:** Debido a limitaciones del entorno de desarrollo asistido, la dependencia `@tanstack/react-virtual` (ej. `~3.5.0`) debe ser añadida manualmente al `package.json` y instalada (`npm install` o similar) en el entorno local del proyecto para que esta optimización funcione.

### 3. Integración Nativa (Revisión)
*   **Cámara (`ChatInput.tsx`, `CameraCapture.tsx`):**
    *   Se confirmó que el uso de `capture="environment"` en el input de archivo (activado por `isTouchDevice`) es la estrategia correcta para acceder a la cámara trasera por defecto en móviles.
    *   El componente `CameraCapture.tsx` sigue siendo utilizado para previsualización en dispositivos no táctiles (escritorio).
*   **Notificaciones (`NotificationContext.tsx`):**
    *   El sistema actual utiliza la API Web de Notificaciones. Se concluyó que, si bien funciona en navegadores, para una experiencia móvil nativa completa (especialmente notificaciones cuando la app está en segundo plano o cerrada), se requerirá la integración de plugins de Capacitor como `@capacitor/local-notifications` o `@capacitor/push-notifications`. Esta integración se considera un paso posterior, idealmente durante o después del proceso de empaquetado del APK.

### 4. Feedback Visual
*   **Componentes Afectados:** `src/components/ui/button.tsx`, `src/components/home/ChatList.tsx`.
*   **Descripción:**
    *   Se mejoró el feedback visual al tocar elementos interactivos.
    *   Se añadió un estilo `active:opacity-90` a las variantes del componente `Button` para indicar claramente el estado presionado.
    *   Se añadió un estilo `active:bg-secondary/80` a los ítems de la lista en `ChatList.tsx` para un feedback similar al ser tocados.

Estos cambios contribuyen a una experiencia de usuario más fluida, responsiva y adaptada a dispositivos móviles.
