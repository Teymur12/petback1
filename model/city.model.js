import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  cityName: {
    type: String,
    required: [true, 'Şəhər adı tələb olunur'],
    trim: true,
    unique: true
  }
}, {
  timestamps: true
});

const City = mongoose.model('City', citySchema);

export default City;