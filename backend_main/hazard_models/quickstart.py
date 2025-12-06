"""
Quick Start Script - Installs dependencies and starts the server
"""

import subprocess
import sys
from pathlib import Path


def run_command(command: str, description: str):
    """Run a command and print status"""
    print(f"\n{'=' * 60}")
    print(f"{description}")
    print(f"{'=' * 60}")
    print(f"Running: {command}\n")
    
    result = subprocess.run(command, shell=True, capture_output=False, text=True)
    
    if result.returncode != 0:
        print(f"\n❌ Error: {description} failed!")
        return False
    else:
        print(f"\n✓ {description} completed successfully!")
        return True


def check_file(file_path: str) -> bool:
    """Check if a required file exists"""
    if Path(file_path).exists():
        print(f"✓ Found: {file_path}")
        return True
    else:
        print(f"❌ Missing: {file_path}")
        return False


def main():
    print("\n" + "=" * 60)
    print("DeepCrack Backend - Quick Start")
    print("=" * 60)
    
    # Check required files
    print("\n1. Checking required files...")
    print("-" * 60)
    
    required_files = [
        'main.py',
        'pretrained_net_G.pth',
        'inference_utils.py',
        'cv2_utils.py',
        'requirements.txt',
        'models/deepcrack_model.py',
        'models/deepcrack_networks.py',
        'models/base_model.py',
        'models/networks.py'
    ]
    
    all_files_present = all(check_file(f) for f in required_files)
    
    if not all_files_present:
        print("\n❌ Some required files are missing!")
        print("Please ensure all files are present before running the server.")
        return
    
    print("\n✓ All required files are present!")
    
    # Ask user if they want to install dependencies
    print("\n2. Installing dependencies...")
    print("-" * 60)
    install = input("Install/update dependencies? (y/n): ").strip().lower()
    
    if install == 'y':
        if not run_command("pip install -r requirements.txt", "Installing dependencies"):
            return
    else:
        print("Skipping dependency installation...")
    
    # Start the server
    print("\n3. Starting FastAPI server...")
    print("-" * 60)
    print("\nThe server will start at: http://localhost:8000")
    print("API documentation available at: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server\n")
    
    input("Press Enter to start the server...")
    
    # Run uvicorn
    subprocess.run("uvicorn main:app --reload", shell=True)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted by user")
        sys.exit(0)
