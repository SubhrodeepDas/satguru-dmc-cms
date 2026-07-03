# Deploying to Vercel — Satguru DMC (CMS + Frontend)

You'll create **two Vercel projects** from this one folder:

| Project | What it is | Root directory |
|---------|-----------|----------------|
| **satguru-cms** | Next.js admin panel + API (`/admin`, `/api/*`) | `cms` |
| **satguru-frontend** | The static website the client sees | `/` (repo root) |

The CMS can't use its local JSON files on Vercel (serverless disks are read-only),
so it uses two free cloud services instead — both are one-click add-ons inside Vercel:

- **Upstash Redis** → stores all content (replaces `cms/data/*.json`)
- **Vercel Blob** → stores newly uploaded images

Your **local setup is unchanged** — with no cloud env vars present, everything
still runs off local files exactly as before.

---

## 0. Put the code on GitHub (once)

Vercel deploys from a Git repo. From the project root:

```bash
git init
git add .
git commit -m "Satguru DMC — CMS + site"
```

Create an empty repo on github.com, then:

```bash
git remote add origin https://github.com/<you>/satguru-dmc.git
git branch -M main
git push -u origin main
```

---

## 1. Deploy the CMS

1. On **vercel.com → Add New → Project**, import the GitHub repo.
2. **Root Directory:** click *Edit* and choose **`cms`**. (Framework auto-detects as Next.js.)
3. Don't deploy yet — first add storage & env vars (steps 2–3). If it already
   deployed, that's fine; just redeploy after the next steps.

### 2. Add storage (Upstash Redis + Blob)

In the new CMS project → **Storage** tab:

- **Create Database → Upstash (Redis / KV)** → connect it to this project.
  Vercel injects `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` automatically.
- **Create → Blob** → connect it. Vercel injects `BLOB_READ_WRITE_TOKEN`.

### 3. Add environment variables

CMS project → **Settings → Environment Variables**, add:

```
ADMIN_PASSWORD          = <pick a strong admin password>
ADMIN_SESSION_TOKEN     = <any long random string>
SMTP_HOST               = smtp.gmail.com
SMTP_PORT               = 465
SMTP_USER               = pixel.hosted@gmail.com
SMTP_PASS               = <your gmail app password>
CONTACT_TO              = inbound.russia@satgurutravel.com
```

(The Upstash/Blob vars from step 2 are already there.) **Redeploy** the project.

### 4. Load your existing content into Upstash (one time)

Your content currently lives in `cms/data/*.json`. Push it into Upstash:

1. In the CMS project's **Storage → Upstash**, copy `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`.
2. Paste them into **`cms/.env.local`** on your machine (append these lines):
   ```
   UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxxxxxxx
   ```
3. From the `cms` folder, run:
   ```bash
   node scripts/seed-kv.mjs
   ```
   It prints each collection as it's pushed. **Then remove those two lines from
   `cms/.env.local` again** so your local dev keeps using local files.

Your CMS is now live at `https://satguru-cms-xxxx.vercel.app` — log in at
`…/admin` with the `ADMIN_PASSWORD` you set.

> Existing images already in `cms/public/uploads/` ship with the deploy and are
> served from the CMS domain. Any **new** image uploaded through the admin goes
> to Vercel Blob automatically.

---

## 5. Point the frontend at the CMS

Edit **`assets/js/cms.js`** (near the top) and set your CMS URL:

```js
var PRODUCTION_CMS_URL = 'https://satguru-cms-xxxx.vercel.app';
```

Commit & push.

## 6. Deploy the frontend

1. **Vercel → Add New → Project**, import the **same** repo again.
2. **Root Directory:** leave as **`/`** (repo root).
3. **Framework Preset:** choose **Other** (it's a static site — no build step).
4. Deploy.

The site is now live at `https://satguru-frontend-xxxx.vercel.app`. It reads all
its content from the CMS. `vercel.json` handles the `/explore/:slug` and
`/itinerary/:slug` clean URLs automatically.

---

## Give the client

- **Website:** `https://satguru-frontend-xxxx.vercel.app`
- **Admin:** `https://satguru-cms-xxxx.vercel.app/admin` (share the password separately)

## Notes

- **Vercel plan:** the free *Hobby* plan is fine for a demo. Vercel's terms
  reserve Hobby for non-commercial use, so for a paid client deliverable you may
  eventually need a **Pro** seat ($20/mo). Upstash + Blob free tiers are plenty
  for this traffic.
- **Rotate the SMTP password** if this repo becomes public — it's a real Gmail
  app password.
- **Single-admin design:** the storage does read-modify-write per save, which is
  correct for one editor at a time (fine for a demo/small team). It isn't built
  for many simultaneous editors.
