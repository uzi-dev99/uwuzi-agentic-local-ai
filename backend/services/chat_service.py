import httpx
import os
import json
import logging
from typing import AsyncGenerator, List, Dict, Optional

# Define OLLAMA_BASE_URL and OLLAMA_MODEL, e.g., from environment variables or defaults
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:12b") # Default model

logger = logging.getLogger(__name__)

async def get_ollama_response(
    chat_history: List[Dict[str, str]],
    current_message: str,
    api_key: str, # api_key is kept for consistency, not used for Ollama auth here
    model_name: Optional[str] = None,
    temperature: Optional[float] = None,
    images: Optional[List[str]] = None, # <--- Cambiado de attachments a images
) -> AsyncGenerator[str, None]:
    formatted_messages = []
    for item in chat_history:
        formatted_messages.append(item) # Assuming history items are correctly formatted
    formatted_messages.append({"role": "user", "content": current_message})

    # Lógica simplificada para images
    if images:
        formatted_messages[-1]["images"] = images
        logger.info(f"Added {len(images)} image(s) to the request.")

    final_model_name = model_name if model_name else OLLAMA_MODEL

    request_payload: Dict[str, any] = { # Explicitly type for clarity
        "model": final_model_name,
        "messages": formatted_messages,
        "stream": True,
    }

    if temperature is not None:
        try:
            temp_float = float(temperature)
            request_payload["options"] = {"temperature": temp_float}
        except ValueError:
            logger.warning(f"Invalid temperature value: {temperature}. Proceeding without temperature option.")

    async with httpx.AsyncClient(timeout=None) as client:
        try:
            logger.debug(f"Sending request to Ollama: {json.dumps(request_payload, indent=2)}")
            # --- CORRECCIÓN: usar client.stream para streaming ---
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/chat",
                json=request_payload
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            json_line = json.loads(line)
                            if "message" in json_line and "content" in json_line["message"]:
                                content = json_line["message"]["content"]
                                yield content
                            if json_line.get("done"):
                                logger.info("Ollama stream finished.")
                                break
                        except json.JSONDecodeError:
                            logger.error(f"Failed to decode JSON line: {line}")
        except httpx.HTTPStatusError as e:
            error_message = f"Error: Ollama request failed with status {e.response.status_code}."
            try:
                error_details = e.response.json()
                error_message += f" Details: {error_details.get('error', e.response.text)}"
            except ValueError:
                error_message += f" Details: {e.response.text}"
            logger.error(f"Ollama API request failed: {error_message}", exc_info=True)
            yield error_message
        except httpx.RequestError as e:
            logger.error(f"Ollama API request failed: {e}", exc_info=True)
            yield f"Error: Ollama request failed. Check backend logs and connectivity to {OLLAMA_BASE_URL}."
        except Exception as e:
            logger.error(f"An unexpected error occurred while calling Ollama: {e}", exc_info=True)
            yield "Error: An unexpected error occurred. Please check backend logs."
