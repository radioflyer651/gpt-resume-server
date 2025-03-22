import { ObjectId } from "mongodb";
import { Company } from "../model/company.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { User } from "../model/user.model";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import { Chat, ChatInfo, ChatMessage } from "../model/chat-models.model";


export class ChatDbService extends DbService {

    /** Returns the list of chats for a specified userID, optionally filtered by chatType.
     *   Returned data is just a subset of the full chat data. */
    async getUserChatList(userId: ObjectId, chatType?: string): Promise<ChatInfo[]> {
        return await this.dbHelper.makeCall(async db => {
            const query: any = { userId };
            if (chatType) {
                query.chatType = chatType;
            }
            return await db.collection(DbCollectionNames.Chats).find<Chat>(query, {
                projection: {
                    _id: 1,
                    userId: 1,
                    chatType: 1
                }
            }).toArray();
        });
    }

    /** Gets a specific chat, by its ID. */
    async getChatById(chatId: ObjectId) {
        return await this.dbHelper.makeCall(async db => {
            return nullToUndefined(await db.collection(DbCollectionNames.Chats).findOne<Chat>({ _id: chatId }));
        });
    }

    /** Adds a new set of messages to a specified chat. */
    async addMessagesToChat(chatId: ObjectId, messages: ChatMessage[]) {
        return await this.dbHelper.makeCall(async db => {
            await db.collection<Chat>(DbCollectionNames.Chats).updateOne(
                { _id: chatId },
                { $push: { chatMessages: { $each: messages } } }
            );
        });
    }

    /** Upserts a specified chat. */
    async upsertChat(chat: Chat): Promise<Chat> {
        return await this.dbHelper.makeCall(async db => {
            const result = await db.collection(DbCollectionNames.Chats).updateOne(
                { _id: chat._id },
                { $set: chat },
                { upsert: true }
            );

            chat._id = result.upsertedId || chat._id;
            return chat;
        });
    }

    /** Deletes a specified chat. */
    async deleteChat(chatId: ObjectId) {
        return await this.dbHelper.makeCall(async db => {
            await db.collection(DbCollectionNames.Chats).deleteOne({ _id: chatId });
        });
    }
}