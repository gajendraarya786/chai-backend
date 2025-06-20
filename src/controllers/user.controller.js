//import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import { response } from "express";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
       const user =  await User.findById(userId);
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()
       
       user.refreshToken = refreshToken;
       await user.save({validateBeforeSave: false});
       
       return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generation refresh and access token")
    }

}



//we can write controllers without using asyncHandler like below using try catch
const registerUser = async (req, res, next) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists: by username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    // create user object - create entry in db 
    //remove password and refresh token field from response
    //check for user creation
    //return response
    

    //Step-1 Getting details from frontend
    const {fullname, email, username, password } = req.body;
    console.log("email:" , email);
    console.log("password:", password);
    
    //Validating
    if(fullname === ""){
        throw new ApiError(400, "fullname is required");
    }
    if(email === ""){
        throw new ApiError(400, "email is required");
    }
    if(username === ""){
        throw new ApiError(400, "username is required");
    }
    if(password === ""){
        throw new ApiError(400, "password is required");
    }
    
   //Checking if user already exists 
   const existedUser =  await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists");
    }
     
     console.log("Received files:", req.files);
    console.log("Received body:", req.body);

    //checking for files (multer gives access to req.fils method)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
        
    }
    console.log("Received files:", req.files);
    console.log("Received body:", req.body);

    //Uploading on cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath?  await uploadOnCloudinary(coverImageLocalPath) : null;
     
    if(!avatar?.url){
        throw new ApiError(400, "Failed to upload on Cloudinary");
    }
    
    //creating a user
    const user = await User.create({
        fullname: fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: email,
        password: password,
        username: username.toLowerCase()
    })
    
    //checking if a user is created  
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    else{
       return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
       )
    }
}


// const registerUser = asyncHandler( async (req, res) => {
//         res.status(200).json({
//         message: "ok"
//     })
// })

const loginUser = async (req, res, next) =>{
       //req body
       //username or email
       //find the user
       //password check
       //access and refresh token 
       //send cookies
       
       const {email, username, password} = req.body;
       
       if(!username && !email) {
        throw new ApiError(400, "username or email is required");
       }
       
      const user = await User.findOne({
        $or: [{username}, {email}]
       })

       if(!user) {
        throw new ApiError(404, "User does not exist");
       }
       
       const isPasswordValid = await user.isPasswordCorrect(password);

       if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
       }
      
       const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
        
       const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
       
       //sending cookies
       const options = {
        httpOnly: true,
        secure: true
       }

       return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
       .json(
        new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully")
       )
}
const logoutUser = async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
     )

     const options = {
        httpOnly: true,
        secure: true
     }
     return res
     .status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200, {}, "User logged out successfully"));
}

const refreshAccessToken = async(req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request");
    }

   const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

   const user = await User.findById(decodedToken?._id);

   if(!user){
        throw new ApiError(401, "Invalid refresh token");
    }
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh Token is expired");
    }

    const options = {
        httpOnly: true,
        secure: true
    }
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed")
    )
}


const changeCurrentPassword = async(req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return response.status(200)
    .json(new ApiResponse(200, {}, "Password changes successfully"));
}

const getCurrentUser = async(req, res) => {
    return res.status(200)
    .json(200, req.user, "cuurent user fethced successfully");
}

const updateAccountDetails = async(req, res) => {
      const {fullName, email} = req.body;

      if(!fullName || !email){
        throw new ApiError(400, 'All fields are required');
      }

      const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email
            },
        },
        {new: true}
      ).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"))
}

const updateUserAvatar = async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
}
 
export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar
}