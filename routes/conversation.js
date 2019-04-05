var express                =require("express");
var   router                =express.Router();
const User                 =require("../models/user");
const Like                 =require("../models/like");
const Rating                =require("../models/rating");
const House                =require("../models/house");
const Comment              =require("../models/comments");
const Conversation           =  require("../models/conversation");
const Message               =require("../models/message");
const ejsLint              =require('ejs-lint');           
const path                 =require("path");
var  passport              =require("passport");
var moment                 = require("moment"); 
var middleware             = require("../middleware");
const Joi                  = require('joi')
var request                =require("request");
const Upload               =require("../models/validation/upload.js");
const NodeGeocoder         =  require('node-geocoder');
//const register             = require('../models/validation/register.js');
const session              = require("express-session");
const logger               = require('../logger/logger')
const async                = require("async");
var requestify = require('requestify');
const nodemailer           =  require("nodemailer");
//onst { body,validationResult } = require('express-validator/check');
const { sanitizeBody }      = require('express-validator/filter');
const cryptoRandomString    = require('crypto-random-string');
const multer                = require('multer');
const cloudinary            = require('cloudinary');
const cloudinaryStorage = require("multer-storage-cloudinary");
const faker                 = require('faker/locale/en');
var randomLocation = require('random-location')

router.post("/house/:id/messagedirect", middleware.isLoggedIn, async(req, res)=>{
    console.log(req.params.id)
    var owneruser;
    let promise= new Promise((resolve)=>{
              User.findById(req.params.id,(err,user)=>{
                  if(err){
                      console.log(err)
                  }else{
                     // console.log(user);
                      owneruser=user;
                      resolve(owneruser);
                  }
              })
         })
         
        await promise;
           
           res.locals.tfor=owneruser.username
       console.log(req.user.username + ' wants to message ' + owneruser.username);
    
        res.locals.tfor = owneruser.username;
    Conversation.findOne({
    $or : [
        { $and : [ { party1 :owneruser.username}, { party2: req.user.username} ] },
        { $and : [  { party2 :req.user.username}, { party1: owneruser.username}] }
    ]
    }).exec(function(err,found){
        if(err){console.log(err)}
        else if(found){
            console.log('Conversation exists btw the two');
        
             found.lastActivity = moment().valueOf();
             found.save(function(err){
                 if(err){console.log(err)}
                 else{
                     console.log('redirect to inbox with param fetch existing');
                                     res.redirect("/inbox?tfor="+owneruser.username);  
                 }
             });
          
          
        }else{
            //console.log('No conversation exists creating new');
            //console.log(found);
            var newConversation={
               
                 'party1':req.user.username,
                 'party2': owneruser.username,
                
                 'lastActivity':moment().valueOf(),
            }
            Conversation.create(newConversation,function(err,conversation){
                if(err){console.log(err)}
                else if(conversation){
                    console.log(conversation);
                        //  var display ={
                     res.locals.tfor  = owneruser.username,
                        //  }
                        //  req.locals.display = display;
                        res.redirect("/inbox?tfor="+owneruser.username);  
                }
            });
            console.log('create new convesation then redirect to inbox');
        }
    });
 
});
 
router.get("/inbox", middleware.isLoggedIn, function(req,res){
    res.locals.tfor = req.query.tfor;
   // console.log(req)
     console.log(res.locals.tfor)
    if(!res.locals.tfor){
        res.locals.tfor='';
    }
  //  console.log(res.locals.tfor)
        Message.find({$or : [
                                { to:req.user.username} 
                             ]}).sort({'createdAt':-1}).exec(function(err,messages){
         if(err){
             console.log(err);
         }else{
             Conversation.find({$or:[
                                      { $and : [ { party1 :req.user.username} ] },
                                      { $and : [  { party2 :req.user.username} ] }
                                     ]
                                 }).sort({'lastActivity':-1}).exec(function(err,conversations){
                                     if(err){console.log(err)}
                                     else if(conversations.length>0){
                                        
                                         let fullConversations = [];
                                         conversations.forEach(function(conversation){
                                             Message.find({conversationId:conversation._id}).sort({'createdAt':1}).exec(function(err,CMsgs){
                                               if(err){console.log(err)}
                                               else if(CMsgs){
                                                  
                                                   fullConversations.push(CMsgs);   
                                                   if(fullConversations.length === conversations.length) {
                                                      fullConversations; 
                                                     res.render("inbox",{messages:messages,conversations:conversations,fullConversations:fullConversations});
                                                    }
                                                   //  console.log (fullConversations.length+' vs '+conversations.length)
                                                //     console.log('All conversation messages:');
                                                //   console.log(fullConversations);
                                                   
                                               }
                                            //   else{
                                            //         res.render("inbox",{messages:messages,conversations:conversations});
                                            //   }
                                             });
                                         });
                                         //  res.render("inbox",{messages:messages,conversations:conversations});
                                     }
                                     else{
                                                    res.render("inbox",{messages:messages,conversations:conversations});
                                              }
                                     
                                 });
           
         }
    });
    
});               

module.exports=router;