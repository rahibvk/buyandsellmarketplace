'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Listing, PaginatedResponse } from '@/lib/api/types';
import ListingCard from '@/components/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['feed', page],
    queryFn: () => api.get<PaginatedResponse<Listing>>(`/feed?page=${page}&page_size=${pageSize}`),
  });

  return (
    <div className="space-y-6">
      <section className="py-4">
        <h1 className="text-2xl font-bold mb-4">New Arrivals</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">
            Failed to load listings. Please try again later.
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
                No listings found.
              </div>
            )}

            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">Page {page}</span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={!data || data.items.length < pageSize}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
