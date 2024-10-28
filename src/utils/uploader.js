import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    // api_key: process.env.CLOUDINARY_API_KEY,
    api_key: process.env.CLOUDINARY_API_KEY,
})


const uploadOnCloudinary = async(localPath)=>{
    try{
        //check file if given
        if(!localPath) return null
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localPath,{
            //define your resourse type 
            //use auto to let it decide on it's own
            resource_type: "auto"
        })

        //remove file content
        fs.unlinkSync(localPath) 
        //return data
        return response
    }catch(error){
        console.log("cloudinary failed", error)
        //remove file content
        fs.unlinkSync(localPath)
        return null
    }
}

export {uploadOnCloudinary}