# AI Web Developer Task List

## 1. Tailwind Setup & Optimization
- [ ] **Replace Tailwind CDN with npm-based setup**
  - Install Tailwind via npm.
  - Set up PostCSS and autoprefixer.
  - Enable JIT mode for optimized builds.

- [ ] **Create `tailwind.config.js`**
  - Define brand colors, typography, and spacing.
  - Extend the theme with project-specific design tokens.
  - Configure purge paths to remove unused CSS.

- [ ] **Integrate Tailwind with Shadcn UI**
  - Link `tailwind.config.js` with Shadcn’s theme variables.
  - Ensure `components.json` points to the correct Tailwind config file.

---

## 2. Design System Improvements
- [ ] **Customize Shadcn UI “new-york” preset**
  - Update CSS variables for colors, fonts, and spacing to match brand identity.
  - Apply consistent styles across all UI components.

- [ ] **Wire up `ThemeContext.tsx` to Tailwind**
  - Ensure theme switching updates Tailwind variables dynamically.
  - Test dark/light mode transitions.

---

## 3. Performance & Accessibility
- [ ] **Enable CSS Purge**
  - Confirm unused classes are removed during build.
  - Reduce final CSS size for faster load times.

- [ ] **Accessibility Review**
  - Check all components for ARIA attributes and semantic HTML.
  - Verify color contrast meets WCAG AA standards.
  - Ensure focus states are visible and consistent.

---

## 4. UI/UX Consistency
- [ ] **Error State Styling**
  - Review and unify error message styles (e.g., from `login-error.png`).
  - Ensure spacing, typography, and colors match the design system.

- [ ] **Global Style Audit**
  - Align typography hierarchy (headings, paragraphs, captions).
  - Standardize padding, margin, and border radius usage.
