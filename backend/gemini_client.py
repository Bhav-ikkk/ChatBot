import google.generativeai as genai
import os
from typing import Optional

class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    async def chat(self, message: str, model_name: Optional[str] = None) -> str:
        if not self.model:
            raise Exception("Gemini API key not configured")
        
        try:
            response = self.model.generate_content(message)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini error: {str(e)}")
    
    def is_available(self) -> bool:
        return self.model is not None
