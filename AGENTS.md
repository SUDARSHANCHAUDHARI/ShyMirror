# ShyMirror contributor instructions

## Project shape

ShyMirror is a zero-dependency static site built with semantic HTML, CSS, inline SVG, and vanilla JavaScript. There is no compilation step and no generated source tree.

The real character and reflection must retain separate state. Reflection behaviors should continue to use the delayed pose queue rather than duplicating the main animation loop.

## Required checks

Run the complete local gate before committing or releasing:

```bash
pnpm check
```

For HTTP smoke testing, run `pnpm start` and verify `index.html`, `styles.css`, `script.js`, `favicon.svg`, and `site.webmanifest` load successfully.

## Accessibility and motion

- Keep every action available through native buttons or keyboard input.
- Preserve visible focus, live status text, and the accessible progress element.
- Any new looping or large motion must respect `prefers-reduced-motion` in CSS and JavaScript.
- Sound must remain optional, non-essential, generated locally, and gated behind user interaction.

## Security and repository hygiene

- Do not add remote scripts, trackers, unsafe HTML insertion, secrets, environment files, or generated build output.
- Keep the Content Security Policy restrictive when adding new resources.
- Stage files by explicit path; never use blind `git add .`.
- Do not create or modify GitHub Actions workflows without Sudarshan's explicit approval.
- Keep the GitHub repository private until Sudarshan explicitly approves a visibility change.
