import jsonata from "jsonata";
import Conversation from "../models/Conversation.mjs";

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

export class ConversationService {
    async createConversation(conversationData) {
        const conversation = new Conversation(conversationData);
        return await conversation.save();
    }

    async importConversations(conversations) {
        const validationErrors = [];
        const validConversations = [];

        conversations.forEach((conversation, index) => {
            try {
                const transformedConversation = transformExpression.evaluate(conversation);
                const { error } = conversationSchema.validate(transformedConversation);
                if (error) {
                    validationErrors.push({ index, message: error.details[0].message });
                } else {
                    validConversations.push(transformedConversation);
                }
            } catch (err) {
                validationErrors.push({ index, message: `Transformation error: ${err.message}` });
            }
        });

        if (validationErrors.length > 0) {
            throw { status: 400, errors: validationErrors };
        }

        return await Conversation.insertMany(validConversations);
    }

    async getConversationsByUserId(userId) {
        return await Conversation.find({ userId })
            .select('-_id -__v -messages._id -messages.files._id')
            .lean();
    }

    async searchConversations(query) {
        const regexQuery = new RegExp(query, 'i');
        return await Conversation.find({
            $or: [
                { title: regexQuery },
                { conversationId: regexQuery },
                { 'messages.content': regexQuery }
            ]
        }, { conversationId: 1 }).lean();
    }

    async getConversationById(conversationId) {
        return await Conversation.findOne({ conversationId })
            .select('-_id -__v -createdTimestamp -updatedTimestamp -messages._id')
            .lean();
    }

    async updateConversation(conversationId, updateData) {
        return await Conversation.findOneAndUpdate(
            { conversationId },
            updateData,
            { new: true }
        );
    }

    async deleteConversation(conversationId) {
        return await Conversation.findOneAndDelete({ conversationId });
    }
}

export default new ConversationService();  