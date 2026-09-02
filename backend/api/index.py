import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app as fastapi_app


class VercelPathMiddleware:
    """
    ASGI middleware ensuring incoming request paths resolve cleanly on Vercel.
    Handles legacy path rewrites, stripped prefixes, or /api/index.py routing artifacts.
    """

    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")

            # Check if Vercel edge passed the original request path in x-matched-path
            headers = dict(scope.get("headers", []))
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")

            if path in ("/api/index.py", "/api/index", "/index.py", "/index"):
                if matched_path and matched_path not in (
                    "/api/index.py",
                    "/api/index",
                    "/index.py",
                    "/index",
                ):
                    scope["path"] = matched_path
                else:
                    scope["path"] = "/"
            elif path.startswith("/api/index.py/"):
                scope["path"] = path[len("/api/index.py") :]
            elif path.startswith("/index.py/"):
                scope["path"] = path[len("/index.py") :]
            elif path in ("/api/docs", "/api/docs/"):
                scope["path"] = "/docs"
            elif path in ("/api/openapi.json",):
                scope["path"] = "/openapi.json"
            elif path in ("/api", "/api/"):
                scope["path"] = "/"

        await self.asgi_app(scope, receive, send)


app = VercelPathMiddleware(fastapi_app)

__all__ = ["app"]
