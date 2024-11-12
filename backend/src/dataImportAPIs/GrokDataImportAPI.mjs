import jsonata from "jsonata";
import fs from "fs";

import DataImportAPI from "./DataImportAPI.mjs";
import { logger } from "../logger.mjs";

// Define the JSONata transformation expression  
const transformExpression = jsonata(`  
$^(<response_create_time){  
    conversation_id: {  
        "conversationId": $distinct(conversation_id),  
        "title": $distinct(conversation_title),  
        "userId": "brett",  
        "messages": $.{
            "messageId": response_id,
            "modelName": "grok",
            "content": message, 
                        "role": sender = 'human' ? 'user' :  'bot',
            "files": []
            },  
        "createdTimestamp": conversation_create_time? {"$date": $distinct(conversation_create_time)} : null,  
        "updatedTimestamp": response_create_time? {"$date": $now()} : null,  
        "isAIConversation": false  
    }  
} ~> $each(function($v){$v})  
`);


class OpenAIDataImportAPI extends DataImportAPI {
    async convert(importData) {
        logger.info("Importing data from Grok API...");
        try {
            // Apply the JSONata transformation  
            const transformedJson = await transformExpression.evaluate(importData);
            const outputFilePath = 'output.json';
            // Write the transformed JSON to a file

            // fs.writeFileSync(outputFilePath, JSON.stringify(transformedJson, null, 2));

            return transformedJson;
        } catch (error) {
            console.error('Transformation failed Error:', error);
        }
    }
}

export default OpenAIDataImportAPI;