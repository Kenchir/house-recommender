var mongoose=require("mongoose");
var  passportLocalMongoose=require("passport-local-mongoose");
//var dataTables = require('mongoose-datatables')   
var HouseSchema=new mongoose.Schema({
    name: {type:String,unique:false},
    details:String,
    internet_connectivity:Boolean,
    water:Boolean,
    house_types:{
            type:String,
            enum:['Single-Room','Double Room','Bedsitter','1 Bedroom','2 Bedroom','3 bedroom']
             },
     house_rentcost:{
            type:Number,
            enum:['Single-Room','Double Room','Bedsitter','1 Bedroom','2 Bedsitter','3 bedroom']
             },
                 
    rating:Number,
    postedBy: String,
    contact:[{
        type:String
        }],
    location:String,
    coordinates:[{
                type:String
                 }],
    likes:{type:Number,
        default:0
    },
     comments:{type:Number,
        default:0
    },
   images: [{
            type: String
            }],
},{timestamp:true});

HouseSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    by:this.by,
    title:this.title,
    place_id:this.place_id,
    title:this.title,
    image:this.image,
    rating:this.rating,
    body:this.body,
    likes:{type:Number,
        default:0
    },
    comments:{type:Number,
        default:0
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

module.exports=mongoose.model("House",HouseSchema);