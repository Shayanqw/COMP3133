const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: [true, "Name is required"]
  },

  username: {
    type: String,
    required: [true, "Username is required"],
    minlength: [4, "Username must be at least 4 characters"],
    maxlength: [100, "Username must not exceed 100 characters"]
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },

  address: {
    street: { type: String, required: true },
    suite: { type: String, required: true },
    city: {
      type: String,
      required: true,
      match: [/^[A-Za-z\s]+$/, "City must contain only alphabets and spaces"]
    },
    zipcode: {
      type: String,
      required: true,
      match: [/^\d{5}-\d{4}$/, "Zipcode format must be DDDDD-DDDD"]
    },
    geo: {
      lat: { type: String, required: true },
      lng: { type: String, required: true }
    }
  },

  phone: {
    type: String,
    required: true,
    match: [/^\d-\d{3}-\d{3}-\d{4}$/, "Phone format must be D-DDD-DDD-DDDD"]
  },

  website: {
    type: String,
    required: true,
    match: [/^https?:\/\/.+/, "Website must be valid http or https URL"]
  },

  company: {
    name: { type: String, required: true },
    catchPhrase: { type: String, required: true },
    bs: { type: String, required: true }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
