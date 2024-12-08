const mongoose = require('mongoose');
const { Schema } = mongoose;

const printRequestSchema = new Schema({
  documentType: String,
  printType: String,
  copies: Number,
  documentFormat: String,
  paperSize: String,
  description: String,
  descriptionType: String,
  textDescription: String,
  status: String,
  quotationAmount: Number,
  // If you handle audio, store audio info as well if needed (like filename or URL)
  // audioDescription: { type: String, required: false },
  
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PrintRequest', printRequestSchema);
