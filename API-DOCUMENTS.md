# API Spec — Offer Letters & Salary Slips

For the Pratham Venture admin panel. Follows the same conventions as the
existing API: all endpoints require `Authorization: Bearer <JWT>`, errors are
returned as `{ "error": "message" }`, lists return `{ data, pagination }`.

---

## 1. Offer Letters

### Data model

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string / int | auto | primary key |
| company | string | yes | company name shown on letterhead, e.g. "Pratham Venture", "Inkline Digital Solutions" |
| candidateName | string | yes | |
| position | string | yes | |
| department | string | no | |
| annualCtc | number | no | in ₹, e.g. 600000 |
| joiningDate | date (ISO) | no | e.g. "2026-08-01" |
| workLocation | string | no | e.g. "Ahmedabad, Gujarat" |
| letterDate | date (ISO) | no | date printed on the letter |
| hrName | string | no | signatory |
| hrDesignation | string | no | e.g. "HR Manager" |
| employeeRefId | int | no | FK → Employee.id — link for View Client page |
| createdAt / updatedAt | datetime | auto | |
| deletedAt | datetime | auto | soft delete — set on DELETE, null when active |

### Endpoints

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| POST | /api/offer-letters | full object (include `employeeRefId` when picking an employee) | created object |
| GET | /api/offer-letters | ?page&limit&search&employeeRefId&status=active\|inactive\|all | { data, pagination } |
| GET | /api/offer-letters/:id | ?status=active\|inactive\|all (default active) | object + `status` |
| PATCH | /api/offer-letters/:id | any subset of fields; `{ "restore": true }` to undelete | updated object |
| DELETE | /api/offer-letters/:id | — | soft delete → inactive (`deletedAt` set); `{ success: true }` |

### Example POST body

```json
{
  "company": "Inkline Digital Solutions",
  "candidateName": "Janak Patel",
  "position": "Frontend Developer",
  "department": "Engineering",
  "annualCtc": 600000,
  "joiningDate": "2026-08-01",
  "workLocation": "Ahmedabad, Gujarat",
  "letterDate": "2026-07-17",
  "hrName": "Priya Shah",
  "hrDesignation": "HR Manager",
  "employeeRefId": 5
}
```

---

## 2. Salary Slips

### Data model

| Field | Type | Required | Notes |
|---|---|---|---|
| id | string / int | auto | primary key |
| company | string | yes | company name on the slip header |
| employeeName | string | yes | |
| employeeId | string | no | e.g. "PV-014" (display code) |
| employeeRefId | int | no | FK → Employee.id — link for View Client page |
| designation | string | no | |
| department | string | no | |
| month | string | yes | "YYYY-MM", e.g. "2026-07" |
| basic | number | yes | earnings, ₹ |
| hra | number | no | earnings |
| conveyance | number | no | earnings |
| special | number | no | earnings (special allowance) |
| pf | number | no | deduction (provident fund) |
| profTax | number | no | deduction (professional tax) |
| tds | number | no | deduction |
| otherDeduction | number | no | deduction |
| uan | string | no | Universal Account Number |
| pfNumber | string | no | PF No. (string ID — separate from `pf` amount) |
| esiNumber | string | no | ESI No. |
| bankName | string | no | bank name |
| bankAccountNo | string | no | account number |
| createdAt / updatedAt | datetime | auto | |
| deletedAt | datetime | auto | soft delete — set on DELETE, null when active |

Totals (`totalEarnings`, `totalDeductions`, `netPay`) are **calculated by the
frontend** — no need to store them, but storing `netPay` is fine if you want it
queryable.

Optional uniqueness rule: one slip per (employeeId, month, company).

### Endpoints

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| POST | /api/salary-slips | full object (include `employeeRefId` when picking an employee) | created object |
| GET | /api/salary-slips | ?page&limit&month&search&employeeRefId&status=active\|inactive\|all | { data, pagination } |
| GET | /api/salary-slips/:id | ?status=active\|inactive\|all (default active) | object + `status` |
| PATCH | /api/salary-slips/:id | any subset of fields; `{ "restore": true }` to undelete | updated object |
| DELETE | /api/salary-slips/:id | — | soft delete → inactive (`deletedAt` set); `{ success: true }` |

### Example POST body

```json
{
  "company": "Pratham Venture",
  "employeeName": "Harsh Rathod",
  "employeeId": "PV-014",
  "designation": "Frontend Developer",
  "department": "Engineering",
  "month": "2026-07",
  "basic": 30000,
  "hra": 12000,
  "conveyance": 1600,
  "special": 5000,
  "pf": 1800,
  "profTax": 200,
  "tds": 0,
  "otherDeduction": 0,
  "uan": "100123456789",
  "pfNumber": "GJ/AHD/12345/0001234",
  "esiNumber": "37000000000000001",
  "bankName": "Kotak Mahindra Bank",
  "bankAccountNo": "50100123456789",
  "employeeRefId": 5
}
```

---

## 3. Employees

Master list used to prefill **Offer Letter** and **Salary Slip** forms.
Pick a company on those screens, then load employees with the by-company API.

### Data model

| Field | Type | Required | Notes |
|---|---|---|---|
| id | int | auto | primary key |
| company | string | yes | e.g. "Pratham Venture", "Inkline Digital Solutions" |
| name | string | yes | full name |
| employeeCode | string | no | e.g. "PV-014" (maps to salary slip `employeeId`) |
| email | string | no | |
| phone | string | no | |
| designation | string | no | maps to offer `position` / slip `designation` |
| department | string | no | |
| workLocation | string | no | |
| joiningDate | date (ISO) | no | YYYY-MM-DD |
| annualCtc | number | no | for offer letter prefilling |
| uan | string | no | Universal Account Number |
| pfNumber | string | no | PF No. |
| esiNumber | string | no | ESI No. |
| bankName | string | no | bank name |
| bankAccountNo | string | no | bank account number |
| createdAt / updatedAt | datetime | auto | |
| deletedAt | datetime | auto | soft delete |

### Endpoints

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| POST | /api/employees | full object | created object + `status` |
| GET | /api/employees | ?company&page&limit&search&status=active\|inactive\|all | { data, pagination } |
| GET | /api/employees/by-company | **?company=...** (required) | `{ data: [...] }` active employees for that company (for dropdowns) |
| GET | /api/employees/:id/overview | ?status=&docStatus=active\|inactive\|all | **View Client** — employee + salarySlips + offerLetters |
| GET | /api/employees/:id/salary-slips | ?page&limit&status | paginated slips for that employee |
| GET | /api/employees/:id/offer-letters | ?page&limit&status | paginated letters for that employee |
| GET | /api/employees/:id | ?status=active\|inactive\|all | object + `status` |
| PATCH | /api/employees/:id | any subset; `{ "restore": true }` | updated object |
| DELETE | /api/employees/:id | — | soft delete → `{ success: true }` |

### Example POST body

```json
{
  "company": "Pratham Venture",
  "name": "Harsh Rathod",
  "employeeCode": "PV-014",
  "email": "harsh@prathamtech.com",
  "phone": "9876543210",
  "designation": "Frontend Developer",
  "department": "Engineering",
  "workLocation": "Ahmedabad, Gujarat",
  "joiningDate": "2026-08-01",
  "annualCtc": 600000,
  "uan": "100123456789",
  "pfNumber": "GJ/AHD/12345/0001234",
  "esiNumber": "37000000000000001",
  "bankName": "HDFC Bank",
  "bankAccountNo": "50100123456789"
}
```

### Frontend: connect to Offer Letter / Salary Slip

1. User selects **company** on the form.
2. Call `GET /api/employees/by-company?company=Pratham%20Venture`
3. Show employees in a dropdown; on select, prefill:

| Employee field | Offer letter field | Salary slip field |
|---|---|---|
| `name` | `candidateName` | `employeeName` |
| `employeeCode` | — | `employeeId` |
| `designation` | `position` | `designation` |
| `department` | `department` | `department` |
| `workLocation` / `joiningDate` / `annualCtc` | same fields | — |
| `id` | **`employeeRefId`** | **`employeeRefId`** |
| `company` | `company` | `company` |

### View Client page

```
GET /api/employees/5/overview
```

```json
{
  "employee": { "id": 5, "name": "Sahid Shaikh", "status": "active", "...": "..." },
  "salarySlips": { "total": 10, "data": [ /* all linked slips */ ] },
  "offerLetters": { "total": 1, "data": [ /* ... */ ] }
}
```

Always send `employeeRefId` when creating a slip/letter from an employee picker so documents appear on View Client.

---

## 4. Companies

Master company list (dropdowns for Employee, Offer Letter, Salary Slip, Designation).

### Endpoints

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| POST | /api/companies | `{ "name": "..." }` | created company + `status` |
| GET | /api/companies | ?page&limit&search&status=active\|inactive\|all | { data, pagination } — includes `designationCount` |
| GET | /api/companies/:id | ?status=... | company + active `designations[]` |
| PATCH | /api/companies/:id | `{ "name" }` / `{ "restore": true }` | updated |
| DELETE | /api/companies/:id | — | soft deletes company **and** its designations |

---

## 5. Designations (company-wise)

### Endpoints

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| POST | /api/designations | `{ "companyId": 1, "name": "..." }` | created |
| GET | /api/designations | ?companyId&company&page&limit&search&status | { data, pagination } |
| GET | /api/designations/by-company | **?companyId=1** or **?company=Inkline%20Digital%20Solutions** | `{ data: [{ id, companyId, name }] }` for dropdowns |
| GET | /api/designations/:id | ?status=... | object |
| PATCH | /api/designations/:id | any subset; `{ "restore": true }` | updated |
| DELETE | /api/designations/:id | — | soft delete |

### Frontend usage

1. `GET /api/companies` → company dropdown  
2. On company select → `GET /api/designations/by-company?companyId=...` → designation dropdown  
3. Same pattern for Employee create and Offer Letter / Salary Slip forms  

---

## Notes for the backend

- Numbers may arrive as `0` when a field is left empty — treat as valid.
- PATCH is used for the "edit prefilled details" flow: the frontend loads the
  record by id into the form, the user edits, and the frontend PATCHes back.
- Keep status codes consistent with the rest of the API: 401 invalid/expired
  token, 404 unknown id, 400 validation error with `{ "error": "..." }`.

### `GET /api/stats` (Bearer)

Returns submission stats (existing fields) plus offer letters & salary slips:

```json
{
  "total": 7,
  "new": 3,
  "read": 2,
  "replied": 2,
  "perSite": [{ "id": 1, "name": "...", "slug": "...", "total": 3, "byStatus": { "NEW": 1, "READ": 1, "REPLIED": 1 } }],
  "offerLetters": { "total": 5, "active": 4, "inactive": 1 },
  "salarySlips": { "total": 10, "active": 8, "inactive": 2 },
  "employees": { "total": 12, "active": 11, "inactive": 1 }
}
```

### Auth

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/login | — | `{ email, password }` → `{ token, admin }` |
| POST | /api/auth/logout | Bearer | Revokes the current JWT server-side (SHA-256 hash stored in `TokenBlacklist` until expiry). Frontend should still discard the token. |