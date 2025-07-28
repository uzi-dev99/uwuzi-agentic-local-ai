import httpx
import os
import json
from typing import AsyncGenerator, List, Dict
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Obtener la URL de Ollama desde las variables de entorno
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
AGENT_ROUTER_MODEL = os.getenv("AGENT_ROUTER_MODEL", "qwen2.5:7b-instruct-q4_K_M")

async def stream_chat_with_ollama(messages: list) -> AsyncGenerator[str, None]:
    """
    Función asíncrona que se comunica con Ollama para el chat conversacional.
    Recibe el historial de mensajes y devuelve chunks de datos en streaming.
    
    Args:
        messages (list): Lista de mensajes del historial del chat
        
    Yields:
        str: Chunks de contenido de la respuesta de Ollama
    """
    # Preparar el payload para la petición
    request_payload = {
        "model": AGENT_ROUTER_MODEL,
        "messages": messages,
        "stream": True
    }
    
    async with httpx.AsyncClient(timeout=None) as client:
        try:
            # Realizar petición POST a Ollama con streaming
            async with client.stream(
                "POST",
                OLLAMA_API_URL,
                json=request_payload
            ) as response:
                response.raise_for_status()
                
                # Procesar cada línea del stream
                async for line in response.aiter_lines():
                    if line:
                        try:
                            # Parsear la línea JSON
                            json_line = json.loads(line)
                            
                            # Extraer el contenido del mensaje
                            if "message" in json_line and "content" in json_line["message"]:
                                content = json_line["message"]["content"]
                                if content:  # Solo yield si hay contenido
                                    yield content
                            
                            # Verificar si el stream ha terminado
                            if json_line.get("done", False):
                                break
                                
                        except json.JSONDecodeError:
                            # Ignorar líneas que no sean JSON válido
                            continue
                            
        except httpx.HTTPStatusError as e:
            yield f"Error HTTP {e.response.status_code}: {e.response.text}"
        except httpx.RequestError as e:
            yield f"Error de conexión: {str(e)}"
        except Exception as e:
            yield f"Error inesperado: {str(e)}"
