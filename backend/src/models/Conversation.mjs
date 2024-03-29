import mongoose from "mongoose";

const { Schema, model } = mongoose;
const fileSchema = new Schema({
  path: { type: String, required: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const messageSchema = new Schema({
  content: { type: String, required: false },
  role: { type: String, required: true, enum: ["user", "bot", "context"] },
  messageId: { type: String, required: true, unique: true },
  modelName: { type: String, required: false },
  files: { type: [fileSchema], default: [] },
});

const conversationSchema = new Schema(
  {
    title: { type: String, required: true },
    conversationId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    messages: [messageSchema],
  },
  {
    timestamps: {
      createdAt: "createdTimestamp",
      updatedAt: "updatedTimestamp",
    },
  }
);

conversationSchema.index({ conversationId: 1 });

conversationSchema.index({
  title: 'text',
  conversationId: 'text',
  'messages.content': 'text'
});

const Conversation = model("Conversation", conversationSchema);

export default Conversation;
