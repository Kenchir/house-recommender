const moment = require("moment");
const middleware = require("../middleware");
const House = require("../models/house");

const Message = require("../models/message");

const requestify = require("requestify");

const Conversation = require("../models/conversation");
const ChatMsg = require("../models/validation/chatMsg.js");
exports = module.exports = function(io) {
  var clients = {};
  var checkOnline = [];
  //MAIN IO

  io.on("connection", socket => {
    socket.on("add-user", function(data) {
      clients[data.username] = {
        socket: socket.id
      };

      checkOnline.push(data.username);
      // console.log(clients);
      // console.log(checkOnline);
      var resArr = middleware.checkOnlineUsers(checkOnline, clients);
      io.emit("update-online-users", resArr);
      // socket.emit('update-online-users',resArr);
    });
    //Check if users are online for inbox
    socket.on("get-online-users", function(users) {
      // console.log('Checking if the following are online');
      // console.log(users);
      var resArr = middleware.checkOnlineUsers(users, clients);
      socket.emit("update-online-users", resArr);
    });
    //Save and send bid

    socket.on("accept-bid", function(data, cb) {
      var isValid = Bid.validate({
        id: data.assignmentId,
        postedBy: data.postedBy,
        bidder: data.bidder,
        amount: data.amount
      });
      if (isValid.error) {
        console.log(isValid.error);
        //Add response to invalid on client side
        return cb("error", "Failed to accept bid");
      }
      Assignment.findOneAndUpdate(
        { _id: isValid.value.id },
        { status: "accepted", worker: isValid.value.bidder },
        function(err, found) {
          if (err) {
            console.log(err);
          } else if (found && found.status === "posted") {
            var newConversation = {
              //  _id:'bid',
              party1: isValid.value.postedBy,
              party2: isValid.value.bidder,
              lastActivity: moment().valueOf()
            };
            Conversation.create(newConversation, function(err, created) {
              if (err) {
                console.log(err);
              } else if (created) {
                var accMsg = {
                  type: "accept",
                  msg: "Your bid for " + found.unit + " has been accepted ",
                  for: found.unit,
                  amount: isValid.value.amount,
                  assId: isValid.value.id,
                  from: isValid.value.postedBy,
                  to: isValid.value.bidder,
                  conversationId: "bid",
                  createdAt: moment().valueOf()
                };
                //Send message if online
                if (clients[isValid.value.bidder]) {
                  console.log(
                    isValid.value.bidder +
                      " is  online, sending accept message."
                  );
                  io.sockets.connected[
                    clients[isValid.value.bidder].socket
                  ].emit("accept-message", accMsg);
                } else {
                  console.log(
                    isValid.value.bidder +
                      " is not online .Saving message assignment will be saved"
                  );
                }
                //Save message
                Message.create(accMsg, function(err) {
                  if (err) throw err;
                  return cb(
                    "success",
                    'You have accepted the bid go to "My assignments"'
                  );
                });
              }
            });
          } else {
            return cb("error", "An error occured");
          }
        }
      );
    });
    //Send chat message
    socket.on("send-message", function(data, cb) {
      console.log("send inbox message request received from " + data.from);
      var isValid = ChatMsg.validate({
        from: data.from,
        to: data.to,
        conversationId: data.conversationId,
        msg: data.msg
      });
      if (isValid.error) {
        console.log(isValid.error);
        //Add response to invalid on client side
        return cb("error", "An error occured in sending message", false);
      }
      var newMsg = {
        status: "unread",
        type: "chat",
        msg: isValid.value.msg,
        from: isValid.value.from,
        to: isValid.value.to,
        conversationId: isValid.value.conversationId,
        createdAt: moment().valueOf()
      };
      //Send message if online
      if (clients[isValid.value.to]) {
        console.log(isValid.value.to + " is  online, sending chat message.");
        io.sockets.connected[clients[isValid.value.to].socket].emit(
          "receive-message",
          newMsg
        );
      } else {
        console.log(isValid.value.to + " is not online .Saving message...");
      }
      //Save message and update last activity
      Message.create(newMsg, function(err, saved) {
        if (err) {
          console.log(err);
        } else if (saved) {
          var id = newMsg.conversationId;
          Conversation.findOneAndUpdate(
            { _id: id },
            { lastActivity: moment().valueOf() },
            function(err) {
              if (err) {
                console.log(err);
              } else {
                return cb("success", "Message sent", true);
              }
            }
          );
        }
      });
    });
    //on read
    socket.on("read", function(readInfo, cb) {
      console.log(readInfo);
      Message.find({
        $and: [
          {
            to: readInfo.by
          },
          { from: readInfo.for },
          { status: "unread" }
        ]
      }).exec(function(err, found) {
        console.log(found);
        if (err) {
          console.log(err);
        } else {
          found.forEach(function(element, i) {
            element.status = "read";
            element.save();
            if (found.length - 1 === i) {
              cb("success", "");
            }
            console.log(i + " vs " + found.length);
          });
        }
      });
    });
    /*
      socket.on('private-message', function(data){
    console.log("Sending: " + data.content + " to " + data.username);
    if (clients[data.username]){
      io.sockets.connected[clients[data.username].socket].emit("add-message", data);
    } else {
      console.log("User does not exist: " + data.username); 
    }
     });
    */

    //Removing the socket on disconnect
    socket.on("disconnect", function() {
      //console.log('disconnected');

      for (var name in clients) {
        if (clients[name].socket === socket.id) {
          //   console.log('disconnected');
          //      console.log(name);
          middleware.removeA(checkOnline, name);
          delete clients[name];
          break;
        }
      }
      //   	console.log(clients);
      //   	console.log(checkOnline);
      var resArr = middleware.checkOnlineUsers(checkOnline, clients);
      io.emit("update-online-users", resArr);
    });
    //On fetch single report location
    socket.on("fetch-house-location", async (data, cb) => {
      console.log(data);
      // console.log(data[2])
      var house_id = data[2];
      var id = socket.request.user._id + "";
      //console.log(socket.request);

      // console.log(myrating);
      House.findById(house_id, (err, foundhouse) => {
        var cbData = {
          lat: foundhouse.location.coordinates.lat,
          long: foundhouse.location.coordinates.long,
          housename: foundhouse.name
        };
        //  console.log(cbData);
        cb(cbData);
      });
    });
    socket.on("chat message", async (data, cb) => {
      //console.log(data)
    });
    socket.on("my-location", async (data, cb) => {
      const googleMapsClient = require("@google/maps").createClient({
        key: "AIzaSyBjsdFT4HpouHSdJX7fFPJg6Ym7re9ksuM"
      });
      console.log(data);

      //   var house_loc;
      var locname;
      let newpromise = new Promise((resolve, reject) => {
        requestify
          .get(
            "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
              data.lat +
              "," +
              data.lng +
              "&key=" +
              "AIzaSyDFY7ohqrmKp9EpapClfcrq-MW_jM36AOU"
          )
          .then(function(response) {
            response.getBody();
            var loc = JSON.parse(response.body);
            // console.log(loc)
            locname = loc.results[0].formatted_address;
            resolve(locname);
            console.log(locname);
          })
          .catch(err => {
            console.log("here",err);
          });
      });
      await newpromise;
      var reHouse = new Array();

      var cbData = {
        location: locname
        // houses:housewithin
      };
      //  console.log(cbData);
      cb(cbData);
    });

    // socket.on('disconnect', ()=>{
    //     //console.log('Client disconnected');
    //      if(socket.request.user.role=='house-Owner'){
    //       socket.leave('Owneroom');

    //     }else{
    //       socket.leave('masterRoom');
    //        // var clients =io.sockets.adapter.rooms['masterRoom'].sockets
    //        // console.log(clients)
    //     }
  });
};
