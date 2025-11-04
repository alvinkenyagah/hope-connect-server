# 🧭 API ROUTE DOCUMENTATION

## 🔑 **Auth Routes** (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|-----------|---------|--------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and receive JWT token |

---

## 🧑‍💼 **Admin Routes** (`/api/admin`)

> Protected by `protect` + `authorize(['admin'])`

| Method | Endpoint | Access | Description |
|--------|-----------|---------|--------------|
| `POST` | `/api/admin/counsellor` | Admin | Add a new counselor |
| `GET` | `/api/admin/users` | Admin | Retrieve all users |
| `POST` | `/api/admin/assign-counselor` | Admin | Assign a counselor to a victim |
| `GET` | `/api/admin/assigned-victims/:counselorId` | Admin | View victims assigned to a specific counselor |

---

## 🧠 **Assessment Routes** (`/api/assessments`)

> Protected by authentication (`auth` middleware)

| Method | Endpoint | Access | Description |
|--------|-----------|---------|--------------|
| `POST` | `/api/assessments` | Victim | Submit a new assessment |
| `GET` | `/api/assessments` | Victim | View user’s assessment history |

---

## 📅 **Appointment Routes** (`/api/appointments`)

> Protected by `protect` + role-based `authorize()`

| Method | Endpoint | Access | Description |
|--------|-----------|---------|--------------|
| `POST` | `/api/appointments` | Victim | Book a new appointment (requires `counselorId`) |
| `GET` | `/api/appointments` | Victim, Counselor | View user’s appointments |
| `PUT` | `/api/appointments/:id` | Victim, Counselor | Update or cancel an appointment |

---

## 🔗 **Counselor Assignment Routes** (`/api/assignments`)

> Role-restricted using `protect` + `authorize()`

| Method | Endpoint | Access | Description |
|--------|-----------|---------|--------------|
| `GET` | `/api/assignments/my-counselor` | Victim | Get the assigned counselor for the logged-in victim |
| `PUT` | `/api/assignments/:victimId` | Admin | Assign a counselor to a specific victim |

---

## 👩‍⚕️ **Counselor Routes** (`/api/counselor`)

> Protected by `protect` + `authorize(['counselor'])`

| Method | Endpoint | Access | Description |
|--------|-----------|---------|--------------|
| `GET` | `/api/counselor/my-victims` | Counselor | Get victims assigned to the logged-in counselor with contact details |

---

## 🧾 **Summary by Role**

| Role | Accessible Routes |
|------|--------------------|
| **Admin** | `/api/admin/*`, `/api/assignments/:victimId` |
| **Counselor** | `/api/counselor/*`, `/api/appointments` (view/update) |
| **Victim** | `/api/assessments/*`, `/api/appointments` (book/view/update), `/api/assignments/my-counselor` |
