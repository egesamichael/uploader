import mongoose from 'mongoose';
const { Schema } = mongoose;

const equipmentSchema = new Schema({
  name: String,
  category: String,
  price: Number,
 

});

export default mongoose.model('Equipment', equipmentSchema);
