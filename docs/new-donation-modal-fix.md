# New donation modal fix

## Behavior

Closing the donation dialog now unmounts its form. Reopening New donation starts a fresh form rather than displaying the previous success screen. Record Another Donation also starts a new form session, resetting all fields, toggles, errors and the donation date/time. Date and time use Asia/Kolkata.

## Additional improvements

- Escape closes the dialog; keyboard focus stays within it and returns to the opener on close.
- The page behind the dialog does not scroll; the dialog scrolls on small screens.
- A submission guard prevents immediate repeated submit events from creating duplicate records.
- Invalid PAN/amount and save errors appear inline.
- Success copy no longer claims every delivery action completed or that Sheets sync was confirmed.
- Removed the unused automatic email checkbox, which did not submit an email request. The existing email action is labeled Open Email Draft. The separate receipt email request flow is unchanged.

## Verification

Mocked React/DOM regression checks passed for close/reopen after saving, complete reset for another donation, India date/time across UTC midnight, repeated submit events, PAN validation, save errors, Escape, focus restoration/containment and scroll cleanup. No real donation, message, email or external Sheets request was created by the checks. Production build status is verified through Vercel; a full interactive browser workflow was not run.

## Restore

This change is isolated in one commit. Revert that commit to restore the previous modal implementation. The previous main revision was 67631ddd761f0eb347e389c357509c301bc8e01d. No existing donation records or accounts were changed.
