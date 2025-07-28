import httpx
import os
import json
from typing import AsyncGenerator, Dict, Any
from dotenv import load_dotenv
from . import chat_service, n8n_service

# Cargar variables de entorno
load_dotenv()

# Obtener configuración desde variables de entorno
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
AGENT_ROUTER_MODEL = os.getenv("AGENT_ROUTER_MODEL", "llama3")

async def classify_intent(user_prompt: str) -> str:
    """
    Función asíncrona para determinar la intención del usuario.
    
    Args:
        user_prompt (str): El mensaje del usuario a clasificar
        
    Returns:
        str: La categoría de intención clasificada
    """
    # System prompt para clasificar la intención
    system_prompt = """
Eres un clasificador de intenciones. Tu trabajo es analizar el mensaje del usuario y determinar su intención.

Categorías disponibles:
- conversational_chat: Para conversaciones generales, preguntas, charla casual
- sales_report_workflow: Para solicitudes relacionadas con reportes de ventas, análisis de ventas, datos comerciales

Responde ÚNICAMENTE con una de estas categorías: conversational_chat o sales_report_workflow

Ejemplos:
- "Hola, ¿cómo estás?" -> conversational_chat
- "¿Puedes ayudarme con algo?" -> conversational_chat
- "Necesito un reporte de ventas" -> sales_report_workflow
- "Muéstrame las ventas del mes" -> sales_report_workflow
- "Genera un análisis de ventas" -> sales_report_workflow
"""
    
    # Preparar mensajes para la clasificación
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    # Payload para petición no streaming
    request_payload = {
        "model": AGENT_ROUTER_MODEL,
        "messages": messages,
        "stream": False
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Realizar petición POST a Ollama (no streaming)
            response = await client.post(
                OLLAMA_API_URL,
                json=request_payload
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Extraer la categoría de la respuesta
            if "message" in result and "content" in result["message"]:
                intent = result["message"]["content"].strip().lower()
                
                # Validar que la respuesta sea una categoría válida
                if "sales_report_workflow" in intent:
                    return "sales_report_workflow"
                else:
                    return "conversational_chat"
            
            # Fallback por defecto
            return "conversational_chat"
            
        except Exception as e:
            # En caso de error, usar conversational_chat como fallback
            print(f"Error en classify_intent: {e}")
            return "conversational_chat"

async def invoke_agent(request_data: dict) -> AsyncGenerator[str, None]:
    """
    Función generadora asíncrona principal que enruta las peticiones según la intención.
    
    Args:
        request_data (dict): Datos de la petición que incluyen los mensajes
        
    Yields:
        str: Chunks de respuesta según el tipo de intención
    """
    try:
        # Extraer mensajes del request_data
        messages = request_data.get("messages", [])
        
        if not messages:
            yield json.dumps({"error": "No se proporcionaron mensajes"}) + "\n"
            return
        
        # Obtener el último mensaje del usuario
        last_message = messages[-1]
        user_prompt = last_message.get("content", "")
        
        if not user_prompt:
            yield json.dumps({"error": "El último mensaje está vacío"}) + "\n"
            return
        
        # Clasificar la intención
        intent = await classify_intent(user_prompt)
        
        # Enrutar según la intención
        if intent == "sales_report_workflow":
            # Activar workflow de N8N para reporte de ventas
            import time
            params = {
                "user_request": user_prompt,
                "timestamp": str(int(time.time() * 1000))  # timestamp en ms
            }
            
            result = await n8n_service.trigger_sales_report(params)
            
            # Devolver resultado como un único chunk
            yield json.dumps(result) + "\n"
            
        else:
            # Por defecto: conversational_chat
            # Usar el servicio de chat con streaming
            async for chunk in chat_service.stream_chat_with_ollama(messages):
                if chunk:
                    # Formatear cada chunk como JSON
                    chunk_data = {"content": chunk}
                    yield json.dumps(chunk_data) + "\n"
                    
    except Exception as e:
        # Manejar errores generales
        error_response = {
            "error": f"Error en invoke_agent: {str(e)}"
        }
        yield json.dumps(error_response) + "\n"