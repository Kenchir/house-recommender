var mongoose=require("mongoose");
var  passportLocalMongoose=require("passport-local-mongoose");
//var dataTables = require('mongoose-datatables')   
var CommentSchema=new mongoose.Schema({
        text: String,
        user_id:String,
        house_id:String,
},{timestamp:true});

CommentSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    user_id:this.user_id,
    house_id:this.post_id,
    text:this.text,

    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
  };
};

module.exports=mongoose.model("Comment",CommentSchema);
