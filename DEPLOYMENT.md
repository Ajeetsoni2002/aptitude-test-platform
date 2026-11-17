# Deployment Guide — Backend: Render, Frontend: Firebase (dono free)

| Part | Kahan | Free limit |
|---|---|---|
| Backend (Express + Socket.IO) | Render Web Service | 750 hrs/month; 15 min idle ke baad so jata hai |
| Frontend (Vite React) | Firebase Hosting (Spark plan) | 10 GB storage, 360 MB/day transfer |
| Database | MongoDB Atlas M0 | 512 MB |
| Images | Cloudinary | 25 credits/month |
| Emails (verify / reset password) | Brevo | 300 emails/day |
| AI Assistant | Google Gemini API | Free tier, rate-limited |

> Purana AWS (Docker + nginx) setup `docs/ci-cd.md` me hai. Uska GitHub Actions workflow ab
> automatic nahi chalta (sirf manual).

**Order:** pehle backend (uska URL frontend ko chahiye) → phir frontend → phir backend me frontend URL.

---

## Step 0 — Keys (jo pehle se `backend/.env` me hain, wahi use karo)

| Cheez | Note |
|---|---|
| `MONGO_URI` | Atlas string, end me database ka naam ho (`.../aptitudeDB?...`). Atlas → Network Access me `0.0.0.0/0`. |
| `GEMINI_API_KEY` | `.env` wali key. |
| `CLOUDINARY_*` | `.env` wali 3 values. Render par images ke liye zaroori (free disk har restart par saaf hoti hai). |
| `BREVO_API_KEY` | Naya — neeche dekho. |

### Brevo (emails ke liye — naya)
Render free plan Gmail SMTP block karta hai, isliye verification/reset emails Brevo ke HTTPS API se jaate hain.

1. https://www.brevo.com par free sign up.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender** → apna Gmail daalo → us Gmail par aaya link click karke verify karo.
3. **SMTP & API → API Keys → Generate a new API key** → `xkeysib-...` copy karo.
4. `EMAIL_FROM` me wahi verified Gmail: `"ApptitudeTest.live" <yourgmail@gmail.com>`

> Apna domain verify nahi kiya ho to kuch emails spam me ja sakti hain — users ko spam folder
> check karne ko bolna. Local development me `BREVO_API_KEY` na ho to purana Gmail SMTP chalta hai.

### 🔴 Purani Cloudinary key band karo
Repo public hai aur pehle `backend/.env.example` me asli Cloudinary key/secret commit hua tha.
Cloudinary → **Settings → API Keys** → jo key `1849...` se shuru hoti hai use **delete/revoke** karo.
(Ab `.env.example` me placeholders hain, lekin git history me purani key rahegi.)

---

## Step 1 — Code `main` me lao

Ye changes `deploy/render-firebase` branch par hain. GitHub par PR banao → `main` me merge karo:
https://github.com/Ajeetsoni-pvt-ltd/aptitude-test-platform/compare/main...deploy/render-firebase

---

## Step 2 — Backend: Render

### Blueprint (aasaan)
1. https://dashboard.render.com → **New + → Blueprint** → repo connect → branch `main`.
2. Render `render.yaml` padhkar ye values puchega:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | `.env` se |
   | `CLIENT_URL` | Abhi `http://localhost:5173` — Step 4 me badlenge |
   | `CORS_ORIGINS` | Abhi `http://localhost:5173` — Step 4 me badlenge |
   | `BREVO_API_KEY` | Brevo key |
   | `EMAIL_FROM` | `"ApptitudeTest.live" <verified-gmail@gmail.com>` |
   | `GEMINI_API_KEY` | `.env` se |
   | `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | `.env` se |

   `JWT_SECRET` Render khud banata hai (sab users ko ek baar dobara login karna hoga).
3. **Apply** → build ~3-5 min.

### Manual Web Service (agar Blueprint nahi)
| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path | `/health` |

Env: upar wali table + `NODE_ENV=production`, `NODE_VERSION=22`, `RATE_LIMIT_MAX=500`, aur
`JWT_SECRET` (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`).

### Check
`https://<service>.onrender.com/health` → `"success": true`.
Logs me ye dikhna chahiye: `MongoDB Connected`, `EMAIL — Brevo API configured`, `Socket.IO enabled`.

**URL note karo.** Agar ye `https://aptitude-test-platform-i74k.onrender.com` nahi hai (naam pehle se liya ho
to Render suffix laga deta hai), to Step 3.4 me use update karna hai.

---

## Step 3 — Frontend: Firebase Hosting

### 3.1 Project
https://console.firebase.google.com → **Add project** → Spark (free) plan.

### 3.2 CLI
```bash
npm install -g firebase-tools
firebase login
```
> PowerShell me `running scripts is disabled` aaye to: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3.3 Link
```bash
cd frontend
firebase use --add      # project chuno, alias: default
```
`firebase.json` pehle se taiyar hai — **`firebase init` mat chalana**.

### 3.4 Backend URL
`frontend/.env.production` me already hai:
```
VITE_API_BASE_URL=https://aptitude-test-platform-i74k.onrender.com/api
```
Render URL alag mila to yahan badlo (end me `/api`).

### 3.5 Deploy
```bash
npm run deploy
```
URL milega: `https://<project-id>.web.app`

---

## Step 4 — Backend me frontend URL

Render → service → **Environment**:
```
CLIENT_URL=https://<project-id>.web.app
CORS_ORIGINS=https://<project-id>.web.app,https://<project-id>.firebaseapp.com
```
- `CLIENT_URL` = sirf ek URL (email ke verify/reset links isi se bante hain)
- `CORS_ORIGINS` = comma se dono Firebase domains, end me `/` nahi

**Save** → redeploy. Ye nahi kiya to login par CORS / Network error aayega.

---

## Step 5 — Testing checklist
1. `https://<project-id>.web.app` kholo (pehli request ~50 sec, backend jag raha hota hai).
2. Purane account se login (data Atlas me hai, sab users verified hain).
3. Naya account register → Brevo se verification email aana chahiye (spam bhi check karo).
4. Forgot password → reset email.
5. `/dashboard` par refresh → 404 nahi aana chahiye.
6. Test start → camera → submit → result.
7. AI Assistant me message.
8. Admin se question image upload → URL `res.cloudinary.com` wala.
9. Admin → Live Proctoring page connect ho.

---

## Aage update kaise karein
| Kya badla | Kya karo |
|---|---|
| Backend code | `main` par push — Render auto-deploy |
| Frontend code | `cd frontend && npm run deploy` |
| Backend URL | `frontend/.env.production` → `npm run deploy` |
| Frontend domain | Render me `CLIENT_URL` + `CORS_ORIGINS` |

## Free tier limitations
- **Cold start:** free backend 15 min idle ke baad sota hai. Isse bachane ke liye
  `.github/workflows/keep-alive.yml` har ~5 min `/health` ping karta hai (GitHub Actions, free).
  Ek hi free service 24x7 chale to Render ke 750 hrs/month me fit hota hai — dusri free service
  bhi jagaye rakhi to hours kam pad sakte hain.
- **Live proctoring ki active list memory me** — backend restart par reset (violations DB me rehte hain).
- "Too many requests" aaye to Render me `RATE_LIMIT_MAX` badhao.

## AWS band karna
Sab chal jaye to AWS ka EC2/VPS, Elastic IP, Load Balancer aur S3 delete karo. Domain
(`aptitudetest.site`) rakhna ho to Firebase Hosting → **Add custom domain** se jod sakte ho
(phir `CLIENT_URL`/`CORS_ORIGINS` me bhi wahi domain daalna).
