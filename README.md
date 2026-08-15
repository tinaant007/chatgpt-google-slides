# chatgpt-google-slides
ChatGPT Google SLides AppScript

## English Lesson Booking App

A page you can send to students so they can book a lesson directly into your
Google Calendar — no back-and-forth emails.

- `booking/index.html` — the booking page students visit. Shows your real
  open time slots (calendar conflicts are hidden automatically) and lets a
  student pick a time, enter their name/email, and confirm.
- `booking-appscript.js` — the backend. Deploy it as a Google Apps Script Web
  App; it reads your Google Calendar for availability and, on booking,
  creates the calendar event (with the student invited) and emails them a
  confirmation.

### Setup

1. **Deploy the backend**
   - Go to [script.google.com](https://script.google.com) → New project.
   - Delete the placeholder code and paste in the contents of
     `booking-appscript.js`.
   - Edit the `CONFIG` block at the top (lesson length, notice period, email
     text) to match how you teach.
   - Click **Deploy → New deployment**, choose type **Web app**, set
     "Execute as" to **Me** and "Who has access" to **Anyone**, then deploy.
   - Copy the Web app URL it gives you.

2. **Connect the booking page**
   - Open `booking/index.html` and paste that URL into `APPS_SCRIPT_URL`
     near the top of the `<script>` section.
   - Edit `TUTOR_NAME`, `HEADING`, `SUBHEADING`, and `WEEKLY_AVAILABILITY`
     (your bookable start times per weekday) to match your real schedule.
     `LESSON_DURATION_MINUTES` here must match the value in
     `booking-appscript.js`.

3. **Publish and share**
   - Enable GitHub Pages for this repo (Settings → Pages → deploy from the
     `main` branch, root folder).
   - Your booking page will be live at:
     `https://<your-github-username>.github.io/chatgpt-google-slides/booking/`
   - Send that link to students. Each booking appears on your Google
     Calendar automatically and both of you get a confirmation.

Whenever you edit `booking-appscript.js`, redeploy it (Deploy → Manage
deployments → edit → new version) for the changes to take effect.
