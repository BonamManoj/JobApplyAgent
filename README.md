# Application Paste Assistant

A small Chrome extension that detects fields on job application pages and fills them with profile information stored locally in Chrome.

The side panel supports multiple named profiles. Profile 1 starts with blank fields so you can enter your own information; every profile is persisted in `chrome.storage.local` across extension reloads. Use **Reload** on `chrome://extensions` when updating rather than removing the extension.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project directory.
5. Pin the extension, open a normal application form, and click the extension icon.

If a page was already open before the extension was installed, refresh that page once.

## Try it

1. Open the side panel and select **My profile**.
2. Enter your details in Profile 1 and click **Save profile**.
3. Use the profile dropdown or **+ Add profile** to keep different versions of your application information.
4. Open a page containing a form.
5. Click **Scan page**.
6. Use an individual **Fill** button or **Fill all recognized fields**.

## Current scope

- Detects visible text inputs, text areas, and normal HTML dropdowns.
- Uses labels, placeholders, field names, IDs, and browser autocomplete hints.
- Shows each employer as a separate editable company card with its own title, dates, location, and description.
- Supports common work-authorization, sponsorship, relocation, education, and EEO decline fields.
- Can keep a resume locally and attach it to a recognized resume/CV input after you click **Attach**.
- Stores profile data with `chrome.storage.local`; it is not sent to a server.
- Does not submit forms, solve CAPTCHAs, or fill passwords.

Custom dropdowns, deeply nested embedded forms, and unusual framework-controlled inputs will need additional site-specific testing.

## Phone numbers and separate work entries

- A phone country code is detected separately from the phone number, including `type="tel"` code inputs and `tel-country-code` autocomplete hints. Text fields receive `+91`, numeric fields receive `91`, and supported dropdowns match the saved country/code to their options.
- When a form has a separate country-code control, the phone-number field receives digits only and excludes `+91`. Store your country code separately in **My profile**.
- Recognized Local Given Name and Local Family Name fields are deliberately left blank.
- Each detected work entry has a **use saved company** dropdown. Its company, title, location, dates, and role description come from that one saved employer. If the portal shows one entry at a time, choose the employer here before filling the entry, then scan again after adding the next entry.
- A missing title or description in an earlier work entry no longer shifts later fields to a different employer. Numbered work sections and existing company values help choose the corresponding saved employer; check the selector when a portal uses an unusual layout.
- Workday record IDs such as `workExperience-4` and `workExperience-16` group the job's fields together; their internal numbers are not treated as profile indexes. Nested month/year wrappers belong to the same entry as its company and role description.
- Click **Fill saved work experience (add missing entries)** to fill the saved employers, use the Work Experience section's **Add another** button for missing entries, and fill those new entries. Existing matching employers are reused on subsequent clicks. If the button or newly added form cannot be identified, the action stops and explains what remains. It does not remove extra entries or submit the form.
- The **Skills** Fill button searches for each saved skill separately, clicks an exact suggestion, verifies its selected chip, and clears Search before continuing. It keeps existing selections and reports skills that were not available or could not be verified. Plain skills text areas still receive the saved text.
- Fill all preserves existing values and reports fields it could not fill. Use individual Fill buttons if you intend to replace an existing value.

The telephone autocomplete meanings follow the [HTML standard](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html).

## Automated regression checks

Run `node tests/run-browser-tests.cjs`. This opens headless Chrome (or Edge) with a temporary browser profile and synthetic data. It exercises the actual scanner, filling code, and side-panel company selector against local fixtures. It does not submit applications or access your regular Chrome profile. Set `TEST_BROWSER` to a Chromium executable if it is not installed in a standard Windows location.

Regression fixtures include deeply nested Workday date controls with nonsequential record IDs, missing descriptions, delayed Add another rendering, repeated fills, unrelated Education Add another buttons, and skills search with existing, duplicate, and unavailable skills. These checks do not establish compatibility with every live Workday tenant.

## Safe local test

The included `test-form.html` never submits or sends data anywhere.

1. In `chrome://extensions`, open this extension's **Details** page and enable **Allow access to file URLs**.
2. Open `test-form.html` directly in Chrome.
3. Open the extension side panel, save a test profile, and scan the page.
4. Try the individual buttons and **Fill all recognized fields**.

For Workday-specific controls, repeat the same test with `test-workday.html`. It simulates Workday's
`data-automation-id` fields, custom dropdown buttons, search comboboxes, employment dates, education,
and resume input without contacting a real employer.
