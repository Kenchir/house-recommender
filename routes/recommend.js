var express                =require("express");
var   router                =express.Router();
const User                 =require("../models/user");

const Rating                =require("../models/rating");
const House                =require("../models/house");
const Comment              =require("../models/comments");
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
var requestify               = require('requestify');
const nodemailer                =  require("nodemailer");
const Viewed             =require("../models/houseviewed");
const RecommendedHouses             =require("../models/recommendedHouses");

async function calcSimilarity(id1,id2){
  // console.log(id1,id2)
    var mrattings=new Array()
         let promise=new Promise((resolve)=>{
                     Rating.find({user_id:id1},(err,found)=>{
                       //console.log(found)
                             mrattings=found;
                             resolve(mrattings)
                     })
                     
                 })
                await promise;
                
               //   console.log('My length',mrattings.length) //S
      var list=new Array();           
                 let promise1=new Promise((resolve)=>{
                     Rating.find({user_id:id2},(err,found)=>{
                       // console.log(found)
                             list=found;
                             resolve(list)
                       
                     })
                 })
                await promise1;
     
       // console.log('first user',list.length)
   
        //Find the users who rated simalar house as the user you want to find his/her recommendation
        var r_samehouse=new Array();
        
       for(var i=0;i<list.length;i++){
               var ratedsimilar=false;
               var houserating={};var p=0;
                                //mrattings.forEach((user,j)=>{
                                        while((ratedsimilar==false)&&(p<mrattings.length)){
                                            
                                             if(mrattings[p].house_id==list[i].house_id){//if the house a user rated someone also has rated
                                             ratedsimilar=true;
                                             //console.log('Times',ratedsimilar)
                                                 houserating={
                                                     house_id:list[i].house_id,
                                                     rating:list[i].rating
                                                     }
                                                   
                                                }
                                        p++;
                                    }
           
               if(ratedsimilar){
                   //console.log('similarity found')
                   r_samehouse.push(houserating);
               }
           }
           
           
           if(r_samehouse.length>0){
               var sumSquares=0;
            
                    for(var i=0;i<r_samehouse.length;i++){
                        sumSquares=0;
                  
                             mrattings.forEach((user,j)=>{
                           
                                            if(user.house_id==r_samehouse[i].house_id){
                                                     
                                                     var rating1=user.rating;
                                                    // console.log('rating1',rating1)
                                                 
                                                     var rating2=r_samehouse[i].rating;
                                                      //console.log('rating2',rating2)
                                                    var diff=rating1-rating2;
                                                    //console.log('differnce',diff)
                                                    var power;
                                                    if(diff==0){
                                                        power=1*2;
                                                    }else{
                                                        power=diff*diff;
                                                    }
                                                    
                                                    //console.log(power)
                                                      sumSquares=sumSquares+power;  
                                                     
                                                 // resolve(sumSquares)   
                                             }
                                  
                             });
                       
                            
                 
             //console.log(r_samehouse[i][0].user_id)
                         
          }
                       
                            var sq=Math.sqrt(sumSquares);
               
                            var euclid=1/(1+sq);

            return euclid;
           
           }else{
               return -1;
           }
              
}
//calcSimilarity('5c971d4f0c186607c3f03ff3','5c90e8692732556c3caa69e5');

async function findSimilarHouses(id){
  console.log('is received',id)
  let promise=new Promise((resolve)=>{
             Rating.aggregate(
                  [
                      {
                        $group : {
                             _id: "$user_id",
                        }
                      }
                    
                  ],(err,result)=>{
                      // console.log(result)
                      resolve(result)
                  }
                )
        })
  let users_rated=await promise
          
          var similarhouses=new Array(); 
    for(var i=1;i<users_rated.length;i++){
         // console.log('users',users_rated[i])
       if(users_rated[i]._id!=id){
           
           let promise=new Promise((resolve)=>{
              var similarity=calcSimilarity(id,users_rated[i]._id)
               resolve(similarity)
           })
         let p= await promise
            
         if(p!=-1){//Atleast the users have similarity of some houses the both rated. calcSimilarity() returns -1 if no similarity
              var details={
                    user_id:users_rated[i]._id,
                    similarity:p
              }
              similarhouses.push(details)
         }
         
       } 
    }

   similarhouses.sort(middleware.compare);//sort the similar users in ascending order based on similarity
   
      var neighbours=new Array()
       // console.log('After sort',similarhouses)
          var k;
        if(similarhouses.length>5){k=5}else{k=similarhouses.length}
        //Get the first 5 similar users only to recommend
       for(var z=0;z<k;z++){
          neighbours.push(similarhouses[z])
       }
       console.log('To recommnd',neighbours)
      
       
       var recommendations=new Array()
       
        var houses=new Array();
               // console.log(k)
                for(var m=0;m<neighbours.length;m++){
                    var found=new Array()
                    
                    let find=new Promise((resolve)=>{
                                Rating.find({user_id:similarhouses[m].user_id},async(err,foundrating)=>{
                                        if(err){console.log(err)}
                                        found=foundrating;
                                        resolve(found)
                                   })  
                      
                         })
                                await find;
                                
                                console.log('user ', m,' rated',found.length,' houses')
                                found.forEach(async(foundrating,i)=>{
                                    //Check if it is already in the array
                                    let promisex=new Promise((resolve)=>{
                                         var isinarray=false;
                                        if(houses.length>0){
                                               isinarray=houses.includes(foundrating.house_id);
                                        }
                                       // console.log(isinarray)
                                            if(isinarray==false){//Not to add house two times to the array
                                                houses.push(foundrating.house_id)
                                            }
                                            resolve(houses)
                                    })
                                     await promisex  
                                      
                                })
                                console.log('recommend Houses',houses.length)
                            
                }
        
                       
                    
        return houses;
                                
}
//findSimilarHouses('5ca0b6d26879840772dd3a83');
     async function getHouse(found) {
         
                                   var p;         
                                    let promise3=new Promise((resolve)=>{
                                                       House.findById((found),(err,house)=>{
                                                    if(err)console.log(err)
                                                   p= house;
                                                   resolve(p)
                                                        })
                                                   }) 
                    await promise3
                    return p
    }
    
    async function getAllHouses(arr){
        //console.log('arrived',arr.length)
        var recom=new Array();
     
            for(var x=0;x<arr.length;x++){
                let newp=new Promise((resolve)=>{
                   // console.log(arr[x])
                       getHouse(arr[x])
                                 .then((gothouse)=>{
                                                    //  console.log('Got',gothouse)
                                    recom.push(gothouse)
                                           resolve(recom)
                                              //  console.log(recom.length)
                               })
                })
                   
                await newp;
                   
            }
        //    console.log('Houses',recom.length)
       
        
                 return   recom;             
                                                
                                 
                                
    }
    
  router.post("/rating",middleware.isLoggedIn,async(req,res,next)=>{
  ///  console.log(moment().valueOf())
          const{body}=req;
          const{user}=req;
         // console.log(req.body)
          var query={
                        user_id:req.user._id,
                        house_id:body.house_id,
                        rating:body.rating
                     }
                   // console.log(query)
                          var createnewrating;
                         var foundrating;       
                        var allusersrated;
                        var avgrating;
                    let saveRating=new Promise(async(resolve,reject)=>{
                               Rating.findOne(
                                   {
                                       $and:
                                       [
                                        { house_id : query.house_id },
                                        { user_id:query.user_id}
                                       ]
                                   },(error,oldrating)=>{ 
                                      
                                   if(oldrating){
                                      // console.log('Oldrating:',oldrating)
                                       foundrating=oldrating
                                       foundrating.rating=query.rating;
                                        foundrating.save();
                                        resolve(foundrating);
                                      // resolve(oldrating);
                                      console.log('newRating:',foundrating)
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
                  
                 
                        //  console.log('MMMMM')
                          // await newPromise1;
                           
                // var newhouserating={
                //             avg_rating:avgrating,
                //              users_rated:allusersrated
                //           }
                          
                //          let mypromise=new Promise((resolve)=>{
                //                 House.findById(foundrating.house_id)
                //                       .then((foundhouse)=>{
                //                                 foundhouse.rating=newhouserating;
                //                                 foundhouse.save();
                                         
                //                             })
                //                          .catch((err)=>{
                //                              console.log(err);
                //                      })
                //             })
                //         await mypromise;
                       console.log('Next stage')
                        let recommendPromise=new Promise((resolve)=>{
                              findSimilarHouses(req.user._id)
                                .then((houses)=>{
                                    resolve(houses)
                                  // console.log('myhouses',houses)
                                })
                                .catch((err)=>{
                                    console.log(err)
                                })
                        })
                        let findhouses=await recommendPromise;
                        //console.log('similarhouses by id',findhouses)
                        
                        let promise2=new Promise((resolve)=>{
                          
                                    getAllHouses(findhouses)
                                            .then((foundhouses)=>{
                                               // console.log('Houses',foundhouses)
                                                resolve(foundhouses)
                                            })
                                             
                              })
                        
                            let c=await promise2;  
                            console.log('This are similarhouses',c)
                            let last=new Promise((resolve)=>{
                                RecommendedHouses.findOne({user_id:req.user._id})
                                        .then((found)=>{
                                            if(found){
                                                found.houses=c;
                                                found.save();
                                            }else{
                                                var newrecommendation={
                                                    user_id:req.user._id,
                                                    houses:c
                                                }
                                                RecommendedHouses.create(newrecommendation)
                                                        .then((newcreated)=>{
                                                            console.log(newcreated)
                                                            resolve(newcreated)
                                                        })
                                                        .catch((err)=>{
                                                            console.log(err)
                                                        })
                                            }
                                        })
                                        .catch((err)=>{
                                            console.log(err);
                                        })
                                        resolve();
                            })
                            await last
                                           //  console.log('values',c.length)
                                        
                     
})


router.get("/index",middleware.isLoggedIn,async(req,res,next)=>{
            var houses=new Array();
        let housepromise= new Promise((resolve,reject)=>{
                    House.find({}).limit(50)
                        .then((houses)=>{
                            resolve(houses)
                        })
            });
            
            houses=await housepromise;
       //  console.log(req.user._id)
            var locations;
           let newPromise2=new Promise((resolve,reject)=>{
                  //   console.log(query.house_id)
                                    House.aggregate(
                                      [
                                        {
                                   $group:
                                     {
                                       _id: "$location.name",
                                     }
                                 }
                                  ],(error,result)=>{
                                      locations=result
                                      resolve(locations)
                                  }
                                )
                     
                       })     
                       
                    await newPromise2;// createHouse()
         //  console.log(locations)
         var rechouses=new Array();
         let rec=new Promise((resolve)=>{
             RecommendedHouses.findOne({user_id:req.user._id}).lean()
                    .then((found)=>{
                        if(found){
                        var gothouses=found.houses
                        //console.log(gothouses[2])
                        gothouses.forEach((house,i)=>{
                              //console.log(i)
                              if(house!=null){
                                    if(house.hasOwnProperty('name')){
                                        if(house.hasOwnProperty('location')){
                                            if(house.hasOwnProperty('rating')){
                                                if(house.hasOwnProperty('_id')){
                                                    if(house.hasOwnProperty('house_types')){

                                                                var rat=house.rating
                                                               // console.log(rat);
                                                            if(rat.hasOwnProperty('avg_rating')){
                                                                if(house.rating.avg_rating>3.3){
                                                                      rechouses.push(house)
                                                                }
                                                            
                                                            }
                                                    }
                                                }
                                            }
                                        }
                                           
                                                
                                       
                                    }
                              }
                        })
                        }
                         resolve(rechouses)
                         // console.log(rechouses.length)
                    })
                    .catch((err)=>{
                        console.log(err)
                    })
                   
         })
         await rec;
        
         var all_houses= new Array();
       
                    let house_promise= new Promise((resolve,reject)=>{
                    House.find({}).limit(50)
                        .then((houses)=>{
                            resolve(houses)
                        })
            });
            
            all_houses=await house_promise;  
            
           //console.log(all_houses.length)
            var recentV=new Array();
            
               let promise3=new Promise((resolve)=>{
                                 Viewed.find({user_id:req.user._id},(err,found)=>{
                                  //console.log('viewed houses:',found.length)
                                   if(found.length>0){
                                       var view=found[0].houses.length;
                                      // console.log(view)
                                        houses.forEach((house,i)=>{
                                          //  console.log(house._id)
                                            if(house._id){
                                                 if(house._id==found[0].houses[view-1]){
                                              //  console.log(house)
                                                recentV.push(house)
                                                //console.log(recentV)
                                            }else if(house._id==found[0].houses[view-2]){
                                                recentV.push(house)
                                            }else  if(house._id==found[0].houses[view-4]){
                                                recentV.push(house)
                                            }else  if(house._id==found[0].houses[view-5]){
                                                recentV.push(house)
                                            }else  if(house._id==found[0].houses[view-6]){
                                                recentV.push(house)
                                            }else  if(house._id==found[0].houses[view-7]){
                                                recentV.push(house)
                                            }
                                            }
                                           
                                       })
                                    resolve(recentV)
                                   }else{
                                      resolve(recentV)
                                   }
                             })
                       })     
                  await promise3;
                  
                //  console.log(req.user)
                 
                  var locs =new Array();
                    //console.log('Recently Viewed',recentV)
                     let promise4= new Promise((resolve,reject)=>{
                         locations.forEach((place,i)=>{
                                
                                houses.forEach((house,p)=>{
                                    if(place._id==house.location.name){
                                       if(locs.includes(place)==false){
                                           locs.push(place) }
                                    }
                                })
                                resolve(locs);
                            });
                         })
              await promise4;
            //  console.log(all_houses)
                //console.log('hehe')
               res.render("index",{houses:all_houses,places:locs,viewed:recentV,rec:rechouses});
              
        
})


module.exports=router;
 