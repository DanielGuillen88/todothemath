# ToDoTheMath

> Aplicación web full-stack para la planificación, seguimiento y reparto de gastos en eventos, viajes y reformas.

---

## 1. Introducción
ToDoTheMath permite a individuos y grupos gestionar presupuestos, registrar gastos en tiempo real y calcular balances automáticos para liquidar cuentas de forma transparente y eficiente.

## 2. Descripción Funcional
- **Casos de Uso Principales:**
  - Registro y autenticación de usuarios.
  - Creación de proyectos/eventos con presupuesto objetivo.
  - Registro de gastos asociados con categorías, importes y pagador.
  - División de gastos equitativa o personalizada entre participantes.
  - Cálculo de balances y deudas pendientes.

## 3. Descripción Técnica
- **Frontend:** React, Tailwind CSS, React Router DOM.
- **Backend:** Node.js, Express.
- **Base de Datos:** MongoDB con Mongoose.
- **Seguridad:** JWT (JSON Web Tokens), Bcrypt para hashing de contraseñas, sanitización de datos de salida.

## 4. Modelo de Datos (Boceto inicial)
- **User:** `id`, `name`, `email`, `password` (hasheada), `createdAt`.
- **Project:** `id`, `title`, `description`, `type` (*trip* | *event* | *renovation*), `budget`, `owner`, `members`, `createdAt`.
- **Expense:** `id`, `projectId`, `title`, `amount`, `paidBy`, `splitBetween`, `category`, `date`.

## 5. Metodología
- Flujo de trabajo con **Git-flow** (`main` para producción, `develop` para integración, ramas `feature/*` para nuevas funcionalidades).
- Gestión de issues y tareas mediante GitHub Projects / Issues.