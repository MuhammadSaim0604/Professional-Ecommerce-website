# ShopFlow - Modern eCommerce Platform

## Overview

ShopFlow is a full-stack eCommerce platform offering a comprehensive product catalog, user authentication, shopping cart, order management, and an admin dashboard. Its purpose is to provide a robust, scalable, and secure solution for online retail, featuring advanced capabilities like flash sales, wishlist functionality, diverse payment integrations, and complete database export/import functionality. The project aims to deliver a seamless shopping experience for users and efficient management tools for administrators.

## Recent Changes
- **Complete Site Branding System (Aug 4, 2025)**: Implemented comprehensive site branding functionality with site logo, favicon, and site name customization. Added database columns (site_logo, favicon, site_name) to editor_settings table, updated backend routes, created admin editor interface with upload sections, and updated header to dynamically display uploaded branding. Site name input is non-blocking with manual save button for better UX.
- **Product Layout Spacing Optimization (Aug 3, 2025)**: Fine-tuned product card layouts for better mobile experience. Reduced gaps between title, description, price, and stars (space-y-1 on mobile vs space-y-1.5). Optimized price text sizing (text-sm on mobile vs text-lg on desktop) and description text (text-xs) for better fit. Adjusted horizontal scroll sections to remove unnecessary left padding, ensuring first product aligns properly with container edge.
- **Mobile Responsive Optimization (Aug 3, 2025)**: Comprehensive mobile responsiveness improvements across the home page. Reduced product card heights (h-24 on mobile vs h-48 on desktop), optimized text sizes (xs/sm/base scaling), minimized padding and gaps (gap-2 on mobile vs gap-6 on desktop), made grid more compact (2 cols mobile, 3 cols small, 4 cols desktop), optimized horizontal scroll sections with smaller cards (w-32 on mobile vs w-36), and improved section headers with responsive sizing and hidden descriptive text on mobile.
- **Page Scroll Restoration (Aug 3, 2025)**: Fixed navigation scroll position issue where users would land in the middle or bottom of pages when navigating. Implemented ScrollRestoration component that automatically scrolls to the top of the page on every route change, ensuring users always start at the beginning of each page and can scroll freely from there.
- **Mobile Search Layout Fix (Aug 3, 2025)**: Fixed mobile search overlay layout issue where only the search bar was visible instead of the full-screen overlay with popular searches and suggestions. Corrected mobile layout to use proper full-screen dimensions (h-screen w-screen), improved search bar sizing for mobile (full width instead of 75%), optimized content spacing and sizing for mobile screens, and ensured popular searches and recent searches are always visible.
- **Comprehensive Search System Implementation (Aug 3, 2025)**: Completely rebuilt search functionality with proper responsive behavior. Mobile shows search icon in header that opens full-screen overlay with enhanced UI. Desktop shows search input that opens horizontal popup (80% width, 50% height). Fixed all layout bugs, accessibility warnings, and implemented proper dark mode support. Search includes popular searches, recent searches, and real-time search results with product images and categories.
- **Category Status Update Fix (Aug 3, 2025)**: Fixed critical bug where category status toggles (isActive field) weren't saving correctly. Root cause was frontend sending requests to `/api/categories/` instead of `/api/admin/categories/` where the FormData transformation middleware was applied. Fixed frontend to use correct admin endpoints and verified FormData boolean transformation is working.
- **User Management UI Enhancement (Aug 3, 2025)**: Improved user management section responsiveness with optimistic updates, proper loading states, and better error handling. Added loading spinners to status badges, delete buttons, and bulk operations. Enhanced mutation hooks with proper cache invalidation and rollback on errors.
- **Admin File Cleanup (Aug 3, 2025)**: Cleaned up unused admin files to streamline the codebase. Removed 7 unused admin page files and 2 unused admin component files, saving ~380KB. Only active admin files remain: `admin-complete-enhanced.tsx` (main admin panel), `admin-products-fixed.tsx` (dedicated products page), `categories-table-enhanced.tsx`, and `encryption-settings.tsx`.
- **Status Badge Fix (Aug 3, 2025)**: Fixed product and category status badges in admin panel to correctly display red "Inactive" tags for items with `isActive: false` instead of always showing green "Active" tags.
- **Complete Caching Removal (Aug 3, 2025)**: Removed all caching logic from the application per user request. This includes removal of server/cache.ts, all cached query functions, memory cache, query memoization, request caching middleware, and cache management API endpoints. Also removed HTTP cache headers for static assets. The application now operates without any caching mechanisms for maximum data freshness and simplicity.
- **WebSocket Removal (Aug 3, 2025)**: Completely removed all WebSocket functionality from the application per user request. The system now uses HTTP-only approach. Removed socket.io dependencies, WebSocket event handlers, and real-time connection components. Admin panel now relies purely on HTTP requests.
- **Discount System Logic Fix (Aug 3, 2025)**: Resolved discount percentage confusion by implementing clear separation between regular product discounts and flash sale discounts. Flash sale discounts take priority and disable regular discounts. Fixed timestamp conversion errors in database operations.
- **Rating Calculation Optimization (Aug 3, 2025)**: Removed automatic rating recalculation on server startup. Ratings are now calculated only when reviews are created, updated, approved, or deleted. Added manual recalculation endpoint (`POST /api/admin/recalculate-ratings`) for admin data maintenance.
- **Database Management (Aug 1, 2025)**: Implemented complete database export/import/delete functionality in admin panel Settings section
- **Clean Installation**: Removed all sample/dummy data creation - server now only creates admin user (admin@admin.com/admin123) and empty database tables

## User Preferences

Preferred communication style: Simple, everyday language.
Can communicate in Urdu when needed.

## System Architecture

ShopFlow is built with a decoupled frontend and backend architecture.

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query for server state
- **UI Components**: Radix UI primitives with shadcn/ui and Tailwind CSS for styling.
- **Form Management**: React Hook Form with Zod validation.
- **Key Features**: Responsive design, advanced search and filtering, mobile bottom navigation, animated loading states, and dynamic content sections (e.g., sliding categories, flash sales).

### Backend
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Authentication**: Passport.js with local strategy and session-based authentication. JWT tokens for secure API communication.
- **API Design**: RESTful endpoints.
- **Security**: AES-256-GCM encryption for sensitive data, rate limiting, CORS protection, CSRF protection, comprehensive input validation, and role-based access control.

### Database
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM with TypeScript schema definitions.
- **Session Management**: Express sessions stored in PostgreSQL.

### Core Features
- **User Management**: Registration, authentication, role-based access (user/admin), profile management, password reset.
- **Product Catalog**: Hierarchical categories, product variants, inventory, image galleries, reviews, search, and filtering. Supports featured, flash sale, and new arrival product types.
- **Shopping Experience**: Shopping cart, wishlist, multi-step checkout, address management, order tracking, coupons.
- **Payment Integration**: Multiple methods (COD, EasyPaisa, JazzCash) with proof upload and admin verification.
- **Admin Dashboard**: Comprehensive analytics, CRUD for products, orders, users, banners, content, flash sales, and payment verification. Includes system settings for tax rates, shipping costs, and free shipping thresholds, with centralized encryption control.
- **Reviews System**: Optimized rating calculation (calculated on-demand when reviews change), admin moderation (approve/reject/delete), persistent storage of calculated ratings in database, and manual recalculation endpoint for data maintenance.

## External Dependencies

- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`
- **Authentication**: `passport`, `passport-local`, `bcryptjs`
- **UI Framework**: `@radix-ui`, `class-variance-authority`, `tailwindcss`
- **State Management**: `@tanstack/react-query`
- **Form Handling**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **File Upload**: `multer`
- **Charts**: `recharts`, `chart.js`