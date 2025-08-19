import httpx
import os
from typing import Dict, List
from dotenv import load_dotenv
from fastapi import UploadFile

# Cargar variables de entorno
load_dotenv()

# Obtener la URL del webhook de N8N desde las variables de entorno
# Preferimos N8N_WEBHOOK_URL; aceptamos N8N_CHAT_WEBHOOK_URL como fallback por compatibilidad
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL") or os.getenv("N8N_CHAT_WEBHOOK_URL")
# Notas:
# - Para pruebas en el editor de n8n usa la URL de test:   http://<host>:5678/webhook-test/<path>
#   Recuerda presionar "Listen for test event" antes de enviar la solicitud desde la app.
# - Para producción usa la URL de producción:               http://<host>:5678/webhook/<path>
#   Asegúrate de ACTIVAR el workflow para que el webhook quede registrado.

async def invoke_workflow(data: dict) -> Dict[str, str]:
    """
    Función asíncrona que activa un workflow en N8N a través de un webhook usando JSON.
    
    Args:
        data (dict): Los datos a enviar al workflow de N8N.
        
    Returns:
        Dict[str, str]: La respuesta del workflow de N8N o un mensaje de error.
    """
    if not N8N_WEBHOOK_URL:
        return {
            "content": "Error: Webhook de N8N no configurado correctamente en la variable N8N_WEBHOOK_URL",
            "status": "error"
        }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            # Realizar petición POST al webhook de N8N
            response = await client.post(
                N8N_WEBHOOK_URL,
                json=data
            )
            
            response.raise_for_status() # Lanza una excepción para errores 4xx/5xx
            
            # Intentar parsear como JSON
            try:
                n8n_response = response.json()
            except ValueError:
                n8n_response = {"content": response.text}
            
            # Normalizar la respuesta para que siempre tenga 'content'
            if isinstance(n8n_response, dict) and "content" in n8n_response:
                return n8n_response
            else:
                return {"content": str(n8n_response), "status": "success"}
            
        except httpx.HTTPStatusError as e:
            return {
                "content": f"Error HTTP {e.response.status_code}: {e.response.text}",
                "status": "error"
            }
        except httpx.RequestError as e:
            return {
                "content": f"Error de conexión: {str(e)}",
                "status": "error"
            }
        except Exception as e:
            return {
                "content": f"Error inesperado: {str(e)}",
                "status": "error"
            }

async def invoke_workflow_multipart(form_fields: Dict[str, str], files: List[UploadFile]) -> Dict[str, str]:
    """
    Activa un workflow en N8N re-enviando una solicitud multipart/form-data con archivos.

    Args:
        form_fields (Dict[str, str]): Campos de formulario (p. ej. 'messages' serializado).
        files (List[UploadFile]): Archivos a reenviar.

    Returns:
        Dict[str, str]: Respuesta del workflow de N8N normalizada con 'content'.
    """
    if not N8N_WEBHOOK_URL:
        return {
            "content": "Error: Webhook de N8N no configurado correctamente en la variable N8N_WEBHOOK_URL",
            "status": "error"
        }

    # Preparar payload de archivos para httpx
    files_payload = []
    for f in files:
        try:
            content = await f.read()
        except Exception:
            content = b""
        files_payload.append((
            "files",
            (f.filename or "file", content, f.content_type or "application/octet-stream")
        ))

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                N8N_WEBHOOK_URL,
                data=form_fields,
                files=files_payload
            )
            response.raise_for_status()

            # Intentar parsear como JSON; si falla, devolver texto
            try:
                n8n_response = response.json()
            except ValueError:
                n8n_response = {"content": response.text}

            if isinstance(n8n_response, dict) and "content" in n8n_response:
                return n8n_response
            else:
                return {"content": str(n8n_response), "status": "success"}

        except httpx.HTTPStatusError as e:
            return {
                "content": f"Error HTTP {e.response.status_code}: {e.response.text}",
                "status": "error"
            }
        except httpx.RequestError as e:
            return {
                "content": f"Error de conexión: {str(e)}",
                "status": "error"
            }
        except Exception as e:
            return {
                "content": f"Error inesperado: {str(e)}",
                "status": "error"
            }

async def trigger_sales_report(params: Dict) -> Dict[str, str]:
    """
    Función especializada para activar el workflow de reportes de ventas en N8N.
    Utilizada por agent_service cuando se detecta la intención 'sales_report_workflow'.
    
    Args:
        params (Dict): Parámetros específicos del reporte de ventas
        
    Returns:
        Dict[str, str]: Respuesta del workflow de N8N normalizada con 'content'
    """
    # Usar invoke_workflow con parámetros específicos para reportes
    sales_data = {
        "workflow_type": "sales_report",
        **params
    }
    return await invoke_workflow(sales_data)