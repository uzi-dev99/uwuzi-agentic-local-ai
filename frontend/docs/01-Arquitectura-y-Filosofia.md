# 1. Arquitectura y Filosofía

Esta aplicación se ha construido sobre una base de principios claros y una pila tecnológica moderna y eficiente.

### Filosofía de Diseño

1.  **Mobile-First Real**: El diseño y la lógica parten siempre desde la perspectiva de un dispositivo móvil. La vista de escritorio es una adaptación que aprovecha el espacio extra, no una versión separada. Esto garantiza una experiencia de usuario impecable en la plataforma más utilizada.

2.  **Simplicidad Radical**: El código es directo, legible y evita la complejidad innecesaria. Se prefieren soluciones nativas de React y del navegador sobre librerías pesadas. El objetivo es que un nuevo desarrollador pueda entender el flujo de la aplicación rápidamente.

3.  **Eficiencia**: Se priorizan soluciones de bajo consumo lógico y alto rendimiento. Esto se refleja en el uso de componentes funcionales, hooks optimizados y una gestión de estado que minimiza los re-renders innecesarios.

### Pila Tecnológica Principal

-   **React 18**: Utilizamos la última versión de React con `createRoot` para aprovechar las funcionalidades más recientes, como las transiciones y el renderizado concurrente.
-   **TypeScript**: Todo el código está tipado para garantizar la robustez, prevenir errores comunes y mejorar la experiencia de desarrollo con autocompletado y análisis estático.
-   **Tailwind CSS**: Se utiliza para un estilizado rápido, coherente y personalizable. La configuración de la paleta de colores se encuentra directamente en `index.html` para una fácil modificación.
-   **Backend Personalizado con Ollama**: El corazón de la funcionalidad de IA. La interacción con el backend se gestiona a través de un servicio dedicado (`services/backendService.ts`) que se comunica con un backend FastAPI que utiliza Ollama para el procesamiento de IA y N8N para workflows automatizados.
-   **React Router (HashRouter)**: Para la gestión de rutas en esta Single Page Application (SPA). Se usa `HashRouter` para una compatibilidad máxima en diferentes entornos de despliegue.
