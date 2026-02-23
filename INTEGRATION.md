# Content Hub API Integration Guide

How to connect the Content Hub to external systems (Contentful, Sanity, custom backends).

## Current Architecture

```
Frontend (index.html) → API Layer (api.js) → Storage (localStorage)
                                           ↓
                                    [Easy to swap]
                                           ↓
                              CMS / Database / Backend
```

## Integration Options

### 1. Contentful CMS Integration

**Best for:** Marketing teams, non-technical content editors, rich media

**Setup:**
```javascript
// Replace api.js storage methods with Contentful API
import { createClient } from 'contentful-management';

const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
});

class ContentHubAPI {
  async getResources(filter = {}) {
    const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
    const environment = await space.getEnvironment('master');
    
    const entries = await environment.getEntries({
      content_type: 'contentHubResource',
      'fields.type': filter.type || undefined,
      limit: filter.limit || 100
    });
    
    return {
      data: entries.items.map(entry => ({
        id: entry.fields.slug,
        type: entry.fields.type,
        icon: entry.fields.icon,
        title: entry.fields.title,
        desc: entry.fields.description,
        pages: entry.fields.pageCount,
        readTime: entry.fields.readTime,
        date: entry.fields.publishDate,
        sections: entry.fields.sections
      })),
      meta: {
        total: entries.total,
        limit: entries.limit
      }
    };
  }
  
  async createResource(data, apiKey) {
    // Validate API key against Contentful roles
    const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
    const environment = await space.getEnvironment('master');
    
    const entry = await environment.createEntry('contentHubResource', {
      fields: {
        slug: { 'en-US': data.id },
        type: { 'en-US': data.type },
        icon: { 'en-US': data.icon },
        title: { 'en-US': data.title },
        description: { 'en-US': data.desc },
        pageCount: { 'en-US': data.pages },
        readTime: { 'en-US': data.readTime },
        publishDate: { 'en-US': data.date },
        sections: { 'en-US': data.sections }
      }
    });
    
    await entry.publish();
    return entry;
  }
}
```

**Contentful Content Type Schema:**
```json
{
  "name": "Content Hub Resource",
  "displayField": "title",
  "fields": [
    {
      "id": "slug",
      "name": "Slug",
      "type": "Symbol",
      "required": true,
      "unique": true
    },
    {
      "id": "type",
      "name": "Type",
      "type": "Symbol",
      "validations": [{
        "in": ["whitepaper", "comparison", "case-study", "compliance"]
      }]
    },
    {
      "id": "icon",
      "name": "Icon",
      "type": "Symbol"
    },
    {
      "id": "title",
      "name": "Title",
      "type": "Symbol",
      "required": true
    },
    {
      "id": "description",
      "name": "Description",
      "type": "Text"
    },
    {
      "id": "pageCount",
      "name": "Page Count",
      "type": "Integer"
    },
    {
      "id": "readTime",
      "name": "Read Time",
      "type": "Symbol"
    },
    {
      "id": "publishDate",
      "name": "Publish Date",
      "type": "Date"
    },
    {
      "id": "sections",
      "name": "Sections",
      "type": "Array",
      "items": {
        "type": "Object",
        "validations": []
      }
    }
  ]
}
```

### 2. Sanity CMS Integration

**Best for:** Developer-first workflows, real-time collaboration, structured content

**Setup:**
```javascript
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

class ContentHubAPI {
  async getResources(filter = {}) {
    const query = `*[_type == "resource" ${filter.type ? `&& type == "${filter.type}"` : ''}] | order(date desc)`;
    const resources = await sanityClient.fetch(query);
    
    return {
      data: resources,
      meta: { total: resources.length }
    };
  }
  
  async createResource(data, apiKey) {
    const doc = {
      _type: 'resource',
      slug: { current: data.id },
      type: data.type,
      icon: data.icon,
      title: data.title,
      description: data.desc,
      pageCount: data.pages,
      readTime: data.readTime,
      publishDate: data.date,
      sections: data.sections
    };
    
    return await sanityClient.create(doc);
  }
}
```

**Sanity Schema:**
```javascript
// schemas/resource.js
export default {
  name: 'resource',
  title: 'Content Hub Resource',
  type: 'document',
  fields: [
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      }
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Whitepaper', value: 'whitepaper' },
          { title: 'Comparison', value: 'comparison' },
          { title: 'Case Study', value: 'case-study' },
          { title: 'Compliance', value: 'compliance' }
        ]
      }
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'string'
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'pageCount',
      title: 'Page Count',
      type: 'number'
    },
    {
      name: 'readTime',
      title: 'Read Time',
      type: 'string'
    },
    {
      name: 'publishDate',
      title: 'Publish Date',
      type: 'date'
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'heading', type: 'string' },
          { name: 'text', type: 'text' },
          { name: 'highlight', type: 'boolean' }
        ]
      }]
    }
  ]
}
```

### 3. PostgreSQL Backend Integration

**Best for:** Full control, custom workflows, high-performance queries

**Setup:**
```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class ContentHubAPI {
  async getResources(filter = {}) {
    let query = 'SELECT * FROM resources WHERE 1=1';
    const params = [];
    
    if (filter.type && filter.type !== 'all') {
      params.push(filter.type);
      query += ` AND type = $${params.length}`;
    }
    
    if (filter.search) {
      params.push(`%${filter.search}%`);
      query += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filter.limit) {
      params.push(filter.limit);
      query += ` LIMIT $${params.length}`;
    }
    
    const result = await pool.query(query, params);
    
    return {
      data: result.rows,
      meta: { total: result.rowCount }
    };
  }
  
  async createResource(data, apiKey) {
    const query = `
      INSERT INTO resources (id, type, icon, title, description, pages, read_time, date, sections)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      data.id,
      data.type,
      data.icon,
      data.title,
      data.desc,
      data.pages,
      data.readTime,
      data.date,
      JSON.stringify(data.sections)
    ]);
    
    return result.rows[0];
  }
}
```

**PostgreSQL Schema:**
```sql
CREATE TABLE resources (
  id VARCHAR(100) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  pages INTEGER,
  read_time VARCHAR(20),
  date DATE,
  sections JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_date ON resources(date DESC);
CREATE INDEX idx_resources_search ON resources USING gin(to_tsvector('english', title || ' ' || description));
```

### 4. AlphaClaw Agent Integration

**Best for:** AI-powered content generation, automated updates, dynamic content

**Setup:**

Create a skill that manages the content hub via the API:

```bash
# ~/workspace/brad-taylor/skills/content-hub-manager/run.sh
#!/bin/bash

API_KEY="${CONTENT_HUB_API_KEY}"
API_URL="https://content-hub.brad-taylor.alphaclaw.app/api"

case "$1" in
  create)
    # Create resource from AI-generated content
    curl -X POST "${API_URL}/resources" \
      -H "X-AlphaClaw-API-Key: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -d @- <<EOF
{
  "type": "$2",
  "icon": "$3",
  "title": "$4",
  "desc": "$5",
  "pages": $6,
  "readTime": "$7",
  "date": "$(date +%b\ %Y)",
  "sections": $(echo "$8" | jq -R -s 'split("\n\n") | map(split(":") | {heading: .[0], text: .[1], highlight: false})')
}
EOF
    ;;
    
  search)
    curl "${API_URL}/resources?search=$2" \
      -H "X-AlphaClaw-API-Key: ${API_KEY}" \
      | jq '.data[] | {title, type, desc}'
    ;;
esac
```

Then Alpha can create content:
```
Alpha, create a whitepaper about "AI Cost Optimization" with sections on:
- Budget controls
- Model selection strategies
- Monitoring and alerts
```

## Environment Variables

Add to `~/.openclaw/.env`:

```bash
# Contentful
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_MANAGEMENT_TOKEN=your_token
CONTENTFUL_DELIVERY_TOKEN=your_delivery_token

# Sanity
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_token

# PostgreSQL
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Content Hub API
CONTENT_HUB_API_KEY=aclaw_your_api_key
```

## Migration Script

Move from localStorage to external CMS:

```javascript
// migrate.js
const ContentHubAPI = require('./api.js');
const { createClient } = require('contentful-management');

async function migrate() {
  // Get all resources from localStorage
  const api = new ContentHubAPI();
  const resources = api.getResources({}).data;
  
  // Connect to Contentful
  const client = createClient({
    accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
  });
  
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment('master');
  
  // Migrate each resource
  for (const resource of resources) {
    console.log(`Migrating: ${resource.title}`);
    
    const entry = await environment.createEntry('contentHubResource', {
      fields: {
        slug: { 'en-US': resource.id },
        type: { 'en-US': resource.type },
        icon: { 'en-US': resource.icon },
        title: { 'en-US': resource.title },
        description: { 'en-US': resource.desc },
        pageCount: { 'en-US': resource.pages },
        readTime: { 'en-US': resource.readTime },
        publishDate: { 'en-US': resource.date },
        sections: { 'en-US': resource.sections }
      }
    });
    
    await entry.publish();
    console.log(`✓ Published: ${resource.title}`);
  }
  
  console.log(`\n✓ Migrated ${resources.length} resources`);
}

migrate().catch(console.error);
```

Run migration:
```bash
node migrate.js
```

## Testing

Test API endpoints:

```bash
# List all resources
curl https://content-hub.brad-taylor.alphaclaw.app/api/resources \
  -H "X-AlphaClaw-API-Key: YOUR_KEY"

# Get single resource
curl https://content-hub.brad-taylor.alphaclaw.app/api/resources/ai-governance-cisos \
  -H "X-AlphaClaw-API-Key: YOUR_KEY"

# Create resource
curl -X POST https://content-hub.brad-taylor.alphaclaw.app/api/resources \
  -H "X-AlphaClaw-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whitepaper",
    "icon": "🚀",
    "title": "Test Resource",
    "desc": "Testing API integration",
    "pages": 10,
    "readTime": "8 min",
    "date": "Feb 2026",
    "sections": [
      {
        "heading": "Test Section",
        "text": "This is a test.",
        "highlight": false
      }
    ]
  }'
```

## Next Steps

1. Choose your CMS/backend
2. Update `api.js` with integration code
3. Test CRUD operations
4. Run migration script
5. Update admin panel to use new backend
6. Deploy!

---

Questions? Ping Alpha via Slack.
