import UserService from "../services/UserService.mjs";
import { errorHandler } from "../middlewares/index.mjs";

const userService = new UserService();

export const createUser = async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
};

export const getAllUsers = async (req, res) => {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
};

export const getUser = async (req, res) => {
    const user = await userService.getUser(req.params.userId);
    if (!user) {
        return errorHandler(res, 404, "User not found");
    }
    res.json({ success: true, data: user });
};

export const updateUser = async (req, res) => {
    const user = await userService.updateUser(req.params.userId, req.body);
    if (!user) {
        return errorHandler(res, 404, "User not found");
    }
    res.json({ success: true, data: user });
};

export const deleteUser = async (req, res) => {
    const user = await userService.deleteUser(req.params.userId);
    if (!user) {
        return errorHandler(res, 404, "User not found");
    }
    res.sendStatus(204);
};  