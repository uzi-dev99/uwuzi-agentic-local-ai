# /DOCS/02_DIAGRAMA_DE_FLUJO.md: Diagramas de Flujo de uWuzi-Assist

Este documento visualiza los flujos de usuario y lógicos más importantes del proyecto "uWuzi-Assist" utilizando diagramas de flujo en formato Mermaid.

## Flujo de Inicialización de la App y "Autenticación" del Administrador

Dado que uWuzi-Assist está diseñado principalmente para un único usuario administrador (el propietario del PC local), el flujo de "autenticación" se centra en la inicialización de la aplicación y la verificación de la configuración del usuario administrador.

```mermaid
graph TD
    A[Inicio de la Aplicación Móvil (.apk)] --> B{¿Existe 'user' en Local Storage?};
    B -- Sí (Usuario Configurado) --> C[Cargar datos del usuario desde Local Storage];
    C --> D[Aplicación lista para usarse (Modo Chat/Agente)];
    B -- No (Primera Vez / No Configurado) --> E[Mostrar Pantalla de Configuración/Login Inicial];
    E --> F{Usuario introduce URL del Backend y (opcionalmente) credenciales};
    F -- Guardar Configuración --> G[Guardar URL del Backend y datos de 'user' en Local Storage];
    G --> D;
    E -- Usuario Cancela/Retrocede --> H[Aplicación en estado limitado (requiere configuración)];

    classDef appevent fill:#D6EAF8,stroke:#3498DB,stroke-width:2px;
    classDef decision fill:#FDEBD0,stroke:#F39C12,stroke-width:2px;
    classDef uiaction fill:#D5F5E3,stroke:#2ECC71,stroke-width:2px;
    classDef datastore fill:#EBDEF0,stroke:#8E44AD,stroke-width:2px;

    class A,C,D,H appevent;
    class B,F decision;
    class E,G uiaction;
```
*Nota: El "Login Inicial" es actualmente un mock, y se enfoca en configurar la conexión al backend. La verdadera autenticación puede ser manejada por Supabase si se expande a múltiples usuarios, o por un token simple si es solo para el admin.*

## Flujo de Función Crítica 1: Ejecución de Comando en Modo Agente (Ej: Crear Evento de Calendario)

```mermaid
graph TD
    U[Usuario introduce comando en modo 'Agente' en App Móvil (ej: "Crear evento...")] --> MA1[App Móvil valida entrada];
    MA1 -- Comando Válido --> MA2[App Móvil muestra 'isWaitingLongResponse' (si aplica) y envía petición HTTP a FastAPI];
    MA2 -- POST /api/v1/agent/execute --> FAPI1[FastAPI recibe y valida la petición];
    FAPI1 -- Datos Válidos --> FAPI2[FastAPI reenvía comando a Webhook de n8n];
    FAPI2 -- POST a n8n Workflow --> N8N1[n8n: Workflow de Agente se activa];
    N8N1 --> N8N2{n8n: Parsea comando (puede usar Ollama para NLP)};
    N8N2 --> N8N3[n8n: Interactúa con herramienta externa (ej: API de Calendario, Supabase)];
    N8N3 -- Resultado de Herramienta --> N8N4[n8n: Formula respuesta (éxito/error)];
    N8N4 -- Respuesta HTTP --> FAPI3[FastAPI recibe respuesta de n8n];
    FAPI3 --> MA3[App Móvil recibe respuesta de FastAPI];
    MA3 --> MA4[App Móvil actualiza UI: muestra resultado (éxito/error), oculta 'isWaitingLongResponse'];
    MA4 --> U_END[Usuario ve el resultado del comando];

    FAPI1 -- Datos Inválidos --> FAPI_ERR[FastAPI retorna error HTTP a App Móvil];
    FAPI_ERR --> MA3;
    N8N2 -- Error de Parseo/NLP --> N8N_ERR[n8n: Formula respuesta de error];
    N8N_ERR --> FAPI3;
    N8N3 -- Error de Herramienta --> N8N_ERR;

    classDef useraction fill:#FCF3CF,stroke:#F1C40F,stroke-width:2px;
    classDef mobileapp fill:#D6EAF8,stroke:#3498DB,stroke-width:2px;
    classDef fastapi fill:#FDEDEC,stroke:#E74C3C,stroke-width:2px;
    classDef n8n fill:#E8DAEF,stroke:#9B59B6,stroke-width:2px;
    classDef ollama fill:#E6FFFB,stroke:#1ABC9C,stroke-width:2px;

    class U,U_END useraction;
    class MA1,MA2,MA3,MA4 mobileapp;
    class FAPI1,FAPI2,FAPI3,FAPI_ERR fastapi;
    class N8N1,N8N2,N8N3,N8N4,N8N_ERR n8n;
```

## Flujo de Función Crítica 2: Interacción Directa con IA en Modo Chat

```mermaid
graph TD
    UC[Usuario envía mensaje en modo 'Chat' en App Móvil] --> MC1[App Móvil añade mensaje a la UI localmente (estado optimista)];
    MC1 --> MC2[App Móvil envía petición HTTP a FastAPI con el mensaje y (opcionalmente) contexto de chat];
    MC2 -- POST /api/v1/chat/completion --> FC1[FastAPI recibe y valida la petición];
    FC1 -- Mensaje Válido --> FC2[FastAPI reenvía mensaje a Ollama (LLM local)];
    FC2 -- Petición a Ollama API --> OLL1[Ollama procesa el mensaje];
    OLL1 -- Respuesta del LLM --> FC3[FastAPI recibe respuesta de Ollama];
    FC3 --> MC3[App Móvil recibe la respuesta completa de FastAPI];
    MC3 --> MC4[App Móvil actualiza UI con la respuesta del AI];
    MC4 --> UC_END[Usuario ve la respuesta del AI];

    FC1 -- Mensaje Inválido --> FC_ERR[FastAPI retorna error HTTP a App Móvil];
    FC_ERR --> MC3;
    OLL1 -- Error en Ollama --> OLL_ERR[Ollama retorna error a FastAPI];
    OLL_ERR --> FC3;

    classDef useraction fill:#FCF3CF,stroke:#F1C40F,stroke-width:2px;
    classDef mobileapp fill:#D6EAF8,stroke:#3498DB,stroke-width:2px;
    classDef fastapi fill:#FDEDEC,stroke:#E74C3C,stroke-width:2px;
    classDef ollama fill:#E6FFFB,stroke:#1ABC9C,stroke-width:2px;

    class UC,UC_END useraction;
    class MC1,MC2,MC3,MC4 mobileapp;
    class FC1,FC2,FC3,FC_ERR fastapi;
    class OLL1,OLL_ERR ollama;
```

## Flujo de Manejo de Errores (General)

Este diagrama muestra cómo se capturan, registran y presentan los errores al usuario.

```mermaid
graph TD
    subgraph "Frontend (App Móvil .apk)"
        direction LR
        FE1[Ocurre un error (ej: fallo de red, error de UI, validación fallida, respuesta de API inesperada)] --> FE2{¿Error capturado por try/catch o Error Boundary?};
        FE2 -- Sí --> FE3[Se muestra un mensaje de error amigable al usuario en la UI];
        FE3 --> FE4[Se registra el error en la consola del navegador/dispositivo (opcional)];
        FE4 --> FE5[ (Futuro) Se envía el error a un servicio de logging remoto];
        FE2 -- No (Error no capturado) --> FE6[Error global de JavaScript/React];
        FE6 --> FE5;
    end

    subgraph "Backend (FastAPI, n8n, Ollama)"
        direction LR
        BE1[Ocurre un error (ej: excepción en FastAPI, error en workflow n8n, fallo de Ollama)] --> BE2{¿Error esperado/controlado?};
        BE2 -- Sí (ej: Error de validación en FastAPI, error de nodo en n8n) --> BE3[Se genera una respuesta de error HTTP adecuada (ej: 400, 422, 503)];
        BE3 -- Envía respuesta al Cliente --> FE_REC_ERR[App Móvil recibe respuesta de error];
        FE_REC_ERR --> FE3;
        BE3 --> BE_LOG1[Se registra el error con nivel apropiado (WARN, ERROR) y contexto en logs de Docker/servidor];

        BE2 -- No (Excepción inesperada en FastAPI) --> BE4[Middleware global de manejo de errores en FastAPI captura la excepción];
        BE4 --> BE5[Se genera una respuesta de error HTTP genérica (ej: 500 Internal Server Error)];
        BE5 -- Envía respuesta al Cliente --> FE_REC_ERR;
        BE4 --> BE_LOG2[Se registra el error crítico con stack trace y contexto detallado en logs];

        N8N_ERR_WF[n8n: Error dentro de un workflow] --> N8N_LOG[n8n registra error en su UI/logs];
        N8N_LOG --> BE3; %% n8n puede retornar un error HTTP que FastAPI maneja

        OLL_ERR_PROC[Ollama: Error durante procesamiento de LLM] --> OLL_LOG[Ollama registra error en sus logs];
        OLL_LOG --> BE3; %% Ollama API retorna error que FastAPI maneja
    end

    subgraph "Servicios de Logging/Monitoreo (Futuro/Opcional)"
        LS[Sistema de Logging Centralizado (ej: Grafana Loki, Sentry auto-hospedado)]
        FE5 --> LS;
        BE_LOG1 --> LS;
        BE_LOG2 --> LS;
        LS --> ALERT[Alertas a administrador para errores críticos];
    end
```

Estos diagramas deben ser revisados y adaptados para reflejar con precisión los flujos específicos de "uWuzi-Assist" a medida que evoluciona.
