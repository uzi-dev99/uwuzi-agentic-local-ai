from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Importar el servicio del agente
try:
    from services.agent_service import invoke_agent
except ImportError:
    logging.error("Could not import invoke_agent from services.agent_service. Ensure structure is correct.")
    async def invoke_agent(*args, **kwargs):
        yield '{"error": "Agent service not loaded."}\n'

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

# Pydantic Models
class AgentRequest(BaseModel):
    messages: List[Dict[str, str]]

@app.post("/api/v1/agent/invoke")
async def agent_invoke_endpoint(payload: AgentRequest, request: Request):
    """
    Endpoint principal del agente que enruta las peticiones según la intención del usuario.
    """
    logger.info(f"Received agent invoke request with {len(payload.messages)} messages")
    try:
        return StreamingResponse(
            invoke_agent(payload.dict()),
            media_type="application/x-ndjson"
        )
    except Exception as e:
        logger.error(f"Error in agent_invoke_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def read_root():
    return {"message": "Welcome to uWuzi-Assist Backend. Use /docs for API documentation."}

# If running directly (e.g. uvicorn main:app --reload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
