# 8. Documentación del Backend

El backend de Wuzi Chat AI está construido con FastAPI y proporciona un sistema de agentes inteligentes que pueden manejar diferentes tipos de solicitudes del usuario.

## Arquitectura del Backend

### Tecnologías Principales

- **FastAPI**: Framework web moderno y rápido para construir APIs con Python
- **Ollama**: Motor de IA local para el procesamiento de lenguaje natural
- **N8N**: Plataforma de automatización para workflows complejos
- **Pydantic**: Validación de datos y serialización

### Estructura del Proyecto

```
backend/
├── main.py                 # Punto de entrada de la aplicación FastAPI
├── models/
│   ├── __init__.py
│   └── agent_models.py     # Modelos de datos Pydantic
├── services/
│   ├── __init__.py
│   ├── agent_service.py    # Servicio principal del agente
│   ├── chat_service.py     # Servicio de chat con Ollama
│   └── n8n_service.py      # Integración con N8N
├── files/                  # Directorio para archivos temporales
├── requirements.txt        # Dependencias de Python
├── Dockerfile             # Configuración de Docker
└── .env                   # Variables de entorno
```

## Endpoints de la API

### POST /api/v1/agent/invoke

**Descripción**: Endpoint principal para invocar el agente de IA.

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Mensaje del usuario"
    }
  ]
}
```

**Response**: Streaming response en formato NDJSON (Newline Delimited JSON)

**Ejemplo de respuesta**:
```
{"content": "Hola, "}
{"content": "¿en qué "}
{"content": "puedo ayudarte?"}
```

### GET /

**Descripción**: Endpoint de bienvenida y verificación de estado.

**Response**:
```json
{
  "message": "Welcome to uWuzi-Assist Backend. Use /docs for API documentation."
}
```

## Sistema de Agentes

### Clasificación de Intenciones

El backend utiliza un sistema de clasificación de intenciones para determinar cómo procesar cada solicitud del usuario:

1. **conversational_chat**: Para conversaciones generales, preguntas y charla casual
2. **sales_report_workflow**: Para solicitudes relacionadas con reportes de ventas y análisis comerciales

### Flujo de Procesamiento

1. **Recepción**: El endpoint `/api/v1/agent/invoke` recibe los mensajes del frontend
2. **Clasificación**: El `agent_service.py` analiza el último mensaje para determinar la intención
3. **Enrutamiento**: Según la intención clasificada:
   - **Conversational Chat**: Se envía a `chat_service.py` para procesamiento con Ollama
   - **Sales Report**: Se activa un workflow en N8N a través de `n8n_service.py`
4. **Respuesta**: Se devuelve una respuesta en streaming al frontend

## Servicios

### Agent Service (`agent_service.py`)

**Función principal**: `invoke_agent(request_data: dict)`
- Punto de entrada principal para todas las solicitudes
- Clasifica la intención del usuario
- Enruta la solicitud al servicio apropiado
- Maneja errores y excepciones

**Función de clasificación**: `classify_intent(user_prompt: str)`
- Utiliza Ollama para analizar el mensaje del usuario
- Determina si es una conversación general o una solicitud de reporte
- Devuelve la categoría de intención

### Chat Service (`chat_service.py`)

- Maneja la comunicación directa con Ollama
- Procesa conversaciones generales
- Proporciona respuestas en streaming
- Gestiona el historial de conversación

### N8N Service (`n8n_service.py`)

- Integra con workflows de N8N
- Activa procesos automatizados para reportes de ventas
- Maneja la comunicación con sistemas externos
- Procesa solicitudes complejas que requieren múltiples pasos

## Variables de Entorno

### Backend (.env)

```bash
# Configuración de Ollama
OLLAMA_API_URL=http://localhost:11434/api/chat
AGENT_ROUTER_MODEL=llama3

# Configuración de N8N (si aplica)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/...

# Otras configuraciones
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
```

### Frontend (.env.local)

```bash
# URL del backend para la comunicación del frontend
VITE_BACKEND_API_URL=http://localhost:8000/api/v1

# Para producción, usar la URL del servidor desplegado:
# VITE_BACKEND_API_URL=https://tu-backend.dominio.com/api/v1
```

## Configuración CORS

El backend está configurado para permitir solicitudes desde los siguientes orígenes:
- `http://localhost:5173` (desarrollo del frontend)
- `http://localhost:8080`
- `http://localhost:8081`
- `http://localhost:5466`
- `http://localhost`

## Manejo de Errores

- **Errores de clasificación**: Fallback a conversación general
- **Errores de Ollama**: Respuesta de error estructurada
- **Errores de N8N**: Mensaje de error específico
- **Errores generales**: Respuesta JSON con detalles del error

## Logging

El backend utiliza el sistema de logging estándar de Python con nivel INFO para:
- Registro de solicitudes entrantes
- Errores y excepciones
- Estados de los servicios
- Respuestas de workflows

## Despliegue

### Desarrollo Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

```bash
# Construir imagen
docker build -t wuzi-backend .

# Ejecutar contenedor
docker run -p 8000:8000 wuzi-backend
```

## Integración con el Frontend

El frontend se comunica con el backend a través del `backendService.ts` que:
- Envía mensajes al endpoint `/api/v1/agent/invoke`
- Procesa respuestas en streaming
- Maneja errores de conexión
- Adapta el formato de mensajes entre frontend y backend

Para más detalles sobre la integración, consulta el [Flujo de Datos y Servicios](./05-Flujo-de-Datos-y-Servicios.md).