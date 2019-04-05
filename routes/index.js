var express                =require("express");
var   router                =express.Router();
const User                 =require("../models/user");

const Rating                =require("../models/rating");
const House                =require("../models/house");
const Comment              =require("../models/comments");
const Viewed             =require("../models/houseviewed");
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

//generating fake data
const P = {
  latitude: -1.2972,
  longitude: 36.8283
}
 
const R = 30000 // meters
//createHouse()

var messages= new Array();

var data = new Array();

async function createHouse(){
       var owners
       
            
            var owners=new Array();
            let promise=new Promise((resolve)=>{
                       User.find({role:'house-Owner'},(error,users)=>{
                        owners=users
                     resolve(owners)
                 })
            })
           await promise;

        console.log(owners.length)
       
        
        var alltypes=new Array();
        
     for(var p=0;p<owners.length;p++){
         var housetypes=new Array();
        
            var z=faker.random.number({
                                                      'min':1,
                                                      'max':4
                                      })
                    var i=0;    ///console.log('Number of rooms:',z)
           do{
              
                  
                        let prom=new Promise((resolve)=>{ 
                            var p=faker.random.number({'min':4000,'max':20000})
                                     resolve(p)})
                              let rom=await prom      
                             // console.log('Random cost',rom)
                                let prom2=new Promise((resolve)=>{
                                           var house=faker.random.arrayElement([{room_type:faker.random.arrayElement(["Single-room","Bedsitter","One-Bedroom","Two-Bedroom","Three-Bedroom","Own-Compound"]),
                                                          room_cost:rom}  
                                          ])
                                            resolve(house)
                                })
                        let house=await prom2;
                       // console.log(i,' Room ',house)
                             //No house type should be same
                             var isadded
                         console.log(house)
                             if(housetypes.length>=1){
                                 for(var j=0;j<housetypes.length;j++){
                                      
                                         if(house.room_type===housetypes[j].room_type){
                                                while(house.room_type===housetypes[j].room_type){
                                                       let prom2=new Promise((resolve)=>{
                                                               var house=faker.random.arrayElement([{room_type:faker.random.arrayElement(["Single-room","Bedsitter","One-Bedroom","Two-Bedroom","Three-Bedroom","Own-Compound"]),
                                                                              room_cost:rom}  
                                                              ])
                                                                resolve(house)
                                                          })
                                                          house=await prom2; 
                                                }
                                             }
                                    }
                                             housetypes.push(house)  
                             }else{
                                        housetypes.push(house)   
                                       
                                     }
                                     i++;
                           
             } while(i<z);
            // console.log(housetypes)
             
                alltypes.push(housetypes)
                //console.log(p,'',alltypes.length)
         }
                //console.log('All house rooms',alltypes)
             // return
              
         let promise2=new Promise((resolve)=>{
             var locs=middleware.getLocation(owners.length);
                resolve(locs);
        })
       let locs= await promise2;
       
      
             for(var i =0;i<owners.length;i++){
                 // let promise2=new Promise((resolve)=>{
                       var house = {
                                //_id: "SS"+cryptoRandomString(10)+"_"+cryptoRandomString(10),
                                  name: faker.name.findName() +'  Apartment',
                                  postedBy:owners[i]._id,
                                  details:faker.random.words()+faker.random.words()+faker.random.words()+faker.random.words(),
                                  house_types:alltypes[i],
                                  location:locs[i],
                                  water:faker.random.arrayElement([true,false]),
                                  internet:faker.random.arrayElement([true,false]),
                                  images:[ "https://source.unsplash.com/random/450x250","https://picsum.photos/450/250/?random","https://source.unsplash.com/random/450x251"],
                                  contact:{
                                      phone:faker.phone.phoneNumber('+2547########'),
                                      mail:faker.internet.email()
                                     }  
                             }
                           //  console.log(house)
                            
                             data.push(house)
                                
                }
                
                    for(var i=0;i<data.length;i++){
                        House.create(data[i])
                        
                                .then((newhouse)=>{
                                    console.log(newhouse)
                                })
                                .catch((err)=>{
                                    console.log(err)
                                })
                    }
           
        }

//createHouse();
async function createUser(){
        
        for(var i =0;i<30;i++){   
            var randomPoint = randomLocation.randomCirclePoint(P, R)
            var latitude=randomPoint.latitude;
                        var longitude=randomPoint.longitude;
                     var user = {
                        //_id: "SS"+cryptoRandomString(10)+"_"+cryptoRandomString(10),
                    username : faker.name.firstName(),  
                      fname: faker.name.firstName(),
                      lname:faker.name.lastName(),
                      title:faker.random.arrayElement(['Mr.','Mrs.','Miss','Dr.','Proff']),
                      role:faker.random.arrayElement(['user']),
                      email:faker.internet.email(),
                      createdAt:moment().valueOf(),
                      profilepic:[ "https://source.unsplash.com/random/450x251"],
                      verifyToken:cryptoRandomString(10)+"_"+cryptoRandomString(10),
                      verifyExpires:Date.now()+3600000,
        };
        

        User.create(user)
                .then((user)=>{ 
                    //console.log(house.postedBy.username);
                    if(user){
                          console.log(user)
                    }
                })
                .catch((err)=>{
                  console.log(err)
                })
        }
}
//createUser();
async function rateHouses(){
            let allusers=new Promise((resolve)=>{
                User.find({},(err,foundusers)=>{
                    resolve(foundusers);
                });
            })
            let users=await allusers;
          //  console.log(users.length);
            //get all housesfrom db
            var houses;
            var housesnum
            let allhouses=new Promise((resolve)=>{
                House.find()
                .then((foundhouses)=>{
                    housesnum=foundhouses.length;
                    resolve(housesnum)
                })
            })
           
            await allhouses;
            var n=housesnum/0.8;
            let newpromise= new Promise((resolve)=>{    
                          House.aggregate([ { $sample: {size: n} }],(error,result)=>{
                              
                              houses=result;
                              resolve(houses);
                             }) 
                          }); 
                         
                    await newpromise
                    
            
            // console.log('[all houses]',houses);
          
           // console.log(houses.length)
        
            
            houses.forEach(async(house,i)=>{
                
                //Create a random number of users who will rate from 0 to number of users in db(max=users.length)
                 let randomn_users=new Promise((resolve)=>{
                    var num=faker.random.number({ 'min': 1,
                                             'max': users.length-200
                                          });
                        resolve(num)                  
                        })
                        
                      let num=  await randomn_users;
                        console.log("USers expected:"+ num);
                    //Randomly select those users from db
                    //var selectedusers;
                    
                    let newpromise= new Promise((resolve)=>{    
                          User.aggregate([ { $sample: {size: num} }],(error,result)=>{
                              
                             var selectedusers=result;
                              resolve(selectedusers);
                             }) 
                          }); 
                         
                    let selectedusers= await newpromise
                  console.log("Got USers: "+selectedusers.length)
                  //return
                  let promise3= new Promise((resolve)=>{
                      
                     selectedusers.forEach(async(user,i)=>{
                          var query={
                                user_id:user._id,
                                house_id:house._id,
                                rating:faker.random.number({ 'min': 1,
                                                     'max': 5
                                          })
                     }
                   // console.log(query)
                          var createnewrating;
                         var foundrating;       
                        var allusersrated;
                        var avgrating;
                    let saveRating=new Promise(async(resolve,reject)=>{
                               Rating.findOne({house_id:query.house_id,user_id:user._id},(error,oldrating)=>{ 
                                   if(foundrating){
                                       console.log('Oldrating:',foundrating)
                                       foundrating=oldrating
                                       foundrating.rating=query.rating;
                                        foundrating.save();
                                        resolve(foundrating);
                                      // resolve(oldrating);
                                   }else{
                                       Rating.create(query)
                                     .then(async(newRating)=>{
                                           foundrating=newRating
                                           console.log('newrating:',foundrating)
                                            resolve(newRating);
                                         })
                                       .catch((err)=>{
                                          console.log(err)
                                        })
                                   }
                                   
                               })
                    })
                          await saveRating;
                    

                 let newPromise1=new Promise((resolve,reject)=>{
                  //   console.log(query.house_id)
                                    Rating.aggregate(
                                      [
                                          {
                                          $match: {
                                            house_id:foundrating.house_id
                                          }
                                        },
                                        {
                                          $count: "allratings"
                                        },
                                  ],(error,result)=>{
                                       var r=result[0];
                                     allusersrated=r.allratings
                                     resolve(allusersrated);
                                  }
                                )
                     
                       })     
                    await newPromise1;
                    
                       let newPromise2=new Promise((resolve,reject)=>{
                  //   console.log(query.house_id)
                                    Rating.aggregate(
                                      [
                                          {
                                          $match: {
                                            house_id:foundrating.house_id
                                          }
                                        },
                                        {
                                   $group:
                                     {
                                       _id: "$house_id",
                                       avgRAtings: { $avg: "$rating" },
                                     }
                                 }
                                  ],(error,result)=>{
                                       var r=result[0];
                                     avgrating=r.avgRAtings
                                     resolve(avgrating);
                                  }
                                )
                     
                       })     
                    await newPromise2;
                    console.log('Users Rated:',allusersrated,'avgrating',avgrating)
                   // return;
                 
                          
                           await newPromise1;
                           
                var newhouserating={
                            avg_rating:avgrating,
                             users_rated:allusersrated
                          }
                          //console.log(newhouserating);
                         let mypromise=new Promise((resolve)=>{
                                House.findById(foundrating.house_id)
                                      .then((foundhouse)=>{
                                                foundhouse.rating=newhouserating;
                                                foundhouse.save();
                                              //  console.log(foundhouse)
                                               //console.log(foundhouse) 
                                               
                                            })
                                         .catch((err)=>{
                                             console.log(err);
                                     })
                            })
                        await mypromise;

                      })
                  })
                  await promise3
                      
            })
            
                                                
    }
//rateHouses();



    //renders the registtration page
router.get("/register",(req,res)=>{
    res.render("register");
})
router.get("/upload",middleware.isLoggedIn,middleware.isHouseOwner,(req,res)=>{
    res.render("upload");
})

//var pictures=upload.single('image');
router.post("/upload",middleware.isLoggedIn, upload.array('images'),async(req,res,next)=>{
    const googleMapsClient = require('@google/maps').createClient({
              key: 'AIzaSyAWuJ6jjAlCJqpKPvYgvENDFdCUWv-nOe0'
            });
         
    var m=JSON.parse(req.body.house_location)
 
         var p_location={
                    lat:m.latitude,
         }
         var house_loc;
         var locname;
         let newpromise= new Promise((resolve,reject)=>{
              requestify.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+m.latitude+','+m.longitude+'&location_type=APPROXIMATE'+'&key=AIzaSyBjsdFT4HpouHSdJX7fFPJg6Ym7re9ksuM').then(function(response) {
                    response.getBody();
                    var loc=JSON.parse(response.body)
                    locname=loc.results[0].address_components[0].long_name;
                    resolve(locname)
                   });
         })
      await newpromise;

     house_loc={
            coordinates:{
                lat:m.latitude,
                lang:m.longitude
            },
            name:locname
     }
    console.log(house_loc)
   var isValid;
    var houses=new Array();
    var rooms=req.body.room_types;
    if(!rooms){
        res.flash('error','No house rooms selected');
        res.redirect('back');
    }
    console.log(rooms.length)
    if(rooms.length>1){
            rooms.forEach((room,i)=>{
                
                    if(room=='Single Room'){
                     //   console.log("Single Room available")
                           isValid=Upload.validate({
                                    name:req.body.housename,
                                    description:req.body.description,
                                    location:req.body.house_location,
                                    room_cost:req.body.srcost,
                                    water:req.body.water_available,
                                    internet:req.body.internet_connectivity
                                });
                            if(isValid.room_cost){
                                 console.log(isValid.room_cost)
                            } else{
                                houses.push({
                                    room_type:'Single Room',
                                    room_cost:req.body.srcost
                                })
                               
                            }   
                        }
                        if(room=='Own Compound'){
                               isValid=Upload.validate({
                                    name:req.body.housename,
                                    description:req.body.description,
                                    location:req.body.house_location,
                                    room_cost:req.body.srcost,
                                    water:req.body.water_available,
                                    internet:req.body.internet_connectivity
                                });
                            if(isValid.room_cost){
                                 console.log(isValid.room_cost)
                            }else{
                                 houses.push({
                                    room_type:'Own Compound',
                                    room_cost:req.body.owncost
                                })
                            } 
                        }
                        if(room=='Bedsitters'){
                               isValid=Upload.validate({
                                    name:req.body.housename,
                                    description:req.body.description,
                                    location:req.body.house_location,
                                    room_cost:req.body.bscost,
                                    water:req.body.water_available,
                                    internet:req.body.internet_connectivity
                                });
                            if(isValid.room_cost){
                                 console.log(isValid.room_cost)
                            }else{
                                 houses.push({
                                    room_type:'Bedsitter',
                                    room_cost:req.body.bscost
                                })
                            } 
                        }
                        if(room=='One Bedroom'){
                              isValid=Upload.validate({
                                    name:req.body.housename,
                                    description:req.body.description,
                                    location:req.body.house_location,
                                    room_cost:req.body.br1cost,
                                    water:req.body.water_available,
                                    internet:req.body.internet_connectivity
                                });
                            if(isValid.room_cost){
                                 console.log(isValid.room_cost)
                                 }else{
                                      houses.push({
                                        room_type:'One Bedroom',
                                        room_cost:req.body.br1cost,
                                       
                                    })
                                 } 
                        }
                        if(room=='Two Bedroom'){
                                 isValid=Upload.validate({
                                    name:req.body.housename,
                                    description:req.body.description,
                                    location:req.body.house_location,
                                    room_cost:req.body.br2cost,
                                    water:req.body.water_available,
                                    internet:req.body.internet_connectivity
                                });
                            if(isValid.room_cost){
                                 console.log(isValid.room_cost)
                                 }else{
                                      houses.push({
                                        room_type:'Two Bedroom',
                                        room_cost:req.body.br2cost
                                    })
                                 } 
                            
                        }
                        if(room=='Three Bedroom'){
                                 isValid=Upload.validate({
                                    name:req.body.housename,
                                    description:req.body.description,
                                    location:req.body.house_location,
                                    room_cost:req.body.br3cost,
                                    water:req.body.water_available,
                                    internet:req.body.internet_connectivity
                                });
                            if(isValid.room_cost){
                                 console.log(isValid.room_cost)
                                 }else{
                                    
                                     houses.push({
                                        room_type:'Three Bedroom',
                                        room_cost:req.body.br3cost
                                    })
                                 } 
                        }
            })
    }else{
        req.flash('error','You must select atleast a single room type')
        res.redirect('back')
    }
 
    if(isValid.error){
        req.flash("error",isValid.error.message)
        res.redirect("back");
        return;
    }
    
    let filePaths = req.files;
        
         var newhouse={
                       name:isValid.value.name,
                       images:[],
                       house_types:houses,
                       internet:isValid.value.internet,
                       water:isValid.value.water,
                       details:isValid.value.description,
                       location:house_loc,
                       postedBy:req.user._id
                 }
                 console.log(newhouse);
                 let multipleUpload = new Promise(async (resolve, reject) => {
                     let upload_len = filePaths.length
                        ,upload_res = new Array();
                        //console.log(upload_len + ' atline 56');
                        for(let i = 0; i < upload_len ; i++)
                        {
                            let filePath = filePaths[i].path;
                            await cloudinary.v2.uploader.upload(filePath, (error,result) => {
                               console.log( upload_res.length +"vs"+ upload_len)
                                if(upload_res.length === upload_len-1)
                                {
                                  /* resolve promise after upload is complete */
                                   upload_res.push(result)
                                  resolve(upload_res)
                                }else if(result)      {
                                  /*push public_ids in an array */  
                                  upload_res.push(result);
                                } else if(error) {
                                 // console.log(error)
                                  reject(error)
                                }
                
                            })
                
                        } 
                    })
                   .then((result) => result)
                   .catch((error) => error)
        
                    /*waits until promise is resolved before sending back response to user*/
                    let upload = await multipleUpload; 
                       
                    // console.log('atline 84');
                    console.log(upload)
                    upload.forEach((upload,)=>{
                        newhouse.images.push(upload.secure_url);
                    });
       
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
       
       
    
        
    });
    


router.get("/view_house/:id/view",middleware.isLoggedIn,async(req,res,next)=>{
       var viewed={
                        user_id:req.user._id,    
                        houses:[
                              req.params.id
                            ]
                 }
               //  console.log(viewed)
                
            Viewed.find({user_id:req.user._id})
                        .then((foundviews)=>{
                       
                            if(foundviews.length>0){
                                    console.log('Already viewed',foundviews[0].houses.includes(req.params.id));
                                   //return
                                      // console.log(foundviews[0])
                                       if(foundviews[0].houses.includes(req.params.id)==false){
                                      
                                             foundviews[0].houses.push(req.params.id)
                                            foundviews[0].save();
                                           //console.log(foundviews[0])
                                       }
                                   
                                
                            }else{
                                Viewed.create(viewed)
                               // console.log('new',viewed);
                            }
                        })
                        .catch((err)=>{
                            console.log(err)
                            res.redirect('back');
                        })
                        
             var myrating
          
               let newPromise1=new Promise((resolve,reject)=>{
                                    Rating.findOne({house_id:req.params.id,user_id:req.user._id},(error,foundrating)=>{
                                        myrating=foundrating
                                        resolve(myrating)
                                    })
                       }) 
                      await newPromise1;
                    var urating       
                     //  console.log(myrating);
                       if(!myrating){
                           urating=0;
                       }else{
                           urating=myrating.rating;
                       }
                     //  console.log('Myrating:',urating)
                 let newPromise2=new Promise((resolve,reject)=>{
                                    Comment.find({house_id:req.params.id},(error,foundcomment)=>{
                                        resolve(foundcomment)
                                    })
                       }) 
                       let housecomments=await newPromise2;
                       //console.log(housecomments)
                      var users=new Array();
                       let users_promise;
                      if(housecomments.length>0){
                          users_promise=new Promise((resolve,reject)=>{
                              housecomments.forEach((comment,i)=>{
                                  var user_id=comment.user_id;
                                User.findById(user_id,(error,fonduser)=>{
                                   // console.log(fonduser)
                                    users.push(fonduser);
                                    resolve(users);
                                });
                            
                          });
                        })
                            
                      }
                     
                    let all_users=await users_promise;
             
                   //    console.log(myrating[0].rating);
                    House.findById(req.params.id,(err,foundhouse)=>{
                      if(err){
                         // console.log(err)
                          res.redirect("back");
                      }else{
                         // console.log(foundhouse._id)
                          logger.infoLog.info(middleware.capitalize(req.user.username ) + " viewed " + foundhouse.name+ " at " + moment(moment().valueOf()).format('h:mm:a,  Do MMMM  YYYY,,') )
                          res.render("house_view",{house:foundhouse,userrating:urating,comments:housecomments,users:all_users});
                      }
                    })    
                });
   
 
  var housesp=new Array();
      var nearbyHousesbyd=new Array();
router.post('/recommended',async(req,res,next)=>{

    // console.log(req.body)
housesp.length=0;
    
     let promise= new Promise((resolve)=>{
           House.find({},(error,houss)=>{
          var houses=houss
         resolve(houses)
        })
     })
    let houses=await promise
     console.log(houses)
     var location=JSON.parse(req.body.location)
     //console.log(houses);
     
     houses.forEach((house,i)=>{
         var radius=middleware.caclRadius(location.lat,location.lng,house.location.coordinates.lat,house.location.coordinates.long)
         if(radius<=10){
            nearbyHousesbyd.push(house)
         }
     })
         if(nearbyHousesbyd.length>3){
                  housesp.push(nearbyHousesbyd[0]);
                  housesp.push(nearbyHousesbyd[1]);
                  housesp.push(nearbyHousesbyd[2]);
              }
     
     res.redirect("/recommended");
})

router.get("/recommended",async function(req,res){
                        
                       
            let comment_promise=new Promise((resolve,reject)=>{
                Comment.find({},(err,allcomments)=>{
                    resolve(allcomments);
                }) 
            })
              let all_comments= await comment_promise;
             
        
              //console.log(all_houses.uploadedAt);
               res.render("recommended",{houses:housesp,comments:all_comments});
               housesp.length=3;
  
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login",middleware.isLoggedIn,(req,res)=>{
        
        
    });
};



module.exports=router;
 