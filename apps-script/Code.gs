/**
 * Google Apps Script backend for Haus am See reservations.
 *
 * SETUP (one time, ~3 minutes):
 * 1. Create a new Google Sheet. Name the first tab "Reservations".
 * 2. Add a header row (row 1) with these columns, in this order:
 *      Received | Reference | Room | Check in | Check out | Nights | Guests | Name | Email | Phone | Notes
 * 3. Extensions → Apps Script. Delete the sample, paste THIS file.
 * 4. (Optional) set a shared secret so random people can't POST to your sheet:
 *      edit SECRET below AND set SHEETS_WEBHOOK_SECRET to the same value in Vercel.
 * 5. Deploy → New deployment → type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Copy the Web app URL (ends in /exec).
 * 6. Paste that URL into Vercel env var SHEETS_WEBHOOK_URL. Done.
 */

// Leave "" to disable the check, or set to match SHEETS_WEBHOOK_SECRET in Vercel.
var SECRET = "";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (SECRET && data.secret !== SECRET) {
      return json({ ok: false, error: "unauthorized" });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reservations")
      || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.reference || "",
      data.room || "",
      data.checkIn || "",
      data.checkOut || "",
      data.nights || "",
      data.guests || "",
      data.name || "",
      data.email || "",
      data.phone || "",
      data.notes || "",
    ]);

    // Optional: email yourself on every request. Uncomment and set your address.
    // MailApp.sendEmail("you@example.com", "New stay request: " + data.room,
    //   data.name + " (" + data.email + ") — " + data.checkIn + " to " + data.checkOut +
    //   "\nGuests: " + data.guests + "\nNotes: " + data.notes + "\nRef: " + data.reference);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/**
 * doGet — returns upcoming reservations for the "Who's coming" feature.
 * Only non-sensitive fields are returned (reference, room, dates, guests, name).
 * Email / phone / notes are never exposed.
 */
function doGet(e) {
  try {
    if (SECRET && (!e || e.parameter.secret !== SECRET)) {
      return json({ ok: false, error: "unauthorized" });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reservations")
      || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var rows = sheet.getDataRange().getValues();

    var out = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[1] && !r[7]) continue; // skip blank rows (no reference & no name)
      out.push({
        reference: r[1],
        room: r[2],
        checkIn: fmtDate(r[3]),
        checkOut: fmtDate(r[4]),
        guests: r[6],
        name: r[7],
      });
    }
    return json({ ok: true, reservations: out });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Cells may come back as strings ("2026-07-10") or Date objects — normalise to YYYY-MM-DD.
function fmtDate(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(v).slice(0, 10);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
