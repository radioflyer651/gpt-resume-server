
# LLM Function Groups

LLM Function Groups are groups of functions (called "tools" by OpenAI), that can be called by the AI through chat.  These functions are typically provided to the chat context, and called at-will by the LLM.

These can be at the request of the user, or they can be at the behest of the LLM.  For instance, the LLM may query the database for some sort of information, based on a request from the user.