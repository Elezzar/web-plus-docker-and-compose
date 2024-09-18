import { CacheModule } from '@nestjs/cache-manager';

const cacheConfig: CacheModule = {
  ttl: 180,
};

export default cacheConfig;
