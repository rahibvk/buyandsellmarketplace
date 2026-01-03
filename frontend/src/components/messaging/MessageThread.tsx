import React, { useEffect, useRef, useState } from 'react';
import { Message, ConversationSummary } from '@/types/chat';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface MessageThreadProps {
    conversation: ConversationSummary;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (body: string) => Promise<void>;
}

export function MessageThread({ conversation, messages, isLoading, onSendMessage }: MessageThreadProps) {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-card overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                <div>
                    <h3 className="font-semibold">
                        {conversation.other_user?.display_name || conversation.other_user?.email || 'User'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Re: {conversation.listing_title}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {isLoading && messages.length === 0 ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id; // user.id is string now
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col max-w-[80%]",
                                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm",
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted text-secondary-foreground rounded-bl-none"
                                    )}
                                >
                                    {msg.body}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-muted-foreground text-sm mt-10">
                        Start the conversation!
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
