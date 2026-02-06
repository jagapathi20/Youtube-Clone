import dotenv from "dotenv"
import connectDB from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERR:" ,error)
        throw error
    })
    const port = process.env.PORT || 8000
    app.listen(port, () => {
        console.log(`server is running at port: ${port}`)
    })
})
.catch((err) => {
    console.log("Mongo Db connection failed !!!", err)
})
