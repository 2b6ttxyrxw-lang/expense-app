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
const form = $('#expense-form');

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

// ===== JSONP call (CORS-free) / JSONP 呼び出し =====
function callGAS_JSONP(payload) {
  const base = window.GAS_ENDPOINT; // 末尾 .../exec
  if (!base || base.includes('xxxxxxxx')) return Promise.reject(new Error('GAS endpoint not set'));

  const { action, ...rest } = payload;
  const cb = `gas_cb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  return new Promise((resolve, reject) => {
    // 1) コールバックを window に生やす
    window[cb] = (data) => {
      try { resolve(data); } finally {
        delete window[cb];
        script.remove();
      }
    };
    // 2) <script src="..."> を差し込む
    const qs = new URLSearchParams({
      action,
      payload: JSON.stringify(rest),
      cb
    });
    const script = document.createElement('script');
    script.src = `${base}?${qs.toString()}`;
    script.onerror = () => {
      try { reject(new Error('JSONP load error')); } finally {
        delete window[cb];
        script.remove();
      }
    };
    document.body.appendChild(script);
  });
}

// ===== Sync to Cloud / クラウド同期 =====
$('#sync-cloud')?.addEventListener('click', async () => {
  if (!expenses.length) return alert('同期するデータがありません');
  try {
    for (const item of expenses) {
      const r = await callGAS_JSONP({ action: 'create', item });
      if (!r?.ok) throw new Error(r?.error || 'unknown error');
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

// ===== Complete (LINE通知含むサブミット行追加想定) =====
$('#complete-task')?.addEventListener('click', async () => {
  const now = new Date();
  try {
    const r = await callGAS_JSONP({
      action: 'complete',
      trainee: window.APP_META?.trainee,
      userId: window.APP_META?.userId,
      finishedAt: now.toISOString(),
      appUrl: window.APP_META?.appUrl,
      specUrl: window.APP_META?.specUrl
    });
    if (!r?.ok) throw new Error(r?.error || 'unknown error');
    alert('完了通知を送信しました');
  } catch (e) {
    alert('完了通知に失敗: ' + e.message);
  }
});
