var mongoose=require("mongoose");
var  passportLocalMongoose=require("passport-local-mongoose");
//var dataTables = require('mongoose-datatables')   
var LikeSchema=new mongoose.Schema({
        user_id:String,
        house_id:String
});

LikeSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("Like",LikeSchema);
