# Expense App — Spec
## 1. Purpose
Track daily expenses; local first (localStorage) + cloud backup (Google Sheets via GAS JSONP).

## 2. Features
- Add/list/delete expenses
- Category summary + grand total
- Export/Import JSON
- Cloud sync to Google Sheets
- Completion report (Submissions)

## 3. Data Model (localStorage)
expenses: [{ id:number, date:string(YYYY-MM-DD), category:string, amount:number, memo?:string }]

## 4. Cloud API
Endpoint: <GAS Web App /exec> (JSONP)
- create: GET ?action=create&payload={"item":{...}}&cb=...
- list:   GET ?action=list&payload={}&cb=...
- delete: GET ?action=delete&payload={"id":123}&cb=...
- complete: GET ?action=complete&payload={...}&cb=...

## 5. Validation
- date required, category required, amount number≥0
- graceful error alerts

## 6. Security/Privacy
- No secrets in client; Spreadsheet ID in Script Properties
- Public GAS “Anyone”; only appends rows; no PII beyond memo.

## 7. Deployment
- Frontend: GitHub Pages (main/root)
- Backend: Apps Script Web App (Execute as Me / Anyone)

## 8. Acceptance Criteria
- Add → list persists after reload
- Sync → rows appear in Expenses
- Complete → Submissions gets a row
