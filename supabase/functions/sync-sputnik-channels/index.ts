import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Sputnik + Yahsat M3U sources
const SPUTNIK_SOURCES = [
  // Iran (Gem TV, etc.)
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ir.m3u",
  // Tajikistan
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/tj.m3u",
  // Russia
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ru.m3u",
  // Afghanistan
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/af.m3u",
  // Turkey (some Yahsat channels)
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/tr.m3u",
  // UAE (Yahsat home region)
  "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ae.m3u",
];

// Priority channels to always include (matched by name)
const PRIORITY_CHANNELS = [
  "gem", "gem tv", "gem series", "gem classic", "gem kids", "gem junior",
  "gem bollywood", "gem action", "gem drama", "gem comedy",
  "manoto", "iran international", "bbc persian",
  "первый канал", "россия", "нтв", "тв центр",
  "шабакаи якум", "шабакаи дуюм", "safina",
];

interface ParsedChannel {
  name: string;
  logo_url: string;
  stream_url: string;
  category: string;
}

function parseM3U(content: string): ParsedChannel[] {
  const lines = content.split("\n");
  const channels: ParsedChannel[] = [];
  let current: Partial<ParsedChannel> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#EXTINF")) {
      const logoMatch = trimmed.match(/tvg-logo="([^"]*)"/);
      const groupMatch = trimmed.match(/group-title="([^"]*)"/);
      const nameMatch = trimmed.match(/,(.+)$/);
      current = {
        logo_url: logoMatch?.[1] || "",
        category: groupMatch?.[1] || "Общие",
        name: nameMatch?.[1]?.trim() || "Unknown",
      };
    } else if (trimmed && !trimmed.startsWith("#") && current.name) {
      channels.push({
        name: current.name,
        logo_url: current.logo_url || "",
        stream_url: trimmed,
        category: current.category || "Общие",
      });
      current = {};
    }
  }
  return channels;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional: accept a custom M3U URL in the request body
    let customUrl: string | null = null;
    try {
      const body = await req.json();
      customUrl = body?.m3u_url || null;
    } catch {
      // no body
    }

    const sources = customUrl ? [customUrl] : SPUTNIK_SOURCES;
    const allChannels: ParsedChannel[] = [];

    for (const url of sources) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          const parsed = parseM3U(text);
          allChannels.push(...parsed);
        }
      } catch (e) {
        console.error(`Failed to fetch ${url}:`, e);
      }
    }

    if (allChannels.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No channels parsed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert channels by name+source
    let inserted = 0;
    for (let i = 0; i < allChannels.length; i++) {
      const ch = allChannels[i];
      
      // Mark priority channels with a Yahsat/Gem category
      const nameLower = ch.name.toLowerCase();
      const isPriority = PRIORITY_CHANNELS.some(p => nameLower.includes(p));
      const category = isPriority && nameLower.includes("gem") ? "Gem TV 📡" : ch.category;
      
      const { error } = await supabase
        .from("live_channels")
        .upsert(
          {
            name: ch.name,
            logo_url: ch.logo_url,
            stream_url: ch.stream_url,
            category: category,
            source: "sputnik",
            sort_order: isPriority ? i : 1000 + i,
            is_active: true,
          },
          { onConflict: "name,source", ignoreDuplicates: false }
        );
      if (!error) inserted++;
    }

    return new Response(
      JSON.stringify({ success: true, total: allChannels.length, synced: inserted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
