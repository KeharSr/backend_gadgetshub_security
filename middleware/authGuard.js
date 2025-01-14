// import jwt
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const authGuard= async (req, res, next) => {
    //check incoming data
    console.log(req.headers); // passed going to next


    // get authorization data fromheader
    const authHeader = req.headers.authorization;

    // check or validate
    if (!authHeader) {
        return res.status(400).json({
            success: false,
            message: "Auth header not found"
        })
    }


    // Split the data(Format: Bearer token)
    const token = authHeader.split(' ')[1];


    // if token not found : stop the process (res)
    if (!token || token ==="") {
        return res.status(400).json({
            success: false,
            message: "Token not found"
        })
    }

    // verify
    try{
        const decoded= jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    req.user = decoded;
        next();

    }catch(error){
        res.status(500).json({
            sucess: false,
            message: "Not Authorized",
        })
    }
    // if verified : next (function is controller)



    // not verified : not auth
}

// Admin guard
const adminGuard= (req, res, next) => {
    //check incoming data
    console.log(req.headers);
   // passed going to next


    // get authorization data fromheader
    const authHeader = req.headers.authorization;

    // check or validate
    if (!authHeader) {
        return res.status(400).json({
            success: false,
            message: "Auth header not found"
        })
    }


    // Split the data(Format: Bearer token)
    const token = authHeader.split(' ')[1];


    // if token not found : stop the process (res)
    if (!token || token ==="") {
        return res.status(400).json({
            success: false,
            message: "Token not found"
        })
    }

    // verify
    try{
        const decodeUserData= jwt.verify(token, process.env.JWT_SECRET);
        console.log(decodeUserData);
        req.user= decodeUserData; //id, isAdmin
        if(!req.user.isAdmin){
            return res.status(400).json({
                success: false,
                message: "Prabesh Nised!", //Permission Denied
            })
        }
        next();

    }catch(error){
        res.status(500).json({
            sucess: false,
            message: "Not Authorized",
        })
    }
    // if verified : next (function is controller)



    // not verified : not auth
}

const verifyRecaptcha = async (req, res, next) => {
    console.log(req.body)
    const recaptchaResponse = req.body['recaptchaToken']; 
  
  
    if (!recaptchaResponse) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'reCAPTCHA response is required'
      });
    }
  
    try {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY; 
      const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
        params: {
          secret: secretKey,
          response: recaptchaResponse
        }
      });
  
      const data = response.data;
      console.log(data)
      if (data.success) {
        next(); 
      } else {
        res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'reCAPTCHA verification failed'
        });
      }
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error verifying reCAPTCHA'
      });
    }
  };

module.exports = {
    authGuard,
    adminGuard,
    verifyRecaptcha

}