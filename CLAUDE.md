# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the site

No build step. Serve with any static server:
```bash
python3 -m http.server 8080
# or
npx serve .
```
Open `http://localhost:8080` in a browser. The page is fully self-contained.

## Architecture

A **single-page static resort booking template** — no framework, no npm, no backend.

```
index.html        # All markup; sections commented with ── SECTION N ──
css/style.css     # All styles (~32k tokens — read in chunks)
js/app.js         # All logic (~1500 lines)
images/           # Drop logo.png here (fallback shows first letter of property name)
```

### Data flow in app.js

All content is hardcoded in three places — change these to customise the template:

| Variable | Location | Controls |
|---|---|---|
| `property` object | `loadProperty()` | Name, phone, email, location, currency, WhatsApp/call widget |
| `ROOMS` array | module level | Room types, prices, photos, amenities, perks |
| `PHOTOS` array | `loadPhotosFromApi()` | Gallery images (Unsplash URLs) |

On `DOMContentLoaded`, the init sequence runs: `loadProperty()` → `populatePage(property)` which stamps every `id="..."` element in the HTML using the `set()` / `setAttr()` / `setHref()` helpers defined inside that function.

### Booking flow

Select dates (Flatpickr) → `checkRoomAvailability()` → `fetchRoomRates()` (returns static data in template mode) → `renderRooms()` builds room cards → `bookRoom(id, name, price)` opens booking modal → `submitBooking()` shows a demo success screen.

Razorpay integration code exists but is **disabled** (`razorpayKeyId = null` in `initRazorpay()`). To enable real payments, set `razorpayKeyId` from a server endpoint.

### Key UI patterns

- **Modals**: add `.open` class + `document.body.style.overflow = 'hidden'`; remove on close. Overlay click calls `closeOnOverlay(event, id)`.
- **Scroll reveal**: `initScrollReveal()` uses `IntersectionObserver`; elements get `.scroll-reveal` → `.in-view` as they enter viewport. Dynamically-rendered elements (room cards) call `revealObserveEl(el)` after insertion.
- **Sliders**: gallery viewer (`gv-*`), room photo sliders (`rs-*` per room id in `roomSliders{}`), photo lightbox, room photo modal (`rpm-*`), reviews slider (`rev7-*`) — each is independently managed with `setInterval` and paused on hover/touch.
- **Icon colours**: inline `style="--hc-color:#hex"` or `style="--tc:#hex"` CSS custom properties, consumed by `.hc-icon` and `.tp-icon` in CSS.
- **Pricing**: displayed price = `nightly_rate × 1.18` (18% GST inclusive).

### External CDN dependencies

- **Flatpickr 4.6.13** — date picker for check-in/check-out fields
- **Font Awesome 6.5.1** — all icons (`fas`, `fab`, `far`)
- **Google Fonts** — Playfair Display (headings) + Inter (body)
- **Razorpay checkout.js** — loaded but inactive in template mode

## Sections quick-reference

| Section | ID | Purpose |
|---|---|---|
| Header | `#navbar` | Sticky nav; gets `.scrolled` class on scroll |
| 2 | `#section-2` | Photo gallery: main viewer + thumbnail strip |
| 3 | `#section-3` | Property highlight cards (hardcoded in HTML) |
| 4 | `#section-4` | Tabbed guide: overview / dining / accommodation / amenities / experiences / nearby / events / policies |
| 5 | `#section-5` | Date search card + room availability results |
| 6 | `#section-6` | Team grid (populated by `loadTeamSection()`) |
| 7 | `#section-7` | Reviews slider + rating bars + Google Map embed |
| Footer | `.footer` | Contact links |
| — | `#contact-widget` | Floating WhatsApp / Call button |
| — | `#booking-modal` | Guest details form |
| — | `#success-modal` | Post-booking confirmation |
| — | `#gallery-modal` | Full photo grid overlay |
| — | `#lightbox` | Full-screen photo carousel |
| — | `#room-photo-modal` | Per-room photo carousel |
