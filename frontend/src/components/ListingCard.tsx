'use client';

import { Listing } from '@/lib/api/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface ListingCardProps {
    listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false); // MVP: Local state, ideally sync with backend fav status

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to add favorites');
            return;
        }

        // Optimistic toggle
        setIsFavorite(!isFavorite);

        try {
            if (isFavorite) {
                await api.delete(`/favorites/${listing.id}`);
            } else {
                await api.post(`/favorites/${listing.id}`);
            }
        } catch (error) {
            // Revert
            setIsFavorite(!isFavorite);
            toast.error('Failed to update favorite');
        }
    };

    return (
        <Link href={`/listing/${listing.id}`}>
            <Card className="h-full hover:shadow-lg transition overflow-hidden">
                <div className="relative aspect-square bg-gray-100">
                    {listing.images && listing.images.length > 0 && listing.images[0]?.url ? (
                        <Image
                            src={listing.images[0].url}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No Image
                        </div>
                    )}

                    {user && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
                            onClick={toggleFavorite}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                        </Button>
                    )}

                    {listing.status !== 'published' && (
                        <Badge className="absolute top-2 left-2" variant="secondary">{listing.status}</Badge>
                    )}
                </div>

                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold truncate">{listing.title}</h3>
                            <p className="text-sm text-muted-foreground">{listing.brand}</p>
                        </div>
                        <p className="font-bold whitespace-nowrap">
                            {listing.price} {listing.currency}
                        </p>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground capitalize">
                        {listing.condition} • {listing.size}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
