# Marketing site updates for Pro-only + 30-day free access (2026-01)

## Goal

Align `fl4shcards.com` messaging with the new app model:
- **Only one paid plan**: **Pro** (“Revise like a Pro”)
- **£3.99 / month** or **£39.99 / year** (2 months free)
- New users get **30 days of Pro access** (see “trial type” note below)

---

## Current homepage conflicts to fix

In `app/page.tsx` the homepage currently:
- shows **Premium** and **Pro** pricing tiers
- uses “Start Free Trial” CTAs for both Premium and Pro
- claims “No credit card required”

Those cannot all be true if you switch to an App Store / Google Play “intro trial” (which usually requires a payment method).

---

## Decide the “trial type” first

### Option A — Store intro trial (standard)
- Update copy to: “7/14/30 day free trial” (whatever you configure)
- Remove “No credit card required”

### Option B — 30 days free Pro access (no payment method)
- Copy can keep: “No credit card required”
- Avoid calling it “trial” everywhere; prefer “Free month of Pro access”

This doc assumes **Option B** (matches your stated plan).

---

## Implementation checklist (marketing site)

- [ ] Update `app/page.tsx` pricing data:
  - [ ] Remove Premium price points
  - [ ] Set Pro pricing to:
    - [ ] £3.99 / month
    - [ ] £39.99 / year (2 months free)
- [ ] Update homepage pricing cards:
  - [ ] Remove the Premium column entirely
  - [ ] Keep Free as fallback
  - [ ] Make Pro the featured plan (“Revise like a Pro”)
- [ ] Update CTA copy:
  - [ ] Replace “Start Free Trial” with “Get Pro free for 30 days”
  - [ ] Ensure “No credit card required” remains (because you are not using store trials)
- [ ] Repo-wide search/replace targets:
  - [ ] “Premium”
  - [ ] “Launch offer”
  - [ ] “Start Free Trial”
  - [ ] old price points (`£2.99`, `£4.99`, `£29.99`, `£49.99`)

## Required copy changes (homepage)

### Pricing section (remove Premium)
- Replace 3-column pricing with:
  - **Free** (fallback plan) — keep simple
  - **Pro** — highlight as default experience

### Suggested Pro card messaging
- Headline: “**Pro — Revise like a Pro**”
- Price:
  - “**£3.99 / month**”
  - “**£39.99 / year** (2 months free)”
- Support line: “Includes Past Papers, AI voice answers, advanced analytics”
- Trial line: “**Get Pro free for your first 30 days**”

### CTAs
- Replace “Start Free Trial” with:
  - “Get Pro free for 30 days” (if Option B)
  - “Download and start” (if apps are in stores)

---

## Consistency checklist (site-wide)

- Remove or rewrite all uses of:
  - “Premium”
  - “Launch offer”
  - “Premium includes Pro”
- Ensure legal wording doesn’t promise store subscription terms unless the stores actually enforce them.

---

## Non-homepage pages likely to need review

Based on routes present in this repo:
- `/download`
- `/support`
- `/terms`
- `/privacy`
- any SEO subject pages (`/gcse-flashcards`, `/a-level-flashcards`, `/subjects/*`)

Search targets:
- “Premium”
- “Pro”
- “trial”
- “£”
- “subscription”

