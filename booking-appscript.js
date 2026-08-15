/**
 * English Lesson Booking — backend
 *
 * Deploy this as a Google Apps Script Web App. It reads/writes your Google
 * Calendar so the booking page in booking/index.html always reflects your
 * real availability.
 *
 * SETUP
 * 1. Go to https://script.google.com -> New project.
 * 2. Delete the default code and paste this whole file in.
 * 3. Edit the CONFIG block below to match your lessons.
 * 4. Click Deploy -> New deployment -> select type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the Web app URL it gives you.
 * 6. Paste that URL into APPS_SCRIPT_URL in booking/index.html.
 * 7. Re-deploy (Deploy -> Manage deployments -> edit -> new version)
 *    any time you change this file.
 */

const CONFIG = {
  // How long a lesson is, in minutes. Must match LESSON_DURATION_MINUTES
  // in booking/index.html.
  LESSON_DURATION_MINUTES: 50,

  // How many days ahead students can see/book.
  DAYS_AHEAD: 21,

  // Minimum notice required before a lesson can be booked, in hours.
  MIN_NOTICE_HOURS: 12,

  // Text used on the calendar event created for each booking.
  EVENT_TITLE: 'English Lesson',

  // Confirmation email sent to the student after booking.
  EMAIL_SUBJECT: 'Your English lesson is booked!',
  emailBody: function (opts) {
    return 'Hi ' + opts.name + ',\n\n' +
      'Your English lesson is confirmed for:\n' +
      opts.startFormatted + ' (' + CONFIG.LESSON_DURATION_MINUTES + ' minutes)\n\n' +
      (opts.notes ? 'Your note: ' + opts.notes + '\n\n' : '') +
      'A calendar invite has also been sent to this email address.\n\n' +
      'See you then!\n';
  }
};

function doGet(e) {
  const tz = CalendarApp.getDefaultCalendar().getTimeZone();
  const now = new Date();
  const until = new Date(now.getTime() + CONFIG.DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const events = CalendarApp.getDefaultCalendar().getEvents(now, until);

  const busy = events
    .filter(function (ev) { return !ev.isAllDayEvent(); })
    .map(function (ev) {
      return [ev.getStartTime().toISOString(), ev.getEndTime().toISOString()];
    });

  return jsonOutput({
    ok: true,
    timezone: tz,
    lessonDurationMinutes: CONFIG.LESSON_DURATION_MINUTES,
    minNoticeHours: CONFIG.MIN_NOTICE_HOURS,
    daysAhead: CONFIG.DAYS_AHEAD,
    busy: busy
  });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput({ ok: false, error: 'bad_request' });
  }

  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const notes = (body.notes || '').toString().trim();
  const date = (body.date || '').toString().trim();   // "YYYY-MM-DD"
  const time = (body.time || '').toString().trim();   // "HH:MM" (24h)

  if (!name || !email || !date || !time) {
    return jsonOutput({ ok: false, error: 'missing_fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonOutput({ ok: false, error: 'invalid_email' });
  }

  const calendar = CalendarApp.getDefaultCalendar();
  const tz = calendar.getTimeZone();

  let start;
  try {
    start = Utilities.parseDate(date + ' ' + time, tz, 'yyyy-MM-dd HH:mm');
  } catch (err) {
    return jsonOutput({ ok: false, error: 'bad_datetime' });
  }
  const end = new Date(start.getTime() + CONFIG.LESSON_DURATION_MINUTES * 60 * 1000);

  const minStart = new Date(Date.now() + CONFIG.MIN_NOTICE_HOURS * 60 * 60 * 1000);
  if (start < minStart) {
    return jsonOutput({ ok: false, error: 'too_soon' });
  }

  // Re-check for conflicts right before booking (covers race conditions).
  const overlapping = calendar.getEvents(start, end);
  if (overlapping.length > 0) {
    return jsonOutput({ ok: false, error: 'slot_taken' });
  }

  const event = calendar.createEvent(
    CONFIG.EVENT_TITLE + ' — ' + name,
    start,
    end,
    {
      guests: email,
      sendInvites: true,
      description: notes ? 'Note from student: ' + notes : ''
    }
  );

  const startFormatted = Utilities.formatDate(start, tz, "EEEE, MMMM d 'at' h:mm a") + ' (' + tz + ')';

  try {
    MailApp.sendEmail({
      to: email,
      subject: CONFIG.EMAIL_SUBJECT,
      body: CONFIG.emailBody({ name: name, startFormatted: startFormatted, notes: notes })
    });
  } catch (err) {
    // Booking already succeeded on the calendar; email failure shouldn't fail the request.
  }

  return jsonOutput({ ok: true, eventId: event.getId(), startFormatted: startFormatted });
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
