# COMP3133 Assignment 1 — Employee Management System (Backend)

Backend application built with **NodeJS + Express + GraphQL (Apollo Server) + MongoDB (Mongoose)**.

## Features (Mapped to Assignment APIs)
- **Mutation: signup** — create user account (password stored encrypted)
- **Query: login** — login with **username OR email** + password (returns JWT token)
- **Query: getAllEmployees** — list employees
- **Mutation: addEmployee** — create employee (optionally uploads profile photo to **Cloudinary**)
- **Query: searchEmployeeByEid** — find employee by MongoDB _id
- **Mutation: updateEmployeeByEid** — update employee by _id
- **Mutation: deleteEmployeeByEid** — delete employee by _id
- **Query: searchEmployeesByDesignationOrDepartment** — filter by designation and/or department

## Requirements
- Node.js 18+
- MongoDB (Atlas or local)
- (Optional but recommended) Cloudinary account for employee photos

## 1) Setup

### A) Install dependencies
```bash
npm install
```

### B) Create `.env`
Copy `.env.example` → `.env` and update values:
- `MONGO_URI` (Atlas or local)
- `JWT_SECRET` (any long random string)
- Cloudinary values (required if you want to upload photos)

Example local:
```env
MONGO_URI=mongodb://localhost:27017/comp3133_101474651_Assigment1
PORT=8081
AUTH_REQUIRED=true
JWT_SECRET=super_long_secret
JWT_EXPIRES_IN=2h
```

### C) Run
```bash
npm run dev
```
Open GraphQL UI:
- `http://localhost:8081/graphql`

Health check:
- `http://localhost:8081/health`

## 2) Authentication (JWT)
- `signup` and `login` return a `token`
- For employee APIs, send header:

```
Authorization: Bearer <YOUR_TOKEN>
```

To disable auth quickly (optional):
```env
AUTH_REQUIRED=false
```

## 3) Seeding (Sample User + Demo Employees)
Creates a demo user and 2 demo employees if they don’t exist:
```bash
npm run seed
```

**Sample user details (for submission/testing):**
- username: `demo_user`
- email: `demo_user@example.com`
- password: `Password123!`

## 4) Cloudinary Photo Upload
In `addEmployee` / `updateEmployeeByEid`, you can pass:
- a public **image URL**, OR
- a **base64 data URI** like: `data:image/png;base64,....`

The server uploads to Cloudinary and stores the returned **secure URL** in `employee_photo`.

## 5) GraphQL Examples

### Signup
```graphql
mutation {
  signup(username: "demo_user", email: "demo_user@example.com", password: "Password123!") {
    success
    message
    token
    user { _id username email }
  }
}
```

### Login
```graphql
query {
  login(usernameOrEmail: "demo_user", password: "Password123!") {
    success
    message
    token
  }
}
```

### Add Employee
```graphql
mutation {
  addEmployee(employee: {
    first_name: "Mina"
    last_name: "Rahimi"
    email: "mina.rahimi@example.com"
    gender: "Female"
    designation: "Business Analyst"
    salary: 54000
    date_of_joining: "2026-01-10"
    department: "Operations"
    employee_photo: ""
  }) {
    success
    message
    employee { _id first_name last_name email }
  }
}
```

## 6) Postman Collection
Inside `/postman`:
- `COMP3133_Assignment1_GraphQL.postman_collection.json`
- `COMP3133_Assignment1_GraphQL.postman_environment.json`

Import both into Postman.
1. Run **Login** request → it auto-saves `token` into the environment.
2. For **Search/Update/Delete by EID**, set environment variable `eid` to a real employee `_id`.

## 7) Docker (Optional Hosting)
```bash
cd docker
docker compose up --build
```
GraphQL: `http://localhost:8081/graphql`

## 8) GitHub Submission Notes
Repository name (per assignment):
- `COMP3133_101474651_Assignment1`

Typical flow:
```bash
git init
git add .
git commit -m "Initial commit - GraphQL EMS backend"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

If you keep it private, add collaborator:
- GitHub username: `pritamworld`

## 9) What to Submit (Checklist Helper)
- MongoDB screenshots: DB + collections (`users`, `employees`)
- Screenshots of each API test + responses
- Export Postman collection
- Zip project **without node_modules**
- GitHub link
- Sample user detail (provided above)
- (Optional) deployed URL
