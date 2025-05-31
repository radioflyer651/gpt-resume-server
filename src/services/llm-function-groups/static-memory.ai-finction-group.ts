import { AiFunctionDefinitionPackage, AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";


export class StaticMemoryFunctionGroup implements AiFunctionGroup {
    constructor() {

    }

    readonly groupName: string = 'Static Memory Function Group';

    get functions(): AiFunctionDefinitionPackage[] {
        return [

        ];
    }

    storeMemoryItem = async (aiParameters: any) => undefined;
    deleteMemoryItem = async (aiParameters: any) => undefined;
    findRelevantChatInfo = async (aiParameters: any) => undefined;
    findMemoriesForTag = async (aiParameters: any) => undefined;
    findMemoriesForTopic = async (aiParameters: any) => undefined;
    pinMemoryItem = async (aiParameters: any) => undefined;
    unPinMemoryItem = async (aiParameters: any) => undefined;
    getCurrentChatContext = async (aiParameters: any) => undefined;
}