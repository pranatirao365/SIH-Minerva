"""
Hugging Face Image Client
Handles image generation using Hugging Face Router API
"""

import os
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


def generate_image(prompt: str, config: Dict) -> bytes:
    """
    Generate image using Hugging Face Router API

    Args:
        prompt: Text prompt for image generation
        config: Configuration dictionary

    Returns:
        Raw image bytes

    Raises:
        Exception: If API call fails
    """

    token = get_hf_token(config)
    model = config['models']['image_generation']['model']

    api_url = f"https://router.huggingface.co/hf-inference/models/{model}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": prompt
    }

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
            error_data = response.json()
            estimated_time = error_data.get('estimated_time', 20)
            raise Exception(f"Model is loading, estimated time: {estimated_time}s. Please retry.")
        else:
            raise Exception(f"Hugging Face API error: {response.status_code} - {response.text}")

    except requests.exceptions.Timeout:
        raise Exception("Request timed out. Model might be overloaded, try again.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")