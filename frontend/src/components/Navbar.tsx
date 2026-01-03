'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Menu, HelpCircle, ChevronDown, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

// Vinted-like categories data structure
const CATEGORIES = [
    'Women', 'Men', 'Designer', 'Kids', 'Home', 'Electronics', 'Entertainment', 'Hobbies & collectables', 'Sports', 'About', 'Our Platform'
];

// Mock subcategory data for mega menu
const CATEGORY_DATA: Record<string, { title: string; items: string[] }[]> = {
    'Women': [
        { title: 'Clothing', items: ['Dresses', 'Tops', 'Jeans', 'Coats', 'Skirts', 'Shorts'] },
        { title: 'Shoes', items: ['Sneakers', 'Boots', 'Heels', 'Sandals', 'Flats'] },
        { title: 'Bags', items: ['Handbags', 'Backpacks', 'Totes', 'Clutches'] },
        { title: 'Accessories', items: ['Jewelry', 'Watches', 'Scarves', 'Hats'] }
    ],
    'Men': [
        { title: 'Clothing', items: ['T-Shirts', 'Shirts', 'Jeans', 'Pants', 'Coats'] },
        { title: 'Shoes', items: ['Sneakers', 'Boots', 'Loafers'] },
        { title: 'Accessories', items: ['Watches', 'Belts', 'Wallets'] }
    ],
    'Kids': [
        { title: 'Girls', items: ['Clothing', 'Shoes'] },
        { title: 'Boys', items: ['Clothing', 'Shoes'] },
        { title: 'Toys', items: ['Action Figures', 'Dolls', 'Games'] }
    ],
    // Default fallback for others
    'default': [
        { title: 'Popular', items: ['Newest Items', 'Best Sellers'] },
        { title: 'Browse', items: ['All Items'] }
    ]
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="bg-white border-b sticky top-0 z-50 text-sm">
            {/* TOP ROW */}
            <div className="container mx-auto px-4 py-3 flex items-center gap-4 justify-between relative z-50 bg-white">

                {/* Logo */}
                <Link href="/" className="text-3xl font-bold text-teal-600 tracking-tight shrink-0">
                    VintedClone
                </Link>

                {/* Catalogue Dropdown (Desktop) */}
                <div className="hidden md:block relative">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="text-gray-500 hover:text-teal-600 gap-1">
                                Catalogue <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48">
                            {CATEGORIES.slice(0, 5).map((cat) => (
                                <DropdownMenuItem key={cat} onClick={() => router.push(`/search?category=${cat}`)}>
                                    {cat}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/search')}>
                                See all items
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Search Bar (Wide) */}
                <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative hidden sm:block">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                            type="search"
                            placeholder="Search for items"
                            className="w-full pl-10 bg-gray-100 border-transparent focus:bg-white focus:border-teal-600 rounded-md py-2"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </form>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {user ? (
                        <>
                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative p-0 h-9 w-9 rounded-full overflow-hidden border">
                                        {/* Avatar placeholder if no image */}
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/inbox')}>
                                        Inbox
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/my/listings')}>
                                        My Listings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/favorites')}>
                                        Favorites
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="hidden md:block">
                                <HelpCircle className="w-5 h-5 text-gray-400 cursor-pointer hover:text-teal-600" />
                            </div>
                        </>
                    ) : (
                        <div className="hidden md:flex gap-1 text-teal-600">
                            <Link href="/signup" className="hover:underline">Sign up</Link>
                            <span className="text-gray-300">|</span>
                            <Link href="/login" className="hover:underline">Log in</Link>
                        </div>
                    )}

                    {/* Sell Now Button */}
                    <Button
                        asChild
                        className="bg-teal-600 hover:bg-teal-700 text-white rounded-md px-4 font-medium"
                    >
                        <Link href="/sell/new">Sell now</Link>
                    </Button>

                    {/* Mobile Menu Toggle (Simplified) */}
                    <div className="sm:hidden text-gray-500">
                        <Menu className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW (Mega Menu Categories) */}
            <div className="border-t relative z-40 bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-0">
                        {CATEGORIES.map((cat) => (
                            <div key={cat} className="group">
                                <Link
                                    href={`/search?category=${cat}`}
                                    className="block px-3 py-3 text-gray-500 border-b-2 border-transparent hover:text-teal-600 hover:border-teal-600 transition-colors cursor-pointer"
                                >
                                    {cat}
                                </Link>

                                {/* MEGA MENU DROPDOWN */}
                                <div className="absolute left-0 w-full bg-white border-t border-b shadow-lg hidden group-hover:block transition-all duration-200">
                                    <div className="container mx-auto px-4 py-6">
                                        <div className="grid grid-cols-4 gap-8">
                                            {/* Render Subcategories */}
                                            {(CATEGORY_DATA[cat] || CATEGORY_DATA['default']).map((section, idx) => (
                                                <div key={idx}>
                                                    <h3 className="font-semibold text-teal-800 mb-3 text-base">
                                                        {section.title}
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {section.items.map((item) => (
                                                            <li key={item}>
                                                                <Link
                                                                    href={`/search?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(item)}`}
                                                                    className="text-gray-500 hover:text-teal-600 hover:underline block"
                                                                >
                                                                    {item}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
