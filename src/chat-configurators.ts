import { chatDbService, userDbService } from "./app-globals";
import { MainChatConfigurator } from "./services/chat-configurators/main-chat.configurator";

export function getChatConfigurators() {
    return [
        new MainChatConfigurator(userDbService, chatDbService),
    ];
}