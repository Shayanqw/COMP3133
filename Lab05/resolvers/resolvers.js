import MovieModel from '../models/movie.js';

const movieResolvers = {
  Query: {
    getAllMovies: async () => {
      return await MovieModel.find();
    },

    getMovieById: async (_, { id }) => {
      return await MovieModel.findById(id);
    },

    getMoviesByDirector: async (_, { director_name }) => {
      return await MovieModel.find({ director_name });
    }
  },

  Mutation: {
    addMovie: async (_, args) => {
      const newMovie = new MovieModel(args);
      return await newMovie.save();
    },

    updateMovie: async (_, { id, ...updates }) => {
      return await MovieModel.findByIdAndUpdate(id, updates, { new: true });
    },

    deleteMovie: async (_, { id }) => {
      await MovieModel.findByIdAndDelete(id);
      return "Movie deleted successfully";
    }
  }
};

export default movieResolvers;