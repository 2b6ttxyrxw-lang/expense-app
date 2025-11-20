// main.js ($ を使わないシンプル版)

document.addEventListener('DOMContentLoaded', () => {
  // ===== Storage / 永続化 =====
  const KEY = 'expenses';

  function loadExpenses() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveExpenses(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function yen(n) {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(n);
  }

  // ===== State =====
  let expenses = loadExpenses();

  // ===== DOM参照 =====
  const tbody = document.querySelector('#expense-table tbody');
  const summary = document.querySelector('#summary');
  const grandTotal = document.querySelector('#grand-total');
  const form = document.querySelector('#expense-form');
  const btnSync = document.querySelector('#sync-cloud');
  const btnExport = document.querySelector('#export-json');
  const btnImport = document.querySelector('#import-json');
  const btnComplete = document.querySelector('#complete-task-new'); // 課題完了ボタン

  // ===== Render =====
  function render() {
    // テーブル
    if (tbody) {
      tbody.innerHTML = '';
      expenses.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.date}</td>
          <td>${item.category}</td>
          <td>${yen(item.amount)}</td>
          <td>${item.memo || ''}</td>
          <td><button type="button" data-id="${item.id}" class="del">削除</button></td>
        `;
        tbody.appendChild(tr);
      });
    }

    // サマリ
    if (summary && grandTotal) {
      const byCat = expenses.reduce((acc, cur) => {
        const cat = cur.category || '';
        acc[cat] = (acc[cat] || 0) + Number(cur.amount || 0);
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

  // ===== 追加 =====
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const dateEl = document.querySelector('#date');
      const catEl = document.querySelector('#category');
      const amtEl = document.querySelector('#amount');
      const memoEl = document.querySelector('#memo');

      const item = {
        id: Date.now(),
        date: dateEl ? dateEl.value : '',
        category: catEl ? catEl.value : '',
        amount: amtEl ? Number(amtEl.value) : NaN,
        memo: memoEl ? memoEl.value.trim() : ''
      };

      if (!item.date || !item.category || isNaN(item.amount)) {
        alert('日付・カテゴリ・金額を確認してください');
        return;
      }

      expenses.push(item);
      saveExpenses(expenses);
      if (form) form.reset();
      render();
    });
  }

  // ===== 削除 =====
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains('del')) return;

      const id = Number(target.dataset.id);
      expenses = expenses.filter(x => x.id !== id);
      saveExpenses(expenses);
      render();
    });
  }

  // ===== Sync to Cloud（GASを新しいタブで叩く） =====
  if (btnSync) {
    btnSync.addEventListener('click', () => {
      const base = window.GAS_ENDPOINT;
      if (!base) {
        alert('GASのURLが設定されていません');
        return;
      }
      if (!expenses.length) {
        alert('同期するデータがありません');
        return;
      }

      const payload = { items: expenses };
      const qs = new URLSearchParams({
        action: 'create',
        payload: JSON.stringify(payload)
      });
      const url = `${base}?${qs.toString()}`;
      window.open(url, '_blank');
      alert('クラウド同期リクエストを送信しました（GASのタブが開きます）');
    });
  }

  // ===== Export / Import =====
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'expenses.json';
      a.click();
    });
  }

  if (btnImport) {
    btnImport.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          if (!Array.isArray(data)) throw new Error('配列ではありません');
          expenses = data;
          saveExpenses(expenses);
          render();
        } catch (err) {
          alert('読み込みに失敗しました: ' + err.message);
        }
      };
      input.click();
    });
  }

  // ===== Complete（課題完了：GASを新しいタブで叩く） =====
  if (btnComplete) {
    btnComplete.addEventListener('click', () => {
      const base = window.GAS_ENDPOINT;
      if (!base) {
        alert('GASのURLが設定されていません');
        return;
      }
      const payload = {
        trainee: window.APP_META?.trainee || '',
        userId: window.APP_META?.userId || ''
      };
      const qs = new URLSearchParams({
        action: 'complete',
        payload: JSON.stringify(payload)
      });
      const url = `${base}?${qs.toString()}`;
      window.open(url, '_blank');
      alert('完了通知リクエストを送信しました（GASのタブが開きます）');
    });
  }
});
