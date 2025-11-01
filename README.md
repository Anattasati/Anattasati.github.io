# Anattasati's Jekyll Website

![Build & Deploy](https://github.com/Anattasati/Anattasati.github.io/actions/workflows/jekyll.yml/badge.svg)
![Security Audit](https://github.com/Anattasati/Anattasati.github.io/actions/workflows/security.yml/badge.svg)

This is a Jekyll-powered website hosted on GitHub Pages.

## Local Development

### Prerequisites

- Ruby (version 3.0 or higher)
- Bundler gem

### Getting Started

1. **Install dependencies:**
   ```bash
   bundle install
   # or use the convenience script:
   ./jekyll.sh install
   ```

2. **Start the development server:**
   ```bash
   bundle exec jekyll serve --host 0.0.0.0 --port 4000
   # or use the convenience script:
   ./jekyll.sh serve
   ```

3. **View your site:**
   Open your browser and go to `http://localhost:4000`

### Available Commands

You can use the `jekyll.sh` script for common tasks:

- `./jekyll.sh serve` - Start development server
- `./jekyll.sh build` - Build the site
- `./jekyll.sh clean` - Clean generated files
- `./jekyll.sh install` - Install dependencies

### Site Structure

```
├── _config.yml      # Site configuration
├── _posts/          # Blog posts
├── _site/           # Generated site (don't edit)
├── about.md         # About page
├── index.md         # Homepage
└── 404.html         # 404 error page
```

### Writing Posts

Create new blog posts in the `_posts` directory with the filename format:
`YYYY-MM-DD-title.md`

Example:
```markdown
---
layout: post
title: "My New Post"
date: 2024-07-13 10:00:00 +0000
categories: jekyll update
---

Your post content goes here...
```

### Customization

- Edit `_config.yml` to change site settings
- Modify the theme by editing the CSS in `assets/main.scss`
- Add new pages by creating `.md` files in the root directory

### Deployment

This site is automatically deployed to GitHub Pages when you push to the main branch.

### Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Minima Theme](https://github.com/jekyll/minima)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
