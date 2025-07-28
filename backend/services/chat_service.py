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

async def generate_response(messages: List[Dict[str, str]], files: Optional[List[UploadFile]]) -> AsyncGenerator[str, None]:
    """
    Genera una respuesta multimodal procesando texto, imágenes y audio.
    """
    if not OLLAMA_API_URL:
        yield json.dumps({"error": "OLLAMA_API_URL no está configurada."})
        return

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
                    yield json.dumps({"error": f"Error al procesar el audio: {e}"})

    # 2. Construir el prompt y el contexto
    # Estrategia de ventana deslizante simple: usar todo el historial
    # para construir un único prompt, que es como funciona el endpoint /api/generate
    context_prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    final_prompt = f"{context_prompt}{audio_transcription}".strip()

    # 3. Construir el payload para Ollama
    payload = {
        "model": MULTIMODAL_MODEL,
        "prompt": final_prompt,
        "stream": True
    }
    if base64_images:
        payload["images"] = base64_images

    logger.info(f"Enviando payload a Ollama. Prompt: '{final_prompt[:100]}...'")

    # 4. Llamar a Ollama y hacer streaming de la respuesta
    async with httpx.AsyncClient(timeout=None) as client:
        try:
            async with client.stream("POST", OLLAMA_API_URL, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            chunk = json.loads(line)
                            yield json.dumps(chunk) # Retransmitir el chunk JSON completo
                            if chunk.get("done"):
                                break
                        except json.JSONDecodeError:
                            logger.warning(f"No se pudo decodificar la línea JSON de Ollama: {line}")
                            continue
        except httpx.HTTPStatusError as e:
            error_msg = e.response.text
            logger.error(f"Error de estado HTTP de Ollama: {e.response.status_code} - {error_msg}")
            yield json.dumps({"error": f"Error del servidor de IA: {error_msg}"})
        except Exception as e:
            logger.error(f"Error inesperado en la comunicación con Ollama: {e}", exc_info=True)
            yield json.dumps({"error": f"Error de conexión con el servidor de IA: {e}"})
