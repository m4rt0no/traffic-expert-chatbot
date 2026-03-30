import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.agent import chat_with_agent
# Carga variables de entorno\load_dotenv()
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="Traffic Optimization Agent Demo",
    version="1.0.0"
)
# Configurar CORS para permitir al front React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat(request: dict):
    user_input = request.get("user_input")
    if not user_input:
        raise HTTPException(status_code=400, detail="`user_input` es obligatorio")
    try:
        response = chat_with_agent(user_input)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Traffic Optimization Agent está vivo 🚀"}
@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)