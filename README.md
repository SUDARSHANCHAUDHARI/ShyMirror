# ShyMirror

ShyMirror is a dependency-free interactive cartoon scene about a mirror reflection with its own ideas. Move the real character and the reflection will follow—until it looks away, hides, waves, changes its face, or sends in a cat instead.

## Features

- Pointer and touch movement controls the real character's eyes, head, and body.
- Arrow-key controls provide a complete non-pointer alternative.
- Real and reflected characters use separate animation state.
- A delayed pose queue gives the reflection its own timing.
- Ten shuffled reflection behaviors:
  - looks in another direction
  - hides behind the mirror frame
  - waves independently
  - makes a different expression
  - moves with an exaggerated delay
  - refuses to copy the pose
  - leaves the mirror
  - draws on the glass
  - turns around
  - replaces itself with another character
- Meaningful actions are counted instead of every raw pointer event.
- Every five actions, the two characters synchronize briefly before the reflection rebels again.
- Generated Web Audio sound effects with an on/off control.
- Responsive SVG layout, visible keyboard focus, live status text, and reduced-motion support.
- No dependencies, build process, external fonts, images, or audio files.
- A restrictive Content Security Policy and no-referrer policy suitable for static hosting.

## Run locally

The project can be opened directly from `index.html`, or served locally:

```bash
pnpm start
```

Then open [http://localhost:8080](http://localhost:8080).

Run the project checks with:

```bash
pnpm check
```

The check verifies JavaScript syntax, required project files, unique HTML/SVG IDs, all behavior definitions, and key accessibility hooks.

## Controls

| Input | Action |
| --- | --- |
| Pointer or touch movement | Guide the character's gaze, head, and body |
| Tap/click in the scene | Record an interaction |
| Arrow keys while the scene is focused | Nudge the character |
| <kbd>Space</kbd> while the scene is focused | Trigger a random rebellion |
| <kbd>S</kbd> | Toggle generated sound |
| <kbd>R</kbd> | Reset the scene and interaction history |

The **Surprise me**, **Sound**, and **Reset** buttons expose the same actions without keyboard shortcuts.

## Production gate

Before any release or visibility change:

```bash
pnpm check
pnpm start
```

Confirm the local page and its assets load, then review the changes on the intended release branch. The repository should remain private until the release owner explicitly approves making it public. No GitHub Actions workflow is included; adding or enabling CI requires separate approval.

## GitHub Pages

ShyMirror is ready for GitHub Pages without a build step or workflow file.

When public release is approved:

1. Confirm the repository visibility and release branch are intentional.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the default branch and the **`/ (root)`** folder, then save.

GitHub Pages will serve `index.html` directly. All asset references are relative, so the site works from both a user site and a project subpath.

## Project structure

```text
ShyMirror/
├── index.html                 # Semantic UI and the complete SVG scene
├── styles.css                 # Visual system, responsive layout, animation, reduced motion
├── script.js                  # Character state, behaviors, interaction tracking, generated sound
├── favicon.svg                # Project icon
├── site.webmanifest           # Static app metadata
├── .nojekyll                  # Disable GitHub Pages' Jekyll processing
├── scripts/check-project.mjs  # Dependency-free structural checks
├── package.json               # Local run and check commands
├── AGENTS.md                  # Project-local contributor instructions
├── SECURITY.md                # Private vulnerability reporting guidance
├── CHANGELOG.md               # User-facing release history
├── LICENSE                    # MIT license
└── README.md
```

## Accessibility notes

- The scene is keyboard focusable and has an accessible title and description.
- Dynamic reflection behavior is announced through a polite live region.
- Native buttons and a native progress element are used for controls and sync progress.
- `prefers-reduced-motion` removes looping transitions and shortens large movements in JavaScript.
- Sound never contains essential information and can be disabled at any time.

## License

[MIT](LICENSE)
