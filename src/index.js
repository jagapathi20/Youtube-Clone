import dotenv from "dotenv"
import connectDB from "./db/index.js"
import {app} from "./app.js"
import {connectRedis} from "./db.redis.js"
import "./cron/viewSync.cron.js"

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERR:" ,error)
        throw error
    })
    connectRedis()
    const port = process.env.PORT || 8000
    app.listen(port, () => {
        console.log(`server is running at port: ${port}`)
    })
})
.catch((err) => {
    console.log("Mongo Db connection failed !!!", err)
})
