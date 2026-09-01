# MASTER PROMPT — BUILD IBYEGERANYO.COM FROM SCRATCH

You are a senior full-stack engineer, UI/UX designer, product architect, and security-conscious web developer.

Your task is to build **Ibyegeranyo.com / Aime Christian Documentaries** completely from scratch as a production-ready full-stack documentary streaming platform.

Do NOT create a superficial mockup.

Do NOT create only the homepage.

Do NOT leave buttons, forms, authentication, uploads, payments, navigation, or API calls as placeholders.

Build the entire working application, including the frontend, backend, database integration, authentication, payment-proof workflow, documentary management, access control, video player, responsive design, legal pages, and all required routes.

The existing website is a specialized documentary streaming platform where visitors discover documentaries, register, select a payment plan, pay through MTN MoMo, upload proof of payment, wait for administrator verification, and then receive access to full documentaries.

The new version must preserve that core functionality while substantially improving the information architecture, page structure, visual design, UX, and video-upload architecture.

---

# 1. PRODUCT IDENTITY

Product name:

**Aime Christian Documentaries**

Website:

**Ibyegeranyo.com**

The platform should feel like:

**Netflix-style documentary library + independent documentary creator platform + premium editorial publication + manual MTN MoMo payment verification.**

The site primarily showcases documentaries and investigations, particularly stories relating to Rwanda and the wider region/world.

Content categories can include:

- History
- Economics
- Politics
- Social welfare
- Lifestyle
- Diplomacy
- Investigative documentaries
- Current affairs

The platform's core promise is:

**Premium, advertisement-free access to Aime Christian's documentaries.**

The visual identity must feel:

- Cinematic
- Premium
- Modern
- Editorial
- Dark
- Dramatic
- Trustworthy
- Minimal
- Image-focused

Avoid making the website look like a generic corporate SaaS dashboard.

Avoid excessive rounded UI elements.

Avoid excessive gradients.

Avoid excessive animations.

The documentary artwork and video content should remain the visual focus.

---

# 2. CRITICAL DESIGN DIRECTION

The entire platform must use a dark cinematic visual language.

## Primary colors

Use approximately:

- Background: `#080B12` / `#0B0F16`
- Primary text: `#FFFFFF`
- Secondary text: `#F1F1F1`
- Muted text: `#9CA3AF`
- Red accent: `#E50914` / `#FF1A1A`
- Existing gold accent: `#F5B63A`
- Existing sand accent: `#D6C2A2`
- Existing red: `#DC2626`

The primary visual hierarchy should be:

**Near-black background → white typography → red interaction/CTA → gold/sand premium highlights.**

Use red primarily for:

- Primary CTA buttons
- Active states
- Badges
- Important highlights
- Hover states
- Subscription prompts
- Status indicators where appropriate

Use gold selectively for:

- Aime Christian branding
- Premium highlights
- Important headings
- Premium/subscription indicators

Do not allow red and gold to compete equally everywhere.

---

# 3. TYPOGRAPHY

Use:

**Inter**

for:

- Navigation
- Body copy
- Buttons
- Forms
- Metadata
- Labels
- Dashboard UI

Use:

**Fraunces**

for:

- Major cinematic headings
- Hero headline
- Documentary/editorial headings
- Large section titles where appropriate

Typography should feel editorial and cinematic without becoming difficult to read.

Use strong typographic hierarchy.

Headings should be bold and visually commanding.

Body copy should remain readable with comfortable line-height.

---

# 4. GLASSMORPHISM

Maintain the existing glassmorphism concept but use it carefully.

Glass components should use:

- Translucent dark/light backgrounds
- Subtle white borders
- Soft shadows
- Background blur where appropriate
- Moderate corner radius
- Layered gradients where useful

Use glass treatment for:

- Login
- Registration
- Pricing
- About
- Documentary cards
- Player information
- Admin panels
- Important overlays

Do not turn every element into glass.

The result should remain elegant and cinematic rather than visually noisy.

---

# 5. COMPLETE PAGE STRUCTURE

Do NOT keep everything on one long homepage.

Create dedicated pages for different functions.

Required public pages:

### `/`

Homepage

### `/documentaries`

All documentaries / documentary library

### `/documentaries/:id`

Individual documentary details / preview page

### `/player?doc=:id`

Dedicated documentary video player

### `/about`

About Aime Christian

### `/pricing`

Pricing and subscription/payment

### `/register`

Registration/payment flow

### `/login`

Login

### `/privacy`

Privacy Policy

### `/terms`

Terms of Service

### `/admin`

Administrator dashboard

You may use equivalent route structures if the framework requires it, but the functionality and separation must remain.

---

# 6. GLOBAL NAVIGATION

Create a sticky global navigation.

Desktop navigation should contain:

### Left

Logo/brand:

- A logo-style square/rounded element containing **A**
- **Aime Christian**
- **Ibyegeranyo.com**

The logo should have a subtle red accent/border.

### Main navigation

- About Us
- Documentaries / Ibyegeranyo
- Pricing / Ibiciro

Additional useful navigation:

- Home
- Login
- Register

### Subscription indicator

Show the current subscription state:

**Free**

when the user has no active subscription.

Dynamically change this when authenticated.

Possible states:

- Free
- Pending
- Active
- Expiring Soon
- Expired

### Account actions

Unauthenticated:

- Register / Kwiyandikisha
- Login / Kwinjira

Authenticated:

- Account
- Subscription status
- Logout

On mobile, collapse navigation into a polished mobile menu.

The navigation must remain usable on every page.

---

# 7. HOMEPAGE

The homepage should function as the primary marketing and discovery experience.

Structure:

1. Navigation
2. Hero
3. Trending/featured documentary content
4. Featured documentary/editorial section
5. Recently Added
6. About
7. Pricing
8. Final CTA
9. Footer

---

# 8. HERO SECTION

The hero should be highly cinematic.

Use a large looping background video.

Existing hero video:

**`broll for hero section.mp4`**

Requirements:

- Autoplay
- Loop
- Muted
- Inline playback
- Automatic loading
- Appropriate fallback if video cannot load
- Responsive behavior
- Dark overlay

Use a strong multi-directional gradient overlay so text remains readable.

Hero headline:

**“Watch Aime Christian Documentaries Ad-Free”**

Highlight:

**Aime Christian**

using gold.

Supporting copy should communicate:

**Premium access to advertisement-free Rwandan stories and investigations.**

Primary CTA:

**Subscribe**

→ navigate to pricing.

Secondary CTA:

**Explore the library**

→ navigate to documentaries.

The hero must immediately communicate:

**What this platform is + why it matters + what the visitor should do next.**

---

# 9. DOCUMENTARY DISCOVERY

Create a dedicated `/documentaries` page.

This is the complete documentary catalogue.

The page should contain:

- Page title
- Introductory description
- Search
- Category filtering if supported by available metadata
- Documentary cards
- Loading states
- Empty state
- Error state

Documentaries must be retrieved dynamically from the backend/database.

Do NOT hard-code documentary data into the frontend.

If there are no documentaries:

**“No documentaries available yet.”**

Display a polished empty state.

---

# 10. FEATURED DOCUMENTARY SECTION

The old "Featured News" design should now be adapted for documentaries.

This section should NOT look like a conventional movie grid.

It should feel like a premium editorial documentary section.

The visual pattern is:

**Image → Title → Description → View More**

Each featured documentary should use large imagery.

The image is the immediate visual hook.

Below or beside the image:

- Documentary title
- Short/medium description
- Metadata where useful
- “View More” CTA

The cards should feel like editorial stories rather than generic movie tiles.

Use large visual storytelling.

The design should communicate:

**This is important content.**

The documentary page itself should inherit this editorial visual language.

---

# 11. RECENTLY ADDED SECTION

Create a separate compact catalogue section titled:

**Recently added**

Include a short supporting sentence.

This section must prioritize information density rather than large imagery.

Each item should display:

### Status badge

Examples:

- 🔥 SOON
- 🔥 NEW
- ⭐ TOP
- ⚡ HOT

### Title

Large enough to scan easily.

### Genre

Example:

**Action • Thriller**

### Rating

Example:

**⭐ 9.8**

### Release year/date

Example:

**📅 2026**

The user should be able to quickly scan:

**status + title + genre + rating + year**

This section should visually contrast with the large editorial Featured section.

---

# 12. DOCUMENTARY DETAIL PAGE

Create an individual documentary page.

Example:

`/documentaries/:id`

The page should contain:

- Documentary hero artwork
- Documentary title
- Summary
- Category/genre
- Release information
- Rating if available
- Status
- Trailer/preview
- Subscription/access status
- CTA

Possible CTA states:

### User is not authenticated

**Login to Watch**

and

**Subscribe**

### User is authenticated but does not have access

**Unlock Full Documentary**

### User has active access

**Watch Full Documentary**

The page should never expose the full protected video URL to an unauthorized visitor.

---

# 13. DOCUMENTARY ACCESS CONTROL

This is one of the most important parts of the system.

Seeing a documentary does NOT mean the user has permission to watch the full video.

Access should depend on:

**User identity + payment status + subscription/access expiration + documentary entitlement**

The system must verify access server-side.

Do NOT rely solely on:

- localStorage
- frontend JavaScript
- hidden buttons
- hidden URLs

The backend must determine whether access is permitted.

The existing system uses the user's phone number as the primary identity.

Preserve phone-based identification.

Normalize Rwanda phone formats so that variations such as:

- `0781234567`
- `250781234567`
- `+250781234567`

can be consistently handled.

---

# 14. REGISTRATION FLOW

Create a dedicated registration/payment experience.

Required fields:

### Full name

### Phone number

Example:

`0781234567`

### Password

Use secure password hashing.

### Subscription plan

Options:

| Plan | Price | Access |
|---|---:|---|
| Weekly | 700 RWF | 7 days |
| Monthly | 2,000 RWF | 30 days |
| Yearly | 22,000 RWF | 1 year |
| Single Documentary | 200 RWF | 1 documentary |

The registration flow must clearly explain:

1. Select your plan
2. Pay through MTN MoMo
3. Upload payment proof
4. Wait for administrator verification
5. Receive access after confirmation

Create a clear multi-step experience if appropriate.

Example:

**Step 1 — Account**

**Step 2 — Plan**

**Step 3 — Payment**

**Step 4 — Upload Proof**

**Step 5 — Verification**

---

# 15. PAYMENT SYSTEM

The payment system is MANUAL.

Do NOT pretend that there is an automatic MTN payment API unless one is actually configured.

The workflow is:

User registers.

↓

Selects plan.

↓

Pays using MTN MoMo.

↓

Uploads screenshot/payment proof.

↓

Payment is created as:

**pending**

↓

Administrator reviews proof.

↓

Administrator confirms.

↓

Subscription/access becomes active.

---

# 16. PAYMENT PROOF UPLOAD

Allow users to upload their MTN payment screenshot.

The interface must include:

- File selector
- Image preview
- Upload progress
- Validation
- Error handling
- Success state

Validate:

- File type
- File size
- Upload status

The payment proof must be associated with:

- User
- Payment
- Selected plan
- Amount
- Timestamp

Payment status:

- pending
- confirmed
- rejected if the platform supports rejection

---

# 17. VIDEO UPLOAD ARCHITECTURE — IMPORTANT CHANGE

This is a major requirement.

When an administrator uploads a documentary or trailer:

## Required pipeline

**Video file → Vercel Blob → Cloudinary**

Do NOT simply upload the video directly to Cloudinary from the browser.

The intended flow is:

1. Admin selects video.
2. Backend receives the video.
3. Video is uploaded/stored through **Vercel Blob**.
4. The stored video is then sent to **Cloudinary**.
5. Cloudinary stores/processes the final media.
6. The resulting Cloudinary media URL/identifier is stored in the documentary record.
7. The player retrieves the media through the backend.

Use temporary storage safely.

Do not load huge videos entirely into server memory.

The existing platform supports video files around 1 GB, so design the upload pipeline to handle large files appropriately.

Implement:

- Upload progress
- Large-file handling
- Validation
- Failure recovery
- Clear errors
- Success confirmation

---

# 18. CLOUDINARY

Use Cloudinary for stored/processed documentary media.

The database should store relevant media metadata, such as:

- Cloudinary public ID
- Secure URL
- Resource type
- Duration if available
- Thumbnail/poster URL
- Upload timestamp

Do not expose unnecessary Cloudinary configuration values to the frontend.

Secrets must remain server-side.

---

# 19. TRAILER SYSTEM

Each documentary may optionally have a trailer.

Admin workflow:

1. Select existing documentary.
2. Select trailer video.
3. Upload trailer.
4. Store trailer media information.

Clearly distinguish:

**Full Documentary**

from

**Trailer / Preview**

Unauthorized visitors may watch the trailer/preview.

They must not automatically receive access to the full documentary.

---

# 20. VIDEO PLAYER

Create a dedicated player page:

`/player?doc=:id`

The player must have its own premium cinematic interface.

Header:

**Aime Christian**

Subtitle:

**Independent Documentary Maker**

Navigation:

- Documentaries
- Pricing
- Back

Back returns to documentary discovery/homepage.

---

# 21. PLAYER STATES

Implement all states.

### Loading

Display:

**Preparing player…**

with an elegant loading state.

### Documentary not found

Display:

**Documentary not found**

with a return-to-library CTA.

### Unauthorized

Do NOT expose the full documentary.

Display:

- Documentary artwork
- Title
- Description
- Preview/trailer if available
- Access explanation
- Subscribe CTA

### Authorized

Display the full documentary player.

---

# 22. PREVIEW EXPERIENCE

For unauthorized users, show a trailer/preview when available.

Preview should include:

- Video controls
- Documentary title
- Documentary summary
- Clear CTA

CTA:

**Pay to see the full video**

Clicking it sends the visitor to pricing/payment.

The conversion path should be:

**Free preview → interest → subscription/payment → full documentary**

---

# 23. FULL DOCUMENTARY PLAYER

Authorized users receive the full video.

Use HTML5 video or an appropriate production-ready video player.

Required controls:

- Play/pause
- Timeline
- Volume
- Fullscreen
- Playback speed
- Standard controls

Use:

`controlsList="nodownload"`

where appropriate to discourage casual downloading through browser controls.

Important:

This is a deterrent, not a security guarantee.

Do not claim that HTML video controls can make video impossible to download.

Use server-side authorization for actual access protection.

---

# 24. DOCUMENTARY INFORMATION BELOW PLAYER

Below the player display:

- Documentary title
- Summary
- Category
- Release information
- Other relevant metadata

Keep the design spacious and cinematic.

---

# 25. ABOUT PAGE

Create `/about`.

The About page should explain:

**About Aime Christian**

Explain that the platform provides documentaries covering areas such as:

- History
- Economics
- Politics
- Social welfare/lifestyle
- Diplomacy
- Investigations

Explain the mission of the platform in a credible editorial tone.

Include a CTA encouraging users to subscribe for access to new content.

The page should not be a giant block of text.

Use:

- Editorial typography
- Documentary imagery
- Glass panels
- Strong visual hierarchy

---

# 26. PRICING PAGE

Create `/pricing`.

Primary visible plan:

**2,000 RWF / month**

But show all available options:

### Weekly

700 RWF

7 days

### Monthly

2,000 RWF

30 days

### Yearly

22,000 RWF

1 year

### Single Documentary

200 RWF

1 documentary

Make the monthly plan visually prominent without hiding the other options.

Primary CTA:

**Pay with MTN MoMo**

Clearly explain the manual verification process.

---

# 27. LOGIN

Create a dedicated `/login` page.

Fields:

- Phone number
- Password

Button:

**Login / Kwinjira**

Include:

- Loading state
- Error state
- Successful authentication state

Normalize phone numbers.

After login, redirect appropriately.

If the user attempted to access a protected documentary, preserve the intended destination and return them to it after authentication.

---

# 28. ACCOUNT/SUBSCRIPTION STATE

The user should be able to understand their current access status.

Possible states:

### Free

No active subscription.

### Pending

Payment submitted and waiting for administrator confirmation.

### Active

Subscription/payment confirmed.

Show:

- Plan
- Start date
- Expiration date
- Access status

### Expired

Access has ended.

Provide a CTA:

**Renew Subscription**

---

# 29. SINGLE DOCUMENTARY PURCHASE

The existing platform supports:

**Single Documentary — 200 RWF**

This should be handled properly.

When a user chooses a single documentary:

- Associate the payment with the selected documentary.
- After payment confirmation, grant access to that documentary.
- Do not automatically grant unlimited access unless the selected plan says so.

Preserve documentary-specific entitlement information in the database.

---

# 30. ADMIN AUTHENTICATION

Create:

`/admin`

The admin interface must begin behind an authentication screen.

Fields:

- Username
- Password

Use secure server-side authentication.

Use a server-side session/cookie.

Do not expose admin credentials in frontend code.

Protect all admin API endpoints.

---

# 31. ADMIN DASHBOARD

After authentication, display a professional CMS dashboard.

Main areas:

### Verify Payments

### Upload Documentary

### Add Trailer

### Current Documentaries

Potentially also include:

- Overview/statistics
- Active users
- Pending payments
- Recent uploads

Keep the existing core functionality as mandatory.

---

# 32. ADMIN PAYMENT VERIFICATION

Display pending payment registrations.

Each record should contain:

- Customer name
- Phone number
- Plan
- Amount in RWF
- Creation date
- Payment status
- Payment screenshot/proof

Actions:

**View Proof**

**Confirm**

Optionally:

**Reject**

Add:

**Refresh**

to reload pending payments.

Payment records should be easy to scan.

Use status badges.

---

# 33. VIEW PAYMENT PROOF

Clicking:

**View Proof**

should display the uploaded MTN payment screenshot.

Use a modal/lightbox or dedicated viewer.

Allow the administrator to inspect the image clearly.

---

# 34. CONFIRM PAYMENT LOGIC

When the administrator clicks:

**Confirm**

the backend must:

1. Locate the user's account.
2. Read the selected payment plan.
3. Determine access duration.
4. Set start date.
5. Calculate expiration.
6. Set end date.
7. Set expiresAt.
8. Change payment status to confirmed.
9. Update the user's access/subscription.
10. Persist the changes.
11. Return a success response.
12. Update the dashboard UI.

Expiration rules:

### Weekly

Approximately 7 days.

### Monthly

Approximately 30 days.

### Yearly

Approximately 365 days.

### Single

Follow the existing backend behavior unless the new data model explicitly supports documentary-specific entitlement; ideally make it documentary-specific rather than granting unrelated access.

---

# 35. ADMIN DOCUMENTARY UPLOAD

Create a dedicated upload form.

Fields:

### Documentary Title

### Summary

### Video File

CTA:

**Upload Documentary**

After successful upload:

- Create documentary record.
- Store media metadata.
- Generate/store thumbnail if possible.
- Display success state.
- Refresh documentary list.

---

# 36. ADMIN TRAILER UPLOAD

Create:

**Add Trailer**

Flow:

1. Select existing documentary.
2. Choose trailer file.
3. Upload.
4. Process through required storage pipeline.
5. Associate trailer with documentary.
6. Confirm success.

---

# 37. CURRENT DOCUMENTARIES

Dashboard section:

**Current Documentaries**

Display:

- Title
- Summary
- Thumbnail where available
- Upload date
- Status
- Play/view link

Provide refresh functionality.

The admin should be able to immediately inspect existing content.

---

# 38. ADMIN LOGOUT

Provide:

**Logout**

It must:

- Destroy/invalidate the admin session.
- Clear relevant cookies.
- Redirect to admin login.

Do not simply hide the dashboard in JavaScript.

---

# 39. DATABASE ARCHITECTURE

Use Firebase Firestore as the primary application database if maintaining the existing architecture.

Core collections:

## users

Fields may include:

- id
- phone
- normalizedPhone
- fullName
- passwordHash
- createdAt
- subscriptionStatus
- selectedPlan
- amount
- paymentId
- paymentStatus
- paymentProofUrl
- startDate
- endDate
- expiresAt
- documentaryIds
- updatedAt

Do not store plaintext passwords.

---

## documentaries

Fields may include:

- id
- title
- summary
- category
- rating
- releaseDate
- status
- thumbnailUrl
- videoUrl
- cloudinaryPublicId
- cloudinarySecureUrl
- videoDuration
- trailerUrl
- trailerPublicId
- createdAt
- updatedAt
- featured
- metadata

---

## payments

Prefer a dedicated payments collection for proper auditing.

Fields:

- id
- userId
- phone
- plan
- amount
- documentaryId where applicable
- status
- proofUrl
- createdAt
- confirmedAt
- confirmedBy
- startDate
- expiresAt

This is preferable to relying entirely on payment information embedded inside users.

---

# 40. API ARCHITECTURE

Maintain an Express/Node.js backend or an equivalent secure server architecture.

Required functionality/endpoints:

### Admin

`POST /api/admin/login`

`POST /api/admin/logout`

`GET /api/admin/me`

### Payments

`POST /api/payments/create`

`POST /api/payments/upload-proof`

`POST /api/payments/confirm`

### Documentaries

`GET /api/documentaries`

`GET /api/documentaries/:id`

`POST /api/documentaries/upload`

### Access

`GET /api/me/access`

Create any additional endpoints required for the new page structure.

All protected endpoints must enforce authorization server-side.

---

# 41. SECURITY REQUIREMENTS

Treat this as a production application.

Implement:

- Password hashing using bcrypt or an equivalent secure algorithm.
- HTTP-only authentication cookies where appropriate.
- Secure cookie settings.
- Session expiration.
- CSRF protection where applicable.
- Input validation.
- File type validation.
- File size validation.
- Server-side authorization.
- Admin route protection.
- Rate limiting for authentication endpoints.
- Secure error messages.
- Environment variables for secrets.
- No Firebase admin credentials in frontend code.
- No Cloudinary secret keys in frontend code.
- No admin credentials in frontend JavaScript.
- No trust in localStorage for authorization.

Phone number normalization must occur server-side.

---

# 42. ACCESS SECURITY

The player must NOT determine access solely from:

- localStorage
- a query parameter
- a frontend variable
- a hidden UI element

The backend should verify:

1. User identity.
2. User payment/subscription status.
3. Current expiration date.
4. Documentary entitlement.
5. Whether the requested documentary exists.

Only then should protected media access be granted.

---

# 43. RESPONSIVE DESIGN

The website must be fully responsive.

Support:

### Mobile

Approximately 320px–767px

### Tablet

Approximately 768px–1023px

### Desktop

1024px+

### Large desktop

1440px+

The mobile experience must not simply be a compressed desktop.

Specifically redesign:

- Navigation
- Hero
- Documentary cards
- Featured section
- Recently added
- Pricing cards
- Forms
- Video player
- Admin dashboard

for mobile.

---

# 44. DOCUMENTARY CARD DESIGN

Documentary cards should feel premium and cinematic.

Use:

- Large artwork
- Dark glass overlay
- Subtle border
- Rounded corners
- Gradient bottom overlay
- Metadata
- Hover animation
- Red hover accent

Desktop cards can be approximately 330px wide.

The library should support horizontal scrolling/carousel behavior where appropriate.

On mobile, cards should remain easy to swipe/scroll.

Hover effects should not be essential for functionality because mobile devices do not have hover.

---

# 45. ANIMATIONS

Use subtle, premium animation.

Examples:

- Fade-in sections
- Image reveal
- Card hover lift
- Border transition
- Button hover
- Modal transitions
- Page transitions where appropriate
- Loading animations

Avoid:

- Excessive bouncing
- Distracting animations
- Long transitions
- Animation on every element

Prioritize performance.

Respect `prefers-reduced-motion`.

---

# 46. FOOTER

Create a polished cinematic footer.

Include:

**Aime Christian**

Description:

The central destination for documentaries and current stories from Rwanda and abroad.

Social platforms:

- YouTube
- Instagram
- TikTok

Also include:

- About
- Documentaries
- Pricing
- Privacy Policy
- Terms of Service

Display the copyright year dynamically.

---

# 47. PRIVACY POLICY

Create a dedicated:

`/privacy`

page.

It should explain in clear language:

- What information is collected
- Phone number usage
- Account information
- Payment proof collection
- Documentary access information
- Cookies/session data
- How information is stored
- Third-party services
- Security
- User rights
- Contact information
- Policy updates

Do not invent overly specific legal claims.

Make the document professional and understandable.

---

# 48. TERMS OF SERVICE

Create:

`/terms`

Include:

- Account responsibilities
- Subscription/payment rules
- Manual payment verification
- Access expiration
- Documentary access
- Single-documentary purchases
- Content ownership
- Acceptable use
- Prohibited redistribution
- Service availability
- Account termination
- Disclaimer
- Changes to terms
- Contact information

---

# 49. SEO / META TAGS

Every public page must have appropriate metadata.

Implement:

- `<title>`
- Meta description
- Canonical URL
- Open Graph title
- Open Graph description
- Open Graph image
- Twitter/X card metadata
- Appropriate viewport metadata
- Favicon
- Theme color

Examples:

Homepage title:

**Aime Christian Documentaries | Ibyegeranyo.com**

Documentary page title:

**[Documentary Title] | Aime Christian Documentaries**

Use meaningful descriptions rather than generic placeholder text.

---

# 50. ACCESSIBILITY

Follow good accessibility practices.

Implement:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Proper labels
- ARIA attributes where appropriate
- Accessible modals
- Accessible navigation
- Alt text for images
- Sufficient text contrast
- Keyboard-accessible buttons
- Accessible form errors

Do not use color alone to communicate important information.

---

# 51. PERFORMANCE

The site must be optimized.

Implement:

- Lazy loading for documentary images
- Responsive images
- Efficient video loading
- Code splitting where appropriate
- Optimized fonts
- Minimal unnecessary JavaScript
- Efficient Firestore queries
- Pagination where appropriate
- Caching where appropriate

Do not load every documentary video on the homepage.

Do not preload huge full documentary files.

Only load video when needed.

---

# 52. ERROR STATES

Every important operation must have clear error handling.

Examples:

### Network failure

“Unable to connect. Please try again.”

### Login failure

“Incorrect phone number or password.”

### Payment upload failure

“Payment proof could not be uploaded. Please try again.”

### Documentary loading failure

“Unable to load documentaries.”

### Upload failure

“Upload failed. Please check the file and try again.”

### Unauthorized player

“Your subscription does not currently provide access to this documentary.”

Never show raw server errors or stack traces to normal users.

---

# 53. LOADING STATES

Create polished loading UI for:

- Documentary library
- Documentary detail
- Player
- Login
- Registration
- Payment creation
- Proof upload
- Admin dashboard
- Payment verification
- Documentary upload
- Trailer upload

Avoid blank screens.

Use skeleton loaders or elegant spinners where appropriate.

---

# 54. EMPTY STATES

Create useful empty states.

Examples:

**No documentaries available yet.**

**No pending payments.**

**No active subscription.**

**No trailer available.**

Each empty state should tell the user what they can do next.

---

# 55. DATA VALIDATION

Validate on both client and server.

Phone:

- Validate Rwanda-compatible phone numbers.
- Normalize before storage.

Password:

- Require reasonable minimum strength.

Name:

- Required.

Plan:

- Must match an allowed plan.

Payment amount:

- Must be derived from the selected plan server-side.

Files:

- Validate MIME type.
- Validate extension.
- Validate size.
- Reject suspicious uploads.

Never trust payment amount submitted by the browser.

---

# 56. IMPORTANT: PAYMENT SECURITY

The frontend must never be able to decide:

“I paid 2,000 RWF, therefore activate my subscription.”

Instead:

Frontend submits plan.

Backend determines official price.

Payment is created as pending.

Admin confirms payment.

Backend activates access.

This prevents users from manipulating the amount or subscription duration.

---

# 57. USER EXPERIENCE FLOW

Implement this complete flow:

Visitor

↓

Homepage

↓

Cinematic hero

↓

Explore documentaries

↓

Browse featured documentaries

↓

Browse recently added

↓

Select documentary

↓

See documentary details

↓

Watch trailer/preview

↓

Attempt to watch full documentary

↓

Access gate

↓

Subscribe

↓

Registration

↓

Select plan

↓

MTN MoMo payment instructions

↓

Upload payment screenshot

↓

Payment status = Pending

↓

Administrator reviews payment

↓

Administrator confirms

↓

Subscription/access becomes active

↓

User logs in

↓

Backend verifies access

↓

Full documentary becomes available

↓

User watches documentary ad-free

---

# 58. ADMIN FLOW

Admin:

↓

Visit `/admin`

↓

Login

↓

Dashboard

↓

View pending payments

↓

Open payment proof

↓

Verify payment

↓

Confirm

↓

Subscription activated

OR

↓

Upload documentary

↓

Video → Vercel Blob → Cloudinary

↓

Documentary record created

↓

Documentary appears in public library

↓

Optionally upload trailer

↓

Trailer associated with documentary

↓

Public visitors can preview it

---

# 59. HOMEPAGE VISUAL HIERARCHY

The homepage should feel like a premium streaming/editorial website.

Priority:

### 1. Hero

Strong cinematic visual.

### 2. Featured documentaries

Large editorial storytelling.

### 3. Recently Added

Dense catalogue browsing.

### 4. About

Trust and brand story.

### 5. Pricing

Conversion.

### 6. Footer

Navigation and social proof.

Do not make every section equally visually loud.

---

# 60. DESIGN DETAILS

Use generous spacing.

Use strong contrast.

Use subtle borders.

Use cinematic imagery.

Use dark overlays.

Use large editorial headings.

Use red for important actions.

Use gold for premium brand highlights.

Use glass surfaces sparingly.

Use consistent border radius.

Use consistent spacing scale.

Create a coherent design system rather than styling each page independently.

---

# 61. COMPONENT ARCHITECTURE

Build reusable components.

Examples:

- Navbar
- Footer
- Hero
- DocumentaryCard
- FeaturedDocumentaryCard
- RecentlyAddedItem
- StatusBadge
- PricingCard
- LoginForm
- RegistrationForm
- PaymentProofUpload
- DocumentaryPlayer
- AccessGate
- TrailerPlayer
- Modal
- Toast
- LoadingState
- EmptyState
- ErrorState
- AdminSidebar
- AdminHeader
- PaymentVerificationCard
- DocumentaryUploadForm
- TrailerUploadForm

Do not duplicate the same UI code across pages unnecessarily.

---

# 62. STATE MANAGEMENT

Handle:

- Authentication state
- Subscription state
- Documentary data
- Payment state
- Admin state
- Loading states
- Error states

Avoid unnecessary global state.

Keep sensitive authentication decisions server-side.

---

# 63. ENVIRONMENT VARIABLES

Create an `.env.example`.

Potential variables:

- Firebase configuration
- Firebase Admin credentials
- Cloudinary cloud name
- Cloudinary API key
- Cloudinary API secret
- Vercel Blob token
- Session secret
- Admin configuration
- Application URL

Never commit secrets.

Never place secret credentials into client-side code.

---

# 64. PROJECT QUALITY

The generated project must be:

- Clean
- Modular
- Maintainable
- Production-oriented
- Responsive
- Secure
- Accessible
- Performant

Use clear naming conventions.

Use reusable utilities.

Add meaningful comments only where they improve maintainability.

Avoid giant monolithic components.

---

# 65. DO NOT DO THESE THINGS

Do NOT:

- Build only a visual prototype.
- Hard-code documentary data.
- Hard-code payment status.
- Hard-code admin login into frontend JavaScript.
- Trust localStorage for access authorization.
- Expose Cloudinary secrets.
- Expose Firebase Admin credentials.
- Fake MTN payment confirmation.
- Allow users to manipulate subscription prices.
- Show protected video URLs to unauthorized users.
- Make the entire website one enormous page.
- Leave TODO placeholders for core functionality.
- Use fake API responses when real backend functionality is required.
- Create non-functional buttons.
- Use generic lorem ipsum.
- Ignore mobile.
- Ignore error states.
- Ignore empty states.
- Ignore loading states.
- Remove existing core functionality without a reason.

---

# 66. IMPLEMENTATION PRIORITY

If there is a conflict between visual polish and core functionality, prioritize in this order:

1. Security
2. Authentication
3. Payment/access logic
4. Documentary retrieval
5. Video storage and playback
6. Admin functionality
7. Responsive behavior
8. UX
9. Visual polish
10. Animation

The website must actually work before being decorated.

---

# 67. FINAL QA REQUIREMENT

Before considering the project complete, perform a full internal QA pass.

Verify:

## Public website

- Homepage loads.
- Navigation works.
- Hero video works.
- Hero CTAs work.
- Documentary library loads dynamically.
- Featured documentaries work.
- Recently Added works.
- About page works.
- Pricing page works.
- Footer links work.
- Privacy page works.
- Terms page works.

## Authentication

- Registration works.
- Login works.
- Logout works.
- Phone normalization works.
- Passwords are hashed.
- Authentication persists correctly.
- Invalid credentials produce safe errors.

## Payments

- Plans display correctly.
- Prices are correct.
- Payment creation works.
- Payment proof upload works.
- Pending state works.
- Admin can view proof.
- Admin can confirm.
- Subscription expiration is calculated correctly.
- Unauthorized users cannot access protected content.

## Documentary system

- Admin can upload documentary.
- Video follows:

**Vercel Blob → Cloudinary**

- Documentary appears in database.
- Documentary appears publicly.
- Trailer can be uploaded.
- Trailer can be played.
- Full documentary requires authorization.
- Player loading state works.
- Not-found state works.
- Access-denied state works.
- Authorized player works.

## Admin

- Admin login works.
- Unauthorized visitors cannot access dashboard.
- Pending payments display.
- Payment proof opens.
- Confirm works.
- Documentary upload works.
- Trailer upload works.
- Current documentaries display.
- Logout works.

## Responsive

Test:

- 320px
- 375px
- 768px
- 1024px
- 1440px+
 
Ensure there is no:

- Horizontal overflow
- Broken navigation
- Cut-off text
- Broken video
- Unusable forms
- Overlapping modals

---

# 68. FINAL DELIVERABLE

Deliver a complete working full-stack project.

The final result should feel like:

**A premium Netflix-inspired documentary platform built specifically for Aime Christian and Ibyegeranyo.com.**

The visual language should combine:

**dark cinematic streaming UI + editorial documentary storytelling + red CTA accents + gold premium branding + glassmorphism + strong typography.**

The functional architecture should combine:

**documentary catalogue + trailer previews + paid access + manual MTN MoMo verification + Firebase user/content data + secure authentication + administrator CMS + Vercel Blob → Cloudinary video storage pipeline.**

The final application should be ready to deploy rather than being a design concept.

---

# 69. MOST IMPORTANT INSTRUCTION

Treat every requirement in this specification as intentional.

Do not simplify away functionality because it requires additional implementation.

Do not replace real functionality with mock data.

Do not omit pages because the homepage is easier.

Do not omit backend functionality because the frontend looks complete.

Do not stop after generating the UI.

Build the entire system from scratch.

When something is unclear, preserve the behavior of the existing platform described in this specification rather than inventing a completely different product.

At the end, provide:

1. Complete project structure
2. All source code
3. Database/data model
4. API implementation
5. Authentication implementation
6. Payment workflow
7. Video upload workflow
8. Admin dashboard
9. Responsive frontend
10. Environment-variable documentation
11. Setup instructions
12. Deployment instructions
13. Final QA verification

The goal is a **fully functional production-ready Ibyegeranyo.com**, not a prototype.