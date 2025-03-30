

import { FunctionTool } from "../forwarded-types.model";

export const getTarotCardDetailsDefinition: FunctionTool = {
    name: 'get_tarot_cards_details',
    type: 'function',
    description: `Retrieves the details about tarot cards, specified by their ids.  Details include:
            # Card: Card's ObjectId
              - Card Name: Name of the card.
              - Card Alignment: Alignment (generally, how it could affect the outcome.)  Neutral means it could be good or bad.
              - Technological Theme: The technology theme the card represents.
              - Meaning/Interpretation: The spirit in which to interpret the meaning of the card.
    `,
    parameters: {
        type: "object",
        required: [
            'tarotIds'
        ],
        properties: {
            tarotIds: {
                type: "array",
                description: "Array of tarot card IDs to retrieve details for",
                items: {
                    type: "string",
                    description: "ID of the tarot card"
                }
            }
        },
        additionalProperties: false
    },
    strict: true
};

export const getTarotCardsImageDetails: FunctionTool = {
    name: 'get_tarot_card_image_details',
    type: 'function',
    description: `Returns details about the images on tarot cards, specified by their ids.`,
    parameters: {
        type: "object",
        required: [
            'tarotIds'
        ],
        properties: {
            tarotIds: {
                type: "array",
                description: "Array of tarot card IDs to retrieve details for",
                items: {
                    type: "string",
                    description: "ID of the tarot card"
                }
            }
        },
        additionalProperties: false
    },
    strict: true
};

export const flipTarotCard: FunctionTool = {
    name: 'flip_tarot_card',
    description: 'Flips the next tarot card in a Tarot game, and returns the details.',
    type: 'function',
    parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
    },
    strict: true
};