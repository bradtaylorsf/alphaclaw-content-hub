# AlphaClaw Content Hub

Enterprise content management system with API integration and admin panel for managing whitepapers, comparison guides, case studies, and compliance documentation.

## Features

### 🎯 Frontend Hub (index.html)
- **Content Library** - Browse all resources with filtering by type
- **Search & Filter** - Real-time search and category filtering
- **Modal Previews** - Full content preview with sections
- **Responsive Design** - Works on desktop, tablet, mobile
- **Stats Dashboard** - Resource count, pages, categories

### ⚙️ Admin Panel (admin.html)
- **Resource Management** - Create, edit, delete resources
- **Section Builder** - Dynamic form for multi-section content
- **Statistics** - Real-time stats dashboard
- **API Configuration** - View API keys and endpoints
- **Content Types** - Whitepapers, comparisons, case studies, compliance docs

### 🔌 API Integration (api.js)
- **RESTful Endpoints** - Full CRUD operations
- **API Key Authentication** - Secure access control
- **Search & Filtering** - Query by type, text search, sorting
- **Pagination** - Handle large datasets efficiently
- **Stats Endpoint** - Resource analytics

## File Structure

```
content-hub/
├── index.html      # Public-facing content library
├── admin.html      # Admin panel for managing content
├── api.js          # API logic (localStorage-based, CMS-ready)
└── README.md       # This file
```

## Quick Start

### View the Content Hub
Open `index.html` in your browser or visit:
```
https://content-hub.brad-taylor.alphaclaw.app
```

### Access Admin Panel
Open `admin.html` or visit:
```
https://content-hub.brad-taylor.alphaclaw.app/admin.html
```

Default API key is generated on first load and shown in browser console.

### Create New Resource
1. Click "New Resource" in admin panel
2. Fill in title, description, type, icon, pages, read time
3. Add sections (headings + content, HTML allowed)
4. Mark key takeaways with "Highlight" checkbox
5. Click "Save Resource"

## API Usage

### Endpoints

```
GET  /api/resources        # List all resources (with filters)
GET  /api/resources/:id    # Get single resource by ID
POST /api/resources        # Create new resource
PUT  /api/resources/:id    # Update existing resource
DELETE /api/resources/:id  # Delete resource
GET  /api/stats            # Get statistics
```

### Authentication

All API requests require the `X-AlphaClaw-API-Key` header:

```bash
curl -H "X-AlphaClaw-API-Key: aclaw_YOUR_KEY" \
  https://content-hub.brad-taylor.alphaclaw.app/api/resources
```

### Example: Create Resource

```javascript
const apiKey = 'aclaw_YOUR_KEY';

fetch('/api/resources', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-AlphaClaw-API-Key': apiKey
  },
  body: JSON.stringify({
    type: 'whitepaper',
    icon: '📄',
    title: 'AI Security Best Practices',
    desc: 'Comprehensive guide to securing AI deployments in enterprise environments.',
    pages: 32,
    readTime: '25 min',
    date: 'Feb 2026',
    sections: [
      {
        heading: 'Overview',
        text: 'AI security requires a multi-layered approach...',
        highlight: false
      },
      {
        heading: 'Key Takeaway',
        text: 'Security must be built-in from day one.',
        highlight: true
      }
    ]
  })
})
.then(res => res.json())
.then(data => console.log('Created:', data));
```

### Example: Search & Filter

```javascript
// Filter by type
fetch('/api/resources?type=whitepaper')

// Search by text
fetch('/api/resources?search=security')

// Combine filters + pagination
fetch('/api/resources?type=case-study&search=fintech&page=1&limit=10')

// Sort by date (newest first)
fetch('/api/resources?sort=date-desc')
```

## Content Types

| Type | Description | Icon Examples |
|------|-------------|---------------|
| `whitepaper` | In-depth technical documentation | 🛡️ 🔐 🏗️ |
| `comparison` | Side-by-side product comparisons | ⚖️ 🔄 🧠 |
| `case-study` | Customer success stories & ROI | 🏦 📊 ⚡ |
| `compliance` | Regulatory & compliance docs | ✅ 🇪🇺 🏥 |

## Storage

**Current:** localStorage (browser-based, demo-ready)

**Production-Ready:** The API is structured to easily swap storage backends:
- Contentful CMS
- PostgreSQL
- MongoDB
- DynamoDB
- Any RESTful CMS API

### Integrating with Contentful

1. Create Content Type in Contentful with fields matching the schema
2. Replace `api.js` storage methods with Contentful API calls
3. Use Contentful's Management API for write operations
4. Use Delivery API for read operations

Example schema mapping:
```javascript
// localStorage structure → Contentful fields
{
  id: 'slug (Short Text, unique)',
  type: 'contentType (Short Text)',
  icon: 'icon (Short Text)',
  title: 'title (Short Text)',
  desc: 'description (Long Text)',
  pages: 'pageCount (Number)',
  readTime: 'readTime (Short Text)',
  date: 'publishDate (Date)',
  sections: 'sections (Rich Text or JSON)'
}
```

## Customization

### Adding New Content Types

1. Update `api.js` validation to allow new type
2. Add badge style in `index.html` CSS (`.badge-yourtype`)
3. Add option in `admin.html` form select
4. Update icons and colors to match

### Styling

Both files use CSS custom properties for theming:
```css
--accent: #6c5ce7;       /* Primary brand color */
--accent2: #a29bfe;      /* Secondary brand color */
--green: #00b894;        /* Success states */
--red: #e17055;          /* Danger states */
--blue: #74b9ff;         /* Info states */
```

Change these to match your brand instantly.

## Analytics Integration

Add tracking to button clicks and resource views:

```javascript
// In index.html, add to openModal()
function openModal(id) {
  // ... existing code ...
  
  // Track view
  if (window.gtag) {
    gtag('event', 'resource_view', {
      resource_id: id,
      resource_type: r.type
    });
  }
}
```

## Next Steps

### CMS Integration
- [ ] Connect to Contentful API
- [ ] Implement real-time sync
- [ ] Add image upload support
- [ ] Enable draft/publish workflow

### Advanced Features
- [ ] PDF generation from content
- [ ] Email sharing functionality
- [ ] Download tracking
- [ ] Related resources suggestions
- [ ] A/B testing for descriptions

### Marketing Automation
- [ ] Lead capture forms (email gate)
- [ ] Marketo/HubSpot integration
- [ ] Automated email sequences
- [ ] Salesforce opportunity tracking

## Deployment

Already live at:
- **Public Hub:** https://content-hub.brad-taylor.alphaclaw.app
- **Admin Panel:** https://content-hub.brad-taylor.alphaclaw.app/admin.html

To update:
```bash
# Copy new files to apps directory
cp index.html admin.html api.js ~/workspace/brad-taylor/apps/content-hub/

# Changes auto-deploy (static hosting)
```

## Security Notes

⚠️ **Current Setup (Demo):**
- API keys stored in localStorage
- No server-side validation
- CORS-enabled (client-side only)

🔒 **Production Requirements:**
- Move API keys to server-side environment variables
- Implement server-side authentication (JWT, OAuth)
- Add rate limiting
- Enable HTTPS-only
- Validate/sanitize all inputs server-side
- Add CSRF protection for write operations

## Support

Questions? Contact Alpha at alpha@alphaclaw.app or via Slack.

---

**Built with:** HTML, CSS, JavaScript (vanilla, no build step)
**Storage:** localStorage (demo), Contentful-ready
**License:** MIT
