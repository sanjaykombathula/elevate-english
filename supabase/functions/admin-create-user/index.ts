import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NewUser {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: string;
  branch?: string;
  level?: string;
  goal?: string;
  daily_target?: number;
}

interface UpdateUser {
  id: string;
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: string;
  branch?: string;
  level?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await callerClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (roleErr || !roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const action: string = body?.action ?? "create";

    // ===== DELETE =====
    if (action === "delete") {
      const id: string = body?.id;
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== UPDATE =====
    if (action === "update") {
      const u: UpdateUser = body?.user;
      if (!u?.id) return new Response(JSON.stringify({ error: "user.id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const authPatch: Record<string, unknown> = {};
      if (u.email) authPatch.email = u.email;
      if (u.password) {
        if (String(u.password).length < 8) {
          return new Response(JSON.stringify({ error: "password must be at least 8 characters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        authPatch.password = u.password;
      }
      if (Object.keys(authPatch).length) {
        const { error } = await admin.auth.admin.updateUserById(u.id, authPatch);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const profilePatch: Record<string, unknown> = {};
      for (const k of ["name", "phone", "college", "department", "year", "branch", "level"] as const) {
        if (u[k] !== undefined) profilePatch[k] = u[k];
      }
      if (u.email) profilePatch.email = u.email;
      if (Object.keys(profilePatch).length) {
        const { error } = await admin.from("profiles").update(profilePatch).eq("id", u.id);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== CREATE (default, supports bulk) =====
    const users: NewUser[] = Array.isArray(body?.users) ? body.users : [body];
    const results: { email: string; status: "created" | "error"; error?: string; id?: string }[] = [];

    for (const u of users) {
      if (!u?.email || !u?.password) {
        results.push({ email: u?.email ?? "", status: "error", error: "email and password required" });
        continue;
      }
      if (String(u.password).length < 8) {
        results.push({ email: u.email, status: "error", error: "password must be at least 8 characters" });
        continue;
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name ?? "" },
      });

      if (createErr || !created.user) {
        results.push({ email: u.email, status: "error", error: createErr?.message ?? "create failed" });
        continue;
      }

      const profileUpdate: Record<string, unknown> = {};
      for (const k of ["name", "phone", "college", "department", "year", "branch", "level", "goal", "daily_target"] as const) {
        if ((u as any)[k]) profileUpdate[k] = (u as any)[k];
      }
      if (Object.keys(profileUpdate).length) {
        await admin.from("profiles").update(profileUpdate).eq("id", created.user.id);
      }

      results.push({ email: u.email, status: "created", id: created.user.id });
    }

    return new Response(JSON.stringify({
      total: results.length,
      created: results.filter((r) => r.status === "created").length,
      failed: results.filter((r) => r.status === "error").length,
      results,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
