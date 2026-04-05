const mongoose = require("mongoose");

const MetricsSchema = new mongoose.Schema({

id:{
type:String,
required:true,
unique:true,
default:"global"
},

totalRequests:{
type:Number,
default:0
},

vmDeployments:{
type:Number,
default:0
},

storageAllocations:{
type:Number,
default:0
},

testPassRate:{
type:Number,
default:0
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Metric",MetricsSchema);