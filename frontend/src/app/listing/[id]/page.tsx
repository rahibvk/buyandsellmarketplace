'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Listing } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';
import { Heart, MessageCircle } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { chatService } from '@/services/chat';
import { toast } from 'sonner';

export default function ListingDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const { data: listing, isLoading, error } = useQuery({
        queryKey: ['listing', id],
        queryFn: () => api.get<Listing>(`/listings/${id}`),
        enabled: !!id,
    });

    const createConvMutation = useMutation({
        mutationFn: () => chatService.createConversation({ listing_id: id as string }),
        onSuccess: (data) => {
            router.push(`/inbox?conversation_id=${data.id}`);
        },
        onError: () => {
            toast.error("Failed to start conversation");
        }
    });

    const handleMessage = () => {
        if (!user) {
            router.push(`/login?redirect=/listing/${id}`);
            return;
        }
        createConvMutation.mutate();
    };

    if (isLoading) return <div className="space-y-4 max-w-4xl mx-auto"><Skeleton className="h-[400px] w-full" /><Skeleton className="h-8 w-1/2" /></div>;
    if (error || !listing) return <div className="text-center py-10">Listing not found</div>;

    const isOwner = user?.id === listing.seller_id;

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Images */}
            <div className="space-y-4">
                {listing?.images && listing.images.length > 0 ? (
                    <Carousel className="w-full">
                        <CarouselContent>
                            {listing.images.filter(img => !!img.url).map((img, index) => (
                                <CarouselItem key={index}>
                                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
                                        <Image src={img.url} alt={listing.title} fill className="object-cover" />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {listing.images.length > 1 && <><CarouselPrevious className="left-2" /><CarouselNext className="right-2" /></>}
                    </Carousel>
                ) : (
                    <div className="aspect-square bg-muted flex items-center justify-center rounded-lg border">
                        No Images
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold">{listing.title}</h1>
                        <p className="text-xl font-bold text-primary">{listing.price} {listing.currency}</p>
                    </div>
                    <p className="text-muted-foreground mt-1">{listing.brand} • {listing.size}</p>
                </div>

                <div className="flex gap-2">
                    <Badge variant="outline">{listing.condition}</Badge>
                    <Badge variant="secondary">{listing.status}</Badge>
                </div>

                <Card>
                    <CardContent className="p-4 space-y-4">
                        <p className="whitespace-pre-wrap">{listing.description}</p>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                    {isOwner ? (
                        <div className="flex gap-2">
                            <Button className="flex-1" variant="outline">Edit Listing</Button>
                            {listing.status === 'draft' && <Button className="flex-1">Publish</Button>}
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button className="flex-1">Buy Now</Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleMessage}
                                disabled={createConvMutation.isPending}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                {createConvMutation.isPending ? "Starting..." : "Message"}
                            </Button>
                            <Button variant="ghost" size="icon"><Heart className="w-5 h-5" /></Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
