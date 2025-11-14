// ===== DOM Helper / DOMヘルパ =====
const $ = sel => document.querySelector(sel);

// ===== Storage Layer / 永続化 =====
const KEY = 'expenses';
const yen = n => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);

const Storage = {
  load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  },
  save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
};

// ===== State / 状態 =====
let expenses = Storage.load();

// ===== DOM refs =====
const tbody = $('#expense-table tbody');
const summary = $('#summary');
const grandTotal = $('#grand-total');

// ===== Render / 表示更新 =====
function render() {
  // table
  if (tbody) {
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
  }
  // summary
  if (summary && grandTotal) {
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
}
render();

// ===== Add (form) / 追加 =====
const form = $('#expense-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const item = {
      id: Date.now(),
      date: $('#date')?.value,
      category: $('#category')?.value,
      amount: Number($('#amount')?.value),
      memo: ($('#memo')?.value || '').trim()
    };
    if (!item.date || !item.category || isNaN(item.amount)) {
      alert('入力を確認してください');
      return;
    }
    expenses.push(item);
    Storage.save(expenses);
    form.reset();
    render();
  });
}

// ===== Delete (table) / 削除 =====
if (tbody) {
  tbody.addEventListener('click', e => {
    const btn = e.target.closest('button.del');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    expenses = expenses.filter(x => x.id !== id);
    Storage.save(expenses);
    render();
  });
}

// ===== GAS fetch (no JSON header to avoid preflight) =====
// プリフライト(OPTIONS)回避のため Content-Type ヘッダを付けない
async function postToGAS(payload) {
  const url = window.GAS_ENDPOINT;
  if (!url || url.includes('xxxxxxxx')) {
    alert('GASのURLを設定してください'); 
    return { ok:false };
  }
  const res = await fetch(url, {
    method: 'POST',
    // headers: { 'Content-Type': 'application/json' }, // ←付けない
    body: JSON.stringify(payload) // text/plain 相当でも GAS 側で JSON.parse 可能
  });
  if (!res.ok) throw new Error('GAS Error: ' + res.status);
  return await res.json();
}

// ===== Sync to Cloud / クラウド同期 =====
$('#sync-cloud')?.addEventListener('click', async () => {
  if (!expenses.length) return alert('同期するデータがありません');
  try {
    for (const item of expenses) {
      await postToGAS({ action: 'create', item });
    }
    alert('クラウド同期が完了しました');
  } catch (err) {
    console.error(err);
    alert('同期に失敗しました: ' + err.message);
  }
});

// ===== Export / Import =====
$('#export-json')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'expenses.json';
  a.click();
});

$('#import-json')?.addEventListener('click', async () => {
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
$('#complete-task')?.addEventListener('click', async () => {
  const now = new Date();
  const payload = {
    action: 'complete',
    trainee: window.APP_META?.trainee,
    userId: window.APP_META?.userId,
    finishedAt: now.toISOString(),
    appUrl: window.APP_META?.appUrl,
    specUrl: window.APP_META?.specUrl
  };
  try {
    await postToGAS(payload);
    alert('完了通知を送信しました');
  } catch (e) {
    alert('完了通知に失敗: ' + e.message);
  }
});
