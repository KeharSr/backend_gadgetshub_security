const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    },

    userName : {
        type : String,
        required : true
    },

    email : {
        type : String,
        required : true,
        unique : true
    },

    phoneNumber:{
        type : String,
    },

    resetPasswordOTP: {
        type: Number,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    },
    password : {
        type : String,
        required : true
    },
    
    isAdmin : {
        type : Boolean,
        default : false
    },
    profilePicture : {
        type : String,
       
    },
    fromGoogle: {
        type: Boolean,
        default: false,
      },
    

})

const User = mongoose.model('user', userSchema)
module.exports = User;





