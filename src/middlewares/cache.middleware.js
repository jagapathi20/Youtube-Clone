import { redisClient } from "../db/redis.js"

export const cacheMiddleware = (ttl = 300, isPersonalized = false) => {
    return async(req, res, next) => {
        if(req.method !== "GET") return next()
        
        const url = new URL(req.originalUrl || req.url, `http://${req.headers.host}`)
        const params = Object.fromEntries(url.searchParams.entries())

        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key.toLowerCase()}=${params[key].toLowerCase()}`)
            .join("&")
        let key = `cache:${url.pathname}${sortedParams ? "?" + sortedParams: ""}`

        if(isPersonalized && req.user._id){
            key += `:u:${req.user._id}`
        }

        try{
            const cachedData = await redisClient.get(key)

            if(cachedData){
                return res
                .status(200)
                .json(JSON.parse(cachedData))
            }

            const originalJson = res.json

            res.json = function(data){
                res.json = originalJson

                if(res.statusCode === 200){
                    redisClient.set(key, JSON.stringify(data), "EX", ttl)
                        .catch(err => console.error("redis cache error", err))
                }

                return res.json(data)
            }

            next()
        }catch(error){
            console.error("cache middleware fai", error)
            next()
        }
    }
}