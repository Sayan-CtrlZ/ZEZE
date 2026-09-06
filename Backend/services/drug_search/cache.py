import time
from typing import Any, Optional
from cachetools import TTLCache

# In-memory TTL caches for external medical services
# RxNav search cache: 3600 seconds (1 hour)
_rxnorm_cache = TTLCache(maxsize=1000, ttl=3600)
# FDA monograph cache: 7200 seconds (2 hours)
_fda_cache = TTLCache(maxsize=1000, ttl=7200)

def get_cached_rxnorm(key: str) -> Optional[Any]:
    return _rxnorm_cache.get(key)

def set_cached_rxnorm(key: str, value: Any) -> None:
    _rxnorm_cache[key] = value

def get_cached_fda(key: str) -> Optional[Any]:
    return _fda_cache.get(key)

def set_cached_fda(key: str, value: Any) -> None:
    _fda_cache[key] = value
