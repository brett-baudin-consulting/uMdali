import Joi from "joi";

// Joi validation schema for creating/updating a user
const MacroSchema = Joi.object({
    shortcut: Joi.string().required(),
    text: Joi.string().required(),
    macroId: Joi.string().required(),
});

const ContextSchema = Joi.object({
    name: Joi.string().required(),
    contextId: Joi.string().required(),
    text: Joi.string().required(),
    isDefault: Joi.boolean().default(false),
});

const SpeechToTextModelSchema = Joi.object({
    model_id: Joi.string().required(),
    vendor: Joi.string().required(),
});

const TextToSpeechModelSchema = Joi.object({
    model_id: Joi.string().required(),
    vendor: Joi.string().required(),
    voice_id: Joi.string().required(),
});

const SettingsSchema = Joi.object({
    model: Joi.string().required(),
    language: Joi.string().default("en"),
    speechToTextModel: SpeechToTextModelSchema.required(),
    textToSpeechModel: TextToSpeechModelSchema.required(),
    temperature: Joi.number().default(0.5),
    maxTokens: Joi.number().default(1000),
    isStreamResponse: Joi.boolean().default(true),
    theme: Joi.string().default('dark'),
    contexts: Joi.array().items(ContextSchema),
    macros: Joi.array().items(MacroSchema),
    dataImport: Joi.object({
        dataImportId: Joi.string().required(),
    }),
});

const userSchema = Joi.object({
    userId: Joi.string().required(),
    name: Joi.string().required(),
    settings: SettingsSchema.required(),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
});

export { userSchema as default };