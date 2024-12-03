// services/DataImportService.mjs  
import { logger } from "../logger.mjs";
import OpenAIDataImportAPI from "../dataImportAPIs/OpenAIDataImportAPI.mjs";
import GrokDataImportAPI from "../dataImportAPIs/GrokDataImportAPI.mjs";
import Conversation from "../models/Conversation.mjs";

export class DataImportService {
    constructor() {
        this.apis = {
            "chatgpt.openai": new OpenAIDataImportAPI(),
            "grok.xai": new GrokDataImportAPI(),
        };
    }

    getAPI(model) {
        return this.apis[model];
    }

    async importConversations(conversations, user) {
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

    async processImport(user, dataImport) {
        const importName = user.settings.dataImport.dataImportId;
        const dataImportAPI = this.getAPI(importName);

        if (!dataImportAPI) {
            throw new Error(`Unsupported API: ${importName}`);
        }

        const conversations = await dataImportAPI.convert(dataImport);
        return this.importConversations(conversations, user);
    }
}  