import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import { Chat, ChatInfo, ChatMessage } from "../model/shared-models/chat-models.model";
import { isExistingDbItem, isNewDbItem, NewDbItem, UpsertDbItem } from "../model/shared-models/db-operation-types.model";
import { ChatTypes } from "../model/shared-models/chat-types.model";
import { ChatBaseInstructions } from "../model/chat-instructions.model";


export class ChatDbService extends DbService {

    /** Returns the list of chats for a specified userID, optionally filtered by chatType.
     *   Returned data is just a subset of the full chat data. */
    async getUserChatList(userId: ObjectId, chatType?: string): Promise<ChatInfo[]> {
        return await this.dbHelper.makeCall(async db => {
            const query: any = { userId, isDeleted: { $ne: true } };
            if (chatType) {
                query.chatType = chatType;
            }
            return await db.collection(DbCollectionNames.Chats).find<Chat>(query, {
                projection: {
                    _id: 1,
                    userId: 1,
                    chatType: 1,
                    lastAccessDate: 1
                },
                sort: { chatType: 1, lastAccessDate: -1 }
            }).toArray();
        });
    }

    /** Gets a specific chat, by its ID. */
    async getChatById(chatId: ObjectId) {
        return await this.dbHelper.makeCall(async db => {
            return nullToUndefined(await db.collection(DbCollectionNames.Chats).findOne<Chat>({ _id: chatId, isDeleted: { $ne: true } }));
        });
    }

    /** Returns the chat of a specified type, for a specified userID, that was accessed last. */
    async getLastAccessedChat(userId: ObjectId, chatType: string): Promise<Chat | undefined> {
        return await this.dbHelper.makeCall(async db => {
            return nullToUndefined(await db.collection(DbCollectionNames.Chats).findOne<Chat>({
                userId,
                isDeleted: { $ne: true },
                chatType
            }, {
                sort: { lastAccessDate: -1 }
            }));
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
    async upsertChat(chat: UpsertDbItem<Chat>): Promise<Chat> {
        return await this.dbHelper.makeCall(async db => {
            // Determine if this is a new chat, or an existing one.
            if (isExistingDbItem(chat)) {
                const result = await db.collection(DbCollectionNames.Chats).updateOne(
                    { _id: chat._id },
                    { $set: chat },
                    { upsert: true }
                );

                chat._id = result.upsertedId || chat._id;
                return chat;
            } else {
                // Insert the chat into the database.
                const opResult = await db.collection<NewDbItem<Chat>>(DbCollectionNames.Chats).insertOne(chat);

                // Silly, but recast to an actual chat, because TypeScript can't figure it out.
                const newChat = chat as Chat;

                // Set the new ID from the database.
                newChat._id = opResult.insertedId;

                // Return the old object.
                return newChat;
            }
        });
    }

    /** Deletes a specified chat. */
    async deleteChat(chatId: ObjectId) {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.Chats, async (db, collection) => {
            // Soft delete the chat.
            collection.updateOne({ _id: chatId }, {
                $set: { isDeleted: true }
            });
        });
    }

    /** Returns the base instruction set, if there are any, for a specified chat type. */
    async getBaseInstructions(chatType: ChatTypes): Promise<ChatBaseInstructions | undefined> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.ChatBaseInstructions, async (db, collection) => {
            return nullToUndefined(collection.findOne<ChatBaseInstructions>({ chatType }));
        });
    }

    /** Upserts a specified ChatBaseInstructions object. */
    async upsertChatBaseInstructions(instructions: UpsertDbItem<ChatBaseInstructions>): Promise<ChatBaseInstructions> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.ChatBaseInstructions, async (db, collection) => {
            // Determine if this is a new chat, or an existing one.
            if (isExistingDbItem(instructions)) {
                const result = await collection.updateOne(
                    { _id: instructions._id },
                    { $set: instructions },
                    { upsert: true }
                );

                instructions._id = result.upsertedId || instructions._id;
                return instructions;
            } else {
                // Insert the chat into the databse.
                const opResult = await collection.insertOne(instructions);

                // Silly, but recast to an actual chat, because TypeScript can't figure it out.
                const newInstructions = instructions as ChatBaseInstructions;

                // Set the new ID from the database.
                newInstructions._id = opResult.insertedId;

                // Return the old object.
                return newInstructions;
            }
        });
    }

    /** Deletes a specified ChatBaseInstructions object from the database. */
    async deleteChatBaseInstructions(chatType: ChatTypes): Promise<void> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.ChatBaseInstructions, async (db, collection) => {
            collection.deleteOne({ chatType });
        });
    }

    /** Returns all chats of a specified type for a user, specified by their ID. */
    async getChatsForUserByType(userId: ObjectId, chatType: ChatTypes): Promise<Chat[]> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.Chats, async (db, collection) => {
            return collection.find<Chat>({
                userId,
                isDeleted: { $ne: true },
                chatType,
            }).toArray();
        });
    }
}