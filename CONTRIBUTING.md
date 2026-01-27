# Contributing to Anattasati

Thank you for your interest in contributing contemplative content to this space.

## Adding New Posts

### Understanding Post Organization

This Jekyll site **automatically organizes posts** based on the `categories` field in the front matter. You don't need to manually update navigation or create index pages - Jekyll handles this for you!

### How It Works

1. **Place your post** in the `_posts/` directory
2. **Name it correctly**: `YYYY-MM-DD-title.md` (e.g., `2025-07-13-calm-ease.md`)
3. **Set the category** in the front matter
4. **That's it!** Jekyll automatically:
   - Creates the URL at `/:categories/:title/`
   - Lists it in the corresponding section page
   - Makes it accessible through the site navigation

### Post Structure

Every post must have front matter (metadata between `---` markers) at the top:

```markdown
---
layout: reading
title: "Your Post Title"
date: YYYY-MM-DD HH:MM:SS +0000
categories: CATEGORY_NAME
---

Your content starts here...
```

### Available Categories

Choose **one** of these categories to determine where your post appears:

| Category | Section | Description |
|----------|---------|-------------|
| `reflections` | Reflections | Contemplations and moments from sitting |
| `meditations` | Meditations | Meditation practices and guidance |
| `dharma` | Dharma | Buddhist teachings and wisdom |
| `satipatthana` | Satipaṭṭhāna | Four Foundations of Mindfulness |
| `anapanasati` | Ānāpānasati | Mindfulness of Breathing |

### Complete Example

**File**: `_posts/2025-08-15-walking-meditation.md`

```markdown
---
layout: reading
title: "Walking Meditation"
date: 2025-08-15 14:30:00 +0000
categories: meditations
---

> Walk as if you are kissing the Earth with your feet.
> 
> — Thich Nhat Hanh

Walking meditation is a practice of mindful movement...

## Instructions

1. Stand still and take three conscious breaths
2. Begin walking slowly...

---

*May this practice bring peace.*
```

**Result**:
- Post appears at: `https://anattasati.org/meditations/walking-meditation/`
- Listed in the Meditations section
- Accessible via the site's navigation

### Advanced: Multiple Categories

You can specify multiple categories (space-separated):

```yaml
categories: dharma reflections
```

**Behavior**:
- The post appears in the **first category's section** (`dharma` in this example)
- URL includes **all categories**: `/dharma/reflections/walking-meditation/`

### Tips for Writing

1. **Keep the layout as `reading`** - This is the custom layout for post content
2. **Use meaningful titles** - They appear in navigation and URLs
3. **Date format** - Use `YYYY-MM-DD HH:MM:SS +0000` (UTC timezone)
4. **File naming** - Must match `YYYY-MM-DD-title.md` exactly
5. **URL generation** - The title in the filename becomes the URL slug (lowercase, hyphens)

### Testing Locally

Before committing, test your post locally:

```bash
# Start the development server
./jekyll.sh serve

# Or manually
bundle exec jekyll serve --host 0.0.0.0 --port 4000
```

Visit `http://localhost:4000` to see your post in the appropriate section.

### What NOT to Do

- ❌ Don't manually edit section pages (`_sections/*.md`) to add your post
- ❌ Don't create custom category names - use the existing ones
- ❌ Don't forget the date in the filename
- ❌ Don't skip the front matter

### Jekyll Auto-Organization Explained

The magic happens in `_layouts/void.html`:

```liquid
{% assign section_name = page.slug %}
{% assign section_posts = site.posts | where_exp: "post", "post.categories contains section_name" %}
```

This Liquid template code:
1. Gets the current section name (e.g., "meditations")
2. Filters all posts to find those with matching category
3. Automatically displays them in the section

And in `_config.yml`:

```yaml
permalink: /:categories/:title/
```

This configures Jekyll to create URLs using the category and post title.

### Questions?

If you're unsure which category to use or have questions about the organization system, feel free to ask in an issue.

---

*May all contributions flow with ease and clarity.*
