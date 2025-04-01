import { SiteSettings } from "../../model/shared-models/site-settings.model";
import { SocketServer } from "../socket.server";
import { SocketServiceBase } from "./socket-server-base.socket-service";


export class AdminSocketService extends SocketServiceBase {
    constructor(socketServer: SocketServer) {
        super(socketServer);
    }

    /** Broadcasts the site settings to all nodes. */
    sendSiteSettings(settings: SiteSettings): void {
        this.socketServer.emitEventToAll('receiveSiteSettings', settings);
    }

    async initialize(): Promise<void> {

    }
}