import redis
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def check_rate_limit(self, api_key: str, daily_limit: int, ip_address: str) -> tuple[bool, int]:
        if not self.redis:
            print("WARNING: Redis client not available, skipping rate limit check.")
            return (True, 9999)

        today = datetime.now().strftime("%Y-%m-%d")
        key = f"rate_limit:{api_key}:{today}"
        
        try:
            # FIX: Corrected logic for handling a key that doesn't exist yet
            raw_count = self.redis.get(key)
            current_count = int(raw_count) if raw_count else 0
            
            if current_count >= daily_limit:
                return (False, 0)
            
            new_count = self.redis.incr(key)
            
            if new_count == 1:
                self.redis.expire(key, 86400)

            remaining = daily_limit - new_count
            
            usage_key = f"usage:{api_key}:{today}"
            usage_data = {
                "count": str(new_count),
                "ip": ip_address,
                "timestamp": datetime.now().isoformat()
            }
            for field, value in usage_data.items():
                self.redis.hset(usage_key, field, value)
            self.redis.expire(usage_key, 86400)
            
            return (True, remaining)
        except Exception as e:
            print(f"ERROR: Redis rate limit check failed: {e}")
            return (True, 9999)
