# API Gateway Design Guidelines

## Design Approach

**Selected Approach:** Design System with Developer-Focused References

Drawing inspiration from **Stripe Dashboard** (data clarity, technical elegance), **Linear** (modern minimalism, crisp typography), and **GitHub** (developer-tool conventions), this API Gateway prioritizes information density, rapid task completion, and technical precision while maintaining visual sophistication.

**Core Principles:**
- Clarity over decoration: Every element serves a functional purpose
- Information hierarchy: Critical data immediately accessible
- Technical professionalism: Inspire confidence in enterprise capabilities
- Efficient workflows: Minimize clicks to complete common tasks

---

## Typography

**Font Families:**
- Primary: Inter (body text, UI elements, data tables)
- Monospace: JetBrains Mono (API endpoints, code snippets, logs, tokens)

**Hierarchy:**
- Page Titles: text-2xl font-semibold
- Section Headers: text-lg font-semibold
- Subsections: text-base font-medium
- Body Text: text-sm
- Labels/Metadata: text-xs text-muted-foreground
- Code/Technical: font-mono text-sm

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4
- Page margins: p-6 to p-8

**Container Strategy:**
- Dashboard Layout: Sidebar (w-64) + Main Content (flex-1 with max-w-7xl centered)
- Cards/Panels: Contained width with consistent internal padding (p-6)
- Tables: Full-width within container, horizontal scroll if needed
- Forms: max-w-2xl for optimal readability

---

## Component Library

### Navigation & Layout
**Top Bar:**
- Fixed height (h-16), logo left, user menu/theme toggle right
- Breadcrumb navigation for nested admin sections
- Search bar for logs/documentation (w-96, centered when appropriate)

**Sidebar:**
- Collapsible navigation with icons + labels
- Grouped sections: Dashboard, API Management, Admin, Documentation
- Active state: subtle background highlight, border accent
- Sticky positioning for long content pages

### Data Display Components

**API Key Cards:**
- Prominent display of key name and truncated key value
- Copy-to-clipboard button (icon-only, appears on hover)
- Metadata row: Created date, Last used, Request count
- Status badge: Active/Revoked with appropriate visual treatment
- Actions menu: Revoke, View details, Edit

**Service Registry Cards:**
- Service name (text-lg font-semibold) with health status indicator (colored dot)
- Base URL in monospace font
- Quick stats row: Uptime percentage, Avg response time, Total requests
- Action buttons: Configure, Test endpoint, View logs

**Metrics Dashboards:**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Stat cards: Large number (text-3xl font-bold), label below, trend indicator
- Time-series charts: Clean line graphs with minimal chrome
- Responsive table layouts with sortable columns

**Log Viewer:**
- Monospace font for all log content
- Timestamp column (w-48), Method badge, Endpoint, Status code, Duration
- Expandable rows for request/response details
- Filter controls: Date range picker, status filter, search input
- Infinite scroll or pagination for performance

### Forms & Inputs

**API Tester Interface:**
- Method selector: Dropdown or button group (GET, POST, PUT, DELETE, PATCH)
- Endpoint input: Full-width, prepended with base URL chip
- Headers section: Key-value pair inputs, add/remove rows
- Body editor: Tabbed interface (JSON, Form Data, Raw)
- Send button: Primary, prominent (h-10, px-8)
- Response panel: Split view (Headers, Body) with syntax highlighting

**Authentication Forms:**
- Centered card layout (max-w-md)
- Input fields: Full-width with clear labels above
- Password visibility toggle
- Primary action button: Full-width (w-full)
- Secondary links: Centered below, text-sm

**Service Configuration Form:**
- Two-column layout for dense information (grid-cols-2 gap-6)
- Service name, base URL, auth type as primary fields
- Expandable sections: Health check config, Rate limits, Headers
- Save/Cancel buttons: Right-aligned, gap-3

### Interactive Elements

**Badges:**
- Role badges: px-2 py-1, rounded-md, uppercase text-xs font-medium
- Status indicators: Small (h-2 w-2) colored dots with text label
- Method badges (HTTP): Compact, color-coded (GET=blue, POST=green, DELETE=red, etc.)

**Tables:**
- Striped rows for readability
- Hover state: Subtle background change
- Sticky header for long tables
- Row actions: Icon buttons appear on hover (aligned right)
- Checkbox column for bulk actions (admin tables)

**Tabs:**
- Underline style: Active tab has bottom border accent
- Even spacing: px-4, py-2
- Use for: API Docs sections, Log filters, Response viewers

**Modals/Dialogs:**
- Confirm actions: Small centered modal (max-w-md)
- Form dialogs: Larger (max-w-2xl) for creating services/users
- Backdrop: Dark overlay (bg-black/50)

---

## Page-Specific Guidelines

### Dashboard Page
- Hero stats grid: 4 columns of key metrics (Total requests, Active services, API keys, Error rate)
- Recent activity feed: List of latest requests with inline status
- Quick actions section: Create API key, Register service, View logs buttons
- Service health overview: Grid of registered services with status dots

### API Documentation Page
- Left sidebar: Sticky navigation of endpoint categories
- Main content: Endpoint cards with method badge, path, description
- Code examples: Tabbed (cURL, JavaScript, Python) with copy buttons
- Try it out: Inline API tester for each endpoint

### Admin Pages
**Users Management:**
- Table view: Username, Email, Role, Status, Actions
- Bulk actions toolbar: Select all, Change role, Deactivate
- Create user button: Top-right, primary styling

**Logs Page:**
- Filter bar: Prominent at top with date picker, status select, search
- Log table: Monospace content, expandable rows
- Export button: Download filtered logs as CSV/JSON

**Monitoring Dashboard:**
- Time range selector: Top-right (Last hour, 24h, 7d, 30d, Custom)
- Charts section: Request volume, Response times, Error rates
- Service breakdown: Pie chart or horizontal bars showing traffic distribution

---

## Images

**Not Required:** This is a technical/enterprise application where imagery would distract from data and functionality. Focus on clean UI, clear data visualization, and efficient information architecture. Any visual interest comes from well-designed components, subtle transitions, and thoughtful use of whitespace—not decorative imagery.

---

## Accessibility

- All interactive elements: Proper focus states with visible outline
- Form inputs: Associated labels, clear error messages
- Tables: Proper semantic HTML with scope attributes
- Icons: Paired with text or aria-labels
- Code snippets: High contrast syntax highlighting
- Consistent keyboard navigation: Tab order follows visual hierarchy