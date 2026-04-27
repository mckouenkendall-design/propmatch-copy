import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xkbelavlpydxsarzvpkl.supabase.co'
const supabaseAnonKey = 'sb_publishable_3fsEhgkzdIdSQ36jjV6Bdg_itekRWwb'

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Wrap a Supabase query builder so that `await` returns just the data array
// (or null/object) instead of the standard { data, error } envelope.
//
// The OLD wrapper hijacked the proxy's `then` and called Promise.resolve on the
// builder itself, which broke the builder's internal then-mechanics and caused
// queries to hang on fresh page loads. This rewrite is simpler and correct:
// every method on the builder is wrapped to either return another wrapped builder
// (for chaining like .eq, .order, .limit) or, when terminal methods are awaited,
// to return data directly.
//
// Implementation: convert the builder to a thenable that, when awaited, calls
// the builder's real .then with our own handler.

const wrapBuilder = (builder) => {
  if (!builder || typeof builder !== 'object') return builder

  return new Proxy(builder, {
    get(target, prop, receiver) {
      // When something awaits this proxy, JavaScript reads `.then`.
      // We return a function that calls the builder's REAL .then and unwraps the result.
      if (prop === 'then') {
        return (onFulfilled, onRejected) => {
          // target.then is the builder's real terminal-execution method.
          return target.then.call(target, (envelope) => {
            // Standard Supabase response: { data, error, status, statusText, count }
            const unwrapped =
              envelope && typeof envelope === 'object' && 'data' in envelope
                ? envelope.data
                : envelope
            return onFulfilled ? onFulfilled(unwrapped) : unwrapped
          }, onRejected)
        }
      }

      const value = Reflect.get(target, prop, receiver)

      // Chained methods (.eq, .select, .order, etc) return another builder we wrap.
      if (typeof value === 'function') {
        return (...args) => {
          const result = value.apply(target, args)
          return wrapBuilder(result)
        }
      }

      return value
    },
  })
}

// Top-level proxy: intercept .from() to return a wrapped builder.
// auth, storage, channel, realtime, and everything else go DIRECTLY to the real
// client untouched - this prevents proxy-induced binding issues with internal state.
export const supabase = new Proxy(supabaseClient, {
  get(target, prop, receiver) {
    if (prop === 'from') {
      return (table) => wrapBuilder(target.from(table))
    }
    // For everything else, return directly from the real client.
    // Don't go through Reflect.get with the proxy as receiver - that can bind `this`
    // wrong on internal methods.
    const value = target[prop]
    if (typeof value === 'function') return value.bind(target)
    return value
  },
})

// Direct access to the raw client for places that need it (auth, etc.)
// without any proxy interference.
export const rawSupabase = supabaseClient

export const uploadFile = async (file) => {
  const fileName = `${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName)
  return { file_url: data.publicUrl }
}
