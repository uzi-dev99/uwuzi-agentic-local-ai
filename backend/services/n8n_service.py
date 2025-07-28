import httpx
import os
from typing import Dict
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Obtener la URL del webhook de N8N desde las variables de entorno
N8N_SALES_REPORT_WEBHOOK = os.getenv("N8N_SALES_REPORT_WEBHOOK")

async def trigger_sales_report(params: dict) -> Dict[str, str]:
    """
    Función asíncrona que activa el workflow de reporte de ventas en N8N.
    
    Args:
        params (dict): Parámetros para el reporte de ventas
        
    Returns:
        Dict[str, str]: Diccionario con el estado de la operación
    """
    if not N8N_SALES_REPORT_WEBHOOK or N8N_SALES_REPORT_WEBHOOK == "TU_WEBHOOK_DE_N8N_AQUI":
        return {
            "status": "error",
            "message": "Webhook de N8N no configurado correctamente"
        }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Realizar petición POST al webhook de N8N
            response = await client.post(
                N8N_SALES_REPORT_WEBHOOK,
                json=params
            )
            
            response.raise_for_status()
            
            return {
                "status": "success",
                "message": "Reporte de ventas en proceso."
            }
            
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