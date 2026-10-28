# meteroo

Warm, simple **Mentimeter-style** live interactions for the classroom — word clouds, short answers, and multiple-choice votes. Static React app on **GitHub Pages** with **Firebase Realtime Database** for multi-device sync.

**Live site:** [https://ltmtms.github.io/meteroo/](https://ltmtms.github.io/meteroo/)

| Route | Purpose |
|-------|---------|
| [`/`](https://ltmtms.github.io/meteroo/) | Home — links to all modes |
| [`/admin`](https://ltmtms.github.io/meteroo/admin) | Presenter — create room, edit slides, advance, preview results |
| [`/start`](https://ltmtms.github.io/meteroo/start) | Participants — join with room code, answer current slide |
| [`/show`](https://ltmtms.github.io/meteroo/show) | Projector — fullscreen live results for the current slide |

## Run locally

```bash
npm install
cp .env.example .env.local   # optional — see Firebase below
npm run dev
```

Open [http://localhost:5173/meteroo/](http://localhost:5173/meteroo/) (Vite uses the `/meteroo/` base path).

```bash
npm run build   # output in dist/
npm run preview # serve production build locally
```

## Firebase setup (required for phones + projector on different devices)

Without Firebase, the app runs in **demo mode**: session data is stored in **localStorage** in one browser only (fine for trying the UI, not for a real class).

1. Create a [Firebase](https://console.firebase.google.com/) project.
2. Enable **Anonymous** sign-in: Authentication → Sign-in method → Anonymous → Enable.
3. Create a **Realtime Database** (not Firestore). Start in test mode for setup, then lock down with rules below.
4. Register a **Web app** and copy the config values into GitHub Actions secrets (for deploy) and/or a local `.env.local`:

| Variable | Example |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | `AIza…` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://your-project-default-rtdb.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project` |
| `VITE_FIREBASE_APP_ID` | `1:123…:web:abc…` |

Add the same names as **repository secrets** in GitHub (Settings → Secrets and variables → Actions) so the deploy workflow bakes them into the static build.

### Suggested Realtime Database rules

Open classroom tool — adjust if you need stricter access:

```json
{
  "rules": {
    "sessions": {
      "$code": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

Anonymous auth runs automatically on first use (`signInAnonymously`).

### Data shape

```
/sessions/{ROOMCODE}/
  adminUid, currentSlideIndex, createdAt
  slides: [ { id, type, prompt, options? } ]
  responses/{slideIndex}/
    words/{uid}: { text, nickname?, at }
    shorts/{pushId}: { text, nickname?, uid, at }
    votes/{uid}: { optionIndex, at }   // one vote per user per slide (overwrite = re-vote)
```

Room codes are 5 characters from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (no `O` / `I`).

## How to run a session (teacher flow)

1. Open **[Admin](https://ltmtms.github.io/meteroo/admin)** → add slides (word cloud / short answer / live vote) → **Create new room**. Note the **room code**.
2. Click **Open display fullscreen** (or `/show?code=XXXXX`) on the **projector**.
3. Students open **[Join](https://ltmtms.github.io/meteroo/start)** (or `/start?code=XXXXX`) on their phones, enter the code, optional nickname.
4. Use **Prev / Next** in admin to change the active slide; `/start` and `/show` follow `currentSlideIndex` in real time.
5. **Reset responses (this slide)** clears answers for the current slide only.

## Tech

- Vite + React + TypeScript, `react-router-dom` with `basename="/meteroo"`
- Firebase Realtime Database + anonymous auth
- GitHub Actions → `peaceiris/actions`-style **deploy-pages** to `https://ltmtms.github.io/meteroo/`

## License

MIT (or your choice — add a LICENSE file if needed).
