'use client';

import ListingForm from '@/components/ListingForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Listing } from '@/lib/api/types';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function EditListingPage() {
    const { id } = useParams();

    const { data: listing, isLoading, error } = useQuery({
        queryKey: ['listing', id],
        queryFn: () => api.get<Listing>(`/listings/${id}`),
        enabled: !!id,
    });

    if (isLoading) return <div className="container max-w-2xl py-8"><Skeleton className="h-[600px] w-full" /></div>;
    if (error || !listing) return <div className="text-center py-10">Listing not found</div>;

    return (
        <ProtectedRoute>
            <div className="container max-w-2xl py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Listing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ListingForm mode="edit" initialData={listing} />
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
