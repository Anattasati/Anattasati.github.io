# Post Templates

This directory contains templates for creating new posts in each section of the Anattasati website.

## How to Use These Templates

1. **Choose the appropriate template** for your content type
2. **Copy the template** to the `_posts` directory
3. **Rename the file** following the format: `YYYY-MM-DD-your-title.md`
4. **Fill in the content**, replacing the placeholders with your actual content
5. **Update the date** in both the filename and front matter

## Available Templates

- **reflections-template.md** - For personal contemplations and insights from practice
- **meditations-template.md** - For meditation instructions and guidance
- **dharma-template.md** - For Buddhist teachings and philosophical content
- **satipatthana-template.md** - For Four Foundations of Mindfulness teachings
- **anapanasati-template.md** - For Mindfulness of Breathing practices

## Example Usage

```bash
# Copy the reflections template
cp .github/post-templates/reflections-template.md _posts/2025-08-15-my-reflection.md

# Edit the file
nano _posts/2025-08-15-my-reflection.md

# The post will automatically appear in the Reflections section!
```

## Automatic Organization

Remember: Once you create a post with the correct:
- Filename format (`YYYY-MM-DD-title.md`)
- Front matter (with `categories` field)
- Placement in `_posts/` directory

Jekyll will **automatically**:
- Create the appropriate URL
- List it in the correct section
- Make it accessible through navigation

No manual updates needed! See `CONTRIBUTING.md` for full details.
