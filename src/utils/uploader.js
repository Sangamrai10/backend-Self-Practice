import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async(localPath)=>{
    try{
        //check file if given
        if(!localPath) return null
        //upload file on cloudinary
        const uploadedFile = cloudinary.uploader.upload(localPath,{
            resource_type: "auto"
        })

        //return data
        return uploadedFile
    }catch(error){
        //remove file content
        fs.unlinkSync(localPath)
        return null
    }
}

export {uploadOnCloudinary}