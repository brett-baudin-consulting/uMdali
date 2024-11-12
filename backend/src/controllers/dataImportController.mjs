import { logger } from "../logger.mjs";  
import OpenAIDataImportAPI from "../dataImportAPIs/OpenAIDataImportAPI.mjs";  
import GrokDataImportAPI from "../dataImportAPIs/GrokDataImportAPI.mjs";  
import Conversation from "../models/Conversation.mjs";  
import User from "../models/User.mjs";

export const dataImportAPIs = {  
  "chatgpt.openai": new OpenAIDataImportAPI(),  
  "grok.xai": new GrokDataImportAPI(),  
};

function getAPI(model) {  
  return dataImportAPIs[model];  
}

async function importData(conversations, user) {  
  try {  
    const updatePromises = conversations.map(conv => {  
      const filter = {  
        conversationId: conv.conversationId,  
        userId: user.userId  
      };

      const update = {  
        $set: {  
          title: conv.title,  
          messages: conv.messages,  
          createdTimestamp: new Date(conv.createdTimestamp.$date || conv.createdTimestamp),  
          updatedTimestamp: new Date(conv.updatedTimestamp.$date || conv.updatedTimestamp),  
          isAIConversation: false,  
        }  
      };
      const options = {  
        upsert: true,  
        new: true,  
        setDefaultsOnInsert: true  
      };

      return Conversation.findOneAndUpdate(filter, update, options);  
    });

    await Promise.all(updatePromises);  
    return { success: true, message: "All conversations imported or updated successfully" };  
  } catch (error) {  
    logger.error("Error importing data:", error);  
    throw new Error("Failed to import or update conversations");  
  }  
}  

async function handleRequest(req, res) {  
  const { user, dataImport } = req.body;

  if (!user || !user.settings || !dataImport) {  
    return res.status(400).json({ error: 'Invalid request body' });  
  }  
  const importName = user.settings.dataImport.dataImportId;  
  const dataImportAPI = getAPI(importName);  
  logger.info("Importing data with", user.settings.dataImport, dataImportAPI);

  if (!dataImportAPI) {  
    return res.status(400).json({ error: `Unsupported API: ${importName}` });  
  }

  try {  
    const conversations = await dataImportAPI.convert(dataImport);  
    const result = await importData(conversations, user);  
    logger.info("Import result:", result);  
    res.json(result);  
  } catch (error) {  
    logger.error("Error handling request:", error);  
    res.status(500).json({ error: error.message });  
  }  
}

export default handleRequest;  