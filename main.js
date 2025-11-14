// ===== Storage Layer =====
async function postToGAS(payload) {
const url = window.GAS_ENDPOINT;
if (!url || url.includes('xxxxxxxx')) { alert('GASのURLを設定してください'); return { ok:false }; }
const res = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(payload)
});
if (!res.ok) throw new Error('GAS Error: ' + res.status);
return await res.json();
}


$('#sync-cloud').addEventListener('click', async () => {
if (!expenses.length) return alert('同期するデータがありません');
try {
const results = [];
for (const item of expenses) {
const r = await postToGAS({ action: 'create', item });
results.push(r);
}
alert('クラウド同期が完了しました');
} catch (err) {
console.error(err);
alert('同期に失敗しました: ' + err.message);
}
});


// ===== Export / Import =====
$('#export-json').addEventListener('click', () => {
const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'expenses.json';
a.click();
});


$('#import-json').addEventListener('click', async () => {
const input = document.createElement('input');
input.type = 'file';
input.accept = 'application/json';
input.onchange = async () => {
const file = input.files[0];
if (!file) return;
const text = await file.text();
try {
const data = JSON.parse(text);
if (!Array.isArray(data)) throw new Error('Invalid JSON');
expenses = data;
Storage.save(expenses);
render();
} catch (e) { alert('読み込み失敗: ' + e.message); }
};
input.click();
});


// ===== Complete (LINE通知) =====
$('#complete-task').addEventListener('click', async () => {
const now = new Date();
const payload = {
action: 'complete',
trainee: window.APP_META.trainee,
userId: window.APP_META.userId,
finishedAt: now.toISOString(),
appUrl: window.APP_META.appUrl,
specUrl: window.APP_META.specUrl
};
try {
await postToGAS(payload);
alert('完了通知を送信しました');
} catch (e) {
alert('完了通知に失敗: ' + e.message);
}
});
