export interface User {
    id: string; // UUID
    email: string;
    full_name?: string;
    city?: string;
    region?: string;
    created_at: string;
}

export interface Token {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user?: User; // Depending on backend response, sometimes user is embedded or separate
}

export interface ApiError {
    status: number;
    message: string;
    details?: any;
}

export interface Listing {
    id: string; // UUID
    title: string;
    description?: string;
    price: number;
    currency: string;
    category?: string;
    brand?: string;
    size?: string;
    condition?: string;
    images?: ListingImage[]; // Objects with url
    seller_id: string; // UUID
    created_at: string;
    status: 'draft' | 'live' | 'sold' | 'hidden';
}

export interface ListingImage {
    id: string; // UUID
    url: string;
    thumb_url?: string;
    sort_order: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface Favorite {
    user_id: string; // UUID
    listing_id: string; // UUID
    created_at: string;
    listing?: Listing;
}
