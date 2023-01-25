const express = require('express');
const app = express();
const PORT = 5000 
const { hashSync, compareSync } = require('bcrypt');
const UserModel = require('./config/database');
const jwt = require('jsonwebtoken');
const passport = require('passport')
const cors = require('cors');

require('./config/passport')

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(passport.initialize());
app.use(cors())

app.get('/',(req,res) => {
    res.send("hello");
})
app.post('/signup',(req,res) => {
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
app.listen(PORT,() => console.log(`Listening at port ${PORT}`))