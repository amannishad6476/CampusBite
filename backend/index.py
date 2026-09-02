import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from app.main import app as fastapi_app
from api.index import VercelPathMiddleware

app = VercelPathMiddleware(fastapi_app)

__all__ = ["app"]
