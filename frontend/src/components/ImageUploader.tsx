'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ImageUploaderProps {
    listingId: number;
    existingImages?: string[];
    onUploadComplete: () => void;
}

export default function ImageUploader({ listingId, existingImages = [], onUploadComplete }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);

        try {
            for (const file of files) {
                // 1. Get presigned URL
                const presignRes = await api.post<{ upload_url: string; file_url: string }>('/media/presign', {
                    filename: file.name,
                    content_type: file.type,
                });

                if (!presignRes) throw new Error('Failed to get upload URL');

                // 2. Upload file to storage (Direct PUT)
                // Note: usage of fetch directly here to avoid api wrapper's JSON/Auth logic on external URL if needed, 
                // but presigned URL usually doesn't need auth header, just standard PUT.
                // We use standard fetch.
                const uploadRes = await fetch(presignRes.upload_url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type,
                    },
                });

                if (!uploadRes.ok) {
                    console.error('Upload failed with status:', uploadRes.status, uploadRes.statusText);
                    const text = await uploadRes.text();
                    console.error('Upload response body:', text);
                    throw new Error(`Failed to upload file to storage: ${uploadRes.status} ${uploadRes.statusText}`);
                }

                // 3. Attach to listing
                await api.post(`/listings/${listingId}/images`, {
                    url: presignRes.file_url,
                });
            }

            toast.success('Images uploaded successfully');
            onUploadComplete();
        } catch (error: any) {
            console.error('Upload Error Details:', JSON.stringify(error, null, 2));
            console.error('Raw Error:', error);
            if (error.message) console.error('Error Message:', error.message);
            toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {existingImages.filter(img => !!img).map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-md overflow-hidden border">
                        <Image src={img} alt="Listing image" fill className="object-cover" />
                    </div>
                ))}

                <div
                    className="w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
                multiple
            />
            <p className="text-sm text-muted-foreground">Click + to add images. They will be uploaded immediately.</p>
        </div>
    );
}
