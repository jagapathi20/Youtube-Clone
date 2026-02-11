import { redisClient } from "../db/redis.js";

export const invalidateCache = async(pattern) => {
    try{
        const stream = redisClient.scanStream({
            match: `cache:*${pattern}*`
        })

        stream.on("data", async (keys) => {
            if(keys.length > 0){
                const pipeline = redisClient.pipeline()
                keys.forEach((key) => pipeline.del(key))
                await pipeline.exec()
            }
        })

        console.log(`Invalidation triggered for pattern: ${pattern}`)
    }catch(error){
        console.error("cache invalidataion failed", error)
    }
}