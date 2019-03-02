
const User                 =require("../models/user");
const House              =require("../models/house");
const Comment             =require("../models/comments");
const session              = require("express-session");
const logger               = require('../logger/logger')
const async                 = require("async");
const nodemailer            =  require("nodemailer");
//onst { body,validationResult } = require('express-validator/check');

exports=module.exports=function(io){
    
    io.on('connection',(socket)=>{
        console.log("someone like the picture");
    })
    console.log(io)
}





