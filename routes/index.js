var express                =require("express");
var   router                 =express.Router();
const User                 =require("../models/user");
const Like              =require("../models/like");
const House              =require("../models/house");
const Comment             =require("../models/comments");
const ejsLint            = require('ejs-lint');           
const path                  =require("path");
var  passport               =require("passport");
var moment                 = require("moment"); 
var middleware             = require("../middleware");
//var crypto                 = require("crypto");
var request                =require("request");
const Upload                =require("../models/validation/upload.js");

//const register             = require('../models/validation/register.js');
const session              = require("express-session");
const logger               = require('../logger/logger')
const async                 = require("async");
const nodemailer            =  require("nodemailer");
//onst { body,validationResult } = require('express-validator/check');
const { sanitizeBody }      = require('express-validator/filter');
//const cryptoRandomString    = require('crypto-random-string');
const multer                = require('multer');
const cloudinary            = require('cloudinary');
const cloudinaryStorage = require("multer-storage-cloudinary");
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
    cloud_name: 'do7m8vtor', 
    api_key: 885839233384236, 
    api_secret: "4gbzBw8I2RwM6N2R-cRQhde5Kts"
  });


//Mutler configuration move during refactoring
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
  onError : function(err, next) {
  //   console.log('error', err);
      next(err);
    }
});

var fileFilter = function (req, file, cb) {
    // accept image files only
    if(req.originalUrl=='/profilepic'){
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|)$/i)) {
              req.fileValidationError ='Invalid file type';
                  cb(null, true);
            }
            cb(null, true);
    }else if(req.originalUrl=='/upload'){
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|)$/i)) {
              req.fileValidationError ='Invalid file type';
                  cb(null, true);
          }
         
            cb(null, true);
    }
};

var maxSize =1 * 1024 * 1024 *25
var upload = multer({ storage: storage,limits:{ fileSize: maxSize }, fileFilter: fileFilter, })
//,




router.get("/",middleware.isLoggedIn,async(req,res,next)=>{
        try{
            
            let house_promise= new Promise((resolve,reject)=>{
                House.find({},(err,allhouses)=>{
                    resolve(allhouses);
                  // console.log(allhouses);
                });
            });
             let all_houses=await house_promise;
             let like_promise= new Promise((resolve,reject)=>{
                Like.find({},(err,alllikes)=>{
                    resolve(alllikes);
                  // console.log(allhouses);
                });
            });
                  let all_likes=await like_promise;
            let comment_promise=new Promise((resolve,reject)=>{
                Comment.find({},(err,allcomments)=>{
                    resolve(allcomments);
                })
            })
               let all_comments= await comment_promise;
      
            let users_promise=new Promise((resolve,reject)=>{
                User.find({},(err,allusers)=>{
                    resolve(allusers);
                })
            })
                  let all_users=await users_promise;
             
             
          
              //console.log(all_houses.uploadedAt);
               res.render("index",{houses:all_houses,likes:all_likes,comments:all_comments,users:all_users});
              
        } catch(error){
            return res.status(200).json({success:false, message:error.message});
        }
})
router.post("/loc",async(req,res)=>{
     console.log(req.body);
     var lat=req.body.latitude;
     var long=req.body.longitude;
    var BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=";

    var address = lat + ","+long;
    var API_KEY='AIzaSyAWuJ6jjAlCJqpKPvYgvENDFdCUWv-nOe0';
    var url = BASE_URL + address + "&key=" + API_KEY;
console.log(url)
     request(url, (error, response, body)=> {
        if (!error && response.statusCode == 200) {
            console.log(res.json(body));
            res.json(body);
           // console.log(body);
        }
        else {
            console.log(error)
        }
    });

   

})
    //renders the registtration page
router.get("/register",(req,res)=>{
    res.render("register");
})
router.get("/upload",middleware.isLoggedIn,(req,res)=>{
    res.render("upload");
})

//var pictures=upload.single('image');
router.post("/upload",middleware.isLoggedIn, upload.single('images'),(req,res,next)=>{
    //console.log(req.file);
    console.log(req.body);
    console.log(req.file);
    var isValid=Upload.validate({
        name:req.body.housename,
        description:req.body.description,
        location:req.body.house_location
        
    });
    if(isValid.error){
        req.flash("error",isValid.error.message)
        res.redirect("back");
        return;
    }
    
    //console.log(isValid.value.name)
     var file=req.file.path;
     console.log('[body]',req.body)
     console.log('[file]',file)
    
    cloudinary.v2.uploader.upload(file,(err,result)=>{
       console.log('[result]',result);
        req.body.images = result.secure_url;
        
         var newhouse={
                       name:isValid.value.name,
                       images:req.body.images,
                       details:isValid.value.description,
                       location:isValid.value.house_location,
                       postedBy:{
                           id:req.user._id,
                           username:req.user.username
                       }
       }
       if(err){
           res.send('an error occured')
       }else{
        House.create(newhouse)
                .then((house)=>{ 
                    console.log(house.postedBy.username);
                    if(house){
                           req.flash('success',"Images successfully uploaded");
                          res.redirect("/upload");
                        
                    }
                })
                .catch((err)=>{
                    req.flash('error',"An error occured, please check your upload");
                    res.redirect("/upload");
                })
       }
       
    
        
    });
    
});


//adding comments to each house
router.post("/house_comment",async(req,res,next)=>{
    //console.log(req.body);
    var newComment={
                        text:  req.body.text,
                        user_id:req.user._id,
                        house_id:req.body.houseid
                    }
                console.log(newComment);
                   
                     Comment.create(newComment)
                                     .then((newcomment)=>{
                                                 return res.json({success:true})
                                                console.log(newcomment)
                                            })
                                            
                                     .catch((err)=>{
                                         console.log(err);
                                                return res.json({success:true})
                                     })                
})


//Like post and unlike
router.post("/house_like",middleware.isLoggedIn,async(req,res,next)=>{
  ///  console.log(moment().valueOf())
  const{body}=req;
  const{user}=req;
  console.log(req.body.liked)
  const query={
                user_id:user._id,
                house_id:body.houseid
             }
    if(body.liked){
        Like.findOneAndDelete(query)
                .then((data)=>{
                     console.log(req.user.username+' disliked  a house')
                     return res.json({success:true})
                })
                .catch((err)=>{
                      console.log(err)
                })
                    
                
        
    }else if (!body.liked){
         Like.create(query)
                 .then((newLike)=>{
                      House.findById(query.house_id,(error,foundhouse)=>{
                         console.log(foundhouse);
                         foundhouse.likes++;
                         foundhouse.save();
                        // console.log(foundhouse);
                     })
                    console.log(req.user.username+' liked a house')
                     return res.json({success:true})
            
                              
                 })
                .catch((err)=>{
                      console.log(err)
                })
    }
                     
})

router.get("/inbox",(req,res)=>{
    res.render("inbox")
})
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login",middleware.isLoggedIn,(req,res)=>{
        
        
    });
};



module.exports=router;
