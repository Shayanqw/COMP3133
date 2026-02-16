import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      match: [/^[a-zA-Z0-9_]+$/, "Username can contain letters, numbers, underscore only."]
    },
    firstname: { type: String, required: true, trim: true, maxlength: 50 },
    lastname: { type: String, required: true, trim: true, maxlength: 50 },
    password: { type: String, required: true, minlength: 6 },
    createdOn: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.model("User", userSchema);
