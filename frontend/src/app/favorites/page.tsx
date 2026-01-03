'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Listing, Favorite } from '@/lib/api/types';
import ListingCard from '@/components/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function FavoritesPage() {
    const { data: favorites, isLoading } = useQuery({
        queryKey: ['favorites'],
        queryFn: async () => {
            // Returns list of Favorite objects with embedded listing
            return api.get<Favorite[]>('/favorites');
        },
    });

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">My Favorites</h1>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[250px] w-full rounded-xl" />)}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {favorites && Array.isArray(favorites) && favorites.map((fav) => (
                                fav.listing && <ListingCard key={fav.listing.id} listing={fav.listing} />
                            ))}
                            {favorites && !Array.isArray(favorites) && (favorites as any).items?.map((fav: any) => (
                                fav.listing && <ListingCard key={fav.listing.id} listing={fav.listing} />
                            ))}
                        </div>
                        {(!favorites || (Array.isArray(favorites) && favorites.length === 0)) && (
                            <div className="text-center py-10 text-muted-foreground">
                                You haven't favorited any items yet.
                            </div>
                        )}
                    </>
                )}
            </div>
        </ProtectedRoute>
    );
}
