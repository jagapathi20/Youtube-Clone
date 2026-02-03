import { loadEnvFile } from 'node:process';
import connectDB from "./db/index.js";

loadEnvFile()
connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERR:" ,error)
        throw error
    })
    port = process.env.PORT || 8000
    app.listen(port, () => {
        console.log(`server is running at port: ${port}`)
    })
})
.catch((err) => {
    console.log("Mongo Db connection failed !!!", err)
})
