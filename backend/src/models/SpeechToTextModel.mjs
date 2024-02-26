import { Schema, model } from 'mongoose';

const SpeechToTextModelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  vendor: {
    type: String,
    required: true,
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

export default model('SpeechToTextModel', SpeechToTextModelSchema);