import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { Client } from 'pg';

// Fallback direct connection string to match seeded DB details
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:FilterCoffee@123@db.fqryrrlzajzagixmirpw.supabase.co:5432/postgres';

export async function POST() {
  const parser = new Parser();
  const pgClient = new Client({ connectionString });
  
  let totalImported = 0;
  let hasErrors = false;
  let errorMessage = '';

  try {
    await pgClient.connect();
    
    // 1. Fetch configured RSS sources
    const { rows: sources } = await pgClient.query(
      'SELECT id, name, url, category FROM public.rss_sources'
    );

    if (sources.length === 0) {
      return NextResponse.json({ message: 'No RSS sources configured.', imported: 0 });
    }

    // 2. Loop through each source and parse it
    for (const src of sources) {
      try {
        const feed = await parser.parseURL(src.url);
        
        for (const item of feed.items) {
          const headline = item.title || 'Untitled Article';
          const link = item.link || '';
          
          if (!link) continue; // Skip articles with no link

          const summary = item.contentSnippet || item.summary || item.content || 'No summary available.';
          const content = item.content || item.contentSnippet || summary;
          const category = src.category || 'Technology';
          
          // Fallback image url parser from feed enclosure or content search
          let image_url = null;
          if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
            image_url = item.enclosure.url;
          } else {
            // Simple regex match for img src in content to grab thumbnail
            const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
              image_url = imgMatch[1];
            }
          }

          const created_at = item.pubDate ? new Date(item.pubDate) : new Date();

          // Write to database using direct INSERT ON CONFLICT DO NOTHING
          const queryText = `
            INSERT INTO public.articles (category, headline, summary, content, image_url, link, created_at, likes_count)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
            ON CONFLICT (link) DO NOTHING
            RETURNING id;
          `;
          
          const res = await pgClient.query(queryText, [
            category,
            headline,
            summary.substring(0, 1000), // Protect database constraint sizing
            content,
            image_url,
            link,
            created_at
          ]);

          if (res.rowCount && res.rowCount > 0) {
            totalImported++;
          }
        }
      } catch (feedErr: any) {
        console.error(`Failed to ingest feed from ${src.name} (${src.url}):`, feedErr);
        hasErrors = true;
        errorMessage += `${src.name} error: ${feedErr.message}; `;
      }
    }

    // 3. Log ingestion attempt
    const status = hasErrors && totalImported === 0 ? 'FAILURE' : 'SUCCESS';
    await pgClient.query(
      'INSERT INTO public.rss_ingestion_logs (status, items_imported, error_message) VALUES ($1, $2, $3)',
      [status, totalImported, hasErrors ? errorMessage : null]
    );

    return NextResponse.json({
      success: true,
      status,
      imported: totalImported,
      errors: hasErrors ? errorMessage : null
    });

  } catch (err: any) {
    console.error('Ingestion transaction error:', err);
    
    // Log failure log
    try {
      await pgClient.query(
        'INSERT INTO public.rss_ingestion_logs (status, items_imported, error_message) VALUES ($1, $2, $3)',
        ['FAILURE', 0, err.message]
      );
    } catch (logErr) {
      console.error('Failed to write failure log:', logErr);
    }

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await pgClient.end();
  }
}

export async function GET() {
  // Support GET triggers for cron schedulers
  return POST();
}
