import express from 'express';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';

import User from "../models/User.mjs";

const router = express.Router();

// Middleware to skip authentication if DISABLE_AUTH is true
const skipAuth = (req, res, next) => {
    if (process.env.DISABLE_AUTH === 'true') {
        return next();
    }
    return passport.authenticate('ldapauth', { session: false })(req, res, next);
};

// Load user template from a JSON file asynchronously
const loadUserTemplate = async () => {
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const userTemplatePath = path.join(dirname, '../config/defaultUserConfig.json');
    const userTemplateData = await fs.readFile(userTemplatePath, 'utf8');
    return JSON.parse(userTemplateData);
};

router.post('/', skipAuth, async function (req, res, next) {
    try {
        // Validate and sanitize the input
        const username = req.body.username; // Implement validation and sanitization logic as needed

        // Check if the user exists
        let user = await User.findOne({ userId: username });

        if (!user) {
            const userTemplate = await loadUserTemplate();
            const newUserSettings = {
                ...userTemplate.settings,
                contexts: userTemplate.settings.contexts.map(context => ({
                    ...context,
                    contextId: uuidv4()
                })),
                macros: userTemplate.settings.macros.map(macro => ({
                    ...macro,
                    macroId: uuidv4()
                }))
            };

            // Create a new user with unique userId and contextId
            user = new User({
                userId: username,
                name: username,
                settings: newUserSettings
            });
            await user.save();
        }

        // Respond with user information or a success message
        // Make sure not to send sensitive information in the response
        res.json({
            status: 'OK',
            user: {
                userId: user.userId,
                name: user.name
            }
        });
    } catch (error) {
        // Pass the error to the centralized error handler
        next(error);
    }
});

// Centralized error handling middleware
router.use((error, req, res, next) => {
    console.error(error); // Replace with your logger if necessary
    res.status(500).send('An error occurred while processing the request.');
});

export default router;