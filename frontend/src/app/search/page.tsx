'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Listing, PaginatedResponse } from '@/lib/api/types';
import ListingCard from '@/components/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Suspense } from 'react';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');

    // Update local state when URL changes
    useEffect(() => {
        setSearchTerm(searchParams.get('q') || '');
        setCategory(searchParams.get('category') || '');
    }, [searchParams]);

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) params.set('q', searchTerm); else params.delete('q');
        if (category && category !== 'all') params.set('category', category); else params.delete('category');
        router.push(`${pathname}?${params.toString()}`);
    };

    const { data, isLoading } = useQuery({
        queryKey: ['search', searchParams.toString()],
        queryFn: async () => {
            const qs = searchParams.toString();
            return api.get<PaginatedResponse<Listing>>(`/search?${qs}`);
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex-1 flex gap-2">
                    <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <div className="w-full md:w-48">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="toys">Toys</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleSearch}>
                    <SearchIcon className="w-4 h-4 mr-2" /> Search
                </Button>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Results</h2>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {data?.items.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                        {(!data?.items || data.items.length === 0) && (
                            <div className="text-center py-10 text-muted-foreground">
                                No results found for your search.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="p-8"><Skeleton className="h-8 w-64" /></div>}>
            <SearchPageContent />
        </Suspense>
    );
}
