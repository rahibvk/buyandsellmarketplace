'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Listing } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';

const listingSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    currency: z.string().default('USD'),
    category: z.string().min(1, 'Category is required'),
    brand: z.string().optional(),
    size: z.string().optional(),
    condition: z.string().min(1, 'Condition is required'),
});

interface ListingFormProps {
    initialData?: Listing;
    mode: 'create' | 'edit';
}

export default function ListingForm({ initialData, mode }: ListingFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [listingId, setListingId] = useState<number | null>(initialData?.id || null);
    const [images, setImages] = useState<string[]>(initialData?.images?.map(img => img.url) || []);

    const form = useForm<z.infer<typeof listingSchema>>({
        resolver: zodResolver(listingSchema) as any,
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            price: initialData?.price || 0,
            currency: initialData?.currency || 'USD',
            category: initialData?.category || '',
            brand: initialData?.brand || '',
            size: initialData?.size || '',
            condition: initialData?.condition || '',
        },
    });

    const onDraftSubmit = async (values: z.infer<typeof listingSchema>) => {
        setLoading(true);
        try {
            let tempId = listingId;
            if (mode === 'create' && !tempId) {
                // Create Draft
                const res = await api.post<Listing>('/listings', values);
                if (res) {
                    tempId = res.id;
                    setListingId(res.id);
                    toast.success('Draft created! Now upload images.');
                }
            } else if (tempId) {
                // Update Draft
                await api.put(`/listings/${tempId}`, values);
                toast.success('Draft updated');
            }
        } catch (error: any) {
            toast.error('Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    const onPublish = async () => {
        if (!listingId) return;
        setLoading(true);
        try {
            await api.post(`/listings/${listingId}/publish`);
            toast.success('Listing published!');
            router.push(`/listing/${listingId}`);
        } catch (error) {
            toast.error('Failed to publish');
        } finally {
            setLoading(false);
        }
    };

    const refreshImages = async () => {
        if (!listingId) return;
        const res = await api.get<Listing>(`/listings/${listingId}`);
        if (res && res.images) {
            setImages(res.images.map(img => img.url));
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto p-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onDraftSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl><Input placeholder="Item name" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Currency</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="Describe the item..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Result" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="electronics">Electronics</SelectItem>
                                            <SelectItem value="clothing">Clothing</SelectItem>
                                            <SelectItem value="home">Home</SelectItem>
                                            <SelectItem value="toys">Toys</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="condition"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condition</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="new">New</SelectItem>
                                            <SelectItem value="like_new">Like New</SelectItem>
                                            <SelectItem value="good">Good</SelectItem>
                                            <SelectItem value="fair">Fair</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brand (Optional)</FormLabel>
                                    <FormControl><Input placeholder="e.g. Nike" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="size"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Size (Optional)</FormLabel>
                                    <FormControl><Input placeholder="e.g. M, 42" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit" disabled={loading}>
                        {listingId ? 'Save Changes' : 'Create Draft'}
                    </Button>
                </form>
            </Form>

            {listingId && (
                <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Images</h3>
                    <ImageUploader listingId={listingId} existingImages={images} onUploadComplete={refreshImages} />

                    <div className="mt-8 flex justify-end">
                        <Button size="lg" onClick={onPublish} className="w-full sm:w-auto" disabled={loading}>
                            Publish Listing
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
