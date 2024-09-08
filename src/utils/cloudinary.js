import {v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUDE_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload file to cloudinary
        const response = await cloudinary.uploader
       .upload(
           localFilePath, {
               resource_type: "auto"
           }
       )
        //File uploaded successfully
        console.log("File is uploaded successfully" , response.url)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the temporary file
        return null;
    }
}

export {uploadOnCloudinary};

