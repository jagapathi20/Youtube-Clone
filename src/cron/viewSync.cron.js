import cron from "node-cron"
import { redisClient } from "../db/redis.js"
import {Video} from "../models/video.model.js"

cron.schedule("*/10 * * * *", async() => {
    console.log("syncing buffered views to MongoDB......")

    try{
        const viewsData = await redisClient.hgetall("video:views:buffer")
        const videoIds = Object.keys(viewsData)

        if(videoIds.length === 0) return

        const bulkOps = videoIds.map((id) => ({
            upddateOne:{
                filter: {_id: id},
                update: {$inc: {views: parseInt(viewsData[id])}}
            }
        }))

        await Video.bulkWrite(bulkOps)

        await redisClient.del("video:vies:buffer")

        console.log(`Successfully synced views for ${videoIds.length} videos`);
    } catch (error) {
        console.error("View Sync Error:", error);
    }
})