import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query || query.trim().length === 0) {
      return Response.json({ results: [] });
    }

    // Fetch all searchable data in parallel
    const [
      listings,
      requirements,
      users,
      groups,
      groupPosts,
      groupEvents,
      teamResources,
      teamAnnouncements
    ] = await Promise.all([
      base44.entities.Listing.list('-created_date', 200),
      base44.entities.Requirement.list('-created_date', 200),
      base44.entities.User.list('-created_date', 200),
      base44.entities.Group.filter({ status: 'active' }, '-created_date', 100),
      base44.entities.GroupPost.list('-created_date', 200),
      base44.entities.GroupEvent.list('-created_date', 100),
      base44.entities.TeamResource.list('-created_date', 100),
      base44.entities.TeamAnnouncement.list('-created_date', 100)
    ]);

    // Use AI to analyze the query and search across all data
    const searchPrompt = `You are a search engine for a real estate platform. Analyze this search query and return the most relevant results.

Query: "${query}"

Available Data:
LISTINGS: ${JSON.stringify(listings.map(l => ({ id: l.id, title: l.title, address: l.address, city: l.city, price: l.price, property_type: l.property_type, size_sqft: l.size_sqft, transaction_type: l.transaction_type, description: l.description, created_by: l.created_by })))}

REQUIREMENTS: ${JSON.stringify(requirements.map(r => ({ id: r.id, title: r.title, cities: r.cities, property_type: r.property_type, max_price: r.max_price, min_price: r.min_price, transaction_type: r.transaction_type, notes: r.notes, created_by: r.created_by })))}

USERS: ${JSON.stringify(users.map(u => ({ id: u.id, full_name: u.full_name, email: u.email, username: u.username, company_name: u.company_name, bio: u.bio })))}

FISH_TANKS: ${JSON.stringify(groups.map(g => ({ id: g.id, name: g.name, description: g.description, location: g.location, focus_category: g.focus_category })))}

GROUP_POSTS: ${JSON.stringify(groupPosts.map(p => ({ id: p.id, group_id: p.group_id, content: p.content, author_name: p.author_name, created_date: p.created_date })))}

EVENTS: ${JSON.stringify(groupEvents.map(e => ({ id: e.id, group_id: e.group_id, title: e.title, description: e.description, start_datetime: e.start_datetime, location_type: e.location_type, address: e.address })))}

RESOURCES: ${JSON.stringify(teamResources.map(r => ({ id: r.id, title: r.title, description: r.description, resource_type: r.resource_type, category: r.category, file_name: r.file_name })))}

ANNOUNCEMENTS: ${JSON.stringify(teamAnnouncements.map(a => ({ id: a.id, title: a.title, content: a.content, author_name: a.author_name })))}

Return a JSON array of the most relevant results. Each result must have:
{
  "type": "listing" | "requirement" | "user" | "fish_tank" | "post" | "event" | "resource" | "announcement",
  "id": "the entity id",
  "title": "display title",
  "subtitle": "brief description or context",
  "relevance": number between 0-100,
  "match_reason": "why this result matches the query"
}

Return up to 10 most relevant results sorted by relevance (highest first). If no good matches, return empty array.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: searchPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                id: { type: "string" },
                title: { type: "string" },
                subtitle: { type: "string" },
                relevance: { type: "number" },
                match_reason: { type: "string" }
              },
              required: ["type", "id", "title", "subtitle", "relevance"]
            }
          }
        },
        required: ["results"]
      }
    });

    return Response.json({ 
      results: aiResponse.results || [],
      query 
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});