from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
import logging
import json

# Importar servicios
from services.chat_service import generate_response

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="uWuzi-Assist Backend",
    description="API for uWuzi-Assist application, providing chat functionalities with Ollama.",
    version="0.2.3"
)

# --- CORS Middleware ---
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5466",
    "http://localhost:5173",  # Para desarrollo del frontend
    "http://localhost:5174",  # Puerto alternativo para desarrollo del frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- FIN CORS ---

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

# --- Endpoints ---

@app.post("/api/v1/chat/direct")
async def direct_chat_endpoint(
    messages: str = Form(...),
    files: Optional[List[UploadFile]] = File(None)
):
    """
    Endpoint para comunicación directa con el modelo multimodal.
    Recibe el historial de chat y archivos adjuntos (imágenes, audio).
    """
    try:
        # El historial de mensajes llega como un string JSON, hay que parsearlo
        messages_list = json.loads(messages)
        logger.info(f"Received direct chat request with {len(messages_list)} messages.")
        
        return StreamingResponse(
            generate_response(messages=messages_list, files=files),
            media_type="application/x-ndjson"
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for messages.")
    except Exception as e:
        logger.error(f"Error in direct_chat_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/agent/invoke")
async def agent_invoke_placeholder():
    """
    Placeholder para el endpoint del agente de la V2.
    Actualmente devuelve un mensaje informativo.
    """
    async def stream_placeholder():
        yield json.dumps({"message": "Agent mode is not available in this version."})
    
    return StreamingResponse(stream_placeholder(), media_type="application/x-ndjson")

@app.get("/")
async def read_root():
    return {"message": "Welcome to uWuzi-Assist Backend. Use /docs for API documentation."}

# If running directly (e.g. uvicorn main:app --reload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
