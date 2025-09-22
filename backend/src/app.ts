import { AppDataSource } from "./config/db";
import { User } from "./config/entity/User";


/* Example de comment remplir une Table */
export const saveData = async () => {
    const user = new User();
    user.name = "Alice";
    user.email = "alice@example.com";
    user.password_hash = "securepassword";

    await AppDataSource.manager.save(user);
    console.log("Saved a new user:", user);
}
