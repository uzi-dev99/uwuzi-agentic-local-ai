# /DOCS/00_README.md: uWuzi-Assist

## Visión General del Proyecto

**Nombre del Proyecto:** uWuzi-Assist

**uWuzi-Assist** es un chatbot asistente de IA privado y local, diseñado principalmente para uso personal en un dispositivo móvil (distribuido como .apk). Su propósito es interactuar con un backend local robusto (compuesto por Docker, FastAPI, n8n, Ollama, Supabase, Caddy y Cloudflare) para realizar tareas agénticas de manera eficiente y segura. El asistente se enfoca en la privacidad y el control del usuario sobre sus datos y las capacidades de IA.

## Estado Actual

*   **Frontend:** La interfaz de usuario ha sido refactorizada con un enfoque "mobile-first", ofreciendo una experiencia optimizada para dispositivos móviles. Está lista para ser empaquetada como una aplicación Android (.apk) y mantiene la comunicación básica con el backend.
*   **Backend:** La arquitectura del backend está definida, implementada y operativa, con los servicios principales funcionando en contenedores Docker.
*   **Próxima Fase Principal:** Empaquetar el frontend de React como una aplicación Android (.apk) para su instalación en dispositivos móviles. (Esto sigue siendo relevante, la guía ya está creada).

## Stack Tecnológico Principal

*   **Frontend (Mobile App - Optimizada para Mobile-First):**
    *   React
    *   Vite
    *   TypeScript
    *   Tailwind CSS (utilizado para diseño responsivo y mobile-first)
    *   shadcn/ui (para componentes de UI)
    *   @tanstack/react-query (para la gestión del estado del servidor y caching)
    *   react-router-dom (para la navegación)
*   **Backend (Local PC - Desplegado con Docker):**
    *   Docker (para la orquestación de contenedores)
    *   FastAPI (framework Python para la API principal y la lógica de negocio)
    *   n8n (para la automatización de flujos de trabajo y tareas agénticas)
    *   Ollama (para el servicio de modelos de lenguaje grandes - LLMs locales)
    *   Supabase (como base de datos PostgreSQL y para gestión de autenticación)
    *   Caddy Server (como reverse proxy y para la gestión de SSL/TLS local)
    *   Cloudflare (para la exposición segura opcional de endpoints a través de túneles)

## Cómo Navegar esta Documentación

Esta carpeta `/DOCS` contiene la documentación técnica detallada del proyecto "uWuzi-Assist". A continuación, se describe el contenido de cada archivo principal:

*   **00_README.md:** (Este archivo) Punto de entrada. Visión general del proyecto uWuzi-Assist, stack tecnológico y guía de navegación de la documentación.
*   **01_ARQUITECTURA.md:** Describe la arquitectura de alto nivel del sistema uWuzi-Assist, los patrones utilizados, los componentes principales del backend y frontend, y los flujos de datos entre ellos.
*   **02_DIAGRAMA_DE_FLUJO.md:** Visualiza los flujos de usuario y lógicos más importantes mediante diagramas, incluyendo la autenticación, la interacción con el chatbot, la ejecución de tareas agénticas y el manejo de errores.
*   **03_COMPONENTES.md:** Documenta los componentes reutilizables de la interfaz de usuario del frontend (React) y los módulos/servicios clave del backend (FastAPI, n8n).
*   **04_ESTILOS_Y_UI.md:** Define el sistema de diseño del frontend, la paleta de colores, tipografía (Tailwind CSS y shadcn/ui) y convenciones de estilo.
*   **05_VISTAS_Y_PANTALLAS.md:** Describe cada pantalla principal de la aplicación móvil, su propósito, componentes utilizados y estado manejado (con @tanstack/react-query).
*   **06_LOGICA_DE_NEGOCIO.md:** Documenta las reglas de negocio críticas, la lógica de las tareas agénticas en n8n/FastAPI y cualquier máquina de estado relevante.
*   **07_VALOR_AGREGADO.md:** Incluye principios de diseño específicos de uWuzi-Assist, registro de decisiones arquitectónicas (ADRs), la estrategia de testing para frontend y backend, guía de contribución y el procedimiento de despliegue (incluyendo la compilación del .apk y la configuración del backend con Docker).

Utilice esta documentación como referencia para entender el funcionamiento interno del proyecto, sus fundamentos de diseño y como guía para futuras modificaciones o extensiones.
