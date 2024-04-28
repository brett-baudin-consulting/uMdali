import express from "express";
import Conversation from "../models/Conversation.mjs"; // Ensure this is the correct model path
import Joi from "joi";
import { logger } from "../logger.mjs";
const router = express.Router();

const fileSchema = Joi.object({
  path: Joi.string().required(),
  name: Joi.string().required(),
  originalName: Joi.string().required(),
  type: Joi.string().required(),
  size: Joi.number().required(),
  uploadedAt: Joi.date().default({ value: Date.now, description: 'time of creation' })
});

const messageSchema = Joi.object({
  content: Joi.string().allow('').default(''),
  role: Joi.string().valid('user', 'bot', 'context').required(),
  messageId: Joi.string().required(),
  modelName: Joi.string().optional(),
  files: Joi.array().items(fileSchema).default({ value: [], description: 'default files' }),
  alias: Joi.string().optional()
});

const conversationSchema = Joi.object({
  title: Joi.string().required(),
  conversationId: Joi.string().required(),
  userId: Joi.string().required(),
  messages: Joi.array().items(messageSchema),
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

// Middleware for conversation validation
const validateConversation = (req, res, next) => {
  const { error } = conversationSchema.validate(req.body);
  if (error) {
    logger.error(`Error validating conversation: ${error}`);
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Async handler to simplify async route handlers and error handling
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST conversation with validation
router.post(
  "/",
  validateConversation,
  asyncHandler(async (req, res) => {
    const conversation = new Conversation(req.body);
    await conversation.save();
    res.status(201).json(conversation);
  })
);

// GET all conversations for a specific userId
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).send("UserId query parameter is required.");
    }

    const conversations = await Conversation.find({ userId: userId })
      .select('-_id -__v -createdTimestamp -updatedTimestamp -messages._id -messages.files._id')
      .lean();

    res.json(conversations);
  })
);

router.get('/search', asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).send("Query parameter is required.");
  }

  try {
    const regexQuery = new RegExp(query, 'i'); // 'i' makes it case insensitive

    const conversations = await Conversation.find({
      $or: [
        { title: regexQuery },
        { conversationId: regexQuery },
        { 'messages.content': regexQuery }
      ]
    }, { conversationId: 1 }).lean();

    const conversationIds = conversations.map(conv => conv.conversationId);

    res.json(conversationIds);
  } catch (error) {
    res.status(500).send("An error occurred while searching for conversations.");
  }
}));

// GET a single conversation by conversationId
router.get(
  "/:conversationId",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({
      conversationId: req.params.conversationId,
    })
      .select('-_id -__v -createdTimestamp -updatedTimestamp -messages._id')
      .lean();

    if (!conversation) {
      return res.status(404).send("Conversation not found.");
    }

    // And here as well
    res.json(conversation);
  })
);

// PUT update conversation by conversationId
router.put(
  "/:conversationId",
  validateConversation,
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId: req.params.conversationId },
      req.body,
      { new: true }
    );
    if (!conversation) {
      return res.status(404).send("Conversation not found.");
    }
    res.json(conversation);
  })
);

// DELETE a conversation by conversationId
router.delete(
  "/:conversationId",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOneAndDelete({
      conversationId: req.params.conversationId,
    });
    if (!conversation) {
      return res.status(404).send("Conversation not found.");
    }
    res.sendStatus(204);
  })
);

// Global error handler
router.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ message: err.message });
});

export default router;
