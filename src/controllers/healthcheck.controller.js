import mongoose from "mongoose"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async(req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? "Healthy" : "Unhealthy"

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    status: "OK",
                    database: dbStatus,
                    uptime: process.uptime()
                },
                "Healthcheck passed"
            )
        )
})

export {healthcheck}