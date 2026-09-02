import os
import sys

# Ensure the backend root directory is on sys.path so that 'app' can be resolved
# properly regardless of the serverless invocation directory structure.
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app

# Vercel Serverless Function runtime detects and executes 'app' as the ASGI application
__all__ = ["app"]
