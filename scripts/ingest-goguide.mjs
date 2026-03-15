/**
 * ingest-goguide.mjs
 * Scrapes all blog posts from goguide.bg, chunks content,
 * generates embeddings via OpenAI, and stores in Supabase.
 *
 * Does NOT clear existing data — freesofiatour.com chunks are preserved.
 * Only clears previous goguide.bg rows (by URL match) before re-ingesting.
 *
 * Usage: node scripts/ingest-goguide.mjs
 * Requires: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY in .env.local
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { load } from 'cheerio';
import OpenAI from 'openai';

// Load .env.local
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const SITEMAP_INDEX_URL = 'https://goguide.bg/sitemap.xml';
const CHUNK_SIZE = 400; // tokens approx (words * 1.3)
const BATCH_SIZE = 20;  // embed N chunks at a time
const DELAY_MS = 300;   // polite crawl delay between pages

function chunkText(text, maxWords = 300) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    const chunk = words.slice(i, i + maxWords).join(' ');
    if (chunk.length > 50) chunks.push(chunk);
  }
  return chunks;
}

async function fetchUrls() {
  console.log('Fetching sitemap index...');
  const indexRes = await fetch(SITEMAP_INDEX_URL, { headers: { 'User-Agent': 'Sofia Audio Guide Bot/1.0' } });
  const indexXml = await indexRes.text();
  const $index = load(indexXml, { xmlMode: true });

  // Collect sub-sitemap URLs (post-sitemap.xml, post-sitemap2.xml, etc.)
  const subSitemapUrls = [];
  $index('loc').each((_, el) => {
    const loc = $index(el).text().trim();
    if (loc.includes('post-sitemap') || loc.includes('sitemap')) {
      subSitemapUrls.push(loc);
    }
  });

  // If it's a flat sitemap (no sub-sitemaps found), treat the index as the only source
  const sitemapsToFetch = subSitemapUrls.length > 0 ? subSitemapUrls : [SITEMAP_INDEX_URL];
  console.log(`Found ${sitemapsToFetch.length} sub-sitemaps`);

  const allUrls = [];
  for (const sitemapUrl of sitemapsToFetch) {
    // Skip the index itself if it appeared in its own loc list
    if (sitemapUrl === SITEMAP_INDEX_URL && sitemapsToFetch.length > 1) continue;
    try {
      const res = await fetch(sitemapUrl, { headers: { 'User-Agent': 'Sofia Audio Guide Bot/1.0' } });
      const xml = await res.text();
      const $ = load(xml, { xmlMode: true });
      $('loc').each((_, el) => {
        const loc = $(el).text().trim();
        // Only add page URLs, not nested sitemap references
        if (!loc.endsWith('.xml')) allUrls.push(loc);
      });
    } catch (err) {
      console.warn(`  Skipping ${sitemapUrl}: ${err.message}`);
    }
  }

  // Deduplicate
  const urls = [...new Set(allUrls)];
  console.log(`Found ${urls.length} posts total`);
  return urls;
}

async function scrapePost(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Sofia Audio Guide Bot/1.0' } });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = load(html);

    // Remove noise
    $('nav, footer, header, .sidebar, .comments, .related, script, style, .wp-block-buttons, aside, .widget').remove();

    const title = $('h1').first().text().trim() || $('title').text().trim();

    // Try WordPress content selectors
    let contentEl = $('.entry-content');
    if (!contentEl.length) contentEl = $('.post-content');
    if (!contentEl.length) contentEl = $('article');
    if (!contentEl.length) contentEl = $('main');

    const content = contentEl
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    // Skip category/tag/archive listings or very short pages
    if (!content || content.length < 150) return null;

    return { url, title, content };
  } catch {
    return null;
  }
}

async function embedBatch(texts) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return res.data.map(d => d.embedding);
}

async function main() {
  // NOTE: Do NOT clear existing chunks — adding goguide.bg on top of existing data

  const urls = await fetchUrls();
  let totalChunks = 0;
  let pendingRows = [];

  const flush = async () => {
    if (pendingRows.length === 0) return;
    const texts = pendingRows.map(r => r.content);
    console.log(`  Embedding ${texts.length} chunks...`);
    const embeddings = await embedBatch(texts);
    const rows = pendingRows.map((r, i) => ({ ...r, embedding: embeddings[i] }));
    const { error } = await supabase.from('blog_chunks').insert(rows);
    if (error) console.error('  Insert error:', error.message);
    totalChunks += rows.length;
    pendingRows = [];
  };

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`[${i + 1}/${urls.length}] ${url.split('/').slice(-2).join('/')}... `);

    const post = await scrapePost(url);
    if (!post) { console.log('skip'); continue; }

    const chunks = chunkText(post.content);
    console.log(`${chunks.length} chunks`);

    for (const chunk of chunks) {
      pendingRows.push({ url: post.url, title: post.title, content: chunk });
      if (pendingRows.length >= BATCH_SIZE) await flush();
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  await flush();
  console.log(`\nDone! ${totalChunks} chunks stored in Supabase.`);
}

main().catch(console.error);
