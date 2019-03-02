var express                =require("express");
var   router                 =express.Router();
const User                 =require("../models/user");
const House              =require("../models/house");


var  passport               =require("passport");
var moment                 = require("moment"); 
var middleware             = require("../middleware");
var crypto                 = require("crypto");
//const jwt                  = require("jsonwebtoken");
//var Lowercase              =require("lower-case");
const SignUp               = require('../models/validation/signUp.js');


//const register             = require('../models/validation/register.js');
const session              = require("express-session");
const logger               = require('../logger/logger');
//const logger = require('./logger').createLogger('development.log');
const async                 = require("async");
const nodemailer            =  require("nodemailer");
//onst { body,validationResult } = require('express-validator/check');
const { sanitizeBody }      = require('express-validator/filter');
const cryptoRandomString    = require('crypto-random-string');
const multer                = require('multer');
const cloudinary            = require('cloudinary');

var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();
            
            if(dd<10) {
                dd = '0'+dd
            } 
            
            if(mm<10) {
                mm = '0'+mm
            } 
            today = dd + '/' + mm + '/' + yyyy;
//cloudinary config
cloudinary.config({ 
    cloud_name: 'devteamke', 
    api_key: 442155129588629, 
    api_secret: "ylF7sUCL0j1cb9rt0Khgk6inG_s"
  });

//Mutler configuration move during refactoring
// var storage = multer.diskStorage({
//   filename: function(req, file, callback) {
//     callback(null, Date.now() + file.originalname);
//   },
//   onError : function(err, next) {
//   //   console.log('error', err);
//       next(err);
//     }
// });
// var fileFilter = function (req, file, cb) {
//     // accept image files only
//     if(req.originalUrl=='/profilepic_android'){
//             if (!file.originalname.match(/\.(jpg|jpeg|png|gif|)$/i)) {
//               req.fileValidationError ='Invalid file type';
//                   cb(null, true);
//             }
//             cb(null, true);
//     }else if(req.originalUrl=='/new_report_android'){
//         if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|)$/i)) {
//               req.fileValidationError ='Invalid file type';
//                   cb(null, true);
//           }
         
//             cb(null, true);
//     }
// };

// var maxSize =1 * 1024 * 1024 *25
// var upload = multer({ storage: storage,limits:{ fileSize: maxSize }, fileFilter: fileFilter, })

router.get("/login",(req,res)=>{
        res.render("login");
    })
    //renders the registtration page
router.get("/register",(req,res)=>{
    res.render("register");
})
router.post("/login", passport.authenticate("local",{  failureFlash :"Sorry, Wrong Credentials!",failureRedirect: "/login" }),function(req, res) {
      logger.infoLog.info(middleware.capitalize(req.user.username ) + " has just logged in " +  " at " + moment(moment().valueOf()).format('h:mm:a,  Do MMMM  YYYY,,') )
     req.flash("success","Login successful!")
     res.redirect(req.session.returnTo || '/');
      delete req.session.returnTo;
    
});
router.get("/logout", function(req,res){
   
    if(req.isAuthenticated()){
        
        logger.infoLog.info(middleware.capitalize(req.user.username ) + " has just logged out " +  " at " + moment(moment().valueOf()).format('h:mm:a, Do MMMM  YYYY,') )
        req.logout();
        req.session.destroy(function(err){
            if(err){
              logger.errorLog.error(err);
            } else {
                // Check for Geolocation API permissions
                navigator.permissions.query({name:'geolocation'})
                  .then(function(permissionStatus) {
                    console.log('geolocation permission state is ', permissionStatus.state);
                
                    permissionStatus.onchange = function() {
                      console.log('geolocation permission state has changed to ', this.state);
                    };
                  });
                res.redirect("/");
            }
        });
    }else{
        req.flash('error','Your were not logged in');
          res.redirect("/");
    }
   
});
router.get("/inbox",(req,res)=>{
    res.render("inbox");
})
//register for authentication
router.post("/register",async(req,res,next)=>{
    //console.log(req.body);
       var token=crypto.randomBytes(25).toString('hex');
       logger.infoLog.info("User registration request received from " + middleware.capitalize(req.body.fname));
        console.log(req.body);
       logger.infoLog.info("Name: " + middleware.capitalize(req.body.fname)  + "email: " + req.body.email + " has requested registration" + " at " + moment(moment().valueOf()).format('h:mm:a,  Do MMMM  YYYY,'));
         var isValid = SignUp.validate({
             uname:req.body.username,
             fname: req.body.fname,
             lname: req.body.lname,
             email: req.body.email,
             title: req.body.title.value,
             password:req.body.password,
          });
          
        if(isValid.error){
     // console.log(isValid.value.password)
      //Add response to invalid on client side
          req.flash("error",isValid.error.message);
          res.redirect("back");
          return;
         }
         
         if(isValid.value.password!=req.body.confPassword){
             req.flash("error","Password do not match");
             res.redirect("back");
             return;
         }
            
            User.findOne({username:isValid.value.uname},(error,uname)=>{
                if(uname){
                    req.flash("Username already exists.")
                    return;
                }
            })
          // console.log("successful")
                              //check if email does not exists      
         User.findOne({email:isValid.value.email}, (error, email)=> {
                     if(email){
                         req.flash("error"," The email you entered is already in use !");
                        res.redirect("back");   
                     }else{
                         
                         User.register(new User({
                                            fname:isValid.value.fname,
                                            username:isValid.value.uname,
                                            verifyToken:token,
                                            verifyExpires:Date.now()+3600000,
                                            lname:isValid.value.lname,
                                            title:isValid.value.title,
                                            email:isValid.value.email,
                                            joinedAt:moment(moment().valueOf()),
                                             }),isValid.value.password, (err,user)=>{
                                                 
                            if(err){
                                    req.flash("error",err.message);
                                    res.redirect("register");
                            }else{
                                //req.flash("success","New admin has added successful.")
                                 //logger.infoLog.info(isValid.value.fname + " has requested for registration");
                                  //console.log(token);
                                //  Notify.create({body:' A new admin has just registered',
                                //                 type:'new_admin',
                                //                 ref_id:user._id
                                    
                                //   },(err,notification)=>{
                                //      req.io.sockets.to('masterRoom').emit('new-report/admin', user)
                                //  })
                             async.waterfall([
                                 function(done){
                                var smtpTransport = nodemailer.createTransport({
                                    service:'Gmail',
                                    auth:{
                                        user:'webemailkip@gmail.com',
                                        pass:'parcel1002017'
                                    }
                                });
                                var mailOptions = {
                                    to: isValid.value.email,
                                    from:'webemailkip@gmail.com',
                                    subject:'House community',
                                    text:'Hello \b'+user.fname +'\b' +'\n\n' + 'Your request for admin registration has been received and pending for verification ' +'\n\n'+
                                    'Welcome to StreetSweeperKE'
                                    };
                                    smtpTransport.sendMail(mailOptions, function(err,info){
                                    //req.io.sockets.to('masterRoom').emit('new-admin', uname) 
                                    
                                    req.flash('success','Your registration was successful. Please,login');
                                    res.redirect("/login");
                                  // console.log(info);
                                    done(err, 'done');
                                    });
                                }
                                ], function(err){
                                    if(err){ 
                                        // return next();
                                        console.log(err);
                                }else{
                                    
                                }
                             });
                          }
                      });
                     }    
              });
    
});
router.get("/profile",(req,res)=>{
    res.render("myprofile");
})
router.get("/profile/:id",async(req,res,next)=>{
    res.render("/user_profile");
})
// router.get("/verifications",middleware.isLoggedIn,middleware.isMasterAdmin,(req,res)=>{
//     User.find({'isActive':false,'isVerified':false,registeredBy:null},(err,Users)=>{
//             res.render("verifications",{users:Users});
//         });
//     });
// router.post("/verifications/:id",middleware.isLoggedIn,middleware.isMasterAdmin,(req,res)=>{
//         if(req.body.choice==="Delete"){
//          User.findByIdAndRemove(req.params.id,(err,user)=>{
//           if(err){
//               req.flash("error","Something went wrong");
//               res.redirect("back");
//           }else{
            
//               req.flash("success","Admin request rejected");
//               res.redirect("panel");
//             }
//          });
//         }
       
//         if(req.body.choice==="Activate"){
//             Notify.Update({ref_id:req.params.id},{status:'read'});
//         User.findByIdAndUpdate(req.params.id,{isActive:true,registeredBy:req.user.username,yearOfHire:today},{new:true},(err,user)=>{
//              if(err){
//               req.flash("error","Something went wrong");
//               res.redirect("back");
//           }else{
//                     async.waterfall([
//                                  function(done){
//                                 var smtpTransport = nodemailer.createTransport({
//                                     service:'Gmail',
//                                     auth:{
//                                         user:'webemailkip@gmail.com',
//                                         pass:'parcel1002017'
//                                     }
//                                 });
//                                 var mailOptions = {
//                                     to: user.email,
//                                     from:'webemailkip@gmail.com',
//                                     subject:'StreetSweeperKE Account Confirmation',
//                                     text:'Hello \b'+user.fname +'\b' +'\n\n' + 'You are receiving this mail  from jenga Citi that your request for admin has been received and accepted.'+ '\n'+ 'Click on the link to verify your account and login.USE USERNAME TO LOGIN ' +'\n\n'+
//                                     'Click on the link or paste it into your browser to go on.' + '\n\n' +' Your Username:\b' +user.username  + '\b'+ '\n\n' +
//                                   'http://'+ req.headers.host +'/confirmaccount/'+ user.verifyToken+'/activated' +'\n\n'+
//                                     'Welcome to StreetSweeperKE'
//                                     };
//                                     smtpTransport.sendMail(mailOptions, function(err,info){
                                     
//                                     req.flash('success','Account successfully activated.');
//                                     res.redirect("back");
//                                   // console.log(info);
//                                     done(err, 'done');
//                                     });
//                                 }
//                                 ], function(err){
//                                     if(err){ 
//                                         return next();
//                                 }else{
                                    
//                                 }
//                              });
//           }
//         });
//     }
//     })
//   // router.post("/verifications/:id/")
// router.get("/add_admin",middleware.isLoggedIn,middleware.isMasterAdmin,(req,res)=>{
//           // res.render("verifications",);
//             res.render("add_admin");
     
// });
// router.post("/add_admin", middleware.isMasterAdmin,(req, res)=> {
//         console.log(req.body);
//         var token=crypto.randomBytes(25).toString('hex');
//          crypto.randomBytes(20,function(err,buf){
//                  token = buf.toString('hex');
//             });
//         logger.infoLog.info("Admin registration request received from " + middleware.capitalize(req.user.username));
//         //console.log(req.body);
//         //console.log("A new admin " + middleware.capitalize(req.body.fname)  +" using email: " + req.body.email + " has requested registration" + " at " + moment(moment().valueOf()).format('h:mm:a,  Do MMMM  YYYY,'));
//          var isValid = SignUp.validate({
//              fname: req.body.fname,
//              lname: req.body.lname,
//              email: req.body.email,
//           });
//         if(isValid.error){
//       // console.log(isValid.error)
//       //Add response to invalid on client side
//           req.flash("error",isValid.error.message);
//           res.redirect("back");
//           return;
//          }
         
//             var password = "123";
//             var uname=isValid.value.fname;
//             var username=Lowercase(uname)+Math.floor(Math.random() * (+10 - +0)) + +1;
//             var today = new Date();
//             var dd = today.getDate();
//             var mm = today.getMonth()+1; //January is 0!
//             var yyyy = today.getFullYear();
            
//             if(dd<10) {
//                 dd = '0'+dd
//             } 
            
//             if(mm<10) {
//                 mm = '0'+mm
//             } 
            
//             today = dd + '/' + mm + '/' + yyyy;
//                               //check if email does not exists      
//          User.findOne({email:isValid.value.email}, (error, email)=> {
//                      if(email){
                         
//                          req.flash("error"," The email you entered is already in use !");
//                         res.redirect("add_admin");   
//                      }else{
                                            
//                                                   User.register(new User({
//                                                     username,
//                                                     fname:isValid.value.fname,
//                                                     verifyToken:token,
//                                                     isActive:true,
//                                                     verifyExpires:Date.now()+3600000,
//                                                     lname:isValid.value.lname,
//                                                     county:req.body.county,
//                                                     email:isValid.value.email,
//                                                     yearOfHire:today,
//                                                   role:req.body.role,
//                                                     authority:req.body.authority,
//                                                     registeredBy:req.user.username
//                                                     }),password, function(err,user){
//                             if(err){
//                                     req.flash("error",err.message);
//                                     res.redirect("add_admin");
//                             }else{
//                                 //req.flash("success","New admin has added successful.")
//                                  logger.infoLog.info(isValid.value.fname + " has been successfully registered ");
//                                   //console.log(token);
//                                 // console.log(user);
//                                   logger.infoLog.info("Sending"+isValid.value.fname+" email for account completion setup  ");
//                              async.waterfall([
//                                  function(done){
//                                 var smtpTransport = nodemailer.createTransport({
//                                     service:'Gmail',
//                                     auth:{
//                                         user:'webemailkip@gmail.com',
//                                         pass:'parcel1002017'
//                                     }
//                                 });
//                                 var mailOptions = {
//                                     to: isValid.value.email,
//                                     from:'webemailkip@gmail.com',
//                                     subject:'StreetSweeperKE Account Confirmation',
//                                     text:'Hello \b'+user.fname +'\b' +'\n\n' + 'You are receiving this  from StreetSweeperKE mail that you have been added as an Admin. Complete by  setting up your password for the account' +'\n\n'+
//                                     'Click on the link or paste it into your browser to go on.' + '\n\n' +' Your Username:\b' + username  + '\b'+ '\n\n' +
//                                     'http://'+ req.headers.host +'/confirmaccount/'+ token + '\n\n'+
//                                     'Welcome to StreetSweeperKE'
//                                     };
//                                     smtpTransport.sendMail(mailOptions, function(err,info){
                                     
//                                     req.flash('success','An email has been sent to '+ user.email + ' with further instructions to verify the account.');
//                                     res.redirect("/add_admin");
//                                   // console.log(info);
//                                     done(err, 'done');
//                                     });
//                                 }
//                                 ], function(err){
//                                     if(err){ 
//                                         return next();
//                                 }else{
                                    
//                                 }
//                              });
//                           }
//                       });
//                      }    
//               });
//         });
 
// router.get("/confirmaccount/:token",function(req, res) {
//         var token=req.params.token;
//       // console.log(token);
//       User.findOne({'verifyToken':token},(err,user)=>{
//           if(user){
//               if(!user.isActive){
//                   req.flash('success','Account successfully verified. Login');
//                   res.render("register",{user:user});
//               }else{
//                   req.flash('success','Kindly Set Up the Password and username of your choice');
//                  res.render("register",{user:user});
//               }
//           }else
//           {
//                 logger.infoLog.info("A user has just tried to confirm account with an expired token");
//                 req.flash('error','Confirm Account token is invalid or has expired');
//                 res.redirect("/login");
//           }
//       })
// });
//  router.get("/confirmaccount/:token/activated",async(req,res)=>{
           
//                  User.findOne({'verifyToken':req.params.token},(err,user)=>{
//                      if(user){
//                         // console.log(user);
//                         res.render("register",{user:user,req});
//                       //  console.log(req.url);
//                      }else{
//                          req.flash("error","It seems you have confirmed your account.Login ")
//                          res.redirect("/login")
//                      }
//                  });
//      });
// router.post("/confirmaccount/:token/activated",(req,res,next)=>{
//     console.log(req.body);
//           User.findOneAndUpdate({verifyToken:req.params.token},{isVerified:true,verifyToken:undefined,verifyExpires:undefined},{new:true},(err,user)=>{
//           if(err){
//               console.log(err);
//               req.flash("error","Something went wrong");
//               res.redirect("back");
//           }else{
//               req.flash("success","Your account has been verified, Login")
//               res.redirect("/login");
//           }
//       })

      
// });     
// router.post("/confirmaccount/:token", (req, res)=> {
    
            
//             async.waterfall([
//         function(done){
//                       User.findOne({verifyToken:req.params.token,verifyExpires:{ $gt:Date.now()} },function(err,user,next){
//                             // console.log(user);
//                             if(!user){
//                                 //console.log(user);
//                                 //console.log("token time has expired or invalid");
//                                 //console.log(err);
//                                  req.flash('error','Your verify account token is invalid or has expired.Please contact master admin');
//                                  res.redirect("back");
//                             }else if(user){
//                               // console.log('code')
//                             //console.log(req.body.password +" vs "+req.body.confirmPassword);
//                                  if(req.body.password===req.body.confirmPassword){
//                                   user.setPassword(req.body.password,function(err,user){
//                                  user.isVerified=true;
//                                  user.isActive=true;
//                                  user.verifyToken=undefined;
//                                  user.verifyExpires=undefined;
//                                      user.save(function(){//saves the new details for the user to database
//                                          req.logIn(user,function(err){
//                                          req.flash('success','Password Succesfully set. Welcome');
//                                             done(err,user);
//                                          });
                                    
//                                     });
//                                  });
//                              }else{
//                                  req.flash('error','Passwords does not match');
//                                  res.redirect("/confirmaccount/"+ req.params.token);
//                              }
//                             //  console.log(req.user.email);
                                
//                          }
                            
//                      });
//         },
//          function( user, done){
//             var smtpTransport = nodemailer.createTransport({
//                 service:'Gmail',
//                 auth:{
//                     user:'webemailkip@gmail.com',
//                     pass:'parcel1002017'
                
//                 }
//             });
//             var mailOptions = {
//                 to: user.email,
//                 from:'webemailkip@gmail.com',
//                 subject:'Street Sweeper Account Confirmation',
//                 html:"Hello \b" +user.username + "\bThis is a confirmation that the password for your streetSweepeer admin account " + user.email +" has been set and your account has been verified\n\n"
//                         +"Welcome"
//                 };
//                 smtpTransport.sendMail(mailOptions, function(err){
//                  logger.infoLog.info(middleware.capitalize( user.username) + "has changed their password");
//                  req.flash('success','Your account has been verified.');
//                  res.redirect("/panel");
//                 done(err,'done');
//                 });
//         }
//         ], function(err){
//             if(err){ 
//                 return next();
                
//             }
             
//         }
// )
//  });
    
//  router.post("/changepassword/:id", (req, res)=> {
//             async.waterfall([
//         function(done){
//                       User.findOne({username:req.user.username },function(err,user,next){
//                              console.log(user);
//                           if(user){
//                               // console.log('code')
//                              console.log(req.body.password +" vs "+req.body.confirmPassword);
//                              if(req.body.password===req.body.confirmPassword){
//                                   user.setPassword(req.body.password,function(err,user){
//                                      user.save(function(err){//saves the new details for the user to database
//                                         if(err){
//                                             req.flash("err","something went wrong");
//                                             res.redirect("back");
//                                         }else{
//                                              req.flash('success','Password Succesfully Changed.');
//                                                 res.redirect("back");
                                    
//                                         }
//                                     });
//                                  });
//                              }else{
//                                  req.flash('error','Passwords does not match');
//                                  res.redirect("/profile");
//                              }
//                             //  console.log(req.user.email);
                                
//                          }
//                      });
//         },
//          function( user, done){
//             var smtpTransport = nodemailer.createTransport({
//                 service:'Gmail',
//                 auth:{
//                     user:'webemailkip@gmail.com',
//                     pass:'parcel1002017'
                
//                 }
//             });
//             var mailOptions = {
//                 to: user.email,
//                 from:'webemailkip@gmail.com',
//                 subject:'Street Sweeper Account Confirmation',
//                 html:"Hello \b" +req.body.username + "\bYour apssword has been successfully changed" 
//                         +"Welcome"
//                 };
//                 smtpTransport.sendMail(mailOptions, function(err){
//                  logger.infoLog.info(middleware.capitalize(user.username) + " has successfully changed their password");
//                  req.flash('success','Password was successfully changed.');
//                  res.redirect("/panel");
//                 done(err,'done');
//                 });
//         }
//         ], function(err){
//             if(err){ 
//                 return next();
                
//             }
             
//         }
// )
//  });

//logout router


// router.get("/resetPassword",function(req, res,err) {
//         res.render("forgot_password");
// });
// router.post("/resetPassword",function(req,res){2
//      async.waterfall([
//         function(done){
//             crypto.randomBytes(20,function(err,buf){
//                 var token = buf.toString('hex');
//                 done(err,token);
//             });
            
//         },
//         function(token, done){
            
//             if(req.body.email){
//                 var email = req.body.email;
//             }
//             else{
//                 var email = req.user.email;
//             }
//             User.findOne({email:email},function(err,user){
//                 if(!user){
//                   //  console.log(err + "No accont exists");
//                  req.flash("error"," The email you entered does not belong to an account !");
//                     return res.redirect('back');
//                 }
//                  user.resetPasswordToken = token;
//                  user.resetPasswordExpires = Date.now()+3600000;//1hr
//                  user.save(function(err){
//                     done(err, token, user);
                    
//                 });
//             });
//         },
//         function(token, user, done){
//             var smtpTransport = nodemailer.createTransport({
//                 service:'Gmail',
//                 auth:{
//                     user:'webemailkip@gmail.com',
//                     pass:'parcel1002017'
                
//                 }
//             });
//             var mailOptions = {
//                 to: user.email,
//                 from:'StreetSweeperKE',
//                 subject:'Account Password Reset',
//                 text:'You are receiving this  mail to set your password and account  ' +'\n\n'+
//                 'Click on the link or paste it into your browser to go on and reset your password'+'\n\n' +
//                 'http://'+ req.headers.host +'/resetpassword/'+token + '\n\n'+
//                 'if you did not request password reset . Kindly s please ignore this email'
//                 };
//                 smtpTransport.sendMail(mailOptions, function(err){
//                  //console.log(mailOptions);
//                 req.flash('success','An email has been sent to you with further instructions to reset your password.');
//                 res.redirect("/login");
//                 done(err, 'done');
//                 });
//         }
//         ], function(err){
//             if(err){ 
//                 return next();
//         }else{
            
//         }
//     });
// });

// router.get("/resetPassword/:token",function(req, res) {
//     User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{ $gt:Date.now()} },function(err,user){
//         if(!user){
//           // console.log("token time has expired or invalid");
//              req.flash('error','reset password token is invalid or has expired');
//              res.redirect("/login");
//         }
//       else{
//           console.log(req.body);
//           res.render("resetpassword",{token: req.params.token,});
    
//       }
// })
// });

//Reset password

// router.post("/resetPassword/:token",function(req, res) {
//      async.waterfall([
//         function(done){
//                      User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{ $gt:Date.now()} },function(err,user,next){
//                 if(!user){
//                     console.log("token time has expired or invalid");
//                     console.log(err);
//                      req.flash('error','reset password token is invalid or has expired');
//                      res.redirect("/login");
//                 }
//                 if(req.body.password===req.body.confirmPassword){
//                  //console.log(req.body.password);
//                 //  console.log(req.user.email);
//                  user.setPassword(req.body.password,function(err){
//                      user.resetPasswordToken = undefined;//The reset tokesn are removed
//                      user.resetPasExpires = undefined;//
                     
//                      user.save(function(){//saves the new details for the user to database
//                     req.logIn(user,function(err){
//                           req.flash('success','Password Succesfully set. Welcome');
//                         done(err,user);
//                     });
                    
//                  });
//              });
//              }else
//              {
//                   req.flash('error','Password do not match');
//                      res.redirect("back");
//              }
//             });
//         },
//          function( user, done){
//             var smtpTransport = nodemailer.createTransport({
//                 service:'Gmail',
//                 auth:{
//                     user:'webemailkip@gmail.com',
//                     pass:'parcel1002017'
                
//                 }
//             });
//             var mailOptions = {
//                 to: user.email,
//                 from:'webemailkip@gmail.com',
//                 subject:'Admin Panel',
//                 text:"Hello\n\n" + "This is a confirmation that the password for your StreetSweeperKE Admin account has just been changed successfully"
//                 };
//                 smtpTransport.sendMail(mailOptions, function(err){
//             logger.infoLog.info(middleware.capitalize(user.username) + "has successfully changed their password");
//                 req.flash('success','Success,Your password has been changed.');
//                 done(err);
//                 });
//         }
//         ], function(err){
//             if(err){ 
//                 return next();
                
//             }
//              res.redirect("/panel");
//         }
// )});






function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login",middleware.isLoggedIn,(req,res)=>{
        
        
    });
};



module.exports=router;
