import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';
import User from '../models/User.mjs';

const loadUserTemplate = async () => {
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const userTemplatePath = path.join(dirname, '../config/defaultUserConfig.json');
    const userTemplateData = await fs.readFile(userTemplatePath, 'utf8');
    return JSON.parse(userTemplateData);
};

const createNewUserSettings = (userTemplate) => ({
    ...userTemplate.settings,
    contexts: userTemplate.settings.contexts.map(context => ({
        ...context,
        contextId: uuidv4()
    })),
    macros: userTemplate.settings.macros.map(macro => ({
        ...macro,
        macroId: uuidv4()
    }))
});

export const createOrGetUser = async (username) => {
    let user = await User.findOne({ userId: username });

    if (!user) {
        const userTemplate = await loadUserTemplate();
        const newUserSettings = createNewUserSettings(userTemplate);

        user = new User({
            userId: username,
            name: username,
            settings: newUserSettings
        });
        await user.save();
    }

    return user;
};  