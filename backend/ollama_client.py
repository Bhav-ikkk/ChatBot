import httpx
import os
from typing import Optional

class OllamaClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.client = httpx.AsyncClient()
        print(f"OllamaClient initialized with base URL: {self.base_url}")
    
    async def chat(self, message: str, model: str = "mistral") -> str:
        try:
            print(f"Sending request to Ollama model '{model}'...")
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": message,
                    "stream": False
                },
                # FIX: Increased timeout to 120 seconds
                timeout=120.0 
            )
            response.raise_for_status()
            result = response.json()
            print("Received successful response from Ollama.")
            return result.get("response", "No response generated")
        except httpx.ConnectError as e:
            print(f"Ollama Connection Error: Could not connect to {self.base_url}. Is Ollama running?")
            raise Exception(f"Ollama connection error: {e}")
        except httpx.ReadTimeout as e:
            print(f"Ollama Timeout Error: The request to model '{model}' timed out. This can happen on the first load.")
            raise Exception(f"Ollama timeout error: {e}")
        except Exception as e:
            print(f"An unexpected Ollama error occurred: {e}")
            raise Exception(f"Ollama error: {e}")
    
    async def list_models(self):
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f"Failed to list Ollama models: {str(e)}")
