```markdown
# Design System Document: The Sacred Digital Archive

## 1. Overview & Creative North Star
**Creative North Star: "The Living Liturgy"**

This design system rejects the sterile, flat aesthetic of modern SaaS in favor of a "High-End Editorial" experience. It is designed to feel like a bespoke, leather-bound prayer book translated into a digital medium. The goal is to evoke a sense of timelessness, reverence, and intentionality.

To break the "template" look, we utilize **Intentional Asymmetry**. Rather than a rigid, centered grid, we employ wide margins (using the `24` spacing token) and offset typography to create breathing room. Layouts should feel curated, not generated. Overlapping elements—such as a title partially resting on a ghost-bordered card—create a sense of physical depth and "stacked parchment."

---

## 2. Colors
The palette is rooted in the organic warmth of aged ivory and the regal authority of liturgical gold.

*   **Surface Hierarchy:**
    *   **Background (`#fbf9f4`):** Our primary canvas. It is a soft, non-reflective parchment that reduces eye strain during long periods of reading or prayer.
    *   **Surface Container Lowest (`#ffffff`):** Reserved for "Pure White" cards. These represent the most important content pieces, appearing to lift off the parchment.
    *   **Surface Container High/Highest (`#eae8e3` / `#e4e2dd`):** Used for subtle grouping of secondary information.

*   **The "No-Line" Rule:** 
    Standard 1px solid borders are strictly prohibited for sectioning. Definition must be achieved through background shifts. For example, a `surface-container-low` section should sit flush against the `background` to create a natural "seam" without a stroke.

*   **The "Glass & Gradient" Rule:** 
    Headers and navigation must utilize glassmorphism (80% opacity with a 20px+ backdrop blur) to maintain a sense of lightness. For primary CTAs, use a "Candlelight Gradient" transitioning from `primary` (#785600) to `primary-container` (#986d00) at a 135-degree angle to mimic the flickering warmth of a votive flame.

---

## 3. Typography
Typography is the voice of the system. We pair the authoritative, calligraphic weight of Slavic-inspired displays with the legibility of high-end serifs.

*   **Display & Headline (`newsreader`):** Used for section headers and liturgical titles. Set in `primary` (Bronze/Gold). These should be tracked slightly tighter (-2%) to feel like professional typesetting.
*   **Body (`notoSerif`):** Used for all long-form reading. Set in `on-surface` (Deep Charcoal). Line height must be generous (1.6x) to honor the "Prayer Book" aesthetic.
*   **Labels (`plusJakartaSans`):** Used for metadata and utility text. This sans-serif provides a functional contrast to the ornate display fonts, ensuring the UI remains navigable.

---

## 4. Elevation & Depth
Depth in this system is organic and atmospheric, mimicking the way light hits physical paper.

*   **The Layering Principle:** 
    Instead of shadows, use **Tonal Layering**. Place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift in brightness creates a sophisticated "lift."
*   **Ambient Shadows:** 
    When a shadow is necessary (e.g., for floating action buttons or high-priority cards), use a large 32px blur with a 4% opacity shadow tinted with `surface-tint`. This mimics natural ambient occlusion rather than a harsh digital drop shadow.
*   **The "Ghost Border":** 
    For card containment, use a `0.5px` border of `outline-variant` at 20% opacity. This creates a "glint" of gold that catches the light without boxing in the content.

---

## 5. Components

### Buttons
*   **Primary:** A gradient from `primary` to `primary_container`. Text is `on_primary_fixed` (Deep Brown). Shape: `md` (0.375rem) to maintain a structured, traditional feel.
*   **Tertiary:** Text-only in `primary` with no background. Use for secondary actions like "Dismiss" or "Back."

### Cards
*   **The Sacred Card:** Use `surface_container_lowest` (#FFFFFF). Forbid the use of divider lines. Separate content blocks using `spacing-4` or `spacing-6`. Ensure a thin `outline_variant` ghost border is applied to give a "foil-pressed" edge.

### Inputs & Selection
*   **Input Fields:** Ghost-bordered (`outline_variant` at 20%) with a `surface_container_low` background. Labels should always be `label-md` in `on_surface_variant`.
*   **Selection Chips:** Use `secondary_fixed` for selected states. The organic, burnt-orange tone provides a clear but warm "active" indicator that feels more natural than a harsh blue.

### Glass Navigation
*   **Top Bar:** 80% `surface_container_lowest` with `backdrop-filter: blur(24px)`. This allows the text and imagery below to bleed through softly, maintaining the "spiritual" and airy vibe.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetrical White Space:** Let a heading sit alone on the left with the body text indented further to the right (using `spacing-12`).
*   **Color-Block for Hierarchy:** Use `surface-container-high` to group prayer metadata (date, saint of the day) separately from the main text.
*   **Embrace Serif:** Use `notoSerif` for almost everything. Only use Sans-serif for tiny utility labels (page numbers, timestamps).

### Don't:
*   **Don't use 100% Black:** Never use `#000000`. Use `on-surface` (#1b1c19) to maintain the "printed ink" feel.
*   **Don't use Rounded-Full (Pills):** Avoid `rounded-full` for anything other than icons. We want the UI to feel like a book, not a tech gadget. Stick to `md` and `lg` radius.
*   **Don't use Dividers:** Avoid horizontal rules `<hr>`. Use a `spacing-8` vertical gap or a change in surface color to separate chapters or sections.

---

## 7. Signature Elements
*   **Drop Caps:** For the start of long chapters, use a `display-lg` character in `primary` gold, spanning 2–3 lines of text.
*   **The Liturgical Glow:** Apply a subtle `primary` glow (10% opacity, 40px blur) behind the main icon or headline of the "Current Prayer" to simulate the aura of a candle.```