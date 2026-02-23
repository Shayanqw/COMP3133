import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  name: String,
  director_name: String,
  production_house: String,
  release_date: String,
  rating: Number
});

const MovieModel = mongoose.model('Movie', movieSchema);

export default MovieModel;