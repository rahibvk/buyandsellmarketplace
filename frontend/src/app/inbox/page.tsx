'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

export default function InboxPage() {
    const searchParams = useSearchParams();
    const initialConvId = searchParams.get('conversation_id');

    const [selectedId, setSelectedId] = useState<string | null>(initialConvId || null);
    const queryClient = useQueryClient();

    // Poll conversations every 5 seconds
    const { data: conversationsData, isLoading: isLoadingConvs } = useQuery({
        queryKey: ['conversations'],
        queryFn: chatService.getConversations,
        refetchInterval: 5000,
    });
    const conversations = conversationsData ?? [];

    // Poll messages every 3 seconds if active
    const { data: messagesData, isLoading: isLoadingMsgs } = useQuery({
        queryKey: ['messages', selectedId],
        queryFn: () => chatService.getMessages(selectedId!),
        enabled: !!selectedId,
        refetchInterval: 3000,
    });
    const messages = messagesData ?? [];

    // Mark read effect
    useEffect(() => {
        if (selectedId && messages.length > 0) {
            // Check if there are unread messages to avoid spamming?
            // Since we rely on backend to update `read_at`, calling it idempotently is fine.
            // But we don't want to call it every 3 seconds if nothing changed.
            // The `messages` dep handles updates.
            chatService.markRead(selectedId)
                .then(() => {
                    // Update conversation list to remove unread badge locally or invalidate
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                })
                .catch(console.error);
        }
    }, [selectedId, messages.length, queryClient]);

    const sendMutation = useMutation({
        mutationFn: (body: string) => chatService.sendMessage(selectedId!, { body }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    const handleSendMessage = async (body: string) => {
        if (!selectedId) return;
        await sendMutation.mutateAsync(body);
    };

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <ProtectedRoute>
            <div className="container max-w-6xl py-6 space-y-4 h-[calc(100vh-4rem)]">
                <h1 className="text-2xl font-bold">Inbox</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px]">
                    {/* Conversation List */}
                    <div className={cn(
                        "h-full md:block",
                        selectedId ? "hidden" : "block"
                    )}>
                        <Card className="h-full flex flex-col">
                            <div className="p-4 border-b font-semibold bg-muted/20">
                                Conversations
                            </div>
                            <div className="flex-1 p-2 overflow-hidden">
                                {isLoadingConvs ? (
                                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                                ) : (
                                    <ConversationList
                                        conversations={conversations}
                                        selectedId={selectedId}
                                        onSelect={setSelectedId}
                                    />
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Message Thread */}
                    <div className={cn(
                        "h-full md:col-span-2 md:block",
                        selectedId ? "block" : "hidden"
                    )}>
                        {selectedId ? (
                            selectedConv || isLoadingConvs ? (
                                <div className="h-full flex flex-col">
                                    <div className="md:hidden mb-2">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                        </Button>
                                    </div>
                                    {selectedConv && (
                                        <MessageThread
                                            conversation={selectedConv}
                                            messages={messages}
                                            isLoading={isLoadingMsgs}
                                            onSendMessage={handleSendMessage}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center border rounded-lg bg-muted/20">
                                    Conversation not found
                                </div>
                            )
                        ) : (
                            <div className="h-full hidden md:flex items-center justify-center border rounded-lg bg-muted/10 text-muted-foreground p-10 text-center">
                                Select a conversation to start messaging
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
