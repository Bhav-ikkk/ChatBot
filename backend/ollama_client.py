import httpx
import json
from typing import Optional

class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def chat(self, message: str, model: str = "llama2") -> str:
        try:
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": message,
                    "stream": False
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "No response generated")
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")
    
    async def list_models(self):
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to list models: {str(e)}")
