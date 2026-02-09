import mongoose, {Schema} from "mongoose"

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        requied: true
    }
}, {timestamps: true})

tweetSchema.index({owner: 1})


export const Tweet = mongoose.model("Tweet", tweetSchema)