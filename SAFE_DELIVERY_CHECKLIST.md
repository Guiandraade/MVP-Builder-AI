# Safe Delivery Checklist

Use this checklist for every new feature or bug fix before deploy.

## 1) Discovery (avoid duplication)
- Search existing implementation in UI, store, database, and edge functions.
- Reuse existing helpers and data flows when possible.
- Confirm whether a migration or function change already exists.

## 2) Scope lock
- Define exactly what changes and what must not change.
- List touched files before coding.
- Define acceptance criteria (functional + security + UX).

## 3) Implementation rules
- Keep changes small and layered (UI -> store -> API/function -> DB).
- Prefer one source of truth for validation rules.
- Add limits for user-controlled fields where relevant.

## 4) Validation gates (mandatory)
- Run: `npm run lint`
- Run: `npm run build`
- Run: `npm run check:predeploy`
- Manual smoke checks for altered flows (desktop + mobile).

## 5) Security checks
- Validate oversized payload behavior.
- Validate invalid state handling and error messages.
- Confirm no cross-user data leakage and no open redirect regressions.

## 6) Deploy order
- Apply DB migration first (if any).
- Deploy edge function changes (if any).
- Deploy app changes.
- Run post-deploy smoke checks.

## 7) Post-deploy verification
- Confirm critical routes and key user flows.
- Confirm logs do not show new errors.
- Confirm rollback path is clear if any blocker appears.
