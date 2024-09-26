import mongoose, {Schema} from'mongoose';
const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required:true
    },
    avatar:{
        type: String,//url from cloudinary
        required: true
    },
    coverImage:{
        type: String, //url from cloudinary
        required: true
    }
},{timestamps: true})