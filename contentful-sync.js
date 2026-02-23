#!/usr/bin/env node
/**
 * Contentful Sync Script
 * Uploads AlphaClaw marketing content to Contentful CMS
 * 
 * Prerequisites:
 * - npm install contentful-management
 * - Set CONTENTFUL_MANAGEMENT_TOKEN in ~/.openclaw/.env
 * - Set CONTENTFUL_SPACE_ID in ~/.openclaw/.env
 * 
 * Usage:
 *   node contentful-sync.js              # Sync all content
 *   node contentful-sync.js --dry-run    # Preview without uploading
 */

const contentful = require('contentful-management');
const { getAllContent } = require('./content-loader.js');

const DRY_RUN = process.argv.includes('--dry-run');

// Load env vars from OpenClaw
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.env.HOME, '.openclaw', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const CONTENTFUL_SPACE_ID = env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_MANAGEMENT_TOKEN = env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_MANAGEMENT_TOKEN) {
  console.error('❌ Missing Contentful credentials in ~/.openclaw/.env');
  console.error('   Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN');
  process.exit(1);
}

async function createContentType(environment) {
  console.log('\n📐 Creating Content Type: contentHubResource...');
  
  try {
    await environment.getContentType('contentHubResource');
    console.log('✅ Content type already exists');
    return;
  } catch (e) {
    // Content type doesn't exist, create it
  }
  
  if (DRY_RUN) {
    console.log('🔍 [DRY RUN] Would create content type: contentHubResource');
    return;
  }
  
  const contentType = await environment.createContentTypeWithId('contentHubResource', {
    name: 'Content Hub Resource',
    displayField: 'title',
    fields: [
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
        required: true,
        unique: true,
        validations: [{ unique: true }]
      },
      {
        id: 'type',
        name: 'Type',
        type: 'Symbol',
        required: true,
        validations: [{
          in: ['whitepaper', 'comparison', 'case-study', 'compliance']
        }]
      },
      {
        id: 'icon',
        name: 'Icon',
        type: 'Symbol'
      },
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        required: true
      },
      {
        id: 'description',
        name: 'Description',
        type: 'Text'
      },
      {
        id: 'pageCount',
        name: 'Page Count',
        type: 'Integer'
      },
      {
        id: 'readTime',
        name: 'Read Time',
        type: 'Symbol'
      },
      {
        id: 'publishDate',
        name: 'Publish Date',
        type: 'Symbol'
      },
      {
        id: 'sections',
        name: 'Sections',
        type: 'Array',
        items: {
          type: 'Object'
        }
      }
    ]
  });
  
  await contentType.publish();
  console.log('✅ Content type created and published');
}

async function syncContent() {
  console.log('🚀 AlphaClaw Content Hub → Contentful Sync\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Initialize Contentful client
  const client = contentful.createClient({
    accessToken: CONTENTFUL_MANAGEMENT_TOKEN
  });
  
  const space = await client.getSpace(CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment('master');
  
  // Create content type if needed
  await createContentType(environment);
  
  // Get all content
  const allContent = getAllContent();
  console.log(`\n📦 Found ${allContent.length} resources to sync\n`);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const resource of allContent) {
    try {
      let entry;
      let isNew = false;
      
      // Check if entry already exists
      try {
        const entries = await environment.getEntries({
          content_type: 'contentHubResource',
          'fields.slug': resource.id,
          limit: 1
        });
        
        if (entries.items.length > 0) {
          entry = entries.items[0];
        } else {
          isNew = true;
        }
      } catch (e) {
        isNew = true;
      }
      
      const fields = {
        slug: { 'en-US': resource.id },
        type: { 'en-US': resource.type },
        icon: { 'en-US': resource.icon },
        title: { 'en-US': resource.title },
        description: { 'en-US': resource.desc },
        pageCount: { 'en-US': resource.pages },
        readTime: { 'en-US': resource.readTime },
        publishDate: { 'en-US': resource.date },
        sections: { 'en-US': resource.sections }
      };
      
      if (DRY_RUN) {
        console.log(`🔍 [DRY RUN] Would ${isNew ? 'create' : 'update'}: ${resource.title}`);
        if (isNew) created++; else updated++;
        continue;
      }
      
      if (isNew) {
        entry = await environment.createEntry('contentHubResource', { fields });
        await entry.publish();
        console.log(`✅ Created: ${resource.title}`);
        created++;
      } else {
        // Update existing entry
        entry.fields = fields;
        const updated_entry = await entry.update();
        await updated_entry.publish();
        console.log(`🔄 Updated: ${resource.title}`);
        updated++;
      }
      
    } catch (error) {
      console.error(`❌ Error syncing ${resource.title}:`, error.message);
      skipped++;
    }
  }
  
  console.log('\n📊 Sync Complete:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📦 Total: ${allContent.length}`);
  
  if (DRY_RUN) {
    console.log('\n💡 Remove --dry-run flag to actually sync content');
  }
}

// Run sync
syncContent().catch(error => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
