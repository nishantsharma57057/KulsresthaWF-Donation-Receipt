# Receipt email blocked by an unlinked spreadsheet

## Reproduced failure

The existing script sends OTP before doing any Sheets work. With a standalone Apps Script and no Spreadsheet ID, OTP succeeds, but a donation request fails with:

`TypeError: Cannot read properties of null (reading 'getSheetByName')`

It fails before GmailApp.sendEmail is reached. This was reproduced with mocks; the live Apps Script execution logs have not been inspected.

## Fix

The updated script isolates Sheets sync errors from receipt email. A missing/unauthorized Sheet does not block Gmail receipt delivery. Results contain emailSent, sheetSynced and sheetError. The app can schedule automatic receipt email even when automatic Sheets sync is disabled, while avoiding a second email when the combined sync request already sends it. Explicit email requests keep PDF/HTML/inline images.

## Required deployment in Google Apps Script

1. Open the existing script using kulsresthawf@gmail.com.
2. Replace all code with [donation-email-apps-script.gs](../scripts/donation-email-apps-script.gs).
3. Save → Deploy → Manage deployments → Edit → New version → Deploy. Retain the same webhook URL; Execute as Me (kulsresthawf@gmail.com).
4. Refresh the app. From an existing donation choose Send email, set your own test recipient and submit. Do not create a duplicate donation just to retry delivery.
5. Check inbox/spam and Apps Script → Executions. A Sheets warning may remain until the Sheet is linked, but the receipt email step continues. An email request submitted message in the app does not prove inbox delivery.

To enable Sheets sync too, supply the intended Google Sheet's Spreadsheet ID in app settings or use a Sheet-bound script. The new Gmail account must have access to that Sheet.

## Validation

Mocked regression checks compare the old standalone failure with successful email after the fix. Checks also cover Sheet errors, recipient/PDF/HTML preservation, OTP, email/sync flags and automatic email scheduling without duplicate requests. No actual donor or test email is sent by these checks. Live inbox delivery still requires Apps Script deployment and an authorized recipient test.
