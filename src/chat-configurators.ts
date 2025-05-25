import { chatDbService, tarotDbService, companyDbService, authDbService } from "./app-globals";
import { MainChatConfigurator } from "./services/chat-configurators/main-chat.configurator";
import { TarotChatConfigurator } from "./services/chat-configurators/tarot-chat.configurator";

export function getChatConfigurators() {
    return [
        new MainChatConfigurator(authDbService, companyDbService, chatDbService),
        new TarotChatConfigurator(authDbService, companyDbService, chatDbService, tarotDbService),
    ];
}