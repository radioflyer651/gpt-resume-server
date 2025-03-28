import { appChatService, chatDbService, chatService, initializeServices } from "./app-globals";
import { getAppConfig } from "./config";
import { ChatSocketServer } from "./server/chat-socket.server";
import { initializeExpressApp } from "./setup-express";
import http from 'http';
import https from 'https';
import * as process from 'process';

async function run() {
    const config = await getAppConfig();

    // Initialize the services used by the app.
    await initializeServices();

    // Initialize express, and create the app to listen on a port.
    const app = await initializeExpressApp();

    // Since we're using socket.io, we need to create a server
    //  instead of using the app object directly.
    const server: http.Server | https.Server = http.createServer(app);

    // Register our chat server.  Since it uses socket.io, it works a little differently.
    const socketChatServer = new ChatSocketServer(chatService, chatDbService, appChatService);
    socketChatServer.registerWithServer(config, server);

    // Set the port, and start listening.
    const port = config.serverConfig.port;
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

// Run the application.
run();