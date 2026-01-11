# src/api/routers/translate.py
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Literal, Optional

from src.services.llm import get_llm_client

router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    target_language: Literal["en", "zh", "my"] # Add Burmese ('my')
    source_language: Literal["en", "zh", "my", "auto"] = "auto"
    custom_api_key: Optional[str] = None
    preferred_model: Optional[str] = None

class TranslationResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str
    model: str = "gemini"

class ValidationRequest(BaseModel):
    custom_api_key: str
    preferred_model: Optional[str] = None

class ValidationResponse(BaseModel):
    status: str
    model: str

@router.post("/validate-key", response_model=ValidationResponse)
async def validate_api_key(request: ValidationRequest):
    try:
        # Check network first
        import socket
        try:
            socket.create_connection(("generativelanguage.googleapis.com", 443), timeout=5)
            print("DEBUG: Network check: Google API is reachable.")
        except Exception as net_err:
            print(f"DEBUG: Network check FAILED: {net_err}")
            raise HTTPException(status_code=503, detail=f"Backend cannot reach Google: {net_err}")

        if not request.custom_api_key or request.custom_api_key.strip() == "":
            raise ValueError("API Key is empty")
            
        # Log partial key for safety but enough to verify it's being passed
        key_preview = f"{request.custom_api_key[:5]}...{request.custom_api_key[-5:]}" if len(request.custom_api_key) > 10 else "***"
        print(f"DEBUG: Validating API Key ({key_preview}) with model: {request.preferred_model or 'default'}")
        
        llm = get_llm_client(api_key=request.custom_api_key, model=request.preferred_model)
        
        print(f"DEBUG: LLM Client created. Model: {getattr(llm, 'model', 'unknown')}")
        
        # Just do a tiny call to verify the key works
        try:
            print("DEBUG: Invoking test call...")
            llm.invoke("Say ok")
            print("DEBUG: Test call successful.")
        except Exception as invoke_err:
            print(f"DEBUG: invoke failed: {type(invoke_err).__name__}: {invoke_err}")
            raise invoke_err

        return ValidationResponse(status="valid", model=getattr(llm, "model", "gemini"))
    except ValueError as ve:
        print(f"DEBUG: Validation ValueError: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        print(f"DEBUG: Validation Exception Type: {type(e).__name__}")
        print(f"DEBUG: Validation Exception Message: {e}")
        traceback.print_exc()
        # Return the actual error message from the exception
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    try:
        llm = get_llm_client(api_key=request.custom_api_key, model=request.preferred_model)

        if request.source_language == "auto":
            prompt = f"Translate the following text to {request.target_language}:\n\n{request.text}"
        else:
            prompt = f"Translate the following text from {request.source_language} to {request.target_language}:\n\n{request.text}"
        
        # For LangChain ChatModel, you would use invoke or stream
        response = llm.invoke(prompt)
        translated_content = response.content

        # Dummy source language detection for now if auto
        source_lang_detected = request.source_language if request.source_language != "auto" else "en" # Fallback

        return TranslationResponse(
            translated_text=translated_content,
            source_language=source_lang_detected,
            target_language=request.target_language,
            model=llm.model_name # Get model name from the LLM client
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")
