# /DOCS/07_VALOR_AGREGADO.md: Valor Agregado y Principios de uWuzi-Assist

Este documento contiene información adicional de alto valor que complementa la documentación técnica de "uWuzi-Assist". Incluye principios de diseño, un registro de decisiones arquitectónicas (ADR), la estrategia de testing, una guía de contribución y el procedimiento de despliegue.

## Principios de Diseño y Filosofía

Estos son los principios de diseño y filosofías de desarrollo de software que guían la construcción y evolución de "uWuzi-Assist":

*   **Asistente de IA Privado y Local Primero:** El núcleo del diseño de uWuzi-Assist es la privacidad del usuario y el control local. Se prioriza el uso de herramientas y modelos de IA que puedan ejecutarse en el hardware del usuario (PC local), minimizando la dependencia de servicios en la nube para las funciones esenciales de IA y la soberanía de los datos.
*   **Enfoque de Usuario Único (Personal):** La aplicación está concebida y diseñada para ser utilizada primordialmente por un único usuario: el administrador y propietario del backend local. Esto simplifica ciertos aspectos de la gestión de usuarios y la seguridad, centrándose en la experiencia personal.
*   **Interacción Móvil con Backend Potente Local:** El objetivo es facilitar una interacción fluida y conveniente desde un dispositivo móvil (Android .apk) con un conjunto de herramientas de IA (Ollama), automatización (n8n) y gestión de datos (Supabase) que se ejecutan en el PC local del usuario.
*   **KISS (Keep It Simple, Stupid):** Se busca la simplicidad en las soluciones. Por ejemplo, el sistema de "autenticación" inicial es un simple chequeo en `localStorage` para el usuario administrador. La complejidad se introduce solo donde es necesaria.
*   **DRY (Don't Repeat Yourself):** Se aplica tanto en el frontend (componentes reutilizables, hooks personalizados como `useChat`) como en la configuración del backend (uso de Docker Compose para definir servicios, scripts reutilizables para la gestión).

## Registro de Decisiones Arquitectónicas (ADR - Architectural Decision Record)

Los ADRs documentan decisiones arquitectónicas importantes, su contexto y sus consecuencias.

---
### ADR-001: Elección de Stack de Backend Local (Docker, FastAPI, n8n, Ollama, Supabase)

*   **Título:** Adopción de un Stack Contenerizado Local para el Backend de IA y Automatización.
*   **Fecha:** (Fecha de inicio del proyecto conceptual)
*   **Estado:** Aceptado
*   **Contexto:**
    *   Necesidad de un backend robusto, flexible, privado y personalizable para potenciar un asistente de IA con capacidades agénticas.
    *   Requisito de ejecutar modelos de lenguaje grandes (LLMs) localmente por privacidad y coste.
    *   Deseo de integrar flujos de trabajo de automatización complejos.
*   **Decisión:**
    *   Se optó por un stack de backend que se ejecuta localmente en el PC del usuario, orquestado por Docker y Docker Compose.
    *   **FastAPI (Python):** Elegido como el framework principal para construir la API RESTful que comunica el frontend móvil con los servicios de backend.
    *   **n8n:** Seleccionado para la creación y gestión de flujos de trabajo agénticos y automatizaciones.
    *   **Ollama:** Integrado para servir LLMs localmente, proporcionando las capacidades de IA conversacional y de procesamiento de lenguaje.
    *   **Supabase (PostgreSQL):** Utilizado como la base de datos relacional para persistir datos de la aplicación como historial de chats, configuraciones, datos del dashboard, etc.
    *   **(Opcional) Caddy/Cloudflare Tunnel:** Para la exposición segura y gestión del acceso al endpoint de FastAPI desde la red local o externamente.
*   **Consecuencias (Positivas):**
    *   Control total sobre los datos y los modelos de IA.
    *   Sin costes recurrentes de APIs en la nube para las funciones principales de IA.
    *   Alta flexibilidad para personalizar y extender los servicios.
    *   La contenerización con Docker facilita la configuración y la portabilidad del entorno de backend.
*   **Consecuencias (Negativas/Compromisos):**
    *   Requiere que el usuario gestione y mantenga el servidor local (su PC).
    *   El rendimiento de los LLMs locales depende del hardware del PC del usuario.
    *   La configuración inicial de Docker y los servicios puede ser compleja para usuarios no técnicos (aunque se busca simplificar con `docker-compose`).

---
### ADR-002: Frontend como SPA React (.apk) para Acceso Móvil

*   **Título:** Desarrollo del Frontend como Single Page Application (SPA) con React/Vite, empaquetada como .apk para Android.
*   **Fecha:** (Fecha de inicio del desarrollo del frontend)
*   **Estado:** Aceptado
*   **Contexto:**
    *   Requisito fundamental de poder acceder e interactuar con el asistente personal desde un dispositivo móvil de forma conveniente.
    *   Familiaridad del desarrollador con el ecosistema React/JavaScript.
*   **Decisión:**
    *   Desarrollar el frontend como una SPA utilizando React, Vite (para el entorno de desarrollo y build), y TypeScript.
    *   Empaquetar la SPA resultante como una aplicación Android (.apk) utilizando herramientas como Capacitor o Cordova.
*   **Consecuencias (Positivas):**
    *   Experiencia de usuario fluida y reactiva característica de las SPAs.
    *   Amplio ecosistema de librerías y herramientas de React.
    *   Posibilidad de ofrecer una experiencia cercana a la nativa en el dispositivo móvil.
*   **Consecuencias (Negativas/Compromisos):**
    *   La comunicación con el backend local requiere que el dispositivo móvil y el PC estén en la misma red local, o que el usuario configure un método de acceso seguro externo (VPN, Cloudflare Tunnel, Tailscale, etc.).
    *   El proceso de empaquetado y compilación del .apk añade un paso adicional al ciclo de desarrollo y despliegue.

---
### ADR-003: Uso de `localStorage` para Mocking de API en Desarrollo Inicial del Frontend

*   **Título:** Utilización de `localStorage` (`src/lib/api.ts`) para simular el backend durante el desarrollo temprano del frontend.
*   **Fecha:** (Fase inicial de desarrollo del frontend)
*   **Estado:** Implementado (para desarrollo), Transitorio
*   **Contexto:**
    *   Necesidad de desarrollar y probar rápidamente la interfaz de usuario y los flujos del frontend (HomeView, ChatView) sin una dependencia inmediata en un backend completamente funcional y conectado.
    *   Permitir el desarrollo paralelo del frontend y backend.
*   **Decisión:**
    *   Se implementó una capa de API simulada (`src/lib/api.ts`) que utiliza `localStorage` del navegador para persistir y gestionar datos como chats, carpetas y configuraciones básicas del usuario.
    *   Esta capa imita la firma de las futuras llamadas a la API de FastAPI.
*   **Consecuencias (Positivas):**
    *   Desarrollo y prototipado muy rápido del frontend.
    *   Permite probar la lógica de la UI y la gestión de estado (`@tanstack/react-query` con un backend síncrono simulado) de forma aislada.
    *   Facilita las demos y pruebas iniciales de la aplicación sin necesidad de configurar todo el stack de backend.
*   **Consecuencias (Negativas/Compromisos):**
    *   Esta capa es temporal y **debe ser reemplazada** por llamadas reales a la API de FastAPI para la funcionalidad completa.
    *   No prueba la integración real de red ni el comportamiento asíncrono real del backend.
    *   Los datos almacenados en `localStorage` son específicos del navegador y no persisten entre dispositivos o si se limpia el almacenamiento del navegador.

---

### Backend (PC Local)

*   **Ejecución:** Se ejecuta en el PC local del usuario, gestionado enteramente con Docker y Docker Compose (`docker-compose.yml`).
*   **Componentes:** FastAPI, n8n, Ollama, Supabase (PostgreSQL), y opcionalmente Caddy Server.
*   **Acceso desde la App Móvil:**
    *   **Red Local:** La aplicación móvil necesita poder alcanzar el endpoint de FastAPI (expuesto por Caddy o directamente por FastAPI/Uvicorn) en la dirección IP local del PC y el puerto correspondiente (ej: `http://192.168.1.100:8000`).
    *   **Acceso Externo Seguro (Opcional):** Para usar la app fuera de la red local, el usuario debe configurar un túnel seguro. Opciones populares incluyen:
        *   **Cloudflare Tunnel:** Expone el servicio local a internet a través de un túnel seguro sin abrir puertos en el router.
        *   **Tailscale / ZeroTier:** Crean una red privada virtual (VPN-like) entre dispositivos.
        *   **VPN Personal:** Configurar un servidor VPN en la red local.

### Variables de Entorno

*   **Frontend (Build-time para .apk o Configuración en App):**
    *   `VITE_API_BASE_URL`: La URL base completa para el endpoint de FastAPI del backend local (ej: `http://<IP_LOCAL_PC_O_TUNNEL_HOSTNAME>:<PUERTO>`). Esta es crucial y debe ser accesible desde el dispositivo móvil. Podría necesitar ser configurable en la propia app después de la instalación.
*   **Backend (Docker Compose y archivos `.env`):**
    *   Cada servicio en `docker-compose.yml` (FastAPI, n8n, Supabase, Ollama) tendrá sus propias variables de entorno para configuración de bases de datos, puertos, claves API internas (si las hubiera), configuración de Ollama, etc. Estas se gestionan típicamente a través de archivos `.env` referenciados en el `docker-compose.yml`.

Este documento debe ser un recurso vivo y actualizarse a medida que el proyecto uWuzi-Assist evoluciona.
