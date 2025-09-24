import { getAllUsers,
        getUserByID,
        getUserByEmail,
        getUserByName
} from './user.service';
import express, { Request, Response, NextFunction } from "express";
import { User } from '../../config/entity/User';
import { AppDataSource } from '../../config/db';
import token from '../../middleware/token';
import admin from '../../middleware/admin';

const router = express.Router();


/* User Route GET */
router.get("/", token, admin, async(req: Request, res: Response): Promise<Response | void> => {
    try {
        const users = await getAllUsers();
        return res.status(200).json(users);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/me", token, async(req: Request, res: Response): Promise<Response | void> => {
    try {
        const basicUserInfo = req.auth as { id: number, email: string };
        const user = await getUserByID(basicUserInfo.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const userResponse = {
            ...user,
            password: undefined
        };
        return res.status(200).json(userResponse);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/:data", token, admin, async(req: Request, res: Response): Promise<Response | void> => {

});

/* User Route Put */
router.put("/me", token, async(req: Request, res: Response): Promise<Response | void> => {

});

/* User Route Post */


/* User Route Delete */
router.delete("/:data", token, admin, async(req: Request, res: Response): Promise<Response | void> => {

});

export default router;
