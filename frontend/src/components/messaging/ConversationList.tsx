import React from 'react';
import { ConversationSummary } from '@/types/chat';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User, ShoppingBag } from 'lucide-react';

interface ConversationListProps {
    conversations: ConversationSummary[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
    if (conversations.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No conversations yet.
            </div>
        );
    }

    return (
        <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2">
            {conversations.map((conv) => (
                <div
                    key={conv.id}
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                        selectedId === conv.id
                            ? "bg-accent border-primary/20"
                            : "bg-card hover:bg-accent/50 border-transparent hover:border-border"
                    )}
                >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 opacity-50" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm truncate pr-2">
                                {conv.other_user?.display_name || conv.other_user?.email || 'User'}
                            </h4>
                            {conv.last_message_at && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(conv.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <ShoppingBag className="w-3 h-3" />
                            <span className="truncate">{conv.listing_title}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <p className={cn(
                                "text-sm truncate max-w-[180px]",
                                conv.unread_count > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                            )}>
                                {conv.last_message || "Started a conversation"}
                            </p>
                            {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="h-5 px-1.5 min-w-[1.25rem]">
                                    {conv.unread_count}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
