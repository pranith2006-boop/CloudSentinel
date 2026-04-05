const mongoose = require("mongoose");

const TestExecutionSchema = new mongoose.Schema({

runId:{
type:String,
required:true
},

runner:{
type:String,
required:true
},

environmentOs:{
type:String,
required:true
},

status:{
type:String,
required:true
},

duration:{
type:String,
required:true
},

coverage:{
type:String,
required:true
},

completedAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("TestExecution",TestExecutionSchema);