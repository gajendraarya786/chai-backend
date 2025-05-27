import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema({
   
    videoFile: {
        type: String, //cloudinary url
        required: true,
    },
    thumbnail: {
        type: String, //cloudinary url
        required: true,
    },
    title: {
        type: String, 
        required: true,
    },
    description: {
         ype: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps: true})

// to write aggregation queries in mongodb that is production level apart from regular insert and updateMany queries
videoSchema.plugin(mongooseAggregatePaginate)

const Video = mongoose.model("Video", videoSchema);

export default Video;