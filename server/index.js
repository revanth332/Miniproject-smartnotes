const express = require('express');
const app = express();
const PORT = 5000 
const { hashSync, compareSync } = require('bcrypt');
const {UserModel,NoteModel, TodoModel} = require('./config/database');
const jwt = require('jsonwebtoken');
const passport = require('passport')
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const bodyParser = require("body-parser");
const webpush  = require('web-push')

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'revanthvera69@gmail.com',
        pass: 'jrdniwaqcenakbbg'
    }
});

webpush.setVapidDetails(
    "mailto:test@test.com",
    "BAWpvvm_OhTfHcRpjpYd5xy58x91cISpVmAsDhzuWpV54DKgN9qacgYW0vB9fR3XkQaehFwY6cEUtqCr3Imggr4",
    "TGyGuuSFMu_9ApfaCPbLwfsayvTXI-sLpPXv82MJy28"
  );

require('./config/passport')

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(passport.initialize());
app.use(cors({
    origin:["https://localhost:5000","https://smartnotes.onrender.com"],
})
)

app.post("/subscribe", (req, res) => {
    // Get pushSubscription object
    const subscription = req.body;
  
    // Send 201 - resource created
    res.status(201).json({});
  
    // Create payload
    const payload = JSON.stringify({ title: "Notifiacation Of SmartNotes" });
  
    // Pass object into sendNotification
    webpush
      .sendNotification(subscription, payload)
      .catch(err => console.error(err));
  });

app.post('/signup',(req,res) => {
    UserModel.findOne({email:req.body.email}).then(exists => {
        if(exists){
            return res.status(400).json({error:"user already exists"})
        }
        const user = new UserModel({
            username : req.body.username,
            email : req.body.email,
            password:hashSync(req.body.password,10)
        })
        user.save().then((user => {
            res.send({
                success:true,
                message:"User created successfully",
                user : {
                    id:user._id,
                    username : user.username
                }
            })
        })).catch(err => {
            res.send({
                success:false,
                message:"Something went wrong",
                error : err
            })
        })
    }).catch(err => {
        console.log(err)
    })
    
})

app.post('/signin',(req,res) => {
    UserModel.findOne({email : req.body.email}).then(user => {
        if(!user){
            return res.status(401).send({
                success : false,
                message : "Could not found the user"
            })
        }
        if(!compareSync(req.body.password,user.password)){
            return res.status(401).send({
                success : false,
                message : "Could not verify the user"
            })
        }

        const payload = {
            username : user.username,
            id: user._id
        }
        const token = jwt.sign(payload,"secret random key",{expiresIn : "1d"});

        return res.status(200).send({
            success : true,
            message : "Logged successfully",
            user:payload,
            token : "Bearer "+token
        })
    })
})

app.get('/protected',passport.authenticate('jwt',{session:false}),(req,res) => {
    return res.status(200).send({
        success:true,
        user : {
            id : req.user._id,
            username : req.user.username
        }
    })
})

app.post("/addnotes",(req,res) => {
    const note = new NoteModel({
        username : req.body.username,
        title : req.body.title,
        noteData : req.body.noteData,
        date : req.body.date
    })
    note.save().then(note => {
        // return res.send({
        //     success:true,
        //     message:"Notes saved suucessfully"
        // })
        UserModel.updateOne({_id:req.body.userid},{$inc : {notes:1}}).then(notes => {
            res.send({
                update:true,
                message1:"Note added successfully",
                message2:"Note count updated successfully",
            })
        }).catch(err => {
            res.send({
                update:false,
                message:"Note count not updated"
            })
        })
    }).catch(err => {
        res.send({
            success:false,
            message:"Note not saved"
        })
    })
})

app.post("/addtodos",(req,res) => {
    const todo = new TodoModel({
        username : req.body.username,
        todoData : req.body.todoData,
        time : req.body.time,
        email : req.body.email,
        targetDate: new Date() || req.body.date
    })
    todo.save().then(todo => {
        UserModel.updateOne({_id:req.body.userid},{$inc : {todos:1}}).then(todos => {
            res.send({
                update:true,
                message1:"Todo added successfully",
                message2:"Todo count updated successfully",
            })
        }).catch(err => {
            res.send({
                update:false,
                message:"Note count not updated"
            })
        })
    }).catch(err => {
        res.send({
            success : false,
            message : "todo not added"
        })
    })
})

app.post('/notes',(req,res) => {
    NoteModel.find({username:req.body.username}).then(notes => {
        res.send({
            success:true,
            notes : notes,
        })
    }).catch(err => {
        res.send({
            success:false,
            message:"Notes not fetched properly"
        })
    })
})

app.post('/todos',(req,res) => {
    TodoModel.find({username:req.body.username}).then(todos => {
        res.send({
            success:true,
            todos : todos,
        })
    }).catch(err => {
        res.send({
            success:false,
            message:"todos not fetched properly"
        })
    })
})

app.post('/marktodo',(req,res)=> {
    TodoModel.updateOne({_id:req.body.id},{$set : {completed:true}}).then(todo => {
        UserModel.updateOne({_id:req.body.userid},{$inc : {todosCompleted:1}}).then(todos => {
            res.send({
                update:true,
                message1:"Todo added successfully",
                message2:"CompletedTodo count updated successfully",
            })
        }).catch(err => {
            res.send({
                update:false,
                message:"CompletedTodo count not updated"
            })
        })
    }).catch(err => {
        res.send({
            update:false,
            message:"todo not updated"
        })
    })
})

app.post("/updatetodo",(req,res) => {
    todoid = req.body.todoid;
    data = req.body.todoData
    date = new Date(req.body.date);
    time = req.body.time;
    expired=false;
    if(new Date(date.getFullYear(),date.getMonth(),date.getDate(),time.slice(0,2),time.slice(3,5)).getTime() <= new Date().getTime()){
        expired = true
        console.log("less",date.getFullYear())
    }
    TodoModel.updateOne({_id:todoid},{$set : {date:date,time:time,todoData:data,expired:expired}}).then(todo => {
        res.send({
            update:true,
            message:"todo updated successfuly"
        })
    }).catch(err => {
        res.send({
            update:false,
            message:"todo not updated!",
            error:err
        })
    })

})

app.post("/updatenote",(req,res) => {
    noteid = req.body.noteid;
    data = req.body.noteData
    title=req.body.title
    NoteModel.updateOne({_id:noteid},{$set : {noteData:data,title:title}}).then(note => {
        res.send({
            update:true,
            message:"note updated successfuly"
        })
    }).catch(err => {
        res.send({
            update:false,
            message:"note not updated!",
            error:err
        })
    })

})

app.post('/deletetodo',(req,res)=>{
    TodoModel.deleteOne({_id:req.body.id}).then(todo => {
        res.send({
            delete:true,
            message:"Todo deleted successfully",
        })
    }).catch(err => {
        res.send({
            delete:false,
            message:"Cannot delete todo"
        })
    })
})

app.post('/deletenote',(req,res) => {
    NoteModel.deleteOne({_id:req.body.id}).then(todo => {
        res.send({
            delete:true,
            message:"Note deleted successfully"
        })
    }).catch(err => {
        res.send({
            delete:false,
            message:"Cannot delete Note"
        })
    })
})

app.post('/analatics',(req,res) => {
    UserModel.findOne({_id:req.body.id}).then(user => {
        res.send({
            success:true,
            message:"User found",
            userdata:{
                username:user.username,
                email:user.email,
                notes:user.notes,
                todos:user.todos,
                completedTodos:user.todosCompleted
            }
        })
    }).catch(err => {
        res.send({
            success:false,
            message:"User not found"
        })
    })
})

app.get('/message',(req,res) => {
    const id = 'AC8a434ff68054e27a841dfae37d404137';
const token = '1e7a1ff5215f141c0f8b0644447e3a7a';
  
  
// Creating a client
const client = twilio(id, token);
  
// Sending messages to the client
client.messages 
      .create({ 
         body: 'Hello Revanth', 
         from: 'whatsapp:+14155238886',       
         to: 'whatsapp:+919959965916' 
       }) 
      .then(message => console.log(message.sid)) 
      .done();
})



setInterval(function(){
    TodoModel.find({}).then(todos => {
        todos.forEach(function(todo){
            UserModel.findOne({username:todo.username}).then(user => {
                if(todo.time.slice(0,2) == new Date().getHours() && todo.time.slice(3,5) == new Date().getMinutes() && new Date().getSeconds() == 5 && todo.targetDate.getDate() == new Date().getDate() && todo.targetDate.getMonth() == new Date().getMonth() && todo.targetDate.getFullYear() == new Date().getFullYear()){
                    let mailDetails = {
                        from: 'revanthvera69@gmail.com',
                        to: user.email,
                        subject: 'Todo remainder',
                        text: 'Incomelete todo:\n'+todo.todoData
                    };
                     
                    mailTransporter.sendMail(mailDetails, function(err, data) {
                        if(err) {
                            console.log('Error Occurs');
                        } else {
                            console.log('Email sent successfully');
                        }
                    });

                    TodoModel.updateOne({_id:todo._id},{$set : {expired:true}}).then(item => {
                        console.log(todo._id)
                    }).catch(err => console.log(err));
                }
            })
        })
    })
},1000)


app.listen(PORT,() => console.log(`Listening at port ${PORT}`))
