'use client';

import ListingForm from '@/components/ListingForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SellPage() {
    return (
        <ProtectedRoute>
            <div className="container max-w-2xl py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Sell an Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ListingForm mode="create" />
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
