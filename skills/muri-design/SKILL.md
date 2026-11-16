---
name: muri-design
description: Murilo's design rules and process for product visuals (app and site UI, landing pages, READMEs, social carousels, video frames). The product's own look first, one accent color on a plain base, real screens instead of invented UI, no decorative effects, one layout per screen, motion with a reason, and an approval step before scaling. Activate on "muri design", "muri-design", "/muri-design", or when designing, redesigning or reviewing visuals for a product.
---

# muri-design (1.0)

How I design. These rules come from feedback I actually gave on real projects (approved and rejected work), not
from a style guide. They decide direction and taste; for execution details use the stack skills listed at the end.
Keep the user's language.

## Rules

### Identity
1. **The product's look comes first.** Read its palette, fonts, components and logo before drawing anything
   (theme tokens, CSS, the live site or app). Don't invent a new visual world for it.
2. **A reference gives the shape, never the skin.** Take layout, rhythm or pacing from a reference; never its colors,
   mascot, phrases or look. Don't clone your own last project either: two clients must not look alike.
3. **An approved palette doesn't change.** "Make it more intense" means a stronger layout, scale or motion, not new
   colors.

### Color
4. **Plain neutral base, one accent, used sparingly.** The accent marks an action, a keyword or a state. Black and
   white plus one color is often enough.
5. **No decorative background effects.** No gradients, grids, dot patterns, glow, or a frame washed in color.
6. **Light is light, dark is dark.** No tinted backgrounds (greenish dark, gloomy light). If there are two themes,
   both must look good: the light theme is not an afterthought.
7. **Color identifies.** Tools, agents and languages appear with their official logo in its real colors, never a
   monochrome icon or a colored dot.

### Content
8. **Brand as a logo, not as text.** A small official logo at the top beats a typed product name.
9. **No decorative emoji.** Use proper SVG icons when an icon is needed.
10. **Real screens, never invented UI.** Capture the actual product. Fictional data is fine, and it is labeled
    ("real screen · fictional data").
11. **No made-up numbers.** Real numbers carry their source; fictional ones are clearly different from the real
    ones and labeled. Never fill a loading state with fake figures.
12. **Plain title, technical line below.** Write the headline for a non-technical reader and put the technical
    detail in a small line underneath. Talk about what it does for the user, not vanity metrics.

### Layout
13. **Less, but finished.** Remove whatever doesn't inform. Too much text and too little visual is a rejection.
14. **No generic cards.** Avoid grids of identical boxes and the same arrow or block on every screen. Give each
    screen or slide its own layout, with the real product piece at the center.
15. **Everything fits.** Nothing overlaps, gets cut, or forces scrolling to understand. Each format (16:9, 9:16,
    4:5, mobile, desktop) gets its own layout, not a shrunken copy.
16. **Big, strong type and generous space.** It should read like a case study, not a dashboard dump.

### Motion
17. **Move with a reason, and with rhythm.** Static or slow is a rejection, and so is motion for its own sake:
    something changes every few seconds, and every move shows a real consequence (a click on a real target, a
    state that changes).
18. **No toy 3D or generic metaphors.** No floating coins, gears, chess pieces or plastic 3D models standing in for
    the product.

## Process

1. **Cold context.** Read the product: tokens, screens, components, where the data comes from.
2. **Short briefing.** A few questions with the recommended option first; record the answers.
3. **Options side by side.** Three styleframes or prototypes as images, not descriptions.
4. **Explicit approval.** Record the approval in the user's words. A rejected direction doesn't come back.
5. **Pilot first.** Build one or two pieces for real (not a mock), get approval, then extend to the rest.
   If the user asks for everything at once, do it, but still check the first piece before the others.
6. **QA on a contact sheet.** Look at every screen or frame together before delivering: overlap, cuts, contrast,
   consistency.
7. **Independent review.** Another agent with a clean context reviews before delivery; required fixes go in first.
8. **Don't babysit the dev server.** If the user is running it, they test; you report what changed and where.

## Rejection checklist

Before showing anything, it fails if it has: a gradient or patterned background · a color outside the product's
identity · a tinted dark or light theme · invented UI or numbers · decorative emoji · a grid of identical cards ·
text cut, overlapping or too small · a layout that only works in one format · motion with no consequence · a toy 3D
metaphor · the look of the reference or of another client.

## Pairs with

This skill sets direction. For execution, use the stack in this repository: `impeccable` (Paul Bakaus) for critique
and polish, `emil-design-eng` and `animate` (Emil Kowalski) for motion detail, `frontend-design` (Anthropic) and
`design-taste-frontend` (Leonxlnx) for front-end implementation. Where a rule here overlaps with theirs, theirs is
the detailed version; this file is how I apply it.
