import google.generativeai as genai
import os
from typing import Optional

class GeminiClient:
    def __init__(self):
        self.model = None # Initialize as None first
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                print("GeminiClient initialized successfully.")
            except Exception as e:
                print(f"Failed to initialize GeminiClient: {e}")
        else:
            print("GeminiClient: GEMINI_API_KEY not found in .env file.")
    
    async def chat(self, message: str, model_name: Optional[str] = None) -> str:
        if not self.model:
            raise Exception("Gemini API key not configured or initialization failed")
        
        try:
            # The new SDK uses generate_content_async for async operations
            if hasattr(self.model, 'generate_content_async'):
                 response = await self.model.generate_content_async(message)
            else:
                 response = self.model.generate_content(message)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini error: {str(e)}")
    
    def is_available(self) -> bool:
        return self.model is not None
