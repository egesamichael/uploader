import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  name: String,
  path: String,
  size: Number,
  date: { type: Date, default: Date.now },
});

export default mongoose.model('File', fileSchema);
