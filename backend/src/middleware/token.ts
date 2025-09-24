import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../../index";

type AuthRequest = Request & {
    cookies?: Record<string, any>;
    auth?: string | JwtPayload;
};

const token = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    try {
        const authHeader = req.header("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const tokenStr = authHeader.replace("Bearer ", "");
            try {
                const decoded = jwt.verify(tokenStr, JWT_SECRET as string) as JwtPayload | string;
                req.auth = decoded;
                return next();
            } catch (err) {
                console.log("Invalid Bearer token, checking cookies...");
            }
        }

        const cookieToken = req.cookies?.auth_token;
        if (cookieToken) {
            try {
                const decoded = jwt.verify(cookieToken, JWT_SECRET as string) as JwtPayload | string;
                req.auth = decoded;
                return next();
            } catch (err: any) {
                if (err && typeof err === "object" && "name" in err && (err as { name?: string }).name === "TokenExpiredError") {
                    res.clearCookie("auth_token");
                }
                return res.status(401).json({ msg: "Invalid authentication token" });
            }
        }

        return res.status(401).json({ msg: "Authentication required" });
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ msg: "Internal server error" });
    }
};

export default token
