# Organization sender setup

Email sender: **kulsresthawf@gmail.com**
WhatsApp sender: **+91 8826961430**
NGO contact email in receipts remains **info@kulshresthawf.org**.

## Current webhook

https://script.google.com/macros/s/AKfycbwUoZoPEJtlIiwdR8K51HsaduELV4PGZKi-yAGKMWK_dMAZ3oZ2-RvjmjFrNJhOZUJmHQ/exec

The app uses this URL for receipt email, Sheets sync and login OTP requests. This update migrates existing browser sender/webhook settings once, preserving other settings and donation records. Donor recipients are unchanged.

## Apps Script setup

1. Open the script using the **kulsresthawf@gmail.com** Google account.
2. Ensure the deployed script has `var KWF_SENDER_EMAIL = "kulsresthawf@gmail.com";`. If it still says info@kulshresthawf.org, replace the script with [donation-email-apps-script.gs](../scripts/donation-email-apps-script.gs) from this repo.
3. Save → Deploy → Manage deployments → Edit → New version → Deploy. Choose **Execute as: Me (kulsresthawf@gmail.com)** and retain the existing Web App URL.
4. If this Gmail address is the executing account's primary email, no separate Send mail as alias is needed. The script will refuse to send from a different unverified account rather than silently using another Gmail address.
5. Refresh the app. Check an authorized receipt email in your own inbox and Apps Script execution logs to confirm actual sender and attachment delivery. No email was sent automatically while changing this configuration.

Editing the repository does not change an already deployed Google Apps Script. Updating the sender constant and deploying a new version must be done in the Google account.

## WhatsApp

The WhatsApp sender stays +91 8826961430. Log in/link this number in WhatsApp Web/mobile before opening a donor receipt draft. The portal cannot select the sender account or automatically press Send.

## Validation limits

Mocked checks cover sender selection, rejection of another unverified Gmail account, preservation of recipient/PDF/HTML fields and migration of cached sender and webhook configuration. External Apps Script execution, mailbox permissions and actual delivery are not confirmed by the app's opaque no-cors response.
