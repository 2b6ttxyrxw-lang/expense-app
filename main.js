// ===== Storage Layer =====
const KEY = 'expenses';
const yen = n => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);


const Storage = {
load() {
try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
},
save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
};


// ===== State =====
let expenses = Storage.load();


// ===== DOM Helpers =====
const $ = sel => document.querySelector(sel);
const tbody = $('#expense-table tbody');
const summary = $('#summary');
const grandTotal = $('#grand-total');


// ===== Render =====
function render() {
// table
tbody.innerHTML = '';
for (const item of expenses) {
const tr = document.createElement('tr');
tr.innerHTML = `
<td>${item.date}</td>
<td>${item.category}</td>
<td>${yen(item.amount)}</td>
<td>${item.memo ?? ''}</td>
<td><button data-id="${item.id}" class="del">削除</button></td>
`;
tbody.appendChild(tr);
}
// summary
const byCat = expenses.reduce((acc, cur) => {
acc[cur.category] = (acc[cur.category] || 0) + Number(cur.amount || 0);
return acc;
}, {});
summary.innerHTML = Object.entries(byCat)
.map(([cat, amt]) => `<li><strong>${cat}</strong>: ${yen(amt)}</li>`)
.join('');
const total = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
grandTotal.innerHTML = `<strong>合計: ${yen(total)}</strong>`;
}


render();


// ===== Events =====
$('#expense-form').addEventListener('submit', e => {
e.preventDefault();
const item = {
id: Date.now(),
date: $('#date').value,
category: $('#category').value,
amount: Number($('#amount').value),
memo: $('#memo').value.trim()
};
if (!item.date || !item.category || isNaN(item.amount)) return alert('入力を確認してください');
expenses.push(item);
Storage.save(expenses);
});
