export interface UserPublic {
    id: string;
    email: string;
    display_name?: string;
    city?: string;
    region?: string;
}

export interface ConversationSummary {
    id: string;
    listing_id: string;
    listing_title: string;
    other_user: UserPublic;
    last_message?: string;
    last_message_at?: string; // ISO string
    unread_count: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    created_at: string;
    read_at?: string;
}

export interface CreateConversationParams {
    listing_id: string;
}

export interface SendMessageParams {
    body: string;
}
