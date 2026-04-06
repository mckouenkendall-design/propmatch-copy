import { supabase } from './supabaseClient';

const parseOrder = (orderArg) => {
  if (!orderArg) return null;
  const descending = orderArg.startsWith('-');
  const column = descending ? orderArg.slice(1) : orderArg;
  return { column, ascending: !descending };
};

const applyOrder = (query, orderArg) => {
  const order = parseOrder(orderArg);
  if (!order) return query;
  return query.order(order.column, { ascending: order.ascending });
};

const supabaseEntities = new Proxy({}, {
  get(_, entityName) {
    const table = entityName;

    const buildQuery = (filters = {}) => {
      let query = supabase.from(table).select('*');
      if (filters && Object.keys(filters).length) {
        query = query.match(filters);
      }
      return query;
    };

    return {
      list: async (orderBy, limit) => {
        let query = supabase.from(table).select('*');
        if (typeof orderBy === 'string') {
          query = applyOrder(query, orderBy);
        }
        if (typeof limit === 'number') {
          query = query.limit(limit);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      filter: async (filters = {}, orderBy, limit) => {
        let query = buildQuery(filters);
        if (typeof orderBy === 'string') {
          query = applyOrder(query, orderBy);
        }
        if (typeof limit === 'number') {
          query = query.limit(limit);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      create: async (payload) => {
        const { data, error } = await supabase.from(table).insert(payload).select();
        if (error) throw error;
        return Array.isArray(data) ? data[0] : data;
      },
      update: async (id, payload) => {
        const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
        if (error) throw error;
        return Array.isArray(data) ? data[0] : data;
      },
      delete: async (id) => {
        const { data, error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        return data;
      },
      subscribe: (callback) => {
        const channel = supabase.channel(`realtime-${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, payload => callback(payload))
          .subscribe();
        return async () => {
          await supabase.removeChannel(channel);
        };
      }
    };
  }
});

const auth = {
  me: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
  logout: async (redirectUrl) => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined' && redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
  redirectToLogin: async (redirectUrl) => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
      }
    });
  },
  updateMe: async (metadata) => {
    const { data, error } = await supabase.auth.updateUser({ data: metadata });
    if (error) throw error;
    return data.user;
  }
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      if (!file) {
        throw new Error('No file provided for upload');
      }
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = fileName;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) {
        throw uploadError;
      }
      const { data: urlData, error: urlError } = supabase.storage.from('uploads').getPublicUrl(filePath);
      if (urlError) {
        throw urlError;
      }
      return { file_url: urlData.publicUrl };
    }
  }
};

const functions = {
  invoke: async (name, payload) => {
    if (!supabase.functions) {
      throw new Error('Supabase functions are not available');
    }
    const { data, error } = await supabase.functions.invoke(name, {
      body: payload,
    });
    if (error) throw error;
    return data;
  }
};

const appLogs = {
  logUserInApp: async () => {
    // No-op analytics for Supabase migration
  }
};

export const base44 = {
  auth,
  entities: supabaseEntities,
  integrations,
  functions,
  appLogs,
};
