import express from "express";
import conversationController from "../controllers/conversationController.mjs";
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
router.post("/",
  validateConversation,
  asyncHandler(conversationController.createConversation)
);

router.post("/import",
  validateUserId,
  asyncHandler(conversationController.importConversations)
);

router.get("/",
  validateUserId,
  asyncHandler(conversationController.getConversationsByUserId)
);

router.get('/search',
  asyncHandler(conversationController.searchConversations)
);

router.get("/:conversationId",
  asyncHandler(conversationController.getConversationById)
);

router.put("/:conversationId",
  validateConversation,
  asyncHandler(conversationController.updateConversation)
);

router.delete("/:conversationId",
  asyncHandler(conversationController.deleteConversation)
);

export default router;  