import { createOrGetUser } from '../services/loginService.mjs';

export const getUser = async (req, res, next) => {
    try {
        const { username } = req.body;
        const user = await createOrGetUser(username);

        res.json({
            status: 'OK',
            user: {
                userId: user.userId,
                name: user.name
            }
        });
    } catch (error) {
        next(error);
    }
};  