import time
from collections import defaultdict
from typing import Dict, List

class InMemoryRateLimiter:
    """
    Sliding window rate limiter for guarding sensitive API routes
    (e.g., login attempts, registration, OTP verification, checkout).
    """

    def __init__(self):
        # Maps key -> list of timestamp floats
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
        """
        Evaluates whether a given key has exceeded max_requests within window_seconds.
        Returns True if rate limited (exceeded), False otherwise.
        """
        now = time.time()
        timestamps = self._history[key]

        # Evict timestamps older than the sliding window
        valid_timestamps = [t for t in timestamps if (now - t) < window_seconds]
        self._history[key] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            return True

        self._history[key].append(now)
        return False

    def clear(self, key: str = None):
        """Reset history for a specific key or all keys."""
        if key:
            self._history.pop(key, None)
        else:
            self._history.clear()

# Global default instance
rate_limiter = InMemoryRateLimiter()
