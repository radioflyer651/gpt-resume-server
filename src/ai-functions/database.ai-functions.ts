import { FunctionTool } from "../forwarded-types.model";

/* This is not used, but I'm keeping it for possible future exploration.
    This functionality gives the AI the ability to make arbitrary queries, updates, and deletes
    on the database.  It's probably a little dangerous, but worth exploring at some point.    
 */

export const dbQueryCallTool: FunctionTool = {
    name: 'db_query_call',
    type: 'function',
    strict: false,
    description: `Executes a database query operation on a specified collection using various MongoDB functions.  Try not to retrieve more data than you need, because it will fill up the chat context.
                This is the underlying function call:
                dbQueryCall = async ({ collectionName, collectionFunction, query, newData }: { collectionName: string, collectionFunction: DbFunctions, query: object | Array<object>, newData?: object | Array<object>; }): Promise<string> => {
                        console.log(\`DB Call\`, collectionName, collectionFunction, query, newData);
                        const result = await this.dbHelper.makeCallWithCollection(collectionName, async (db, col) => {
                            switch (collectionFunction) {
                                case 'findOne':
                                    return await col.findOne(query);
                                case 'find':
                                    return await col.find(query).toArray();
                                case 'aggregate':
                                    return await col.aggregate(query as Array<object>).toArray();
                                case 'countDocuments':
                                    return await col.countDocuments(query);
                                case 'updateOne':
                                    return await col.updateOne(query, { $set: newData });
                                case 'updateMany':
                                    return await col.updateMany(query, { $set: newData });
                                case 'findAndReplace':
                                    return await col.findOneAndReplace(query, newData!);
                                case 'findAndUpdate':
                                    return await col.findOneAndUpdate(query, { $set: newData });
                                case 'deleteOne':
                                    return await col.deleteOne(query);
                                case 'deleteMany':
                                    return await col.deleteMany(query);
                                case 'findOneAndDelete':
                                    return await col.findOneAndDelete(query);
                                case 'insertOne':
                                    return await col.insertOne(newData!);
                                case 'insertMany':
                                    return await col.insertMany(newData as Array<object>);
                                default:
                                    throw new Error(\`Unsupported collection function: \${collectionFunction}\`);
                            }
                        });
                
                        // Convert to JSON.
                        return JSON.stringify(result);
                    };`,
    parameters: {
        type: 'object',
        properties: {
            collectionName: {
                type: 'string',
                description: 'Name of the MongoDB collection to perform the operation on'
            },
            collectionFunction: {
                type: 'string',
                enum: [
                    'findOne', 'find', 'aggregate', 'countDocuments',
                    'updateOne', 'updateMany', 'findAndReplace', 'findAndUpdate',
                    'deleteOne', 'deleteMany', 'findOneAndDelete',
                    'insertOne', 'insertMany'
                ],
                description: 'The MongoDB function to execute.'
            },
            query: {
                type: 'object',
                description: 'The query object or array of pipeline stages for aggregation.',
                properties: {},
                additionalProperties: true
            },
            newData: {
                type: 'object',
                description: 'The new data to insert or update (required for update and insert operations).  This must be the who call second argument, and not just the updated object definition.',
                properties: {},
                additionalProperties: true
            }
        },
        required: ['collectionName', 'collectionFunction', 'query'],
        additionalProperties: false
    }
};

export const getAllCollectionNamesTool: FunctionTool = {
    name: 'get_all_collection_names',
    type: 'function',
    strict: true,
    description: 'Returns a list of all collection names in the database.',
    parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false
    }
};

export const createCollectionTool: FunctionTool = {
    name: 'create_collection',
    type: 'function',
    strict: true,
    description: 'Creates a new collection in the database if it does not already exist.  Never add a new collection unless explicitly told to.',
    parameters: {
        type: 'object',
        properties: {
            collectionName: {
                type: 'string',
                description: 'Name of the collection to create.'
            }
        },
        required: ['collectionName'],
        additionalProperties: false
    }
};

