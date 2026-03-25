/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 */
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Dealboard from './pages/Dealboard';
import Listings from './pages/Listings';
import Matches from './pages/Matches';
import Messages from './pages/Messages';
import MyPosts from './pages/MyPosts';
import Requirements from './pages/Requirements';
import MyTemplates from './pages/MyTemplates';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import BrokerDashboard from './pages/BrokerDashboard';
import Teams from './pages/Teams';
import Inventory from './pages/Inventory';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AboutUs from './pages/AboutUs';
import Blog from './pages/Blog';
import Careers from './pages/Careers';
import Affiliate from './pages/Affiliate';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Landing": Landing,
    "Dashboard": Dashboard,
    "Dealboard": Dealboard,
    "Listings": Listings,
    "Matches": Matches,
    "Messages": Messages,
    "MyPosts": MyPosts,
    "Requirements": Requirements,
    "MyTemplates": MyTemplates,
    "Groups": Groups,
    "GroupDetail": GroupDetail,
    "Settings": Settings,
    "Profile": Profile,
    "Onboarding": Onboarding,
    "BrokerDashboard": BrokerDashboard,
    "Teams": Teams,
    "Inventory": Inventory,
    "Terms": Terms,
    "Privacy": Privacy,
    "AboutUs": AboutUs,
    "Blog": Blog,
    "Careers": Careers,
    "Affiliate": Affiliate,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};