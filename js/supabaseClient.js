// ambil createClient dari library CDN
const { createClient } = window.supabase;

// bikin koneksi database
window.db = createClient(
  "https://ituvqtafxhwkszxeropx.supabase.co",
  "sb_publishable_AaimhjrpiANdzj1JDXOl6w_O7QeOofI"
);