const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  totalRequests: { type: Number, default: 0 },
  vmDeployments: { type: Number, default: 0 },
  storageAllocations: { type: Number, default: 0 },
  testPassRate: { type: Number, default: 0 }
});

module.exports = mongoose.model('Metric', MetricSchema);
