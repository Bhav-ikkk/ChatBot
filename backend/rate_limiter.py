import redis
from datetime import datetime, timedelta
import json

class RateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def check_rate_limit(self, api_key: str, daily_limit: int, ip_address: str) -> bool:
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"rate_limit:{api_key}:{today}"
        
        # Get current count
        current_count = self.redis.get(key)
        if current_count is None:
            current_count = 0
        else:
            current_count = int(current_count)
        
        if current_count >= daily_limit:
            return False
        
        # Increment counter
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, 86400)  # Expire after 24 hours
        pipe.execute()
        
        # Log usage
        usage_key = f"usage:{api_key}:{today}"
        usage_data = {
            "count": current_count + 1,
            "ip": ip_address,
            "timestamp": datetime.now().isoformat()
        }
        self.redis.hset(usage_key, mapping=usage_data)
        self.redis.expire(usage_key, 86400)
        
        return True
    
    def get_usage_stats(self, api_key: str, days: int = 7):
        stats = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            key = f"rate_limit:{api_key}:{date}"
            count = self.redis.get(key) or 0
            stats.append({"date": date, "requests": int(count)})
        return stats
