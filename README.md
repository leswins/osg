# Film-prop online banking dashboard

A sample bank account screen for filming. It follows the Axos-style mobile web dashboard from the reference shots: balances, account list, legal footer, and interactive left/right menus. An admin portal lets you change the **name**, **balance**, and **logo** while the dashboard is open.

This is a movie prop. It is not a real bank and is not affiliated with any financial institution.

## Phone / Vercel

Open these on the actor’s phone (no local server needed):

- Dashboard: https://film-bank-git-cursor-bank-acc-e13d1b-leswins5555-4908s-projects.vercel.app
- Admin: https://film-bank-git-cursor-bank-acc-e13d1b-leswins5555-4908s-projects.vercel.app/admin

On the hosted site, name/balance/logo save in that phone’s browser. Use admin on the same phone you will film.

## On set (local)

From this folder:

```bash
python3 serve.py
```

- Dashboard: `http://127.0.0.1:8080`
- Admin: `http://127.0.0.1:8080/admin.html`

On the actor’s phone, open the **On-set phone URL** printed in the terminal (same Wi-Fi as the laptop). Change values in admin; the phone updates within a second.

## What you can edit

- First name, last name, initials, avatar color
- Available balance, total assets, total debt
- Account nickname and last 4 digits
- Header logo and account icon
- Linked “Transfer Only” account
- Fake browser URL/time if you need the address bar in frame

## Menus

- Hamburger opens the left navigation. **Accounts** and **Move Money** expand and collapse.
- The red initials button opens the profile menu.
- Tap either close control or the dimmed page to dismiss.
- Hidden admin shortcut: tap the header logo five times, or tap the footer copyright.

## Filming tips

- On a real phone, keep **Show fake phone browser chrome** off.
- For a computer playback or fullscreen tablet shot, turn chrome on so the URL bar reads like the reference.
- `Reset to reference` restores the sample account from the provided screenshots.
