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

function parseChartJson(rawJson: string): { chartData: Array<{ date: string; net: number }>; waterTemp: number | null } {
  try {
    const series = JSON.parse(rawJson);
    const netSeries = series.find((s: { name: string }) => s.name === "Netto");
    const chartData = netSeries?.data
      ? netSeries.data.map(([ts, val]: [number, number]) => ({
          date: new Date(ts).toLocaleDateString("sv-SE", { month: "short", day: "numeric" }),
          net: val,
        }))
      : [];

    // Extract latest water temperature
    const tempSeries = series.find((s: { name: string }) => s.name === "Vattentemperatur");
    let waterTemp: number | null = null;
    if (tempSeries?.data?.length) {
      const lastPoint = tempSeries.data[tempSeries.data.length - 1];
      if (Array.isArray(lastPoint) && Number.isFinite(lastPoint[1])) {
        waterTemp = lastPoint[1];
      }
    }

    return { chartData, waterTemp };
  } catch {
    return { chartData: [], waterTemp: null };
  }
}

function parseRiverMarkdown(markdown: string) {
  let streamflow: number | null = null;
  let riverStage: number | null = null;
  let waterTemp: number | null = null;

  // Streamflow: 58m³/s
  const flowMatch = markdown.match(/Streamflow[:\s]*(\d+(?:[.,]\d+)?)\s*m[³3]\/s/i);
  if (flowMatch) streamflow = parseFloat(flowMatch[1].replace(',', '.'));

  // River stage: 105.447cm
  const stageMatch = markdown.match(/River stage[:\s]*(\d+(?:[.,]\d+)?)\s*cm/i);
  if (stageMatch) riverStage = parseFloat(stageMatch[1].replace(',', '.'));

  // Water temp (may or may not exist)
  const tempMatch = markdown.match(/(?:Water\s*temp|Temperature)[:\s]*(\d+(?:[.,]\d+)?)\s*°?C/i);
  if (tempMatch) waterTemp = parseFloat(tempMatch[1].replace(',', '.'));

  if (streamflow === null && riverStage === null) {
    throw new Error("No river data found");
  }

  return {
    streamflow,
    streamflowUnit: "m³/s",
    riverStage,
    riverStageUnit: "cm",
    waterTemp,
    waterTempUnit: "°C",
  };
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
  let river = null;
  let videos: Array<{ dateTime: string; species: string; direction: string; length: number; thumb: string; video: string }> = [];
  let chartData: Array<{ date: string; net: number }> = [];
  let waterTempFromChart: number | null = null;

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
      const parsed = parseChartJson(chartText);
      chartData = parsed.chartData;
      waterTempFromChart = parsed.waterTemp;
    } else {
      errors.push("Chart: HTTP " + chartRes.status);
    }
  } catch (e) {
    errors.push(`Chart: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Scrape river conditions from riverapp.net
  try {
    const riverRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.riverapp.net/en/station/5e2ca485473f4b7bee591672',
        formats: ['markdown'],
        waitFor: 3000,
      }),
    });
    const riverData = await riverRes.json();
    const md = riverData?.data?.markdown || riverData?.markdown;
    if (md) {
      river = parseRiverMarkdown(md);
    } else {
      errors.push("River: No markdown returned from scrape");
    }
  } catch (e) {
    errors.push(`River: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Fetch latest videos (public JSON endpoint, no Firecrawl needed)
  try {
    const vidRes = await fetch(
      'https://fiskdata.se/raknare/live/ajax/loadVideos.php?counterId=670&counterYear=2025&urval=0',
      {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'accept': 'application/json',
        },
      }
    );
    if (vidRes.ok) {
      const vidJson = await vidRes.json();
      videos = (vidJson || []).slice(0, 6).map((v: Record<string, unknown>) => ({
        dateTime: v.DateTime as string,
        species: v.NameSv as string,
        direction: (v.Dir as number) === 1 ? 'up' : 'down',
        length: v.Length_calc as number,
        thumb: `https://fiskdata.se${v.thumb}`,
        video: `https://fiskdata.se${v.video}`,
      }));
    } else {
      errors.push("Videos: HTTP " + vidRes.status);
    }
  } catch (e) {
    errors.push(`Videos: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Merge water temp from chart into river data
  if (river && waterTempFromChart !== null) {
    river.waterTemp = waterTempFromChart;
  }

  const result = {
    fish,
    river,
    videos,
    chartData,
    lastUpdated: new Date().toISOString(),
    errors,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
