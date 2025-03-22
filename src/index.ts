import { initializeExpressApp } from "./setup-express";

// Initialize express, and create the app to listen on a port.
const app = initializeExpressApp();

// Set the port, and start listening.
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});