import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xkbelavlpydxsarzvpkl.supabase.co'
const supabaseAnonKey = 'sb_publishable_3fsEhgkzdIdSQ36jjV6Bdg_itekRWwb'

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

const wrapBuilder = (builder) => {
  if (!builder || typeof builder !== 'object') return builder

  return new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      if (prop === 'then') {
        return (onFulfilled, onRejected) => {
          return Promise.resolve(target).then((result) => {
            if (result && typeof result === 'object' && 'data' in result) {
              return onFulfilled ? onFulfilled(result.data, result.error) : result.data
            }
            return onFulfilled ? onFulfilled(result) : result
          }, onRejected)
        }
      }

      if (typeof value === 'function') {
        return (...args) => wrapBuilder(value.apply(target, args))
      }

      return value
    },
  })
}

export const supabase = new Proxy(supabaseClient, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver)
    if (prop === 'from') {
      return (table) => wrapBuilder(target.from(table))
    }
    if (typeof value === 'function') {
      return value.bind(target)
    }
    return value
  },
})

export const uploadFile = async (file) => {
  const fileName = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('uploads').upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return { file_url: data.publicUrl };
};