/**
 * ingest-blog.mjs
 * Scrapes all blog posts from freesofiatour.com, chunks content,
 * generates embeddings via OpenAI, and stores in Supabase.
 *
 * Usage: node scripts/ingest-blog.mjs
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

const SITEMAP_URL = 'https://freesofiatour.com/post-sitemap.xml';
const CHUNK_SIZE = 400; // tokens approx (words * 1.3)
const BATCH_SIZE = 20;  // embed N chunks at a time
const DELAY_MS = 200;   // polite crawl delay between pages

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
  console.log('Fetching sitemap...');
  const res = await fetch(SITEMAP_URL);
  const xml = await res.text();
  const $ = load(xml, { xmlMode: true });
  const urls = [];
  $('loc').each((_, el) => urls.push($(el).text().trim()));
  console.log(`Found ${urls.length} blog posts`);
  return urls;
}

async function scrapePost(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Sofia Audio Guide Bot/1.0' } });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = load(html);

    // Remove nav, footer, sidebar, comments
    $('nav, footer, header, .sidebar, .comments, .related, script, style, .wp-block-buttons').remove();

    const title = $('h1').first().text().trim() || $('title').text().trim();
    const content = ($('article').length ? $('article') : $('.entry-content, .post-content, main'))
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    if (!content || content.length < 100) return null;
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
  // Clear existing chunks
  console.log('Clearing old chunks...');
  await supabase.from('blog_chunks').delete().neq('id', 0);

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
