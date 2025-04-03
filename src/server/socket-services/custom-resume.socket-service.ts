import { Socket } from "socket.io";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { SocketServer } from "../socket.server";
import { LlmChatService } from "../../services/llm-chat-service.service";
import { ChatDbService } from "../../database/chat.db-service";
import { AppChatService } from "../../services/app-chat.service";
import { UserDbService } from "../../database/user.db-service";
import { CustomResume } from "../../model/shared-models/custom-resume.model";
import { CustomResumeDbService } from "../../database/custom-resume.db-service";

export class CustomResumeSocketService extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        private readonly userDbService: UserDbService,
        private readonly llmChatService: LlmChatService,
        private readonly appChatService: AppChatService,
        private readonly chatDbService: ChatDbService,
        private readonly customResumeDbService: CustomResumeDbService,
    ) {
        super(socketServer);

    }

    async initialize(): Promise<void> {
    }

    /** Sends a resume to the front end, in HTML format */
    sendNewResume(socket: Socket, resume: CustomResume): void {
        socket.emit('receiveNewResume', resume);
    }

}