import dotenv from "dotenv"
import connectDB from "./src/config/db.js"
import {app} from "./src/app.js"
import {connectRedis} from "./src/config/redis.js"
import "./src/cron/viewSync.cron.js"
import { setupSwagger } from "./src/config/swagger.js"


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

setupSwagger(app)
