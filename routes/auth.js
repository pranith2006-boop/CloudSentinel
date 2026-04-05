const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");


// Register

router.post("/register", async (req,res)=>{

try{

const {username,email,password} = req.body;

const hashedPassword = await bcrypt.hash(password,10);

const user = new User({
username,
email,
password:hashedPassword
});

await user.save();

res.json("User Registered");

}catch(err){
res.status(500).json(err);
}

});


// Login

router.post("/login", async (req,res)=>{

try{

const {email,password} = req.body;

const user = await User.findOne({email});

if(!user) return res.status(400).json("User not found");

const validPassword = await bcrypt.compare(password,user.password);

if(!validPassword) return res.status(400).json("Invalid Password");

const token = jwt.sign(
{id:user._id},
process.env.JWT_SECRET
);

res.json({
token,
user
});

}catch(err){
res.status(500).json(err);
}

});

module.exports = router;