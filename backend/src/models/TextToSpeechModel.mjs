import { Schema, model } from 'mongoose';

const TextToSpeechModelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  vendor: {
    type: String,
    required: true,
  },
  voice_ids: [
    {
      id: {
        type: String,
        required: true,
      }
    }
  ],
  query_parameters: [
    {
      key: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      }
    }
  ],
  settings: [
    {
      similarity_boost: {
        type: Number,
        required: true,
      },
      stability: {
        type: Number,
        required: true,
      },
      style: {
        type: Number,
        required: false,
      },
      use_speaker_boost: {
        type: Boolean,
        required: false,
      }
    }
  ],
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

export default model('TextToSpeechModel', TextToSpeechModelSchema);