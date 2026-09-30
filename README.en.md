# ToDoTheMath

> Full-stack web application for planning, tracking, and splitting expenses across events, trips, and renovations.

---

## 1. Introduction
ToDoTheMath allows individuals and groups to manage budgets, record expenses in real time, and compute automatic balances to settle debts transparently and efficiently.

## 2. Functional Description
- **Main Use Cases:**
  - User registration and authentication.
  - Creation of projects/events with a target budget.
  - Logging expenses with categories, amounts, and payer details.
  - Equal or customized expense splitting among participants.
  - Calculation of balances and outstanding settlements.

## 3. Technical Description
- **Frontend:** React, Tailwind CSS, React Router DOM.
- **Backend:** Node.js, Express.
- **Database:** MongoDB with Mongoose.
- **Security:** JWT (JSON Web Tokens), Bcrypt for password hashing, output data sanitization.

## 4. Data Model (Initial Draft)
- **User:** `id`, `name`, `email`, `password` (hashed), `createdAt`.
- **Project:** `id`, `title`, `description`, `type` (*trip* | *event* | *renovation*), `budget`, `owner`, `members`, `createdAt`.
- **Expense:** `id`, `projectId`, `title`, `amount`, `paidBy`, `splitBetween`, `category`, `date`.

## 5. Methodology
- Workflow with **Git-flow** (`main` for production, `develop` for integration, `feature/*` branches for new features).
- Issue and task tracking via GitHub Projects / Issues.