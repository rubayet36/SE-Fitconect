# Week 2 - Member 1 Feature Manifest

## 👤 Assigned Teammate: Member 1
**Role**: Authentication, Security & Member Portal Lead

---

## 🚀 Assigned Features & Components

### 1. User Registration & Profile Auto-Provisioning
- **User Story**: Jira Story 2 (`AUTH-RBAC`)
- **Files**:
  - `src/app/signup/page.tsx`
  - `src/app/setup-profile/page.tsx`
  - `src/app/auth/callback/route.ts`
- **Functionality**:
  - Email/password signup and Google OAuth sign-in.
  - Automatically triggers Supabase `handle_new_user()` SQL trigger to provision profile with `role='member'`.

### 2. Interactive Member Dashboard & Active Plan Viewer
- **User Story**: Jira Story 15 (`MEMBER-PORTAL`)
- **Files**:
  - `src/app/member/dashboard/page.tsx`
  - `src/app/member/my-plan/page.tsx`
  - `src/app/member/diet/page.tsx`
- **Functionality**:
  - Renders daily workout accordion schedule with coach execution notes.
  - Displays daily meal timings and macronutrient totals (calories, protein, carbs, fats).

### 3. Workout & Diet Request Submission Form
- **User Story**: Jira Story 16 (`MEMBER-PORTAL`)
- **Files**:
  - `src/app/member/request/page.tsx`
- **Functionality**:
  - Allows gym members to select personal trainers, choose request types (`diet`, `workout`, or `both`), and submit customized health goals.

---

## 🛠️ How to Run
```bash
cd "week 2/member-1"
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).
