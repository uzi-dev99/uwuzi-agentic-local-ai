import httpx
import os
import json
import base64
import logging
from typing import AsyncGenerator, List, Dict, Optional
from fastapi import UploadFile
from dotenv import load_dotenv

# Importar el servicio de audio
from services.audio_service import transcribe_audio

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Constantes del servicio
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL")
MULTIMODAL_MODEL = os.getenv("MULTIMODAL_MODEL", "gemma3:12b")

async def generate_response(messages: List[Dict[str, str]], files: Optional[List[UploadFile]]) -> Dict:
    """
    Genera una respuesta multimodal procesando texto, imágenes y audio.
    Devuelve la respuesta completa como un único objeto JSON.
    """
    if not OLLAMA_API_URL:
        return {"error": "OLLAMA_API_URL no está configurada."}

    base64_images = []
    audio_transcription = ""

    # 1. Procesar archivos adjuntos
    if files:
        for file in files:
            content_type = file.content_type
            if content_type and content_type.startswith("image/"):
                encoded_image = base64.b64encode(await file.read()).decode("utf-8")
                base64_images.append(encoded_image)
                logger.info(f"Imagen '{file.filename}' procesada y codificada en base64.")
            elif content_type and content_type.startswith("audio/"):
                try:
                    transcription = await transcribe_audio(file)
                    audio_transcription += f" {transcription}"
                    logger.info(f"Audio '{file.filename}' transcrito.")
                except Exception as e:
                    logger.error(f"Error al transcribir audio '{file.filename}': {e}")
                    return {"error": f"Error al procesar el audio: {e}"}

    # 2. Construir el prompt y el contexto
    context_prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    final_prompt = f"{context_prompt}{audio_transcription}".strip()

    # 3. Construir el payload para Ollama
    payload = {
        "model": MULTIMODAL_MODEL,
        "prompt": final_prompt,
        "stream": False  # Desactivamos el streaming
    }
    if base64_images:
        payload["images"] = base64_images

    logger.info(f"Enviando payload a Ollama. Prompt: '{final_prompt[:100]}...'")

    # 4. Llamar a Ollama y obtener la respuesta completa
    async with httpx.AsyncClient(timeout=300.0) as client: # Timeout generoso
        try:
            response = await client.post(OLLAMA_API_URL, json=payload)
            response.raise_for_status()
            # La respuesta de Ollama con stream=False es un único objeto JSON
            ollama_response = response.json()
            logger.info("Respuesta completa recibida de Ollama.")
            # Envolvemos la respuesta en nuestra propia estructura
            return {"content": ollama_response.get("response", "")}

        except httpx.HTTPStatusError as e:
            error_msg = e.response.text
            logger.error(f"Error de estado HTTP de Ollama: {e.response.status_code} - {error_msg}")
            return {"error": f"Error del servidor de IA: {error_msg}"}
        except Exception as e:
            logger.error(f"Error inesperado en la comunicación con Ollama: {e}", exc_info=True)
            return {"error": f"Error de conexión con el servidor de IA: {e}"}
