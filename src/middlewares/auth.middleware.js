import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next)=>{
    //get the token from the request headers
    //verify the token
    //get the user from the token
    //attach the user to the request object
    //call the next middleware
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        if (!token) {
            throw new ApiError(401, "Token not provided or invalid");
        }

        console.log("Token received:", token); // Debugging line
        
        const decodedToken = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw ApiError(404, "User not found")
        }
    
        res.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error.message||"Invalid token")
        
    }
})