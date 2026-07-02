
# CampEdge Learning — Full Rebuild Plan

Rebuild the app end-to-end as **CampEdge Learning — The Edge Every Campus Needs**. Public signup stays open; gamification and certificates are included.

## 1. Brand & Design System

- Rename everywhere: title, meta, nav header, footer, PDF exports, emails.
- New palette (HSL tokens in `index.css`):
  - `--primary` #2563EB (blue)
  - `--primary-foreground` #0F172A slate
  - `--accent` #22C55E green, `--success` #16A34A, `--warning` #F59E0B, `--destructive` #DC2626
  - `--background` #F8FAFC, `--card` white, `--foreground` #0F172A
- Fonts via `@fontsource`: **Poppins** (headings) + **Inter** (body); wired in `tailwind.config.ts` and imported in `main.tsx`.
- Add gradient tokens, glass-card utility, soft shadow tokens, rounded-2xl defaults, page-transition + fade/slide/ripple animations (Framer Motion).
- Light/Dark/Auto theme toggle (next-themes-style, using existing `.dark` tokens).

## 2. Information Architecture

New sidebar (desktop) + bottom nav (mobile):
Dashboard · Modules · Progress · Leaderboard · Certificates · Profile · Settings · Logout.

Admin gets separate shell: Admin Dashboard · Students · Modules & Questions · Tasks · Reports · Announcements.

## 3. Learning Structure (rebuilt)

Seed 4 modules × 3 tasks each. Each task 5–8 questions.

```text
Module 1 Communication Skills   → MCQs · Fill blanks · Paragraph reading
Module 2 Vocabulary             → MCQs · Word matching · Sentence formation
Module 3 Interview Skills       → Situation Qs · Voice-to-text · Video/audio response
Module 4 Professional English   → Listening · Speech-to-text · Grammar correction
```

Question renderer supports: MCQ (single/multi), fill-blank, true/false, match, rearrange, drag-drop, listening (audio prompt), voice recording (MediaRecorder), speech-to-text (Web Speech API), image-based, reading comprehension, typing test, short/long answer.

Task player: Prev / Next / Save / Skip, question counter, progress bar, optional timer, autosave answers to DB so nothing is lost. End screen: score, time, correct/wrong, feedback, retry, continue.

## 4. Gamification

- **XP** awarded per correct answer + task/module completion bonuses.
- **Streaks** (daily login/practice).
- **Badges & Achievements** (First task, 7-day streak, 100% module, etc.).
- **Leaderboard** (global + by college/department, weekly + all-time).
- **Certificates**: auto-issued on module completion, PDF via jspdf with student name, module, date, unique cert number, QR code (qrcode lib) that links to a public `/verify/:certNo` page.

## 5. Database (Supabase)

Reuse where possible; add new tables:

- `modules` (title, order, icon, description)
- `module_tasks` (module_id, title, order, type)
- `task_questions` (task_id, type, payload jsonb, correct jsonb, marks, difficulty)
- `task_attempts` (user_id, task_id, answers jsonb, score, time_spent, completed_at)
- `xp_events` (user_id, source, amount, created_at)
- `user_stats` (user_id, xp_total, streak_current, streak_best, last_active)
- `badges` + `user_badges`
- `certificates` (user_id, module_id, cert_number, issued_at, qr_payload) — public read for verification
- `notifications` (user_id, type, title, body, read_at)
- `announcements` (admin-authored, broadcast)

All new public tables get GRANTs + RLS + policies (student sees own rows; admin sees all via `has_role`). Existing `profiles`, `user_roles`, `assessments`, `courses`, `task_submissions` are kept but hidden behind new UI; legacy admin pages remain reachable but relabeled.

## 6. Pages to build/replace

- `/` Login (rebranded, keeps public signup + Google).
- `/onboarding` — polished 4-step (college, dept, year, goal).
- `/dashboard` — welcome, progress rings, XP, streak, continue-learning, leaderboard preview, recommended module, recent activity.
- `/modules` — grid of 4 modules → module detail → task list → task player.
- `/progress` — analytics: accuracy, weak/strong areas, time, completion %, Recharts.
- `/leaderboard` — filters (global / college / department / week / all-time).
- `/certificates` — list + download PDF + share link.
- `/verify/:certNo` — public certificate verification.
- `/profile`, `/settings` (theme, notifications, password).
- Admin: `/admin/dashboard` (stats + charts), `/admin/students` (existing), `/admin/questions` (CRUD + CSV import/export + media upload), `/admin/reports` (student/college/dept/batch), `/admin/announcements`.

## 7. Accessibility & Perf

Keyboard nav, ARIA labels on icon buttons, focus rings, high-contrast mode toggle, large-font toggle, lazy-loaded routes, skeleton loaders, image optimization, `h-dvh` for mobile.

## 8. Technical notes

- Framer Motion for page transitions and micro-interactions.
- Recharts for analytics.
- `qrcode` + `jspdf` + `jspdf-autotable` for certificates and reports.
- Web Speech API for speech-to-text (graceful fallback).
- MediaRecorder + Supabase Storage (`submissions` bucket, new `recordings/` prefix) for voice/video answers.
- Route-level code splitting via `React.lazy`.

## 9. Rollout order (single response, many files)

1. Design tokens + fonts + Tailwind + global styles.
2. New AppLayout (sidebar + bottom nav + theme toggle) + rebranded Login/Onboarding.
3. DB migration for new tables + seed 4 modules / 12 tasks / sample questions.
4. Modules → Task player → results, with XP/streak hooks.
5. Leaderboard, Certificates (+ verify page), Progress analytics.
6. Admin Questions CRUD + CSV import, Admin Dashboard stats, Announcements.
7. Polish: animations, skeletons, a11y pass, dark mode QA.

## Non-technical summary

You'll get a fully rebranded CampEdge Learning app: new blue/green look, Poppins/Inter type, premium dashboard, four learning modules with twelve tasks and rich question types, XP + streaks + badges + leaderboard, auto-generated PDF certificates with QR verification, and a full admin console for students, questions, reports, and announcements. Public signup and Google login stay on.
