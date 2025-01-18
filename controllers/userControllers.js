const { response } = require("express");
const userModel = require('../models/userModel');
const { checkout } = require("../routes/userRoutes");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendOtp = require("../service/sentOtp");
const path = require('path');
const User = require("../models/userModel");
const fs = require('fs');
const {OAuth2Client} = require('google-auth-library');
const axios = require('axios'); 
const client=new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const {sendVerificationEmail,sendLoginOTP} = require("../service/authentication"); 

const createUser = async (req, res) => {
  console.log(req.body);
  const { firstName, lastName, userName, email, phoneNumber, password } = req.body;
  
  if (!firstName || !lastName || !userName || !email || !phoneNumber || !password) {
      return res.status(400).json({
          success: false,
          message: 'Please enter all details!'
      });
  }

  // Password validation
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(password)) {
      return res.status(400).json({
          success: false,
          message: 'Password must contain at least 8 characters, one capital letter, one number, and one special character!'
      });
  }

  try {
      const existingUserByEmail = await userModel.findOne({ email: email });
      const existingUserByPhone = await userModel.findOne({ phoneNumber: phoneNumber });

      if (existingUserByEmail) {
          return res.status(400).json({
              success: false,
              message: 'User with this email already exists!'
          });
      }

      if (existingUserByPhone) {
          return res.status(400).json({
              success: false,
              message: 'User with this phone number already exists!'
          });
      }

      const randomSalt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, randomSalt);

      //Generate OTP 
      const otp = Math.floor(100000 + Math.random() * 900000);
      // generate expiry time for OTP
      const otpExpiry = Date.now() + 10 * 60 * 1000;

      const newUser = new userModel({
          firstName: firstName,
          lastName: lastName,
          userName: userName,
          email: email,
          phoneNumber: phoneNumber,
          password: hashedPassword,
          verificationOTP: otp,
          otpExpires: otpExpiry,
          isVerified: false
      });

      await newUser.save();

      // Send verification email
      const emailSent = await sendVerificationEmail(email, otp);

      if (!emailSent) {
          return res.status(500).json({
              success: false,
              message: 'Error sending verification email'
          });
      }

      res.status(201).json({
          success: true,
          message: 'User created successfully.Please check your email for verification OTP'
      });

  } catch (error) {
      console.log(error);
      res.status(500).json({
          success: false,
          message: 'Internal Server Error!'
      });
  }
}

const loginUser = async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password) {
      return res.status(400).json({
          success: false,
          message: 'Please enter all the fields'
      });
  }

  try {
      const user = await userModel.findOne({ email: email });

      if (!user) {
          return res.status(400).json({
              success: false,
              message: "Email Doesn't Exist!"
          });
      }

      // Check if email is verified
      if (!user.isVerified) {
          return res.status(403).json({
              success: false,
              message: 'Please verify your email first'
          });
      }

      // Check if user is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
          return res.status(403).json({
              success: false,
              message: 'Account is temporarily locked. Please try again later.'
          });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
          // Increment failed login attempts
          user.loginAttempts = (user.loginAttempts || 0) + 1;

          if (user.loginAttempts >= 3) {
              user.lockUntil = Date.now() + 5 * 60 * 1000; // 5 minutes lock
              user.loginAttempts = 0;
          }

          await user.save();

          return res.status(400).json({
              success: false,
              message: "Password Doesn't Match!"
          });
      }

      // If OTP is not provided, generate and send new OTP
      if (!otp) {
          const loginOTP = Math.floor(100000 + Math.random() * 900000);
          const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

          user.loginOTP = loginOTP;
          user.loginOTPExpires = otpExpiry;
          await user.save();

          // Send OTP email
          const emailSent = await sendLoginOTP(email, loginOTP);

          if (!emailSent) {
              return res.status(500).json({
                  success: false,
                  message: 'Failed to send OTP'
              });
          }

          return res.status(200).json({
              success: true,
              message: 'OTP sent to your email',
              requireOTP: true
          });
      }

      // Verify OTP
      if (user.loginOTP !== parseInt(otp) || user.loginOTPExpires < Date.now()) {
          return res.status(400).json({
              success: false,
              message: 'Invalid or expired OTP'
          });
      }

      // Reset login attempts and clear OTP
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.loginOTP = null;
      user.loginOTPExpires = null;
      await user.save();

      const token = jwt.sign(
          {
              id: user._id,
              isAdmin: user.isAdmin,
          },
          process.env.JWT_SECRET
      );

      return res.status(200).json({
          success: true,
          message: 'User Logged in Successfully!',
          token: token,
          userData: user,
      });

  } catch (error) {
      console.log(error);
      return res.status(500).json({
          success: false,
          message: 'Internal Server Error'
      });
  }
};

// verifyloginOTP
const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
      const user
          = 
          await userModel.findOne({
              email,
              loginOTP: otp,
              loginOTPExpires: { $gt: Date.now() }
          });

      if (!user) {
          return res.status(400).json({
              success: false,
              message: 'Invalid or expired OTP'
          });
      }

      // Reset login attempts and clear OTP
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.loginOTP = null;
      user.loginOTPExpires = null;
      await user.save();

      const token = jwt.sign(
          {
              id: user._id,
              isAdmin: user.isAdmin,
          },
          process.env.JWT_SECRET
      );

      res.status(200).json({
          success: true,
          message: 'User Logged in Successfully!',
          token: token,
          userData: user,
      });

  } catch (error) {
      console.log(error);
      res.status(500).json({
          success: false,
          message: 'Internal Server Error'
      });
  }
};


const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
      const user = await userModel.findOne({ 
          email,
          verificationOTP: otp,
          otpExpires: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({
              success: false,
              message: 'Invalid or expired OTP'
          });
      }

      // Update user verification status
      user.isVerified = true;
      user.verificationOTP = null;
      user.otpExpires = null;
      await user.save();

      res.status(200).json({
          success: true,
          message: 'Email verified successfully'
      });

  } catch (error) {
      console.log(error);
      res.status(500).json({
          success: false,
          message: 'Internal Server Error'
      });
  }
};

const resendLoginOTP = async (req, res) => {
  const { email } = req.body;

  try {
      const user = await userModel.findOne({ email });
      
      if (!user) {
          return res.status(400).json({
              success: false,
              message: 'User not found'
          });
      }

      const loginOTP = Math.floor(100000 + Math.random() * 900000);
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      user.loginOTP = loginOTP;
      user.loginOTPExpires = otpExpiry;
      await user.save();

      const emailSent = await sendLoginOTP(email, loginOTP);

      if (!emailSent) {
          return res.status(500).json({
              success: false,
              message: 'Failed to send OTP'
          });
      }

      res.status(200).json({
          success: true,
          message: 'OTP resent successfully'
      });

  } catch (error) {
      console.log(error);
      res.status(500).json({
          success: false,
          message: 'Internal Server Error'
      });
  }
};

const getCurrentUser = async (req, res) => {
  try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
          return res.status(401).json({
              success: false,
              message: "Authentication token missing",
          });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id).select("-password"); // Do not return the password

      if (!user) {
          return res.status(404).json({
              success: false,
              message: "User not found!",
          });
      }

      // Respond with user profile
      return res.status(200).json({
          success: true,
          message: "User profile retrieved successfully",
          user: user,
      });
  } catch (error) {
      console.error("Error in getCurrentUser:", error);
      return res.status(500).json({
          success: false,
          message: "Internal server error",
      });
  }
};



const getToken = async (req, res) => {
  try {
    console.log(req.body);
    const { id } = req.body;

    // Find the user by ID
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if the user is an admin
    if (user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admins are not allowed to generate tokens for this endpoint.',
      });
    }

    // Generate the token for non-admin users
    const token = await jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      message: 'Token generated successfully!',
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error,
    });
  }
};

  const forgotPassword = async (req, res) => {
    const { phoneNumber} = req.body;
  
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Please enter your phone number",
      });
    }
    try{
  
      // finding user by phone number
      const user = await userModel.findOne({ phoneNumber: phoneNumber });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
  
      // Generate OTP random 6 digit number
      const otp = Math.floor(100000 + Math.random() * 900000);
      // generate expiry time for OTP
      const expiry = Date.now() + 10 * 60 * 1000;
      // save to database for verification
      user.resetPasswordOTP = otp;
      user.resetPasswordExpires = expiry;
      await user.save();
      // set expiry time for OTP
  
      // send OTP to registered phone number
      const isSent = await sendOtp(phoneNumber, otp)
      if(isSent){
        return res.status(400).json({
          sucess : false,
          message : 'Error sending OTP'
        })
      }
  
      //If sucess
      res.status(200).json({
        sucess : true,
        message : "OTP send sucesfully"
  
      })
      
  
  
  
    }catch(error){
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  const verifyOtpAndResetPassword = async (req, res) => {
    const { phoneNumber, otp, password } = req.body;
    if (!phoneNumber || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }
    try{
      const user = await userModel.findOne({phoneNumber: phoneNumber});
  
      //Verify OTP
      if(user.resetPasswordOTP != otp){
        return res.status(400).json({
          success: false,
          message: "Invalid OTP"
        })
      }
  
      //Check if OTP is expired
      if(user.resetPasswordExpires < Date.now()){
        return res.status(400).json({
          success: false,
          message: "OTP expired"
        })
      }
  
      //Hash the password
      const randomSalt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, randomSalt);
  
      //update to database
      user.password = hashedPassword;
      await user.save();
  
      //Send response
      res.status(200).json({
        success: true,
        message: "Password reset successfully"
      })
  
    }catch(error){
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  } 

const uploadProfilePicture = async (req, res) => {
  // const id = req.user.id;
  console.log(req.files);
  const { profilePicture } = req.files;

  if (!profilePicture) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image',
    });
  }

  //  Upload the image
  // 1. Generate new image name
  const imageName = `${Date.now()}-${profilePicture.name}`;

  // 2. Make a upload path (/path/upload - directory)
  const imageUploadPath = path.join(
    __dirname,
    `../public/profile_pictures/${imageName}`
  );

  // Ensure the directory exists
  const directoryPath = path.dirname(imageUploadPath);
  fs.mkdirSync(directoryPath, { recursive: true });

  try {
    // 3. Move the image to the upload path
    profilePicture.mv(imageUploadPath);

    //  send image name to the user
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      profilePicture: imageName,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error,
    });
  }
};


  // edit user profile
const editUserProfile = async (req, res) => {
    const { firstName, lastName, userName,email, phoneNumber,profilePicture } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.firstName = firstName|| user.firstName;
        user.lastName = lastName|| user.lastName;
        user.email = email|| user.email;
        user.phoneNumber = phoneNumber|| user.phoneNumber;
        user.userName = userName|| user.userName;
        user.profilePicture = profilePicture|| user.profilePicture;
      
       
        

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User profile updated successfully',
            user
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user profile',
            error: error.message
        });
    }
}

const googleLogin = async (req, res) => {
  console.log(req.body);

  // Destructuring the data
  const { token } = req.body;

  // Validate
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Please fill all the fields',
    });
  }

  // try catch
  try {
    // verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, given_name, family_name, picture } = ticket.getPayload();

    let user = await userModel.findOne({ email: email });

    if (!user) {
      const { password, role } = req.body;

      const randomSalt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, randomSalt);

      // Fetch the image from Google
      const response = await axios.get(picture, { responseType: 'stream' });

      // Set up image name and path
      const imageName = `${given_name}_${family_name}_${Date.now()}.png`;
      const imagePath = path.join(__dirname, `../public/profile_pictures/${imageName}`);

      // Ensure the directory exists
      const directoryPath = path.dirname(imagePath);
      fs.mkdirSync(directoryPath, { recursive: true });

      // Create a write stream to save the image
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      // Wait for the image to be fully saved
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      user = new userModel({
        firstName: given_name,
        lastName: family_name,
        email: email,
        userName: given_name,
        password: hashedPassword,
        isAdmin: role === 'admin',
        profilePicture: imageName,
        fromGoogle: true,
      });
      await user.save();
    }

    // generate token
    const jwtToken = await jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      (options = {
        expiresIn:
          Date.now() + process.env.JWT_TOKEN_EXPIRE * 24 * 60 * 60 * 1000 ||
          '1d',
      })
    );

    return res.status(201).json({
      success: true,
      message: 'User Logged In Successfully!',
      token: jwtToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
      error: error,
    });
  }
};

const getUserByGoogleEmail = async (req, res) => {
  console.log(req.body);

  // Destructuring the data
  const { token } = req.body;

  // Validate
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Please fill all the fields',
    });
  }
  try {
    // verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    console.log(ticket);

    const { email } = ticket.getPayload();

    const user = await userModel.findOne({ email: email });

    if (user) {
      return res.status(200).json({
        success: true,
        message: 'User found',
        data: user,
      });
    }

    res.status(201).json({
      success: true,
      message: 'User not found',
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: e,
    });
  }
};

const checkAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ isAdmin: true });
  } catch (error) {
    console.error("Error in checkAdmin controller:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


  
module.exports = {
    createUser,
    loginUser,
    getCurrentUser,
    getToken,
    forgotPassword,
    verifyOtpAndResetPassword,
    uploadProfilePicture,
    editUserProfile,
    googleLogin,
    getUserByGoogleEmail,
    verifyEmail,
    resendLoginOTP,
    verifyLoginOTP,
    checkAdmin
    

}
