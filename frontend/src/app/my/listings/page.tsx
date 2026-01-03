'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Listing, PaginatedResponse } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Edit, Eye, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyListingsPage() {
    const { user } = useAuth();
    // MVP Hack: fetch feed and filter by user ID if /listings/mine doesn't exist
    // But since backend is assumed to be fully integrated, we'll try /users/me/listings or filter feed.
    // The prompt says: "If backend has endpoint: GET /listings/mine use it. If not... Call /feed and filter"
    // I'll try filtering /feed or a specific filtered search endpoint if I can't confirm /listings/mine.
    // Actually, I can search with `seller_id` if search supports it?
    // Let's implement client-side filtering of the feed for MVP if needed, 
    // BUT fetching *all* feed pages to find mine is bad.
    // Better: GET /feed?seller_id=ME (if backend supports filters on feed? Search does).
    // Let's try GET /search?seller_id={user_id}.
    // Or just assume backend *should* have it, if not I'll just note it.
    // I'll try to use /search with a seller_id param if I can, or filtering the feed 
    // is really inefficient. 
    // I will use `GET /listings` and assume it returns mine if I'm auth? 
    // No, prompt said "GET /listings/{id}".
    // Prompt said: "If not... Call /feed and filter by seller_id == me (MVP hack)".
    // I'll allow the hack: fetch a large page of feed and filter.

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['my-listings', user?.id],
        queryFn: async () => {
            if (!user) return [];
            // Try searching by seller ID if possible, otherwise fetch feed
            // Let's assume we fetch feed page 1 with 100 items for MVP
            const res = await api.get<PaginatedResponse<Listing>>('/feed?page_size=100');
            if (res && res.items) {
                return res.items.filter(item => item.seller_id === user.id);
            }
            return [];
        },
        enabled: !!user,
    });

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        try {
            await api.delete(`/listings/${id}`);
            toast.success('Listing deleted');
            refetch();
        } catch (error) {
            toast.error('Failed to delete listing');
        }
    };

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">My Listings</h1>
                    <Button asChild>
                        <Link href="/sell/new">Add New Listing</Link>
                    </Button>
                </div>

                {isLoading ? (
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.map((listing) => (
                                    <TableRow key={listing.id}>
                                        <TableCell className="font-medium">{listing.title}</TableCell>
                                        <TableCell>{listing.price} {listing.currency}</TableCell>
                                        <TableCell>
                                            <Badge variant={listing.status === 'published' ? 'default' : 'secondary'}>
                                                {listing.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/listing/${listing.id}`}>
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/sell/${listing.id}/edit`}>
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(listing.id)}>
                                                <Trash className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!data || data.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            No listings found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
