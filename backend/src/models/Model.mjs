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
  isSupportsVision: {
    type: Boolean,
    required: true,
    default: false,
  },
  isSupportsAudio: {
    type: Boolean,
    required: true,
    default: false,
  },
  isSupportsVideo: {
    type: Boolean,
    required: true,
    default: false,
  },
  isSupportsContext: {
    type: Boolean,
    required: true,
    default: false,
  },
  inputTokenLimit: {
    type: Number,
    required: true,
    default: 2048,
  },
  outputTokenLimit: {
    type: Number,
    required: true,
    default: 2048,
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

ModelSchema.index({ name: 1, vendor: 1 }, { unique: true });

export default model('Model', ModelSchema);