import express from "express";
import conversationService from "../services/conversationService.mjs";
import { logger } from "../logger.mjs";
import conversationSchemaJoi from "../models/ConversationJoi.mjs";
import { asyncHandler, errorResponse } from "../middlewares/index.mjs";

const router = express.Router();

// Middleware  
const validateConversation = (req, res, next) => {
  const { error } = conversationSchemaJoi.validate(req.body);
  if (error) {
    logger.error(`Validation error: ${error.details[0].message}`);
    return errorResponse(res, 400, error.details[0].message);
  }
  next();
};

const validateUserId = (req, res, next) => {
  const { userId } = req.query;
  if (!userId) {
    return errorResponse(res, 400, "UserId query parameter is required");
  }
  next();
};

// Routes  
router.post("/", validateConversation, asyncHandler(async (req, res) => {
  const conversation = await conversationService.createConversation(req.body);
  res.status(201).json({ success: true, data: conversation });
}));

router.post("/import", validateUserId, asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body)) {
    return errorResponse(res, 400, "Request body must be an array of conversations");
  }
  await conversationService.importConversations(req.body);
  res.status(201).json({ success: true, message: "Conversations imported successfully" });
}));

router.get("/", validateUserId, asyncHandler(async (req, res) => {
  const conversations = await conversationService.getConversationsByUserId(req.query.userId);
  res.json({ success: true, data: conversations });
}));

router.get('/search', asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return errorResponse(res, 400, "Query parameter is required");
  }
  const conversations = await conversationService.searchConversations(query);
  res.json({
    success: true,
    data: conversations.map(conv => conv.conversationId)
  });
}));

router.get("/:conversationId", asyncHandler(async (req, res) => {
  const conversation = await conversationService.getConversationById(req.params.conversationId);
  if (!conversation) {
    return errorResponse(res, 404, "Conversation not found");
  }
  res.json({ success: true, data: conversation });
}));

router.put("/:conversationId", validateConversation, asyncHandler(async (req, res) => {
  const conversation = await conversationService.updateConversation(
    req.params.conversationId,
    req.body
  );
  if (!conversation) {
    return errorResponse(res, 404, "Conversation not found");
  }
  res.json({ success: true, data: conversation });
}));

router.delete("/:conversationId", asyncHandler(async (req, res) => {
  const conversation = await conversationService.deleteConversation(req.params.conversationId);
  if (!conversation) {
    return errorResponse(res, 404, "Conversation not found");
  }
  res.sendStatus(204);
}));

export default router;  