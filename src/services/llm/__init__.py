# src/services/llm/__init__.py
import os
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from src.services.config import get_llm_config

# Configure Gemini API once
_llm_client = None

def get_gemini_client(api_key: Optional[str] = None, model: Optional[str] = None):
    if api_key is not None and api_key.strip() != "":
        # Create a one-off client with the provided key
        return ChatGoogleGenerativeAI(
            model=model or "gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.7,
            convert_system_message_to_human=True,
        )

    global _llm_client
    if _llm_client is None:
        config = get_llm_config()
        if not config.api_key:
            raise ValueError("Gemini API Key is not configured. Please set LLM_API_KEY in your .env file.")

        _llm_client = ChatGoogleGenerativeAI(
            model=config.model,
            google_api_key=config.api_key,
            temperature=config.temperature,
            convert_system_message_to_human=True, # Recommended for LangChain integration
        )
    return _llm_client

def get_llm_client(api_key: Optional[str] = None, model: Optional[str] = None):
    # For now, only Gemini is supported. Can expand to other providers later.
    return get_gemini_client(api_key=api_key, model=model)

__all__ = ["get_llm_client"]