# TODO - Firestore Option A migration (browser-only DB access)

## Security assumptions (from user)
- viewer passwords stored as **plain text** for now in Firestore `users` documents

## Current Firestore schema decisions
- users document ID: `users/{phoneNormalized}`
- payment/proof storage: inside the same `users/{phone}` document

## Implementation steps
- [ ] Add Firebase JS SDK + init code to `index.html` and `admin.html`
- [ ] Replace viewer subscription gating (remove dependency on `/api/*` DB endpoints):
  - [ ] implement browser viewer login: read `users/{phoneNormalized}` and verify `password`
  - [ ] determine active access by checking `status` and `endDate`
- [ ] Replace payment flow (still use Cloudinary screenshot upload for the image, but store URLs + status in Firestore):
  - [ ] create pending payment by setting fields on `users/{phoneNormalized}`
  - [ ] proof upload stores `screenshotUrl` in the same doc and keeps `status=pending`
  - [ ] admin confirmation sets `status=confirmed` and sets `startDate/endDate`
- [ ] Replace documentaries loading:
  - [ ] read `documentaries` collection and render cards
- [ ] Replace admin login:
  - [ ] admin login via Firebase Auth
  - [ ] check `admins/{uid}` doc exists before allowing confirm actions
- [ ] Add/adjust Firestore rules:
  - [ ] `documentaries` read publicly
  - [ ] viewer can only read/write their own `users/{phone}` doc
  - [ ] only admins can set `status=confirmed` / edit payment fields


## Deployment notes
- [ ] Remove or ignore backend endpoints for DB access; keep backend only for Cloudinary video upload if needed
- [ ] Manual tests: viewer login pending/confirmed/expired; admin confirm; documentary list refresh

