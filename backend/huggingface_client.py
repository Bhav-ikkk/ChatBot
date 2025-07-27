from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch
from typing import Optional

class HuggingFaceClient:
    def __init__(self):
        self.models = {}
        self.default_model = "microsoft/DialoGPT-medium"
    
    def load_model(self, model_name: str):
        if model_name not in self.models:
            try:
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                model = AutoModelForCausalLM.from_pretrained(model_name)
                self.models[model_name] = {
                    "tokenizer": tokenizer,
                    "model": model
                }
            except Exception as e:
                raise Exception(f"Failed to load model {model_name}: {str(e)}")
    
    async def chat(self, message: str, model_name: Optional[str] = None) -> str:
        if not model_name:
            model_name = self.default_model
        
        try:
            # Load model if not already loaded
            if model_name not in self.models:
                self.load_model(model_name)
            
            tokenizer = self.models[model_name]["tokenizer"]
            model = self.models[model_name]["model"]
            
            # Encode input
            inputs = tokenizer.encode(message + tokenizer.eos_token, return_tensors="pt")
            
            # Generate response
            with torch.no_grad():
                outputs = model.generate(
                    inputs,
                    max_length=inputs.shape[1] + 100,
                    num_return_sequences=1,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # Decode response
            response = tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True)
            return response.strip()
            
        except Exception as e:
            return f"I'm sorry, I encountered an error: {str(e)}"
