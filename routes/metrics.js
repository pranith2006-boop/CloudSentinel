const router = require("express").Router();

const Metrics = require("../models/Metrics");


// Get Metrics

router.get("/", async(req,res)=>{

try{

const metrics = await Metrics.findOne();

res.json(metrics);

}catch(err){

res.status(500).json(err);

}

});


// Update Metrics

router.post("/", async(req,res)=>{

try{

let metrics = await Metrics.findOne();

if(!metrics){

metrics = new Metrics(req.body);

}else{

Object.assign(metrics,req.body);

}

await metrics.save();

res.json(metrics);

}catch(err){

res.status(500).json(err);

}

});


module.exports = router;