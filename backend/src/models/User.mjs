import { Schema, model } from "mongoose";

const MarcroSchema = new Schema({
  shortcut: { type: String, required: true },
  text: { type: String, required: true },
  macroId: { type: String, required: true, unique: true },
});

const ContextSchema = new Schema({
  name: { type: String, required: true },
  contextId: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const SettingsSchema = new Schema({
  model: { type: String, required: true },
  speechToTextModel: { type: String, required: true },
  temperature: { type: Number, default: 0.5 },
  maxTokens: { type: Number, default: 1000 },
  isStreamResponse: { type: Boolean, default: true },
  theme: { type: String, default: "dark" },
  contexts: [ContextSchema],
  macros: [MarcroSchema],
});

const UserSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    settings: { type: SettingsSchema, required: true },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ userId: 1 }, { unique: true });

export default model("User", UserSchema);
