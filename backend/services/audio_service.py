import httpx
import os
from fastapi import UploadFile, HTTPException
import logging

# Configuración del logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar la URL del servicio Whisper desde las variables de entorno
WHISPER_API_URL = os.getenv("WHISPER_API_URL")

async def transcribe_audio(file: UploadFile) -> str:
    """
    Delega la transcripción de un archivo de audio a un microservicio Whisper dedicado.

    Args:
        file: El archivo de audio (UploadFile) a transcribir.

    Returns:
        El texto transcrito.

    Raises:
        HTTPException: Si el servicio de transcripción no está configurado o falla.
    """
    if not WHISPER_API_URL:
        logger.error("La URL del servicio Whisper (WHISPER_API_URL) no está configurada.")
        raise HTTPException(status_code=500, detail="Servicio de transcripción no configurado.")

    try:
        async with httpx.AsyncClient() as client:
            files = {'file': (file.filename, await file.read(), file.content_type)}
            response = await client.post(WHISper_API_URL, files=files, timeout=30.0)

            response.raise_for_status()  # Lanza una excepción para códigos de error HTTP (4xx o 5xx)

            result = response.json()
            transcribed_text = result.get("text", "")
            logger.info(f"Audio transcrito exitosamente. Texto: '{transcribed_text[:50]}...'")
            return transcribed_text

    except httpx.RequestError as e:
        logger.error(f"Error al contactar el servicio de Whisper: {e}")
        raise HTTPException(status_code=503, detail=f"El servicio de transcripción no está disponible: {e}")
    except Exception as e:
        logger.error(f"Error inesperado durante la transcripción: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error interno durante la transcripción: {e}")