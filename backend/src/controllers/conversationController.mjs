import conversationService from "../services/ConversationService.mjs";
import { errorHandler } from "../middlewares/index.mjs";

const conversationController = {
    async createConversation(req, res) {
        const conversation = await conversationService.createConversation(req.body);
        res.status(201).json({ success: true, data: conversation });
    },

    async importConversations(req, res) {
        if (!Array.isArray(req.body)) {
            return errorHandler(res, 400, "Request body must be an array of conversations");
        }
        await conversationService.importConversations(req.body);
        res.status(201).json({ success: true, message: "Conversations imported successfully" });
    },

    async getConversationsByUserId(req, res) {
        const conversations = await conversationService.getConversationsByUserId(req.query.userId);
        res.json({ success: true, data: conversations });
    },

    async searchConversations(req, res) {
        const { query } = req.query;
        if (!query) {
            return errorHandler(res, 400, "Query parameter is required");
        }
        const conversations = await conversationService.searchConversations(query);
        res.json({
            success: true,
            data: conversations.map(conv => conv.conversationId)
        });
    },

    async getConversationById(req, res) {
        const conversation = await conversationService.getConversationById(req.params.conversationId);
        if (!conversation) {
            return errorHandler(res, 404, "Conversation not found");
        }
        res.json({ success: true, data: conversation });
    },

    async updateConversation(req, res) {
        const conversation = await conversationService.updateConversation(
            req.params.conversationId,
            req.body
        );
        if (!conversation) {
            return errorHandler(res, 404, "Conversation not found");
        }
        res.json({ success: true, data: conversation });
    },

    async deleteConversation(req, res) {
        const conversation = await conversationService.deleteConversation(req.params.conversationId);
        if (!conversation) {
            return errorHandler(res, 404, "Conversation not found");
        }
        res.sendStatus(204);
    }
};

export default conversationController;  