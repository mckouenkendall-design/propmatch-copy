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

    // Redirect to Dashboard on page refresh
    useEffect(() => {
        const handlePerformanceNavigation = () => {
            if (performance.navigation.type === 1 && isAuthenticated) {
                navigate('/Dashboard', { replace: true });
            }
        };

        handlePerformanceNavigation();
    }, [isAuthenticated, navigate]);

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