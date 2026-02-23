# Installation & Setup Guide

## Quick Start (Local Development)

1. **Visit the live app:**
   ```
   https://content-hub.brad-taylor.alphaclaw.app
   ```
   Content auto-loads on first visit. No installation needed!

2. **View admin panel:**
   ```
   https://content-hub.brad-taylor.alphaclaw.app/admin.html
   ```

## Contentful Sync (Optional)

To sync content to your Contentful space:

### Prerequisites
```bash
# Install Node.js dependencies (run outside container if needed)
cd /home/agent/workspace/brad-taylor/apps/content-hub
npm install contentful-management
```

### Configure Credentials
Already set in `~/.openclaw/.env`:
- ✅ `CONTENTFUL_SPACE_ID`
- ✅ `CONTENTFUL_MANAGEMENT_TOKEN`

### Run Sync
```bash
# Preview sync (no changes)
node contentful-sync.js --dry-run

# Sync content to Contentful
node contentful-sync.js
```

## Deployment

Content Hub is deployed at:
- **Public:** https://content-hub.brad-taylor.alphaclaw.app
- **Admin:** https://content-hub.brad-taylor.alphaclaw.app/admin.html

Files automatically deploy when updated in:
```
~/workspace/brad-taylor/apps/content-hub/
```

## Content Library

All 13 marketing resources load automatically via `content-loader.js`:

### Whitepapers (3)
- AI Cost Control for Enterprise Teams
- AI Governance Framework for CISOs
- On-Premise AI: Complete Deployment Guide

### Comparisons (2)
- AlphaClaw vs. ChatGPT Enterprise
- Build Your Own AI Agent vs. AlphaClaw

### Case Studies (3)
- FinServ Compliance Automation
- SaaS Engineering Productivity
- Marketing Agency Cost Reduction

### Compliance (5)
- SOC 2 Compliance Guide
- GDPR Data Protection
- HIPAA Healthcare AI

## Troubleshooting

### Content not loading?
1. Clear browser localStorage
2. Reload page
3. Check browser console for errors

### Contentful sync failing?
1. Verify credentials in `~/.openclaw/.env`
2. Run with `--dry-run` first
3. Check Contentful space permissions

### Need custom content?
1. Use admin panel: /admin.html
2. Or edit `content-loader.js`
3. Or add via API (see README.md)

---

**Questions?** Ask Alpha 🐺
