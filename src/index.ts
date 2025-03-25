import { initializeServices } from "./app-globals";
import { getAppConfig } from "./config";
import { initializeExpressApp } from "./setup-express";


async function run() {
    // Initialize the services used by the app.
    await initializeServices();

    // Initialize express, and create the app to listen on a port.
    const app = await initializeExpressApp();

    // Set the port, and start listening.
    const port = process.env.PORT || 1062;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

// Run the application.
run();