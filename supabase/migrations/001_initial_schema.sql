-- Create tables for PropMatch app migration from Base44 to Supabase
-- This migration creates all necessary tables with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    brokerage_name TEXT,
    brokerage_id TEXT,
    license_number TEXT,
    profile_photo_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    linkedin_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    title TEXT,
    property_category TEXT CHECK (property_category IN ('commercial', 'residential')),
    property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'industrial', 'retail', 'office', 'land')),
    transaction_type TEXT CHECK (transaction_type IN ('sale', 'lease', 'rent')),
    city TEXT NOT NULL,
    state TEXT,
    zip_code TEXT,
    price NUMERIC,
    price_period TEXT DEFAULT 'purchase' CHECK (price_period IN ('purchase', 'per_month', 'per_sf_per_year')),
    size_sqft NUMERIC,
    bedrooms INTEGER,
    bathrooms NUMERIC,
    year_built INTEGER,
    property_details JSONB,
    description TEXT,
    amenities TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed')),
    contact_agent_name TEXT,
    contact_agent_email TEXT,
    contact_agent_phone TEXT,
    company_name TEXT,
    brokerage_id TEXT,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'team', 'brokerage', 'private')),
    visibility_groups TEXT,
    visibility_recipient_email TEXT,
    allow_direct_contact BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requirements table
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    title TEXT,
    property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'industrial', 'retail', 'office', 'land')),
    transaction_type TEXT CHECK (transaction_type IN ('sale', 'lease', 'rent')),
    cities TEXT[],
    max_price NUMERIC,
    min_price NUMERIC,
    price_period TEXT DEFAULT 'purchase' CHECK (price_period IN ('purchase', 'per_month', 'per_sf_per_year')),
    min_size_sqft NUMERIC,
    max_size_sqft NUMERIC,
    min_bedrooms INTEGER,
    min_bathrooms NUMERIC,
    required_amenities TEXT[],
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'closed')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'team', 'brokerage', 'private')),
    visibility_groups TEXT,
    brokerage_id TEXT,
    visibility_recipient_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 TEXT NOT NULL,
    participant_2 TEXT NOT NULL,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_by_1 INTEGER DEFAULT 0,
    unread_by_2 INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_1, participant_2)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    post_id TEXT,
    post_type TEXT CHECK (post_type IN ('listing', 'requirement')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    group_type TEXT DEFAULT 'public' CHECK (group_type IN ('public', 'private')),
    focus_category TEXT DEFAULT 'general' CHECK (focus_category IN ('commercial', 'residential', 'mixed', 'general')),
    location TEXT,
    rules TEXT,
    member_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_email)
);

-- Group Posts table
CREATE TABLE group_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    author_email TEXT NOT NULL,
    author_name TEXT,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'poll', 'event_share')),
    media_urls TEXT[],
    file_urls TEXT[],
    file_names TEXT[],
    poll_question TEXT,
    poll_options JSONB,
    poll_votes JSONB,
    tagged_event_id TEXT,
    reaction_counts JSONB,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Conversations table
CREATE TABLE group_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    participant_emails JSONB NOT NULL,
    created_by TEXT NOT NULL,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    last_message_sender TEXT,
    unread_counts JSONB,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Messages table
CREATE TABLE group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_conversation_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    sender_name TEXT,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type TEXT,
    post_id TEXT,
    post_type TEXT CHECK (post_type IN ('listing', 'requirement')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Events table
CREATE TABLE group_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'networking' CHECK (event_type IN ('networking', 'workshop', 'open_house', 'webinar', 'social', 'site_tour', 'other')),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    timezone TEXT,
    location_type TEXT DEFAULT 'physical' CHECK (location_type IN ('physical', 'online', 'tba')),
    address TEXT,
    online_link TEXT,
    cover_image_url TEXT,
    max_attendees INTEGER,
    rsvp_required BOOLEAN DEFAULT false,
    rsvp_deadline TIMESTAMPTZ,
    allow_guests BOOLEAN DEFAULT false,
    contact_email TEXT,
    cohosts JSONB,
    rsvp_list JSONB,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'past', 'cancelled')),
    host_email TEXT NOT NULL,
    host_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    type TEXT CHECK (type IN ('match', 'group_post', 'message', 'subscription', 'announcement', 'event')),
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    read BOOLEAN DEFAULT false,
    related_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    name TEXT NOT NULL,
    template_type TEXT CHECK (template_type IN ('listing', 'requirement')),
    property_category TEXT CHECK (property_category IN ('commercial', 'residential')),
    property_type TEXT,
    folder TEXT,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brokerage Roster table
CREATE TABLE brokerage_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_email TEXT NOT NULL,
    broker_name TEXT,
    brokerage_name TEXT,
    employing_broker_number TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    agent_email TEXT NOT NULL,
    agent_name TEXT,
    agent_license TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employing_broker_number, agent_email)
);

-- Team Announcements table
CREATE TABLE team_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brokerage_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT,
    author_email TEXT,
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Calls table
CREATE TABLE team_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brokerage_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meeting_link TEXT NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    organizer_name TEXT,
    organizer_email TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Resources table
CREATE TABLE team_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brokerage_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT DEFAULT 'document' CHECK (resource_type IN ('document', 'template', 'guide', 'form', 'presentation', 'other')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('marketing', 'legal', 'training', 'operations', 'sales', 'general')),
    uploaded_by_name TEXT,
    uploaded_by_email TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Matches table (for user-saved matches between listings and requirements)
CREATE TABLE saved_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    match_score NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_email, listing_id, requirement_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokerage_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- Listings: Users can view public listings, and their own listings regardless of visibility
CREATE POLICY "Users can view public listings and own listings" ON listings FOR SELECT USING (
    visibility = 'public' OR auth.jwt() ->> 'email' = user_email
);
CREATE POLICY "Users can insert own listings" ON listings FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can delete own listings" ON listings FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Requirements: Similar to listings
CREATE POLICY "Users can view public requirements and own requirements" ON requirements FOR SELECT USING (
    visibility = 'public' OR auth.jwt() ->> 'email' = user_email
);
CREATE POLICY "Users can insert own requirements" ON requirements FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can update own requirements" ON requirements FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can delete own requirements" ON requirements FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Conversations: Users can only see conversations they participate in
CREATE POLICY "Users can view conversations they participate in" ON conversations FOR SELECT USING (
    auth.jwt() ->> 'email' = participant_1 OR auth.jwt() ->> 'email' = participant_2
);
CREATE POLICY "Users can insert conversations they participate in" ON conversations FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = participant_1 OR auth.jwt() ->> 'email' = participant_2
);
CREATE POLICY "Users can update conversations they participate in" ON conversations FOR UPDATE USING (
    auth.jwt() ->> 'email' = participant_1 OR auth.jwt() ->> 'email' = participant_2
);

-- Messages: Users can view messages in conversations they participate in
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.participant_1 = auth.jwt() ->> 'email' OR c.participant_2 = auth.jwt() ->> 'email')
    )
);
CREATE POLICY "Users can insert messages in their conversations" ON messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.participant_1 = auth.jwt() ->> 'email' OR c.participant_2 = auth.jwt() ->> 'email')
    ) AND auth.jwt() ->> 'email' = sender_email
);

-- Groups: All authenticated users can view groups (public visibility handled in app)
CREATE POLICY "Authenticated users can view groups" ON groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert groups" ON groups FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'email' = created_by);

-- Group Members: Users can view members of groups they're in
CREATE POLICY "Users can view group members for groups they're in" ON group_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_email = auth.jwt() ->> 'email'
    )
);
CREATE POLICY "Users can insert group members for groups they admin" ON group_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_email = auth.jwt() ->> 'email'
        AND gm.role = 'admin'
    )
);

-- Group Posts: Users can view posts in groups they're members of
CREATE POLICY "Users can view posts in groups they're members of" ON group_posts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_posts.group_id
        AND gm.user_email = auth.jwt() ->> 'email'
    )
);
CREATE POLICY "Users can insert posts in groups they're members of" ON group_posts FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_posts.group_id
        AND gm.user_email = auth.jwt() ->> 'email'
    ) AND auth.jwt() ->> 'email' = author_email
);

-- Group Conversations: Users can view group conversations they're participants in
CREATE POLICY "Users can view group conversations they're in" ON group_conversations FOR SELECT USING (
    auth.jwt() ->> 'email' = ANY (SELECT jsonb_array_elements_text(participant_emails)::text)
);
CREATE POLICY "Users can insert group conversations they created" ON group_conversations FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = created_by);

-- Group Messages: Users can view messages in group conversations they're in
CREATE POLICY "Users can view messages in their group conversations" ON group_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM group_conversations gc
        WHERE gc.id = group_messages.group_conversation_id
        AND auth.jwt() ->> 'email' = ANY (SELECT jsonb_array_elements_text(gc.participant_emails)::text)
    )
);
CREATE POLICY "Users can insert messages in their group conversations" ON group_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM group_conversations gc
        WHERE gc.id = group_messages.group_conversation_id
        AND auth.jwt() ->> 'email' = ANY (SELECT jsonb_array_elements_text(gc.participant_emails)::text)
    ) AND auth.jwt() ->> 'email' = sender_email
);

-- Group Events: Users can view events in groups they're members of
CREATE POLICY "Users can view events in groups they're members of" ON group_events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_events.group_id
        AND gm.user_email = auth.jwt() ->> 'email'
    )
);
CREATE POLICY "Users can insert events in groups they admin" ON group_events FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_events.group_id
        AND gm.user_email = auth.jwt() ->> 'email'
        AND gm.role = 'admin'
    ) AND auth.jwt() ->> 'email' = host_email
);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
-- Allow system to insert notifications (service role)
CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT TO service_role WITH CHECK (true);

-- Templates: Users can only see their own templates
CREATE POLICY "Users can view own templates" ON templates FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can insert own templates" ON templates FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can delete own templates" ON templates FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Brokerage Roster: Complex permissions - brokers can see their roster, agents can see their entries
CREATE POLICY "Brokers can view their brokerage roster" ON brokerage_roster FOR SELECT USING (
    auth.jwt() ->> 'email' = broker_email
);
CREATE POLICY "Agents can view their roster entries" ON brokerage_roster FOR SELECT USING (
    auth.jwt() ->> 'email' = agent_email
);
CREATE POLICY "Brokers can insert roster entries for their brokerage" ON brokerage_roster FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = broker_email
);
CREATE POLICY "Brokers can update their roster entries" ON brokerage_roster FOR UPDATE USING (
    auth.jwt() ->> 'email' = broker_email
);

-- Team Announcements: Users can view announcements for brokerages they're in
CREATE POLICY "Users can view team announcements for their brokerages" ON team_announcements FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM brokerage_roster br
        WHERE br.brokerage_id = team_announcements.brokerage_id
        AND (br.broker_email = auth.jwt() ->> 'email' OR br.agent_email = auth.jwt() ->> 'email')
    )
);
CREATE POLICY "Brokers can insert announcements for their brokerages" ON team_announcements FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM brokerage_roster br
        WHERE br.brokerage_id = team_announcements.brokerage_id
        AND br.broker_email = auth.jwt() ->> 'email'
    )
);

-- Team Calls: Similar to announcements
CREATE POLICY "Users can view team calls for their brokerages" ON team_calls FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM brokerage_roster br
        WHERE br.brokerage_id = team_calls.brokerage_id
        AND (br.broker_email = auth.jwt() ->> 'email' OR br.agent_email = auth.jwt() ->> 'email')
    )
);
CREATE POLICY "Brokers can insert calls for their brokerages" ON team_calls FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM brokerage_roster br
        WHERE br.brokerage_id = team_calls.brokerage_id
        AND br.broker_email = auth.jwt() ->> 'email'
    )
);

-- Team Resources: Similar to announcements
CREATE POLICY "Users can view team resources for their brokerages" ON team_resources FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM brokerage_roster br
        WHERE br.brokerage_id = team_resources.brokerage_id
        AND (br.broker_email = auth.jwt() ->> 'email' OR br.agent_email = auth.jwt() ->> 'email')
    )
);
CREATE POLICY "Users can insert resources for their brokerages" ON team_resources FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM brokerage_roster br
        WHERE br.brokerage_id = team_resources.brokerage_id
        AND (br.broker_email = auth.jwt() ->> 'email' OR br.agent_email = auth.jwt() ->> 'email')
    )
);

-- Saved Matches: Users can only see their own saved matches
CREATE POLICY "Users can view own saved matches" ON saved_matches FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can insert own saved matches" ON saved_matches FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "Users can delete own saved matches" ON saved_matches FOR DELETE USING (auth.jwt() ->> 'email' = user_email);

-- Create indexes for better performance
CREATE INDEX idx_listings_user_email ON listings(user_email);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_property_type ON listings(property_type);
CREATE INDEX idx_listings_transaction_type ON listings(transaction_type);
CREATE INDEX idx_listings_visibility ON listings(visibility);
CREATE INDEX idx_listings_status ON listings(status);

CREATE INDEX idx_requirements_user_email ON requirements(user_email);
CREATE INDEX idx_requirements_property_type ON requirements(property_type);
CREATE INDEX idx_requirements_transaction_type ON requirements(transaction_type);
CREATE INDEX idx_requirements_visibility ON requirements(visibility);
CREATE INDEX idx_requirements_status ON requirements(status);

CREATE INDEX idx_conversations_participants ON conversations(participant_1, participant_2);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_status ON groups(status);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_email ON group_members(user_email);

CREATE INDEX idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX idx_group_posts_created_at ON group_posts(created_at);

CREATE INDEX idx_group_conversations_participants ON group_conversations USING GIN(participant_emails);
CREATE INDEX idx_group_messages_conversation_id ON group_messages(group_conversation_id);

CREATE INDEX idx_group_events_group_id ON group_events(group_id);
CREATE INDEX idx_group_events_start_datetime ON group_events(start_datetime);
CREATE INDEX idx_group_events_status ON group_events(status);

CREATE INDEX idx_notifications_user_email ON notifications(user_email);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_templates_user_email ON templates(user_email);
CREATE INDEX idx_templates_type ON templates(template_type);

CREATE INDEX idx_brokerage_roster_broker_email ON brokerage_roster(broker_email);
CREATE INDEX idx_brokerage_roster_agent_email ON brokerage_roster(agent_email);
CREATE INDEX idx_brokerage_roster_brokerage_id ON brokerage_roster(employing_broker_number);

CREATE INDEX idx_team_announcements_brokerage_id ON team_announcements(brokerage_id);
CREATE INDEX idx_team_calls_brokerage_id ON team_calls(brokerage_id);
CREATE INDEX idx_team_resources_brokerage_id ON team_resources(brokerage_id);

CREATE INDEX idx_saved_matches_user_email ON saved_matches(user_email);
CREATE INDEX idx_saved_matches_listing_id ON saved_matches(listing_id);
CREATE INDEX idx_saved_matches_requirement_id ON saved_matches(requirement_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to tables that need them
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON group_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_posts_updated_at BEFORE UPDATE ON group_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_conversations_updated_at BEFORE UPDATE ON group_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_events_updated_at BEFORE UPDATE ON group_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brokerage_roster_updated_at BEFORE UPDATE ON brokerage_roster FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_announcements_updated_at BEFORE UPDATE ON team_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_calls_updated_at BEFORE UPDATE ON team_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_resources_updated_at BEFORE UPDATE ON team_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
<parameter name="filePath">c:\Users\kendall\Desktop\propmatch-copy-1\supabase\migrations\001_initial_schema.sql