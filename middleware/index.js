const User   = require("../models/user");

const requestify=require("requestify");
const crypto                  = require("crypto");
const async                   = require("async");
const nodemailer              =  require("nodemailer");
const express               = require("express");
const app                  = express();
const middlewareObj = {};
const moment = require('moment');
const faker                 = require('faker/locale/en');
const Message                =require("../models/message");
var randomLocation = require('random-location')

const logger               = require('../logger/logger')
 const googleMapsClient = require('@google/maps').createClient({
              key: 'AIzaSyAWuJ6jjAlCJqpKPvYgvENDFdCUWv-nOe0'
            });
            
   const P = {
              latitude: -1.2814369,
              longitude: 36.7394723
}
 
const R = 15000
// middlewareObj.emailVerifier=function(req,res){
//     var email=req.body.email;
//     let verifier=new Verifier("at_8EuvZm3nDak0xfhj2tE1mN1XhcHte");
    
//     verifier.verify("email",(err,data) =>{
//         if (err) {
//             console.log(err);
//           return res.redirect('back');
//         }else
//         {
//               console.log(data);
//         }
  
//     });
    
// }
//create an house

//To check is user is logged in
middlewareObj.isLoggedIn = function (req, res, next){

    if(req.isAuthenticated()){
       
        return next();
    }
    req.session.returnTo = req.path; 
    req.flash('error','Please Login first')
    res.redirect("/login");
}
//To check is user is Admin
middlewareObj.caclRadius= function calcCrow(lat1, lon1, lat2, lon2) 
    {
        function toRad(Value) {
    /** Converts numeric degrees to radians */
             return Value * Math.PI / 180;
        }
      var R = 6371; // km
      var dLat = toRad(lat2-lat1);
      var dLon = toRad(lon2-lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      return d;
    }

middlewareObj.isAdmin = function (req, res, next){
    if(req.user.role === 'admin'){
        
        return next();
    }
   
    res.redirect("/somethinguser");
}

middlewareObj.isHouseOwner=function(req,res,next){
            if(req.user.role==='house-Owner'){
                return next();
            }else{
                logger.infoLog.info(req.user.username + " has just tried to access post-House Route ::"+"\x1b[31m"+" Access Denied!"+"\x1b[0m" );
                
                req.flash("error","You are not privilegded to access this route!")               
                res.redirect("back");
            }
    }
    
middlewareObj.isRealString = function(str){
    return typeof str === 'string' && str.trim().length > 0;
};

middlewareObj.getLocation= async function(owners){
   var locname;
   var locations=new Array();
   for(var i=0;i<owners;i++){
            var randomPoint = randomLocation.randomCirclePoint(P, R)
                        var latitude=randomPoint.latitude;
                        var longitude=randomPoint.longitude;
            let newpromise= new Promise((resolve,reject)=>{
              requestify.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+latitude+','+longitude+'&location_type=APPROXIMATE'+'&key=AIzaSyAWuJ6jjAlCJqpKPvYgvENDFdCUWv-nOe0').then(function(response) {
                    response.getBody();
                    var loc=JSON.parse(response.body)
                    locname=loc.results[0].formatted_address;
                   resolve(locname)
                   });
       })
      await newpromise; 
      let promise2=new Promise((resolve)=>{
          var loc={
                            coordinates:{
                                        lat:latitude,
                                         long:longitude
                                         },
                                name: locname
             }
               locations.push(loc)
               resolve(locations)
      })
      await promise2;
    }
        
      return locations;
};
middlewareObj.setHouseOwner=async function(){
    var query='house-Owner'
    var owners=new Array();
    let promise=new Promise((resolve)=>{
               User.find({role:query},(error,users)=>{
                owners=users
             resolve(owners)
         })
    })
   await promise;
   return owners;
}
middlewareObj.setRandomNoUsers=async function(n){
    var num=faker.random.number({ 'min': 0,
                                             'max': n
                                 });
   return num;
}
middlewareObj.rateHouses=async function(){
            var users=new Array();
    let promise=new Promise((resolve)=>{
               User.find({},(error,users)=>{
                  users.forEach((owner,i)=>{
                  users.push(owner);
             })
             resolve(users)
         })
    })
   await promise;
};

     

 middlewareObj.isActive=(req,res,next)=>{
   //  console.log(req.body);
            User.findOne(req.body.username,(err,user)=>{
               console.log(user);
                if(err){
                    res.redirect("back");
                    
                }else{
                        return next();
                }
    })
 }

middlewareObj.isInArray = function(value, array){

       return array.indexOf(value) > -1;
 
};
middlewareObj.compare=function compare(a,b) {
  if (a.similarity < b.similarity)
    return 1;
  if (a.similarity > b.similarity)
    return -1;
  return 0;
}
middlewareObj.stripEndQuotes = function (s){
	var t=s.length;
	s=s.substring(1,t--);
	 s=s.substring(0,t);
	return s;
}
//To check is user is counelor
// middlewareObj.isCounselor = function (req, res, next){
//     if(req.user.role === 'counselor'){
//         return next();
//     }
//     res.redirect("/counselling");
// }
// //To check if user is client
// middlewareObj.isClient = function (req, res, next){
//   if(req.user){
//         if(req.user.role === 'member'){
//         return next();
//     }
//      res.redirect("/user/personal");
//   }
//   else{
//       next();
//   }
// }
//Capitalize first letter
middlewareObj.capitalize = function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
// to check if it is empty
middlewareObj.isEmpty = function (str) {
    return (!str || 0 === str.length);
}

middlewareObj.emailConfirmation = function (req,res){
    async.waterfall([
        function(done){
            crypto.randomBytes(20,function(err,buf){
                var token = buf.toString('hex');
                done(err,token);
            });
            
        },
        function(token, done){
            
            if(req.body.email){
                var email = req.body.email;
            }
            else{
                var email = req.user.email;
            }
            User.findOne({email:email},function(err,user){
                if(!user){
                    console.log(err + "No accont exists");
                 req.flash("error"," The email you entered does not belong to an account !");
                    return res.redirect('back');
                }
                       user.verifyToken = token;
                 user.verifyExpires = Date.now()+3600000;//1hr
                 user.save(function(err){
                    done(err, token, user);
                    
                });
            });
        },
        function(token, user, done){
            var smtpTransport = nodemailer.createTransport({
                service:'Gmail',
                auth:{
                    user:'webemailkip@gmail.com',
                    pass:'parcel1002017'
                
                }
            });
            var mailOptions = {
                to: user.email,
                from:'webemailkip@gmail.com',
                subject:'dmin Panel ',
                text:'You are receiving this to confirm your email address  ' +'\n\n'+
                'Click on the link or paste it into your browser to complete the process'+'\n\n' +
                'http://'+ req.headers.host +'/verify/'+token + '\n\n'+
                'if you did not request this please igonre this email'
                };
                smtpTransport.sendMail(mailOptions, function(err){
            
                req.flash('success','An email has been sent to '+ user.email + ' with further instructions.');
                done(err, 'done');
                });
        }
        ], function(err){
            if(err) return next(err);
            res.redirect('back');
        }
        );
}
//function generate random string
    middlewareObj.randomStr = function () {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
      for (var i = 0; i < 12; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    
      return text;
    }
//Delete values from array
 middlewareObj.removeA = function (arr) {
     var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
    }
//Delete values from array
 middlewareObj.checkOnlineUsers = function (users,clients) {
      var resArr = [] ;
            users.forEach(function(user){
                   if (clients[user]){
                      
                        var status = {
                            'user':user,
                            'status':'online'
                        }
                        resArr.push(status);
                     } else {
                      
                           var status = {
                            'user':user,
                            'status':'offline'
                        }
                        resArr.push(status);
                     }  
            
        });
    return resArr;
    }
//ignore favicon
middlewareObj.ignoreFavicon =function (req, res, next) {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({nope: true});
  } else {
    next();
  }
}
middlewareObj.createToken=function (){
                crypto.randomBytes(20,(err,buf)=>{
                var token = buf.toString('hex');
                return token;
            });
        }
//Middlware to determine number of unread messages
middlewareObj.unread =function (req, res, next) {
 Message.aggregate(
  [
    {
      $match: {
        to:req.user.username , status:'unread', type:'chat'
      }
    },
    {"$group" : {_id:"$from", count:{$sum:1}}}
  ]
 ).exec(function(err, found){
        if(err){console.log(err)}
        else{
            console.log(found)
            res.locals.unread = found;
        }
    });
      next();
}

    module.exports = middlewareObj;