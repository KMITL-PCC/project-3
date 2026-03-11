import { createClient } from 'redis';

const redisClient = createClient({
    url: 'redis://redis:6379' 
});

redisClient.on('error', (err: any) => console.log('Redis Client Error', err));

redisClient.connect().catch(console.error);

export default redisClient;