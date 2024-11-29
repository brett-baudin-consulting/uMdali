import User from "../models/User.mjs";

export class UserService {
    async createUser(userData) {
        const user = new User(userData);
        return user.save();
    }

    async getAllUsers() {
        return User.find({});
    }

    async getUser(userId) {
        const user = await User.findOne({ userId }).lean();
        if (!user) return null;

        // Set default models if not present  
        if (!user?.settings?.textToSpeechModel?.model_id) {
            user.settings = user.settings || {};
            user.settings.textToSpeechModel = {
                model_id: "tts-1",
                vendor: "OpenAI",
                voice_id: "shimmer",
            };
        }

        if (!user?.settings?.speechToTextModel?.model_id) {
            user.settings = user.settings || {};
            user.settings.speechToTextModel = {
                model_id: "whisper-1",
                vendor: "OpenAI",
            };
        }

        return this.cleanObject(user);
    }

    async updateUser(userId, userData) {
        return User.findOneAndUpdate(
            { userId },
            userData,
            { new: true, overwrite: true, runValidators: true }
        );
    }

    async deleteUser(userId) {
        return User.findOneAndDelete({ userId });
    }

    cleanObject(obj) {
        if (obj instanceof Date || !(obj instanceof Object) || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanObject(item));
        } else if (typeof obj === 'object') {
            const cleaned = {};
            Object.keys(obj).forEach((key) => {
                if (!key.startsWith('_')) {
                    cleaned[key] = this.cleanObject(obj[key]);
                }
            });
            return cleaned;
        }
        return obj;
    }

    // Static instance getter to implement singleton pattern (optional)  
    static getInstance() {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }
}

export default UserService;

