const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FishRow {
  label: string;
  up: number;
  down: number;
  total: number;
}

function parseFishHtml(html: string) {
  // Parse the fish counter table from fiskdata.se
  const tableMatch = html.match(/<table[^>]*id=["']tableLiveTable["'][^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) throw new Error("Fish table not found");

  const rows: FishRow[] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;

  while ((trMatch = trRegex.exec(tableMatch[1])) !== null) {
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
      tds.push(tdMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
    }
    if (tds.length >= 4) {
      const label = tds[0].toLowerCase();
      const up = parseInt(tds[1].replace(/\D/g, ''), 10);
      const down = parseInt(tds[2].replace(/\D/g, ''), 10);
      const total = parseInt(tds[3].replace(/\D/g, ''), 10);
      if ([up, down, total].every(Number.isFinite)) {
        rows.push({ label, up, down, total });
      }
    }
  }

  const byLabel: Record<string, FishRow> = {};
  for (const r of rows) byLabel[r.label] = r;

  const today = byLabel["idag"];
  const yesterday = byLabel["igår"] || byLabel["igar"];
  const lastWeek = byLabel["senaste veckan"];
  const yearTotal = byLabel["totalt år"] || byLabel["totalt ar"];

  if (!today || !yesterday || !lastWeek || !yearTotal) {
    throw new Error("Missing fish metric rows. Found: " + Object.keys(byLabel).join(", "));
  }

  return {
    today,
    yesterday,
    yearTotal,
    deltas: {
      vsYesterday: {
        up: today.up - yesterday.up,
        down: today.down - yesterday.down,
        total: today.total - yesterday.total,
      },
      vsLastWeek: {
        up: today.up - lastWeek.up,
        down: today.down - lastWeek.down,
        total: today.total - lastWeek.total,
      },
    },
  };
}

function parseSnowHtml(html: string) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  
  const contextual = text.match(/sn[öo]djup[^0-9]{0,40}(\d{1,3})\s*cm/iu);
  const stationContext = text.match(/(?:station|m[äa]tplats|observationsplats)[^0-9]{0,80}(\d{1,3})\s*cm/iu);
  const generalCm = text.match(/(\d{1,3})\s*cm/iu);
  const snowValue = contextual?.[1] || stationContext?.[1] || generalCm?.[1];
  const depth = snowValue ? parseInt(snowValue, 10) : null;

  if (!Number.isFinite(depth) || depth! > 250) {
    throw new Error("No snow depth found");
  }

  return { depth: depth!, unit: "cm" };
}

function parseChartJson(rawJson: string) {
  try {
    const series = JSON.parse(rawJson);
    const netSeries = series.find((s: { name: string }) => s.name === "Netto");
    if (!netSeries?.data) return [];
    
    return netSeries.data.map(([ts, val]: [number, number]) => ({
      date: new Date(ts).toLocaleDateString("sv-SE", { month: "short", day: "numeric" }),
      net: val,
    }));
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Firecrawl not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const errors: string[] = [];
  let fish = null;
  let snow = null;
  let chartData: Array<{ date: string; net: number }> = [];

  // Scrape fish data
  try {
    const fishRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://fiskdata.se/raknare/live/live.php?locationId=17',
        formats: ['html'],
        waitFor: 3000,
      }),
    });
    const fishData = await fishRes.json();
    const html = fishData?.data?.html || fishData?.html;
    if (html) {
      fish = parseFishHtml(html);
    } else {
      errors.push("Fish: No HTML returned from scrape");
    }
  } catch (e) {
    errors.push(`Fish: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Scrape snow data
  try {
    const snowRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.smhi.se/vader/observationer/snodjup',
        formats: ['html'],
        waitFor: 3000,
      }),
    });
    const snowData = await snowRes.json();
    const html = snowData?.data?.html || snowData?.html;
    if (html) {
      snow = parseSnowHtml(html);
    } else {
      errors.push("Snow: No HTML returned from scrape");
    }
  } catch (e) {
    errors.push(`Snow: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Fetch chart data directly (it's a public JSON endpoint)
  try {
    const chartRes = await fetch(
      'https://fiskdata.se/raknare/live/ajax/liveChart.php?counterId=670&darkMode=true&lang=se',
      {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'accept': 'application/json',
        },
      }
    );
    if (chartRes.ok) {
      const chartText = await chartRes.text();
      chartData = parseChartJson(chartText);
    } else {
      errors.push("Chart: HTTP " + chartRes.status);
    }
  } catch (e) {
    errors.push(`Chart: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  const result = {
    fish,
    snow,
    chartData,
    lastUpdated: new Date().toISOString(),
    errors,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
