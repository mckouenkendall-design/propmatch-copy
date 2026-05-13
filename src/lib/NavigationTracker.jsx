import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { pagesConfig } from '@/pages.config';

export default function NavigationTracker() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    // Note: A previous "redirect to Dashboard on page refresh" effect lived here.
    // It used performance.navigation (deprecated API) which in modern Chrome
    // returns type=1 on every route change, not just F5 refreshes. Combined with
    // [isAuthenticated, navigate] as deps, it fired on every auth state change,
    // causing instant snap-back to Dashboard whenever the user navigated.
    // The intended behavior (land on Dashboard after a fresh reload) is already
    // handled correctly by App.jsx's routing logic.

    // Log user activity when navigating to a page
    useEffect(() => {
        // Extract page name from pathname
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            // Remove leading slash and get the first segment
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];

            // Try case-insensitive lookup in Pages config
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );

            pageName = matchedKey || null;
        }

        if (isAuthenticated && pageName) {
            // Analytics logging removed for Supabase migration
            console.log(`User navigated to ${pageName}`);
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}