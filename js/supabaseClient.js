/**
 * DAILY FINANCIAL DIARY - SUPABASE CLIENT CONFIGURATION
 * 
 * Kredensial proyek Supabase Anda:
 */

// ============================================================================
// KREDENSIAL SUPABASE ANDA:
// ============================================================================
const SUPABASE_URL = 'https://cympcgyshlpihcnmfbib.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VSRM0qGkrYKOTykN2y_OMQ_sJqD5tpE';
// ============================================================================

// Helper untuk mengecek apakah kredensial sudah dikonfigurasi
function isSupabaseConfigured() {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
}

// Fungsi lazy getter untuk client Supabase (selalu siap kapan pun dipanggil)
function getSupabaseClient() {
  if (window.supabaseClient) {
    return window.supabaseClient;
  }

  const lib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (lib && typeof lib.createClient === 'function') {
    try {
      window.supabaseClient = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log('[Supabase] Client initialized successfully.');
      return window.supabaseClient;
    } catch (err) {
      console.error('[Supabase] Error creating client:', err);
    }
  }
  return null;
}

// Fungsi untuk memastikan pustaka Supabase CDN siap dipakai
function ensureSupabaseLoaded() {
  return new Promise((resolve) => {
    if (getSupabaseClient()) {
      return resolve(window.supabaseClient);
    }

    // Cek jika library sudah ada di window
    const lib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (lib && typeof lib.createClient === 'function') {
      return resolve(getSupabaseClient());
    }

    // Jika belum ada, suntikkan fallback CDN secara dinamis
    console.warn('[Supabase] Memuat pustaka Supabase fallback...');
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@supabase/supabase-js@2';
    script.onload = () => {
      const client = getSupabaseClient();
      console.log('[Supabase] Fallback library loaded successfully.');
      resolve(client);
    };
    script.onerror = () => {
      console.error('[Supabase] Gagal memuat pustaka Supabase dari CDN.');
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

// Inisialisasi awal saat berkas dimuat
try {
  getSupabaseClient();
} catch (e) {
  console.warn('[Supabase] Menunggu pustaka CDN siap...');
}

// Ekspor ke window global agar dapat diakses dari app.js
window.isSupabaseConfigured = isSupabaseConfigured;
window.getSupabaseClient = getSupabaseClient;
window.ensureSupabaseLoaded = ensureSupabaseLoaded;
window.SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY
};
