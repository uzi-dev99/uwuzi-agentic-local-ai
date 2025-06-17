# /DOCS/06_LOGICA_DE_NEGOCIO.md: Lógica de Negocio de uWuzi-Assist

Este documento detalla las reglas de negocio críticas y la lógica de estado implementada en "uWuzi-Assist". El objetivo es proporcionar una comprensión clara de cómo opera el sistema más allá de la simple estructura del código.

## Reglas de Negocio Clave

A continuación, se describen reglas de negocio específicas que son fundamentales para el funcionamiento de uWuzi-Assist.

---

### Regla 1: Distinción entre Modos 'Chat' y 'Agente'

uWuzi-Assist opera con dos modos principales de interacción, seleccionables por el usuario en la interfaz de `ChatView`:

*   **Modo 'Chat':**
    *   **Descripción:** Diseñado para interacciones conversacionales directas, rápidas y responsivas con el modelo de lenguaje local (Ollama). Es el modo por defecto para una experiencia de chatbot tradicional.
    *   **Lógica:**
        1.  El usuario envía un mensaje desde `ChatView`.
        2.  La aplicación móvil envía la petición a un endpoint específico en FastAPI (ej: `/api/v1/chat/completion`).
        3.  FastAPI reenvía el mensaje directamente al servicio Ollama.
        4.  Ollama procesa el mensaje usando el LLM configurado y devuelve la respuesta.
        5.  FastAPI transmite la respuesta de Ollama de vuelta a `ChatView`.
    *   **Caso de Uso Primario:** Preguntas y respuestas rápidas, generación de texto simple, lluvia de ideas, conversación general con la IA.

*   **Modo 'Agente':**
    *   **Descripción:** Utilizado para ejecutar comandos que requieren procesamiento complejo, flujos de trabajo de múltiples pasos (potencialmente involucrando varias herramientas o APIs externas configuradas por el usuario), o tareas que pueden ser de más larga duración.
    *   **Lógica:**
        1.  El usuario envía un comando (ej: "crea un evento de calendario para mañana a las 10am sobre 'reunión de equipo'") desde `ChatView`.
        2.  La aplicación móvil envía la petición a un endpoint diferente en FastAPI (ej: `/api/v1/agent/execute`).
        3.  FastAPI valida el comando y lo reenvía a un webhook específico en n8n.
        4.  n8n activa un flujo de trabajo predefinido o dinámico que orquesta la tarea. Esto puede incluir:
            *   Parseo de la intención y entidades del comando (posiblemente usando Ollama).
            *   Interacción con otras instancias de Ollama para razonamiento o generación de sub-pasos.
            *   Llamadas a APIs externas (ej: Google Calendar, email) a través de nodos de n8n.
            *   Consultas o almacenamiento de datos en Supabase.
        5.  n8n finalmente retorna un resultado (éxito o error con detalles) a FastAPI.
        6.  FastAPI transmite este resultado a `ChatView`.
    *   **Caso de Uso Primario:** Gestión de calendario, envío de correos electrónicos, organización de tareas, procesamiento de información para el dashboard, cualquier tarea que requiera una secuencia de acciones o interacción con otros servicios más allá del LLM básico.

---

### Regla 2: Manejo de Tareas de Larga Duración (Modo Agente)

*   **Descripción:** La interfaz de usuario (`ChatView`) debe proporcionar retroalimentación adecuada cuando un comando en modo 'Agente' podría tomar un tiempo considerable para completarse (ej: varios segundos hasta minutos para flujos complejos en n8n).
*   **Lógica:**
    1.  Cuando el usuario envía un comando en modo 'Agente', la aplicación móvil (`ChatView`) puede activar inmediatamente un indicador visual de "procesamiento largo". Esto se gestiona a través del estado `isWaitingLongResponse` asociado al chat específico (obtenido del hook `useChat`).
    2.  Mientras `isWaitingLongResponse` es `true`:
        *   La UI muestra un indicador (ej: `LongProcessIndicator.tsx`) para informar al usuario que la tarea está en curso.
        *   Opcionalmente, la capacidad de enviar nuevos mensajes/comandos en *ese mismo chat* podría estar temporalmente deshabilitada o encolada para evitar conflictos hasta que la tarea actual finalice.
        *   El usuario puede tener una opción para intentar cancelar el proceso a través de un botón en `LongProcessIndicator`.
    3.  El backend (n8n, a través de FastAPI) debe eventualmente retornar un estado final (éxito con resultado, o error con detalles) a la aplicación móvil.
    4.  Al recibir la respuesta final, `ChatView` actualiza `isWaitingLongResponse` a `false`, oculta el indicador y muestra el resultado o error al usuario.

---

### Regla 3: Agregación de Datos del Dashboard Personal (`DashboardView`)

*   **Descripción (Conceptual):** El `DashboardView` está diseñado para ofrecer al usuario una vista consolidada de datos personales relevantes, como seguimiento de hábitos, gastos, ideas, o resúmenes de actividad.
*   **Lógica (Conceptual):**
    1.  **Almacenamiento de Datos:**
        *   Los datos brutos para los widgets del dashboard (ej: registros de hábitos, transacciones de gastos, notas de ideas, lista de tareas) se almacenan en tablas específicas dentro de la base de datos Supabase.
        *   El usuario ingresaría estos datos a través de la interfaz de uWuzi-Assist (posiblemente mediante comandos de agente o interacciones directas en el dashboard).
    2.  **Consulta de Datos:**
        *   FastAPI expone endpoints seguros (ej: `/api/v1/dashboard/widget_data?widget=habits`) que la `DashboardView` consume para obtener los datos necesarios para cada widget.
        *   Estos endpoints de FastAPI consultan directamente a Supabase para recuperar la información.
    3.  **Procesamiento y Agregación (Opcional, Avanzado):**
        *   Para insights más complejos o reportes generados (ej: "Resumen de gastos del mes", "Progreso semanal de hábitos"), se podría utilizar n8n:
            *   Un flujo de n8n podría ser activado (por FastAPI, o programado) para leer datos de Supabase.
            *   Ollama podría ser invocado dentro del flujo de n8n para analizar estos datos, generar resúmenes en lenguaje natural, o identificar patrones.
            *   El resultado procesado por n8n se almacenaría de nuevo en Supabase o se expondría a través de un endpoint de FastAPI.
    4.  **Visualización:**
        *   El frontend (`DashboardView` y sus componentes widget como `HabitTracker.tsx`, `ExpenseChartWidget.tsx`, `TodoWidget.tsx`) utiliza los datos obtenidos de FastAPI (directos o procesados) para renderizar las visualizaciones y la información al usuario.

---

## Máquinas de Estado (State Machines)

A continuación, se presenta un ejemplo de máquina de estados para un flujo crítico.

### Máquina de Estados: Ciclo de Vida de un Comando de Agente

*   **Descripción:** Modela el ciclo de vida típico de un comando enviado por el usuario en modo 'Agente', desde su creación hasta la visualización del resultado.
*   **Diagrama de Estados (Mermaid):**
    ```mermaid
    stateDiagram-v2
        direction LR
        [*] --> ENVIADO_POR_USUARIO : Usuario envía comando en modo Agente
        ENVIADO_POR_USUARIO --> RECIBIDO_FASTAPI : App Móvil envía a FastAPI
        RECIBIDO_FASTAPI --> EN_PROCESO_N8N : FastAPI dispara Webhook n8n
        state "UI: Muestra 'isWaitingLongResponse'" as UI_ESPERANDO
        EN_PROCESO_N8N --> UI_ESPERANDO : (Feedback Visual en UI)

        subgraph Proceso en n8n
            direction LR
            UI_ESPERANDO --> PROCESANDO_PASOS_N8N : n8n ejecuta workflow (puede usar Ollama, DB, APIs externas)
            PROCESANDO_PASOS_N8N --> FINALIZADO_N8N_EXITO : Workflow completado con éxito
            PROCESANDO_PASOS_N8N --> FINALIZADO_N8N_FALLO : Error en workflow
        end

        FINALIZADO_N8N_EXITO --> RESPUESTA_A_FASTAPI_EXITO : n8n responde a FastAPI
        FINALIZADO_N8N_FALLO --> RESPUESTA_A_FASTAPI_FALLO : n8n responde a FastAPI

        RESPUESTA_A_FASTAPI_EXITO --> MOSTRADO_USUARIO_EXITO : FastAPI envía resultado a App Móvil, UI actualiza
        RESPUESTA_A_FASTAPI_FALLO --> MOSTRADO_USUARIO_FALLO : FastAPI envía error a App Móvil, UI actualiza

        MOSTRADO_USUARIO_EXITO --> [*]
        MOSTRADO_USUARIO_FALLO --> [*]
    ```
*   **Estados:**
    *   `ENVIADO_POR_USUARIO`: El usuario ha introducido y enviado un comando en modo 'Agente' desde `ChatView`.
    *   `RECIBIDO_FASTAPI`: La aplicación móvil ha enviado la solicitud y FastAPI la ha recibido.
    *   `EN_PROCESO_N8N`: FastAPI ha validado la solicitud y ha activado el webhook correspondiente en n8n. n8n ha comenzado a ejecutar el flujo de trabajo.
    *   `UI_ESPERANDO`: El estado en la UI (`ChatView`) donde `isWaitingLongResponse` es `true`, mostrando un indicador al usuario.
    *   `PROCESANDO_PASOS_N8N`: n8n está activamente ejecutando los pasos definidos en el workflow (puede incluir lógica, llamadas a Ollama, Supabase, o APIs externas).
    *   `FINALIZADO_N8N_EXITO`: El workflow de n8n ha completado todos sus pasos con éxito y ha generado un resultado.
    *   `FINALIZADO_N8N_FALLO`: El workflow de n8n ha encontrado un error durante su ejecución.
    *   `RESPUESTA_A_FASTAPI_EXITO`: n8n ha enviado una respuesta HTTP exitosa (con el resultado) a la llamada de FastAPI que lo esperaba (si el webhook de n8n está configurado para esperar y responder).
    *   `RESPUESTA_A_FASTAPI_FALLO`: n8n ha enviado una respuesta HTTP de error a FastAPI.
    *   `MOSTRADO_USUARIO_EXITO`: FastAPI ha reenviado el resultado exitoso a la aplicación móvil, y `ChatView` ha actualizado la interfaz para mostrarlo, y `isWaitingLongResponse` se establece en `false`.
    *   `MOSTRADO_USUARIO_FALLO`: FastAPI ha reenviado el mensaje de error a la aplicación móvil, y `ChatView` ha actualizado la interfaz para mostrarlo, y `isWaitingLongResponse` se establece en `false`.
*   **Transiciones y Condiciones:**
    *   Usuario envía comando -> `ENVIADO_POR_USUARIO`.
    *   App móvil realiza llamada API -> `RECIBIDO_FASTAPI`.
    *   FastAPI llama a webhook de n8n -> `EN_PROCESO_N8N`.
    *   Paralelamente, la UI entra en estado `UI_ESPERANDO` basado en la lógica de `useChat` al enviar el comando.
    *   n8n comienza la ejecución de su flujo -> `PROCESANDO_PASOS_N8N`.
    *   Todos los pasos del flujo de n8n se completan sin errores -> `FINALIZADO_N8N_EXITO`.
    *   Un error ocurre en algún paso del flujo de n8n -> `FINALIZADO_N8N_FALLO`.
    *   n8n envía su respuesta HTTP a FastAPI -> `RESPUESTA_A_FASTAPI_EXITO` o `RESPUESTA_A_FASTAPI_FALLO`.
    *   FastAPI recibe la respuesta de n8n y la reenvía a la app móvil. La app móvil actualiza la UI -> `MOSTRADO_USUARIO_EXITO` o `MOSTRADO_USUARIO_FALLO`.

Este ciclo de vida es fundamental para entender cómo se procesan las tareas más complejas en uWuzi-Assist y cómo la interfaz de usuario refleja estos estados.
