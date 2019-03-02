var mongoose=require("mongoose");
var  passportLocalMongoose=require("passport-local-mongoose");
    
var UserSchema=new mongoose.Schema({
    username: String,
    fname:String,
    lname:String,
    title:{type:String,enum:['Mr','Mrs','Miss','Dr','Proff']},
    email:{type:String,unique:true},
    role:{type:String,
        enum:['house-owner','user'],
         default:'user',
        },
    verifyToken :{type:String,unique:true},
    verifyExpires:Date,
    resetPasswordToken:String,
    resetPasswordExpires:String,
    isVerified:{
        type:Boolean,
        default:false,
    },
    isActive:{
        type:Boolean,
        default:false,
    },
    joinedAt:Number
    
});

UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);