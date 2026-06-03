# TODO — Preview + Admin Trailer Upload

## Step 1 — Implement preview gating
- Update `player.html`:
  - If user has no access: show a short trailer player using `doc.trailerUrl` (fallback to gate if missing)
  - Show button/link text: “Pay to see the full video” → `/index.html#pricing`
  - If user has access: play full documentary as before
- ✅ Done (Step 1)

## Step 2 — Add admin UI to upload trailer
- Update `admin.html`:
  - Add a small “Add Trailer” form
  - Fetch documentaries to populate a `<select>`
  - Submit selected documentary id + trailer file to server
- ✅ Done (Step 2)




## Step 3 — Add backend endpoint + Firestore field

- Update `server.js`:
  - Add protected endpoint `POST /api/documentaries/:id/trailer`
  - Upload trailer video to Cloudinary
  - Save `trailerUrl` onto `documentaries/{id}` document
- ✅ Done (Step 3)


## Step 4 — Validate
- Run a quick local test:
  - Upload trailer in admin
  - Verify player shows trailer for non-access users
  - Verify player shows full video for access users

