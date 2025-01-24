const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    username: String, 
    url: String,      
    method: String,   
    role: String,     
    status: String,   
    time: Date,       
    headers: Object,  
    device: String,   
    ipAddress: String 
  },
  { timestamps: true } 
);

const Log = mongoose.model("Log", logSchema);

module.exports = Log;