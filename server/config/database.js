const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/smartnotes');

const userSchema = mongoose.Schema({
    username : String,
    email : String,
    password : String
});

const UserModel = mongoose.model("User",userSchema);

module.exports = UserModel;
// {
//     "username" : "Revanth",
//     "email" : "revanth@gamail.com",
//     "password" : 1234
//   }