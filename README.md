# ShyMirror

[![Version](https://img.shields.io/badge/version-1.0.0-716A99)](package.json)
[![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=20233F)](script.js)
[![Dependencies](https://img.shields.io/badge/runtime%20dependencies-0-9CEBDD)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

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

## Technology

| Area | Implementation |
| --- | --- |
| Structure | Semantic HTML5 |
| Illustration | Inline SVG with independently addressable character parts |
| Styling | Responsive CSS, SVG transitions, and reduced-motion media queries |
| Interaction | Vanilla JavaScript with separate real-character and reflection state |
| Sound | Generated Web Audio API oscillators; no audio files |
| Verification | Node.js syntax and dependency-free structural checks |
| Hosting | Static files prepared for GitHub Pages |

## Getting started

### Prerequisites

- [Node.js 18 or newer](https://nodejs.org/) for project checks
- [pnpm](https://pnpm.io/) for the documented commands
- Python 3 for the included local static-server command

No package installation is required because ShyMirror has no runtime or development dependencies.

### Clone and run

Clone the repository using an authenticated GitHub account while it remains private:

```bash
git clone https://github.com/SUDARSHANCHAUDHARI/ShyMirror.git
cd ShyMirror
pnpm check
pnpm start
```

Then open [http://localhost:8080](http://localhost:8080). The project can also be opened directly from `index.html`, although the local server more closely matches static hosting behavior.

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

## Author

**Sudarshan Chaudhari**

Solo indie developer and founder of **SudarshanTechLabs**, based in Bangkok, Thailand.

- GitHub: [@SUDARSHANCHAUDHARI](https://github.com/SUDARSHANCHAUDHARI)
- Developer contact: [sunny.sudarshan@gmail.com](mailto:sunny.sudarshan@gmail.com)
- Business and legal contact: [sudarshantechlabs@gmail.com](mailto:sudarshantechlabs@gmail.com)

ShyMirror was designed and developed by Sudarshan Chaudhari under SudarshanTechLabs.

## License

ShyMirror is available under the [MIT License](LICENSE). Copyright © 2026 Sudarshan Chaudhari.
