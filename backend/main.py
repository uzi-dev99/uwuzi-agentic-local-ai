from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Header
from starlette.datastructures import Headers
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
import logging
import json
import os
import base64
import io
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Importar servicios
from services.chat_service import generate_response
from services.agent_service import orchestrate_agent_response

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="uWuzi-Assist Backend",
    description="API for uWuzi-Assist application, providing chat functionalities with Ollama.",
    version="0.2.4"  # Versión incrementada por cambio en API
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos
    allow_headers=["*"],  # Permitir todas las cabeceras
)
# --- FIN CORS ---

# --- Pydantic Models ---
class Message(BaseModel):
    role: str
    content: str

class FileUpload(BaseModel):
    filename: str
    content_type: str
    file_data: str  # data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...

class AgentInvokeRequest(BaseModel):
    messages: List[Message]
    file_uploads: Optional[List[FileUpload]] = []

class WebhookResponse(BaseModel):
    chat_id: Optional[str] = None
    content: str
    status: Optional[str] = "success"
    timestamp: Optional[str] = None
    metadata: Optional[Dict] = None


# --- Endpoints ---

@app.post("/api/v1/chat/direct")
async def direct_chat_endpoint(request: Request):
    """
    Endpoint para comunicación directa con el modelo multimodal.
    Recibe el historial de chat y opcionalmente archivos adjuntos.
    Maneja tanto 'application/json' como 'multipart/form-data'.
    """
    try:
        content_type = request.headers.get('content-type', '')
        
        if 'multipart/form-data' in content_type:
            form = await request.form()
            messages_str = form.get('messages')
            if not messages_str:
                raise HTTPException(status_code=400, detail="'messages' field is required in form data.")
            messages_list = json.loads(messages_str)
            files = form.getlist('files')
        elif 'application/json' in content_type:
            data = await request.json()
            messages_list = data.get('messages')
            if not messages_list:
                raise HTTPException(status_code=400, detail="'messages' field is required in JSON body.")
            files = [] # No files in JSON mode
        else:
            raise HTTPException(status_code=415, detail=f"Unsupported media type: {content_type}")

        logger.info(f"Received direct chat request with {len(messages_list)} messages.")
        response_data = await generate_response(messages=messages_list, files=files)
        return JSONResponse(content=response_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for messages.")
    except Exception as e:
        logger.error(f"Error in direct_chat_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/agent/invoke")
async def agent_invoke(payload: AgentInvokeRequest):
    """
    Invoca el workflow del agente orquestador.
    Recibe una carga JSON con mensajes y archivos codificados en Base64.
    """
    try:
        logger.info(f"🔍 Agent invoke request received with {len(payload.messages)} messages and {len(payload.file_uploads)} files.")
        
        reconstructed_files = []
        for file_upload in payload.file_uploads:
            try:
                # Extraer metadatos y datos base64
                header, encoded_data = file_upload.file_data.split(",", 1)
                file_bytes = base64.b64decode(encoded_data)
                
                # Crear un objeto similar a UploadFile para compatibilidad
                file_like_object = io.BytesIO(file_bytes)
                
                # Corregir la instanciación de UploadFile
                file_headers = Headers({'content-type': file_upload.content_type})
                reconstructed_file = UploadFile(
                    filename=file_upload.filename,
                    file=file_like_object,
                    headers=file_headers
                )
                reconstructed_files.append(reconstructed_file)
                logger.info(f"📄 Successfully reconstructed file: {file_upload.filename} ({len(file_bytes)} bytes)")
            except Exception as e:
                logger.error(f"Failed to decode and reconstruct file {file_upload.filename}: {e}")
                # Opcional: decidir si continuar o lanzar un error
                # raise HTTPException(status_code=400, detail=f"Invalid Base64 data for file {file_upload.filename}")

        # Convertir mensajes Pydantic a dicts
        messages_list = [msg.dict() for msg in payload.messages]

        logger.info(f"Invoking agent with {len(messages_list)} messages and {len(reconstructed_files)} reconstructed files.")
        response_data = await orchestrate_agent_response(messages=messages_list, files=reconstructed_files)
        
        return JSONResponse(content=response_data)
    except HTTPException as e:
        raise e # Re-raise HTTPException para preservar el estado y detalle
    except Exception as e:
        logger.error(f"Error in agent_invoke: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/webhook/response")
async def webhook_response_handler(response_data: WebhookResponse, 
                                 x_api_key: Optional[str] = Header(None)):
    """
    Endpoint para recibir respuestas de N8N via webhook.
    Procesa la respuesta y prepara notificación para el usuario.
    """
    try:
        # Validar API key
        expected_api_key = os.getenv("API_KEY_SECRET")
        if expected_api_key and x_api_key != expected_api_key:
            logger.warning(f"Invalid API key in webhook response: {x_api_key}")
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        logger.info(f"Webhook response received: {response_data.content[:100]}...")
        
        # TODO: Implementar sistema de notificaciones (FASE 5)
        # Por ahora, solo loggear la respuesta
        logger.info(f"Response for chat {response_data.chat_id}: {response_data.status}")
        
        # Respuesta de confirmación a N8N
        return {
            "status": "received",
            "message": "Webhook response processed successfully",
            "chat_id": response_data.chat_id
        }
        
    except Exception as e:
        logger.error(f"Error processing webhook response: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def read_root():
    return {"message": "Welcome to uWuzi-Assist Backend. Use /docs for API documentation."}

# If running directly (e.g. uvicorn main:app --reload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
