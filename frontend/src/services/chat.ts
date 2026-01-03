import { api } from '@/lib/api/client';
import { ConversationSummary, Message, CreateConversationParams, SendMessageParams } from '@/types/chat';

export const chatService = {
    getConversations: async () => {
        return api.get<ConversationSummary[]>('/conversations');
    },

    createConversation: async (data: CreateConversationParams) => {
        return api.post<ConversationSummary>('/conversations', data);
    },

    getMessages: async (conversationId: string, limit = 50, after?: string) => {
        const params: Record<string, any> = { limit };
        if (after) params.after = after;
        return api.get<Message[]>(`/conversations/${conversationId}/messages`, params);
    },

    sendMessage: async (conversationId: string, data: SendMessageParams) => {
        return api.post<Message>(`/conversations/${conversationId}/messages`, data);
    },

    markRead: async (conversationId: string) => {
        return api.post(`/conversations/${conversationId}/read`);
    }
};
