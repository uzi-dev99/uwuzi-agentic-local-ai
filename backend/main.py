from fastapi import FastAPI, HTTPException, Security, Depends, Request
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Attempt to import the chat_service
try:
    from services.chat_service import get_ollama_response
except ImportError:
    # This fallback is for the case where the file is created standalone
    # and the services directory might not be in PYTHONPATH yet.
    # In a real execution, FastAPI structure should handle this.
    logging.warning("Could not import get_ollama_response from services.chat_service. Ensure structure is correct.")
    async def get_ollama_response(*args, **kwargs) -> AsyncGenerator[str, None]:
        yield "Error: Chat service not loaded."

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

# API Key Configuration
API_KEY = os.getenv("API_KEY_SECRET")
API_KEY_NAME = "X-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: Optional[str] = Security(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    else:
        logger.warning(f"Invalid API Key received: {api_key_header}")
        raise HTTPException(status_code=403, detail="Could not validate credentials")

# Pydantic Models
class DirectChatMessage(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    model: Optional[str] = None
    temperature: Optional[float] = None
    images: Optional[List[str]] = None # <--- Cambiado de attachments a images

@app.post("/direct_chat", dependencies=[Depends(get_api_key)])
async def direct_chat_endpoint(payload: DirectChatMessage, request: Request):
    api_key = request.headers.get(API_KEY_NAME)
    logger.info(f"Received direct_chat request. Model: {payload.model}, Temp: {payload.temperature}")
    try:
        return StreamingResponse(
            get_ollama_response(
                chat_history=payload.history,
                current_message=payload.message,
                api_key=api_key,
                model_name=payload.model,
                temperature=payload.temperature,
                images=payload.images # <--- Cambiado de attachments a images
            ),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Error in direct_chat_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def read_root():
    return {"message": "Welcome to uWuzi-Assist Backend. Use /docs for API documentation."}

# If running directly (e.g. uvicorn main:app --reload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
