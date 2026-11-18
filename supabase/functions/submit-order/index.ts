import { createClient } from "npm:@supabase/supabase-js@2.86.0";

const json = (body: unknown, status = 200, origin = "*") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
  });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  let host = "";
  try { host = origin ? new URL(origin).hostname : ""; } catch { return json({ error: "Invalid origin" }, 403); }
  const originAllowed = !origin || host === "localhost" || host === "127.0.0.1" || host === "omoolasupermarket.vercel.app" || host.endsWith(".vercel.app");
  if (!originAllowed) return json({ error: "Origin not allowed" }, 403, "null");
  if (req.method === "OPTIONS") return new Response("ok", { headers: {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }});
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin || "*");

  const apiKey = req.headers.get("apikey") ?? "";
  const publishableRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}";
  let publishableKeys: Record<string, string> = {};
  try { publishableKeys = JSON.parse(publishableRaw); } catch { /* no new keys configured */ }
  const acceptedKeys = [...Object.values(publishableKeys), Deno.env.get("SUPABASE_ANON_KEY") ?? ""].filter(Boolean);
  if (!apiKey || !acceptedKeys.includes(apiKey)) return json({ error: "Invalid application key" }, 401, origin || "*");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Order service is not configured" }, 500, origin || "*");
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = body.email ? String(body.email).trim() : null;
    const method = body.method === "pickup" ? "pickup" : "delivery";
    const address = method === "pickup" ? "Store pickup" : String(body.address ?? "").trim();
    const note = body.note ? String(body.note).trim().slice(0, 1000) : null;
    const channel = body.channel === "whatsapp" ? "whatsapp_handoff" : "website";
    const items = Array.isArray(body.items) ? body.items : [];
    if (name.length < 2 || phone.length < 7 || (method === "delivery" && address.length < 5)) {
      return json({ error: "Please provide a valid name, phone number and delivery address." }, 400, origin || "*");
    }
    if (!items.length || items.length > 50) return json({ error: "Your cart is empty or contains too many different products." }, 400, origin || "*");
    const quantities = new Map<string, number>();
    for (const item of items) {
      const id = String(item.product_id ?? "");
      const quantity = Number(item.quantity);
      if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return json({ error: "One or more cart items are invalid." }, 400, origin || "*");
      }
      quantities.set(id, (quantities.get(id) ?? 0) + quantity);
    }
    const ids = [...quantities.keys()];
    const { data: products, error: productError } = await db.from("products")
      .select("id,name,sku,price,stock_quantity,is_active").in("id", ids);
    if (productError) throw productError;
    if (!products || products.length !== ids.length) return json({ error: "A product in your cart is no longer available." }, 409, origin || "*");
    const lines = [];
    let subtotal = 0;
    for (const product of products) {
      const quantity = quantities.get(product.id) ?? 0;
      if (!product.is_active || Number(product.stock_quantity) < quantity) {
        return json({ error: product.name + " does not have enough stock for this order." }, 409, origin || "*");
      }
      const unitPrice = Number(product.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return json({ error: "A product has an invalid price." }, 409, origin || "*");
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      lines.push({ product_id: product.id, product_name: product.name, sku: product.sku, unit_price: unitPrice, quantity, line_total: lineTotal });
    }
    const { data: settings } = await db.from("website_settings").select("delivery_fee,free_delivery_minimum").eq("id", 1).maybeSingle();
    const minimum = settings?.free_delivery_minimum == null ? null : Number(settings.free_delivery_minimum);
    const deliveryFee = method === "pickup" || (minimum !== null && subtotal >= minimum) ? 0 : Number(settings?.delivery_fee ?? 0);
    const orderNumber = "OM-" + Date.now().toString().slice(-8) + "-" + crypto.randomUUID().slice(0, 4).toUpperCase();
    const { data: customer, error: customerError } = await db.from("customers")
      .insert({ full_name: name, phone, email, address }).select("id").single();
    if (customerError) throw customerError;
    const { data: order, error: orderError } = await db.from("orders").insert({
      order_number: orderNumber, customer_id: customer.id, customer_name: name,
      customer_phone: phone, customer_email: email, delivery_address: address,
      delivery_note: note, subtotal, delivery_fee: deliveryFee, total: subtotal + deliveryFee,
      status: "pending", order_channel: channel, payment_status: "unpaid",
    }).select("id").single();
    if (orderError) throw orderError;
    const { error: itemsError } = await db.from("order_items").insert(lines.map(line => ({ ...line, order_id: order.id })));
    if (itemsError) {
      await db.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }
    // Stock is deliberately not deducted here. It is deducted only after the store confirms the order.
    return json({ ok: true, orderNumber, subtotal, deliveryFee, total: subtotal + deliveryFee }, 200, origin || "*");
  } catch (error) {
    console.error("submit-order failed", error);
    return json({ error: "We could not save your order. Please try again or contact the store." }, 500, origin || "*");
  }
});
