import * as dotenv from "dotenv";
import { AppDataSource } from "./src/config/db";
import { saveData } from "./src/app";
import express from "express";
import { waitForPostgres } from "./src/utils/waitForDb";

const app = express();
dotenv.config();

(async function start() {
    try {
        console.log("Waiting for Postgres to be ready...");
        await waitForPostgres({ retries: 12, delayMs: 2000 });

        await AppDataSource.initialize(); /* Example initilization of elem in table */

        app.listen(3000, () => { // Temp not define in .env
            console.log("Server is running on port 3000");
        });

        await saveData();
    } catch (err) {
        console.error("Failed to start application:", (err as Error).message);
        process.exit(1);
    }
})();
