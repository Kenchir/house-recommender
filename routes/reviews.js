const express                =require("express");
const   router                =express.Router();
const User                 =require("../models/user");
const House                =require("../models/house");
const Comment              =require("../models/comments");
const middleware             = require("../middleware");
const faker                 = require('faker/locale/en');


//fake reviews
async function reviewHouses(){
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
            var n=housesnum/2
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
                                             'max': 5
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
                                text:faker.random.words() +' '+ faker.random.words() +' '+faker.random.words()
                     }
                   // console.log(query)
                           var comment;
                           console.log(query);
                      var allcomments
                    let promise= new Promise((resolve)=>{
                        
                         Comment.create(query)
                        .then((newcomment)=>{
                            comment=newcomment;
                            resolve(comment)
                        })
                        .catch((err)=>{
                            console.log(err)
                        })
                    })
               
                    await promise;
                    console.log('Comment created',comment)
                    //res.send(JSON.stringify(comment))
                    console.log('Comment created',comment)
                     let newPromise1=new Promise((resolve,reject)=>{
                          //   console.log(query.house_id)
                                            Comment.aggregate(
                                              [
                                                  {
                                                  $match: {
                                                    house_id:comment.house_id
                                                  }
                                                },
                                                {
                                                  $count: "allratings"
                                                },
                                          ],(error,result)=>{
                                               var r=result[0];
                                             allcomments=r.allratings
                                             resolve(allcomments);
                                          }
                                        )
                             
                               })     
                    await newPromise1;
                    
           
                  //  console.log('Total comments',allcomments)
                   // return;
             
                          //console.log(newhouserating);
                         let mypromise=new Promise((resolve)=>{
                                House.findById(comment.house_id)
                                      .then((foundhouse)=>{
                                                foundhouse.comments=allcomments;
                                                foundhouse.save();
                                               //console.log(foundhouse)
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
//reviewHouses()
router.post("/review_house",middleware.isLoggedIn,async(req,res,next)=>{
        var query={
                 user_id:req.user._id,
                house_id:req.body.house_id,
                text:req.body.msg
        }
   // console.log(query)
        var comment;
        var allcomments
            let promise= new Promise((resolve)=>{
                 Comment.create(query)
                .then((newcomment)=>{
                    comment=newcomment;
                    resolve(comment)
                })
                .catch((err)=>{
                    console.log(err)
                })
            })
       
            await promise;
            console.log('Comment created',comment)
            res.send(JSON.stringify(comment))
            console.log('Comment created',comment)
             let newPromise1=new Promise((resolve,reject)=>{
                  //   console.log(query.house_id)
                                    Comment.aggregate(
                                      [
                                          {
                                          $match: {
                                            house_id:comment.house_id
                                          }
                                        },
                                        {
                                          $count: "allratings"
                                        },
                                  ],(error,result)=>{
                                       var r=result[0];
                                     allcomments=r.allratings
                                     resolve(allcomments);
                                  }
                                )
                     
                       })     
                    await newPromise1;
                    
           
                  //  console.log('Total comments',allcomments)
                   // return;
             
                          //console.log(newhouserating);
                         let mypromise=new Promise((resolve)=>{
                                House.findById(comment.house_id)
                                      .then((foundhouse)=>{
                                                foundhouse.comments=allcomments;
                                                foundhouse.save();
                                               //console.log(foundhouse)
                                               //console.log(foundhouse) 
                                               
                                            })
                                         .catch((err)=>{
                                             console.log(err);
                                     })
                            })
                            
                        await mypromise;
                
})
module.exports=router;