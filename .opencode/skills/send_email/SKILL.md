# send_email

## Purpose
Dispatches emails directly via the Resend HTTP API with optional attachments from the desktop container filesystem (`/home/user/...`). Avoids brittle, slow webmail GUI navigation and authentication prompts.

## Parameters & Bounds
| Param | Type | Valid range / values | Default | Description |
|---|---|---|---|---|
| `to` | string \| array | Valid email address(es) | required | Recipient email address(es) |
| `subject` | string | Non-empty string | required | Email subject line |
| `body` | string | Plain text or HTML | required | Body message content (HTML supported) |
| `from` | string | Valid email address | env `RESEND_FROM_EMAIL` (`onboarding@resend.dev`) | Sender address |
| `attachments` | array of strings | Absolute paths in desktop container | optional | Absolute paths on desktop VM, e.g. `["/home/user/Desktop/report.xlsx"]` |

## When To Use
- Whenever the user asks to email findings, reports, spreadsheets, PDFs, or generated summaries.
- After creating a spreadsheet (`.xlsx` or `.csv`) on `/home/user/Desktop/` and delivering it to the user.
- To send instant status notifications or completed work reports.

## When To Avoid
- Do NOT open webmail (e.g. Gmail, Outlook) in the browser or open Thunderbird to manually type emails unless explicitly instructed to test the email GUI client.
- When `RESEND_API_KEY` is not configured in `.env`.

## Canonical Examples
- **Good (Plain message):**
  ```json
  send_email({
    "to": "user@example.com",
    "subject": "Competitor Analysis Summary",
    "body": "Here is the summary of our market research..."
  })
  ```
- **Good (With attachment):**
  ```json
  send_email({
    "to": "user@example.com",
    "subject": "Monthly Sales Data",
    "body": "<p>Please find attached the latest sales spreadsheet.</p>",
    "attachments": ["/home/user/Desktop/sales_q3.xlsx"]
  })
  ```
- **Wrong:**
  `send_email({ "to": "user@example.com", "attachments": ["relative_file.xlsx"] })` — Attachment paths must be absolute paths inside the desktop VM (e.g. `/home/user/Desktop/relative_file.xlsx`).

## Common Pitfalls
- Specifying relative attachment paths instead of absolute paths starting with `/home/user/`.
- Sending to unverified third-party email addresses when using the free Resend test sender `onboarding@resend.dev` (the free tier only permits delivery to the email address registered on your Resend account).

## Post-Action Verification
The tool returns a confirmation message containing the Resend dispatch ID and recipient count.
