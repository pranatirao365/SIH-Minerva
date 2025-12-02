"""
Hugging Face Image Client
Handles image generation using Hugging Face Router API
"""

import os
import time
import requests
from typing import Dict


def get_hf_token(config: Dict) -> str:
    """Get Hugging Face token from environment"""
    token = os.getenv(config['models']['image_generation']['api_key_env'])

    if not token:
        raise ValueError(
            f"Hugging Face token not found. Please set "
            f"{config['models']['image_generation']['api_key_env']} environment variable."
        )

    return token


def generate_image(prompt: str, config: Dict, max_retries: int = 3) -> bytes:
    """
    Generate image using Hugging Face Router API with retry logic

    Args:
        prompt: Text prompt for image generation
        config: Configuration dictionary
        max_retries: Maximum number of retry attempts for transient errors

    Returns:
        Raw image bytes

    Raises:
        Exception: If API call fails after all retries
    """

    token = get_hf_token(config)
    model = config['models']['image_generation']['model']

    api_url = f"https://router.huggingface.co/hf-inference/models/{model}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": prompt,
        "parameters": {
            "width": 1080,
            "height": 1080
        }
    }

    last_error = None
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=120
            )

            if response.status_code == 200:
                return response.content
            elif response.status_code == 401:
                raise Exception("Invalid or missing HF token")
            elif response.status_code == 403:
                raise Exception("Model access denied - you may need to request access to this model")
            elif response.status_code == 404:
                raise Exception("Model not accessible or requires access request")
            elif response.status_code == 410:
                raise Exception("User must use Router API - legacy API is deprecated")
            elif response.status_code == 503:
                # Model is loading - retry with exponential backoff
                wait_time = 2 ** attempt * 5  # 5s, 10s, 20s
                if attempt < max_retries - 1:
                    print(f"       ⏳ Model loading, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    raise Exception(f"Model is still loading after {max_retries} attempts")
            elif response.status_code == 504:
                # Gateway timeout - retry with exponential backoff
                wait_time = 2 ** attempt * 3  # 3s, 6s, 12s
                if attempt < max_retries - 1:
                    print(f"       ⏳ Gateway timeout, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    raise Exception("Gateway timeout - Hugging Face API is experiencing high load")
            else:
                # Extract clean error message (avoid HTML content)
                error_text = response.text[:200] if response.text else "Unknown error"
                if "<!DOCTYPE html>" in error_text or "<html" in error_text:
                    error_text = f"HTTP {response.status_code} error (HTML error page received)"
                raise Exception(f"API error: {response.status_code} - {error_text}")

        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt * 3
                print(f"       ⏳ Request timeout, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                last_error = Exception("Request timed out after all retries. API might be overloaded.")
                continue
            else:
                raise Exception("Request timed out after all retries. API might be overloaded.")
        except requests.exceptions.RequestException as e:
            last_error = Exception(f"Network error: {str(e)}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt * 2
                print(f"       ⏳ Network error, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
            else:
                raise last_error
    
    # If we've exhausted all retries
    if last_error:
        raise last_error
    else:
        raise Exception("Failed to generate image after all retries")