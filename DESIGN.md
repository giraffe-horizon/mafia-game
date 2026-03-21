# Design System Strategy: The Analog Intelligence Dossier

## 1. Overview & Creative North Star
**Creative North Star: "The Classified Artifact"**

This design system rejects the "clean" digital aesthetic of modern SaaS. Instead, it treats the screen as a physical desk under a dim lamp—a high-stakes collection of analog intelligence. The goal is to move beyond mere "retro" styling and achieve a sense of **Tactile Authority**. 

We break the standard digital grid through **Intentional Asymmetry**. Elements should feel "placed" rather than "rendered." By using overlapping surfaces, paper-clip motifs, and slight rotational offsets (0.5 to 1 degree), we create a layout that feels like a folder of documents spread across a charcoal-black surface. High contrast is our primary tool for hierarchy; the "Paper" (Secondary) elements must pop violently against the "Void" (Background).

---

## 2. Colors & Surface Logic

The palette is a dialogue between the shadows of the office and the starkness of the report.

### The Palette
- **Background (`#131313`)**: The void. Represents the dark mahogany or steel desk of a cold-war era office.
- **Secondary / "Paper" (`#d7c3b0`)**: The weathered document. Used for main content areas and cards.
- **Primary / "The Stamp" (`#ffb4ac`)**: A de-saturated, ink-bleed red. Use this for critical warnings, "Classified" status indicators, and urgent calls to action.
- **Surface Tiers**: 
    - `surface-container-lowest` (`#0e0e0e`): Deep shadows, recessed areas.
    - `surface-container-highest` (`#353534`): Subtle highlights on the "desk" surface.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. In this system, boundaries are created by the physical edge of a "paper" surface. If you need to separate content on a document, use a vertical whitespace jump (refer to Spacing Scale `8` or `10`) or a subtle tonal shift between `secondary` and `secondary_container`. 

### Surface Hierarchy & Nesting
Treat the UI as a physical stack.
1. **The Desk (Base):** `surface` (`#131313`).
2. **The Folder:** `surface-container-low` (`#1c1b1b`).
3. **The Document:** `secondary` (`#d7c3b0`).
4. **The Sticky Note / Attachment:** `secondary_fixed_dim`.

### The "Ink & Bleed" Rule
To avoid a flat, vector look, use `surface_tint` as a very low-opacity overlay (3-5%) on "Paper" elements to simulate ink soaking into fibers. For CTAs, use a subtle gradient from `on_primary_container` to `primary` to mimic the uneven application of a rubber stamp.

---

## 3. Typography: The Typewriter Mandate

Typography is not just for reading; it is a visual texture. We use `spaceGrotesk` to mimic the mechanical, monospaced soul of the mid-century typewriter.

*   **Display & Headlines:** Use `display-lg` and `headline-lg`. **Mandatory: All Caps.** Increase letter-spacing by `0.1rem` to simulate manual typesetting.
*   **Body Text:** Use `body-md`. This is the "report text." Maintain a generous line-height to ensure readability despite the monospaced nature.
*   **Labels:** Use `label-sm` for "Metadata" (e.g., Date Filmed, Agent ID). 
*   **Hierarchy:** Authority is conveyed through scale and "Stamping." A `headline-sm` in `primary` (Red) acts as a high-priority "REDACTED" or "TOP SECRET" marker, cutting through the `on_surface` (Cream) body text.

---

## 4. Elevation & Depth: Tonal Layering

We do not use modern shadows. We use **Ambient Occlusion** and **Physical Stacking**.

*   **The Layering Principle:** Depth is achieved by placing a `secondary` (Paper) element on top of `surface` (Desk). To show a document is "lifted," use `surface-container-highest` as a very soft, blurred background glow behind the paper, rather than a sharp drop shadow.
*   **The "Ghost Border" Fallback:** If a document sits on another document of the same color, use the `outline-variant` at 15% opacity. This should look like a faint "crease" or "edge shadow" rather than a digital stroke.
*   **Intentional Asymmetry:** Never center-align everything perfectly. Shift a document 4px to the left or right to break the "web template" feel.

---

## 5. Components: The Intelligence Kit

### Buttons (The "Rubber Stamps")
*   **Primary:** High-contrast `primary` background with `on_primary` text. Rectangular. No rounded corners (`0px`). On hover, the color should shift to `on_primary_container` to simulate "fresh ink."
*   **Secondary:** An outlined box using `outline` token. Text is all caps.
*   **Tertiary:** Plain text with an underline that looks like it was drawn with a ruler.

### Input Fields (The "Form")
*   **Style:** No background. A single bottom border using `outline`. 
*   **Focus:** The bottom border shifts to `primary` (Red).
*   **Placeholder:** Use `on_surface_variant` at 50% opacity to look like faint pencil marks.

### Cards (The "Dossier Sheets")
*   **Constraint:** Absolutely no divider lines. 
*   **Structure:** Use `secondary` as the background. Use `16` (3.5rem) padding to give the content "breathing room," mimicking wide document margins.

### New Component: The "Redaction"
*   For sensitive data or "loading" states, use a solid block of `on_secondary` (Dark Brown/Black) over the text. It creates an immediate narrative hook.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use the `0px` roundedness scale religiously. Analog paper has sharp edges.
*   **Do** incorporate "Stamp" motifs. Any critical action or status should look like it was slammed onto the page with a rubber stamp.
*   **Do** use the `spacing-24` (5.5rem) for major section breaks to simulate a new page starting.

### Don't:
*   **Don't** use "Blue" for links. Use `primary` (Red) or an underlined version of the body text.
*   **Don't** use smooth transitions. Use "Step" animations (e.g., a 0.1s jump) to simulate a slide projector or a mechanical typewriter carriage return.
*   **Don't** use standard icons. If an icon is needed, it must look like a hand-drawn line art stamp (e.g., a simple magnifying glass made of two circles and a line).

---

## 7. Accessibility & Readability
While the aesthetic is "Noir," the `on_secondary` text on `secondary` paper must maintain a contrast ratio of at least 7:1. The "weathered" look should be achieved through background textures, not by lowering the contrast of the actual text. Use `on_surface` for any text appearing directly on the dark `surface` background to ensure maximum legibility.