const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/smartnotes');

const userSchema = mongoose.Schema({
    username : String,
    email : String,
    password : String,
    notes : {
        type:Number,
        default:0
    },
    todos : {
        type:Number,
        default:0
    },
    todosCompleted : {
        type:Number,
        default:0
    },
    date : {
        type:Date,
        default : Date.now
    }
});

const noteSchema = mongoose.Schema({
    username : String,
    title : String,
    noteData : String,
    date : String
})

const todoSchema = mongoose.Schema({
    username : String,
    todoData : String,
    time : String,
    email : String,
    completed:{
        type:Boolean,
        default:false
    },
    expired:{
        type:Boolean,
        default:false
    },
    targetDate:{
        type:Date,
        default:Date.now
    },
    date : {
        type:Date,
        default:Date.now
    }
})

const UserModel = mongoose.model("User",userSchema);
const NoteModel = mongoose.model("Note",noteSchema);
const TodoModel = mongoose.model("Todo",todoSchema);

module.exports = {UserModel,NoteModel,TodoModel};
// {
//     "username" : "Revanth",
//     "email" : "revanth@gamail.com",
//     "password" : 1234
//   }