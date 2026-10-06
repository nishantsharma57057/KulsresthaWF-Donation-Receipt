# Production readiness review — 6 October 2026

This is a source-code review, not confirmation of deployed Firebase rules, Apps Script configuration, inbox delivery or a complete browser end-to-end test.

## Completed in this change

- Dashboard/sidebar uses the uploaded wide logo, preserving its aspect ratio.
- Removed all five automatic sample donation seeds and malformed-cache fallback seeds.
- Exact legacy demo fingerprints are excluded from cached and live donation views, counters, reports and exports. Real records with a matching donor name or receipt number alone remain visible. No Firestore records were deleted.
- Empty cloud collections no longer trigger automatic uploads of cached donations. Real local receipts remain cached.
- Removed the example spreadsheet ID from defaults and migrated that exact placeholder to empty.
- Removed the fixed tax registration order date and unsupported PAN validation / filing-ready claims.
- Dashboard attention count now derives from donation statuses.
- Removed randomly fabricated spreadsheet row IDs. Sync requests remain unconfirmed with an opaque no-cors response; fetch failures and missing webhook configuration are reported.
- New receipts and opening an email draft no longer claim email delivery. Settings email test no longer simulates verified delivery; WhatsApp configuration test uses the entered number and a clearly identified test message.
- Sheets ledger is labeled as local records, not a live readback from Sheets.

## Pending before calling the app production-ready

| Priority | Finding | Required work |
| --- | --- | --- |
| Critical | Repository Firestore rules allow public read/write on donations, users and settings. Actual deployed rules were not inspected. | Introduce Firebase Authentication or server authentication and enforced role/approval rules; test staff/admin permissions before deploying restrictive rules. |
| Critical | Custom login stores plaintext password values under passwordHash and ships default credentials. Client-side sessions and client-side OTP checks are bypassable. | Migrate existing users to a managed authentication service; enforce approval and roles server-side; remove defaults and rotate credentials after migration. |
| High | Donation creation saves locally and starts cloud persistence without awaiting success. Receipt numbers are computed on the client and may collide across users. | Await confirmed writes, surface failures and allocate receipt numbers atomically on the server. |
| High | Apps Script requests use no-cors, so the frontend cannot verify writes or email delivery. Existing records marked synced/sent were not externally reverified. | Add an authenticated backend with idempotent requests, explicit responses and delivery tracking. Deploy the updated script and verify authorized test receipts in Sheets and the inbox. |
| High | Shared receipts use an editable snapshot in the URL fragment. | Use an opaque signed reference to a hosted receipt/PDF, with authenticity checks and retention controls. |
| Medium | Forgot password currently opens an admin-assisted reset request. | Add expiring single-use password reset links through the managed auth provider. |
| Medium | 80G and 12A registration fields are blank in the supplied NGO profile; export fields are not independently validated. | Enter verified registration details and validate reports before filing. |
| Medium | Settings are cached locally and the Settings menu is hidden; global configuration is not consistently loaded across devices. | Add authorized settings access and a consistent cloud configuration source. |
| Medium | Automated CI, backups/restore, monitoring and browser end-to-end coverage were not established by this review. | Add coverage for registration approval, auth, donation persistence, PDF/share, email and Sheets; exercise backup restore and error alerts. |

## Scope and data protection

Legacy demo records are hidden only when every fingerprint field matches (ID, receipt number, date, donor name, amount, transaction ID). This does not delete cloud data. Existing user accounts, passwords, roles and real donations are not changed by this cleanup. Old delivery statuses need external verification rather than a blanket rewrite of real donation history.
