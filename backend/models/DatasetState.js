const mongoose = require('mongoose');

const datasetStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: ['verbal', 'codebreaker']
    },
    items: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DatasetState', datasetStateSchema);
