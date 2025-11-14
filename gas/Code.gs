const SPREADSHEET_ID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // 置換
const SHEET_EXPENSES = 'Expenses';
const SHEET_SUBMISSIONS = 'Submissions';
const LINE_NOTIFY_TOKEN = 'YOUR_LINE_NOTIFY_TOKEN'; // 任意


function doPost(e) {
try {
const data = JSON.parse(e.postData.contents);
const action = data.action;
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);


if (action === 'create') {
const sh = ss.getSheetByName(SHEET_EXPENSES) || ss.insertSheet(SHEET_EXPENSES);
const { id, date, category, amount, memo } = data.item;
sh.appendRow([ new Date(), id, date, category, amount, memo ]);
return json({ ok: true });
}


if (action === 'list') {
const sh = ss.getSheetByName(SHEET_EXPENSES);
const values = sh ? sh.getDataRange().getValues() : [];
return json({ ok: true, values });
}


if (action === 'delete') { // 任意実装
const sh = ss.getSheetByName(SHEET_EXPENSES);
if (!sh) return json({ ok: true });
const id = data.id;
const last = sh.getLastRow();
const ids = sh.getRange(1,2,last).getValues(); // colB = id
for (let r=1; r<=last; r++) {
if (ids[r-1][0] == id) { sh.deleteRow(r); break; }
}
return json({ ok: true });
}


if (action === 'complete') {
const sh = ss.getSheetByName(SHEET_SUBMISSIONS) || ss.insertSheet(SHEET_SUBMISSIONS);
const { trainee, userId, finishedAt, appUrl, specUrl } = data;
sh.appendRow([ new Date(), trainee, userId, finishedAt, appUrl, specUrl ]);
// LINE通知（任意）
if (LINE_NOTIFY_TOKEN && LINE_NOTIFY_TOKEN !== 'YOUR_LINE_NOTIFY_TOKEN') {
const msg = `【🎉課題4完了報告🎉】\n研修生：${trainee}（${userId}）\n完了：${new Date(finishedAt).toLocaleString('ja-JP')}\n\nアプリURL:\n${appUrl}\n\n仕様書URL:\n${specUrl}\n\n確認をお願いします！`;
lineNotify(msg);
}
return json({ ok: true });
}


return json({ ok:false, error: 'Unknown action' }, 400);
} catch (err) {
return json({ ok:false, error: err.message }, 500);
}
}


function json(obj, code) {
return ContentService
.createTextOutput(JSON.stringify(obj))
.setMimeType(ContentService.MimeType.JSON)
.setStatusCode(code || 200);
}


function lineNotify(message) {
const url = 'https://notify-api.line.me/api/notify';
const payload = { message };
const options = {
method: 'post',
payload,
headers: { Authorization: 'Bearer ' + LINE_NOTIFY_TOKEN },
muteHttpExceptions: true
};
UrlFetchApp.fetch(url, options);
}
