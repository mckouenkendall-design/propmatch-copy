import Dashboard from './pages/Dashboard';

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