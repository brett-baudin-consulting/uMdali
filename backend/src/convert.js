const fs = require('fs').promises;  
const jsonata = require('jsonata');

// Define the JSONata transformation expression  
const transformExpression = jsonata(`  
$map($, function($conv) {    
    {    
        "title": $conv.title,            
        "conversationId": $conv.id,            
        "userId": "brett",        
        "messages": [$map($conv.mapping.*, function($m) {            
            $m.message.content.parts[0] != "" or $m.message.metadata.user_context_message_data.about_model_message  ? {            
                "messageId": $m.message.id,        
                "modelName": $m.message.metadata.model_slug ? "openai/" & $m.message.metadata.model_slug : 'openai/gpt-4',
                "content": $m.message.author.role = "system" ? $m.message.metadata.user_context_message_data.about_model_message:  
                           ($m.message.author.role = "user" or $m.message.author.role = "assistant") and $m.message.content.content_type = "text" ? $m.message.content.parts[0]:  
                           $m.message.author.role = "user" and $m.message.content.content_type = "multimodal_text" ? $m.message.content.parts[1]:
                           $m.message.author.role = "tool" and $m.message.content.content_type = "text" ? $m.message.content.parts[0]:  
                           $m.message.author.role = "tool" ? $m.message.content.parts[0].metadata.*.prompt[0]:  
                           "default",       
                "role": $m.message.author.role = 'assistant' ? 'bot' :      
                        $m.message.author.role = 'system' ? 'context' :      
                        $m.message.author.role,         
                "files": []          
            } : undefined          
        })[$exists]],            
        "createdTimestamp": $conv.create_time ? {"$date": $fromMillis($conv.create_time * 1000, "[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01].000Z")} :null,        
        "updatedTimestamp": $conv.update_time ? {"$date": $fromMillis($conv.update_time * 1000, "[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01].000Z")} : null,        
        "isAIConversation": false            
    }    
  }) 
`);

(async () => {  
  try {  
    // Read input JSON file  
    const inputFilePath = 'conversations.json';  
    const inputFileData = await fs.readFile(inputFilePath, 'utf8');  
    const inputJson = JSON.parse(inputFileData);

    if (!Array.isArray(inputJson)) {  
      throw new Error("Input JSON is not an array of records.");  
    }

    // Apply the JSONata transformation  
    const transformedJson = await transformExpression.evaluate(inputJson);


    // Write the transformed JSON to a new file  
    const outputFilePath = 'output.json';  
    await fs.writeFile(outputFilePath, JSON.stringify(transformedJson, null, 2));

  } catch (error) {  
    console.error('Error:', error);  
  }  
})();  