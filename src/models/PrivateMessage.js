import mongoose from "mongoose";

const privateMessageSchema = new mongoose.Schema(
  {
    from_user: { type: String, required: true, trim: true, index: true },
    to_user: { type: String, required: true, trim: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    date_sent: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Helpful index for conversation history queries
privateMessageSchema.index({ from_user: 1, to_user: 1, date_sent: -1 });

export const PrivateMessage = mongoose.model("PrivateMessage", privateMessageSchema);
