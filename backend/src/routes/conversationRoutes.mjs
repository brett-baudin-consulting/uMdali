import express from "express";  
import jsonata from "jsonata";

import Conversation from "../models/Conversation.mjs";
import { logger } from "../logger.mjs";  
import conversationSchemaJoi from "../models/ConversationJoi.mjs";
const router = express.Router();

// Middleware for conversation validation  
const validateConversation = (req, res, next) => {  
  const { error } = conversationSchemaJoi.validate(req.body);  
  if (error) {  
    logger.error(`Error validating conversation: ${error}`);  
    return res.status(400).json({ message: error.details[0].message });  
  }  
  next();  
};

// JSONata expression for transforming conversations  
const transformExpression = jsonata(`  
$map($, function($conv) {    
  {    
      "title": $conv.title,            
      "conversationId": $conv.id,            
      "userId": "brett",        
      "messages": $map($conv.mapping.*, function($m) {            
          $m.message.content.parts[0] != "" & $m.message.metadata.user_context_message_data ? {            
              "messageId": $m.message.id,        
              "modelName": "openai/" & $m.message.metadata.model_slug,      
              "content": $m.message.author.role = "system" ? $m.message.metadata.user_context_message_data.about_model_message:  
                         $m.message.author.role = "user" ? $m.message.content.parts[0]:  
                         $m.message.author.role = "tool" and $m.message.content.content_type = "text" ? $m.message.content.parts[0]:  
                         $m.message.author.role = "tool" ? $m.message.content.parts.metadata.*.prompt:  
                         $m.message.content.parts[0],       
              "role": $m.message.author.role = 'assistant' ? 'bot' :      
                      $m.message.author.role = 'system' ? 'context' :      
                      $m.message.author.role,         
              "files": []          
          } : undefined          
      })[$exists],            
      "createdTimestamp": $conv.create_time ? {"$date": $fromMillis($conv.create_time * 1000, "[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01].000Z")} :null,        
      "updatedTimestamp": $conv.update_time ? {"$date": $fromMillis($conv.update_time * 1000, "[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01].000Z")} : null,        
      "isAIConversation": false            
  }    
})   
`);

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

// POST import conversations from JSON array  
router.post(  
  "/import",  
  asyncHandler(async (req, res) => { 
    const { userId } = req.query;  
    if (!userId) {  
      return res.status(400).send("UserId query parameter is required.");  
    } 
    const conversations = req.body;  
    if (!Array.isArray(conversations)) {  
      return res.status(400).json({ message: "Request body must be an array of conversations." });  
    }

    const validationErrors = [];  
    const validConversations = [];

    conversations.forEach((conversation, index) => {  
      try {  
        // Transform the conversation using JSONata  
        const transformedConversation = transformExpression.evaluate(conversation);  
          
        // Validate the transformed conversation  
        const { error } = conversationSchema.validate(transformedConversation);  
        if (error) {  
          validationErrors.push({  
            index,  
            message: error.details[0].message,  
          });  
        } else {  
          validConversations.push(transformedConversation);  
        }  
      } catch (err) {  
        validationErrors.push({  
          index,  
          message: `Transformation error: ${err.message}`,  
        });  
      }  
    });

    if (validationErrors.length > 0) {  
      logger.error("One or more conversations failed validation.");  
      return res.status(400).json({ validationErrors });  
    }

    try {  
      await Conversation.insertMany(validConversations);  
      res.status(201).json({ message: "Conversations imported successfully." });  
    } catch (error) {  
      logger.error("Error importing conversations: ", error);  
      res.status(500).json({ message: "An error occurred while importing conversations." });  
    }  
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
      .select('-_id -__v -messages._id -messages.files._id')  
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