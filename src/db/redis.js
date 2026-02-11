import Redis from "ioredis"

const redisClient = new Redis({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || "127.0.0.1",
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
    }
})

redisClient.on("connect", () => {
    console.log("ioredis: Connected Successfully")
})

redisClient.on("error", (err) => {
    console.log("ioredis: Connection Error", err)
})

export {redisClient}