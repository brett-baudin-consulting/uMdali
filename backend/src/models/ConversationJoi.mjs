import Joi from "joi";

const fileSchemaJoi = Joi.object({
  path: Joi.string().required(),
  name: Joi.string().required(),
  originalName: Joi.string().required(),
  type: Joi.string().required(),
  size: Joi.number().required(),
  uploadedAt: Joi.date().default({ value: Date.now, description: 'time of creation' })
});

const messageSchemaJoi = Joi.object({
  content: Joi.string().allow('').default(''),
  role: Joi.string().valid('user', 'bot', 'context', 'tool').required(),
  messageId: Joi.string().required(),
  modelName: Joi.string().optional(),
  files: Joi.array().items(fileSchemaJoi).default([]),
  alias: Joi.string().optional()
});

const conversationSchemaJoi = Joi.object({
  title: Joi.string().required(),
  conversationId: Joi.string().required(),
  userId: Joi.string().required(),
  messages: Joi.array().items(messageSchemaJoi),
  model1: Joi.string().optional(),
  model2: Joi.string().optional(),
  contextId1: Joi.string().optional(),
  contextId2: Joi.string().optional(),
  alias1: Joi.string().optional(),
  alias2: Joi.string().optional(),
  voice1: Joi.string().optional(),
  voice2: Joi.string().optional(),
  textToSpeechModelId: Joi.string().optional(),
  textToSpeechVendor: Joi.string().optional(),
  isAIConversation: Joi.boolean().default(false),
  createdTimestamp: Joi.date(),
  updatedTimestamp: Joi.date()
});

export { conversationSchemaJoi as default };
