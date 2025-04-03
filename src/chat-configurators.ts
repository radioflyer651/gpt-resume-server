import { chatDbService, tarotDbService, userDbService } from "./app-globals";
import { MainChatConfigurator } from "./services/chat-configurators/main.chat-configurator";
import { TarotChatConfigurator } from "./services/chat-configurators/tarot.chat-configurator";

export function getChatConfigurators() {
    return [
        new MainChatConfigurator(userDbService, chatDbService),
        new TarotChatConfigurator(userDbService, chatDbService, tarotDbService),
    ];
}