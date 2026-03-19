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
import __Layout from './Layout.jsx';

export const PAGES = {
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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};