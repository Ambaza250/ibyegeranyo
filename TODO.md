# TODO - Login + Expiring Paywall

- [ ] Backend: add `expiresAt` calculation based on `planType`
- [ ] Backend: add viewer login endpoint `POST /api/viewer/login`
- [ ] Backend: add viewer session endpoints `GET /api/viewer/me`
- [ ] Backend: update access check to respect expiry and admin-confirmed status
- [ ] Frontend: add viewer login modal (phone + password)
- [ ] Frontend: update paywall rendering to rely on viewer session (not phone polling)
- [ ] Frontend: show messages for pending approval and expired access
- [ ] Admin: ensure confirm sets expiry (if not computed earlier)
- [ ] Manual testing checklist
  - [ ] Pending payment blocks access on viewer login
  - [ ] Confirmed payment unlocks documentaries
  - [ ] Expired payment shows “go pay”
  - [ ] Wrong password denied

