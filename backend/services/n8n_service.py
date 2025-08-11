import httpx
import os
from typing import Dict
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Obtener la URL del webhook de N8N desde las variables de entorno
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")

async def invoke_workflow(data: dict) -> Dict[str, str]:
    """
    Función asíncrona que activa un workflow en N8N a través de un webhook.
    
    Args:
        data (dict): Los datos a enviar al workflow de N8N.
        
    Returns:
        Dict[str, str]: La respuesta del workflow de N8N o un mensaje de error.
    """
    if not N8N_WEBHOOK_URL:
        return {
            "status": "error",
            "message": "Webhook de N8N no configurado correctamente en la variable N8N_WEBHOOK_URL"
        }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            # Realizar petición POST al webhook de N8N
            response = await client.post(
                N8N_WEBHOOK_URL,
                json=data
            )
            
            response.raise_for_status() # Lanza una excepción para errores 4xx/5xx
            
            # Devuelve la respuesta JSON del workflow de N8N
            return response.json()
            
        except httpx.HTTPStatusError as e:
            return {
                "status": "error",
                "message": f"Error HTTP {e.response.status_code}: {e.response.text}"
            }
        except httpx.RequestError as e:
            return {
                "status": "error",
                "message": f"Error de conexión: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error inesperado: {str(e)}"
            }