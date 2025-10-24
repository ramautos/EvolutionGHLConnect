# Design Guidelines: WhatsApp-GoHighLevel AI Integration Platform

## Design Approach

**Selected Approach:** Hybrid - Reference-based landing page inspired by modern AI/SaaS products (Linear, Vercel, Notion) combined with Material Design system for dashboard components.

**Rationale:** The landing page requires strong visual impact to communicate AI capabilities and build trust, while the onboarding and dashboard prioritize clarity and efficiency for business users managing WhatsApp integrations.

**Key Design Principles:**
1. **AI-Forward Aesthetics** - Communicate intelligence and automation through visual design
2. **Trust & Professionalism** - B2B users need confidence in the platform
3. **Progressive Disclosure** - Guide users smoothly through 3-step onboarding
4. **Status Clarity** - WhatsApp connection states must be immediately obvious

## Core Design Elements

### A. Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - Clean, modern, excellent readability
- Accent: Space Grotesk (via Google Fonts) - Tech-forward feel for headings

**Type Scale:**
- Hero Headline: text-6xl (3.75rem), font-bold, Space Grotesk
- Section Headings: text-4xl (2.25rem), font-bold, Space Grotesk
- Card Titles: text-xl (1.25rem), font-semibold, Inter
- Body Text: text-base (1rem), font-normal, Inter
- UI Labels: text-sm (0.875rem), font-medium, Inter
- Captions: text-xs (0.75rem), font-normal, Inter

### B. Layout System

**Spacing Units:** We will use Tailwind units of 2, 4, 6, 8, 12, 16, 20, and 24 (e.g., p-4, gap-8, my-12)

**Container Strategy:**
- Landing sections: max-w-7xl with px-6 on mobile, px-12 on desktop
- Dashboard: max-w-screen-2xl for wide layouts
- Content areas: max-w-4xl for optimal reading width
- Cards: p-6 for comfortable internal spacing

**Grid Patterns:**
- Landing features: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-8
- Dashboard instances: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 with gap-6
- Onboarding steps: Single column max-w-2xl centered

### C. Component Library

**Navigation:**
- Fixed header with backdrop blur (backdrop-blur-lg)
- Logo left, navigation links center, CTA button right
- Mobile: Hamburger menu with slide-in drawer
- Height: h-16 on mobile, h-20 on desktop

**Hero Section:**
- Full viewport height (min-h-screen) with centered content
- Large hero headline with gradient text treatment
- Subtitle text-xl with max-w-2xl
- Primary and secondary CTA buttons side-by-side
- Animated gradient background with subtle particle effects
- Large hero image: Abstract AI visualization (neural network nodes, data flowing, holographic interface) positioned right side on desktop, below text on mobile

**Feature Cards:**
- Rounded corners (rounded-2xl)
- Subtle border with gradient on hover
- Icon at top (w-12 h-12)
- Title, description, and optional "Learn more" link
- Padding: p-8
- Background: Semi-transparent white/dark with backdrop blur

**Onboarding Steps:**
- Progress indicator at top showing 3 steps
- Large step numbers in circles (w-16 h-16)
- Step content in centered cards (max-w-3xl)
- Previous/Next navigation buttons at bottom
- Clear visual feedback for completed steps

**QR Code Display:**
- Modal overlay with backdrop blur
- QR code centered in white card (p-12)
- Loading spinner during generation
- Phone number display when detected
- Success/error states with appropriate icons

**WhatsApp Instance Cards:**
- Card layout with status indicator (dot with color coding)
- Instance name prominently displayed
- Phone number or "Not Connected" status
- Action buttons (Generate QR, Disconnect, Settings)
- Visual states: Created (gray), Connecting (amber), Connected (green), Error (red)

**Dashboard Sidebar:**
- Fixed left sidebar (w-64) on desktop
- Collapsible on tablet/mobile
- Navigation items with icons
- Active state with subtle background and border-left accent
- User profile section at bottom

**Forms:**
- Label above input pattern
- Input fields: h-12, rounded-lg, border with focus ring
- Required field indicators with asterisk
- Inline validation messages
- Submit button: Full width on mobile, auto on desktop

**Buttons:**
- Primary: Gradient background, text-white, font-semibold, px-8 py-3, rounded-lg
- Secondary: Border style, hover background transition
- Ghost: Text only with hover background
- Icon buttons: Circular (w-10 h-10) for actions
- Disabled state: Reduced opacity with cursor-not-allowed

**Status Badges:**
- Small pill shapes (rounded-full, px-3 py-1, text-xs)
- Color-coded: Green (connected), Yellow (connecting), Gray (inactive), Red (error)
- Icon + text combination

**Data Tables:**
- Striped rows for readability
- Hover state on rows
- Sortable column headers with icons
- Pagination at bottom
- Empty state with illustration and CTA

### D. Animations

**Minimal Animation Strategy:**
- Hero gradient: Subtle animated gradient background (slow 10s loop)
- Card hover: Slight lift with shadow increase (transition-all duration-300)
- Button interactions: Scale on active (active:scale-95)
- Page transitions: Fade in content (opacity transition)
- Loading states: Spinner rotation only
- QR code polling: Pulse effect on "Scanning..." indicator

**No scroll-triggered animations** - Keep focus on functionality

## Landing Page Structure

**Section 1: Hero**
- Full viewport with centered content
- Headline: "Intelligent WhatsApp Automation for GoHighLevel"
- Subheadline explaining the value proposition
- Two CTAs: "Get Started Free" (primary) + "Watch Demo" (secondary)
- Hero image: Futuristic AI dashboard mockup with WhatsApp integration visualized

**Section 2: Problem/Solution (py-24)**
- Two-column layout on desktop
- Left: Pain points with icons
- Right: Solution explanation with benefits
- Background: Subtle gradient overlay

**Section 3: How It Works (py-24)**
- Three large cards showing the 3-step process
- Visual icons representing each step
- Brief description under each
- "Get Started" CTA at bottom

**Section 4: Features Grid (py-24)**
- 3-column grid (2 on tablet, 1 on mobile)
- 6-9 feature cards total
- Icons, titles, and descriptions
- Hover effects on cards

**Section 5: Integration Showcase (py-24)**
- Split layout showing GoHighLevel + WhatsApp connection
- Visual representation of data flow
- Trust indicators (uptime, messages processed, etc.)

**Section 6: Social Proof (py-20)**
- Testimonials in 2-column grid
- User photos, names, companies
- 5-star ratings
- "Trusted by X businesses" stat

**Section 7: Pricing Preview (py-24)**
- 3 pricing tiers in cards
- Feature comparisons
- CTA buttons for each tier

**Section 8: Final CTA (py-32)**
- Bold headline
- Single primary CTA button
- Trust badges (security, certifications)

**Footer (py-16)**
- 4-column layout on desktop
- Links organized by category
- Social media icons
- Copyright and legal links
- Newsletter signup form

## Dashboard Structure

**Layout:**
- Fixed sidebar navigation (left)
- Top bar with search, notifications, user menu (right)
- Main content area with breadcrumbs
- Padding: p-6 to p-8 for main content

**Dashboard Home:**
- Stats cards in grid (4 across on desktop)
- Recent activity list
- Quick actions section
- Connected instances overview

**Instances Page:**
- Header with "Add Instance" button
- Grid of instance cards
- Filter/search bar
- Pagination for many instances

**Onboarding Flow:**
- Clean, focused UI
- Large progress indicator
- Clear instructions with visual aids
- Consistent button placement

## Images

**Hero Section:**
- Large feature image: AI-powered dashboard mockup showing WhatsApp conversation flow with automated responses, positioned on right half of hero on desktop (50% width), full width below headline on mobile
- Style: Modern 3D render with purple/blue gradient lighting, holographic UI elements, floating interface panels
- Aspect ratio: 16:9 landscape

**How It Works Section:**
- Icon illustrations for each step (not photos):
  - Step 1: GHL logo with download icon
  - Step 2: Multiple account cards/icons
  - Step 3: QR code with scanning phone illustration

**Features Section:**
- Icons only for feature cards (Material Icons or Heroicons)

**Social Proof:**
- Customer photos: Professional headshots in circular frames (w-16 h-16), 6-8 testimonials
- Company logos: Grayscale, max height h-12

**Footer:**
- No images needed