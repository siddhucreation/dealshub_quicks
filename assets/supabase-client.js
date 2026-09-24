/* ===========================================================
   Quicks — Supabase config + shared helpers
   Loaded on every page after the Supabase UMD script.
   =========================================================== */

// --------------------------------------------------------------------
// 1. CONFIG — fill these in from Supabase → Project Settings → API
// --------------------------------------------------------------------
const SUPABASE_URL = "https://zkmlxlfgeensgrhudfqi.supabase.co"; // from project memory
const SUPABASE_ANON_KEY = "sb_publishable_Bb5jLTh71Y3Dwln4WlrQSA_Zpf72QML";

// Table / column names — edit these three lines if your schema differs
// (see README.md for the exact SQL this site expects).
const TABLES = {
  merchants: "merchants",
  products: "products",
  orders: "orders",
  cart: "cart",
};

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --------------------------------------------------------------------
// 2. Toast helper
// --------------------------------------------------------------------
function toast(msg, ms = 2600) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), ms);
}

// --------------------------------------------------------------------
// 3. Auth helpers
// --------------------------------------------------------------------
async function signUpEmail({ fullName, email, phone, password, role = "customer" }) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone, role } },
  });
  if (error) throw error;
  return data;
}

async function signInEmail({ email, password }) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signInGoogle(redirectPath) {
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + redirectPath },
  });
  if (error) throw error;
  // browser is redirected to Google — nothing else to do here
}

// Phone auth is two steps: request an OTP, then verify it.
// Requires an SMS provider (Twilio / MessageBird / Vonage) to be
// configured under Supabase → Authentication → Providers → Phone.
async function sendPhoneOtp(phone) {
  const { error } = await sb.auth.signInWithOtp({ phone });
  if (error) throw error;
}

async function verifyPhoneOtp(phone, token) {
  const { data, error } = await sb.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw error;
  return data;
}

async function signOut() {
  await sb.auth.signOut();
}

async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function requireAuth(loginPath) {
  const session = await getSession();
  if (!session) window.location.href = loginPath;
  return session;
}

// --------------------------------------------------------------------
// 4. Data helpers (customer)
// --------------------------------------------------------------------
async function fetchProducts({ category = null, limit = 20 } = {}) {
  let q = sb.from(TABLES.products).select("*").eq("is_available", true).limit(limit);
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function fetchNearbyMerchants(limit = 10) {
  const { data, error } = await sb.from(TABLES.merchants).select("*").limit(limit);
  if (error) throw error;
  return data || [];
}

async function addToCart(userId, productId, qty = 1) {
  const { error } = await sb.from(TABLES.cart).insert({
    user_id: userId,
    product_id: productId,
    quantity: qty,
  });
  if (error) throw error;
}

// --------------------------------------------------------------------
// 5. Data helpers (merchant)
// --------------------------------------------------------------------
async function createMerchantProfile(userId, profile) {
  const { error } = await sb.from(TABLES.merchants).insert({
    id: userId,
    business_name: profile.businessName,
    business_type: profile.businessType,
    phone: profile.phone,
    email: profile.email,
    address: profile.address,
  });
  if (error) throw error;
}

async function fetchMyProducts(merchantId) {
  const { data, error } = await sb.from(TABLES.products).select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createProduct(merchantId, p) {
  const { error } = await sb.from(TABLES.products).insert({
    merchant_id: merchantId,
    product_name: p.name,
    category: p.category,
    price: p.price,
    mrp: p.mrp,
    stock: p.stock,
    is_available: true,
  });
  if (error) throw error;
}

async function toggleProductAvailability(productId, isAvailable) {
  const { error } = await sb.from(TABLES.products).update({ is_available: isAvailable }).eq("id", productId);
  if (error) throw error;
}

async function fetchMerchantOrders(merchantId) {
  const { data, error } = await sb.from(TABLES.orders).select("*").eq("merchant_id", merchantId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
