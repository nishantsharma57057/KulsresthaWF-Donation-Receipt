# Organization sender setup

Requested sender email: info@kulshresthawf.org
Requested WhatsApp sender: +91 8826961430

The app defaults and old cached sender settings are updated. Recipients remain the donor email/phone; these sender details never replace the recipient. The repo script and both copyable Apps Script snippets now select the verified organization sender for donation emails and login OTPs. This does not update an already deployed Apps Script automatically.

## Email: finish in the account that runs Apps Script

1. In the Gmail account that owns the deployed Apps Script, open Settings → See all settings → Accounts and Import (or Accounts) → Send mail as → Add another email address.
2. Add Kulshrestha Welfare Foundation and info@kulshresthawf.org. Use the mailbox provider's outgoing SMTP settings when requested. Enter mailbox credentials only in Gmail's own setup screen.
3. Complete verification using the message received at info@kulshresthawf.org. Alternatively deploy Apps Script as the Google Workspace account whose primary email is info@kulshresthawf.org.
4. Open the connected Google Sheet → Extensions → Apps Script. Replace the existing script with scripts/donation-email-apps-script.gs from this repository and save.
5. Deploy → Manage deployments → Edit → New version → Deploy, keeping the existing webhook URL. The script must execute as the verified sending account.
6. Submit an authorized test receipt to your own recipient address and inspect From, Reply-To, attachment and Apps Script execution logs. The app's no-cors request does not prove delivery.

If the organization sender is unavailable, the updated script returns a sender setup error instead of silently sending from a personal Gmail account. Replies are addressed to info@kulshresthawf.org. An email draft opened through mailto uses the email client/account selected on that device; it cannot enforce the sender.

## WhatsApp: finish on the sending device

1. Use WhatsApp/WhatsApp Business registered with +91 8826961430.
2. For desktop, link that account to WhatsApp Web using the phone's Linked devices screen.
3. From the app open the donor receipt draft, confirm the sending account is +91 8826961430, then click Send in WhatsApp.

The current integration is click-to-chat. Sender selection is controlled by the logged-in WhatsApp account. Fully automatic sending requires a separately connected WhatsApp Business Platform integration; no provider or billing setup was added by this change.

## Validation and deployment limits

Mocked tests cover verified alias selection, primary account sender, unavailable sender rejection and preservation of donation/OTP recipients and receipt attachments. No real emails or WhatsApp messages are sent during validation. Mailbox alias verification, Apps Script deployment and the linked WhatsApp account cannot be confirmed from the repository.

Official references:
- https://developers.google.com/apps-script/reference/gmail/gmail-app
- https://support.google.com/mail/answer/22370
- https://faq.whatsapp.com/5913398998672934
