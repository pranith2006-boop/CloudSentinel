const router = require("express").Router();

const TestExecution = require("../models/TestExecution");


// Get executions

router.get("/", async(req,res)=>{

try{

const executions = await TestExecution.find().sort({createdAt:-1});

res.json(executions);

}catch(err){

res.status(500).json(err);

}

});


// Add execution

router.post("/", async(req,res)=>{

try{

const execution = new TestExecution(req.body);

await execution.save();

res.json(execution);

}catch(err){

res.status(500).json(err);

}

});


module.exports = router;