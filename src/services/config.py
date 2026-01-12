# src/services/config.py
from dataclasses import dataclass
import os
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env", override=True) # Load root .env
load_dotenv(PROJECT_ROOT / ".env", override=True) # Load .env

@dataclass
class LLMConfig:
    """LLM configuration dataclass."""
    model: str
    api_key: str
    base_url: Optional[str] = None
    binding: str = "gemini" # Default to gemini
    max_tokens: int = 4096
    temperature: float = 0.7
    provider_type: Literal["api", "local"] = "api"

def _strip_value(value: Optional[str]) -> Optional[str]:
    """Remove leading/trailing whitespace and quotes from string."""
    if value is None:
        return None
    return value.strip().strip("\"'")

def get_llm_config() -> LLMConfig:
    """
    Load LLM configuration from environment variables.
    """
    binding = _strip_value(os.getenv("LLM_BINDING", "gemini"))
    model = _strip_value(os.getenv("LLM_MODEL", "gemini-1.5-flash-001")) # Default to the specific flash model
    api_key = _strip_value(os.getenv("LLM_API_KEY"))
    base_url = _strip_value(os.getenv("LLM_HOST", "https://generativelanguage.googleapis.com"))

    if not api_key:
        raise ValueError("Error: LLM_API_KEY not set in .env file.")
    if not model:
        raise ValueError("Error: LLM_MODEL not set in .env file.")

    return LLMConfig(
        binding=binding,
        model=model,
        api_key=api_key,
        base_url=base_url,
        provider_type="api", # Assuming API for now
    )

__all__ = ["LLMConfig", "get_llm_config"]
