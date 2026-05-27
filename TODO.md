# TODO

- [x] Update backend (`server.js`) with persistent payment/access storage
  - [x] Create `/tmp/documentaries/payments.json`
  - [x] Add API endpoints: create payment, upload screenshot proof, list payments (admin), confirm payment (admin), get viewer access


- [ ] Update main site paywall + MoMo USSD flow
  - [ ] Replace current demo MoMo form with real plan selection UI (monthly/weekly/yearly/one documentary)
  - [ ] Implement USSD trigger using `*182*8*12345*phone*amount#`
  - [ ] Create payment request record and show “confirmation pending”
  - [ ] Add screenshot upload UI and POST to upload-proof endpoint
  - [ ] Replace localStorage gating with server-side access check


- [ ] Update admin panel
  - [ ] Add “Manage payment verifications” list
  - [ ] Show user + plan + screenshot
  - [ ] Implement “Confirm” button to unlock access

- [ ] Keep inline pages consistent (`inline-index.html`, `inline-admin.html`) if needed for your deployment

- [ ] Manual testing checklist
  - [ ] MoMo register → pending state
  - [ ] Screenshot upload works
  - [ ] Admin sees record and confirms
  - [ ] Viewer unlocks documentaries after confirmation

