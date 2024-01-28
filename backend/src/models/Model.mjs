import { Schema, model } from 'mongoose';

const ModelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  vendor: {
    type: String,
    required: true,
  },
  maxTokens: {
    type: Number,
    required: true,

  },
  isSupportsVision: {
    type: Boolean,
    required: true,
    default: false,
  },
  available: {
    type: Boolean,
    required: true,
  },
  createdTimestamp: {
    type: Date,
    default: Date.now
  },
  updatedTimestamp: {
    type: Date,
    default: Date.now
  }
});

export default model('Model', ModelSchema);