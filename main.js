// ===== Complete / 課題完了通知（GASを新しいタブで叩く） =====
$('#complete-task')?.addEventListener('click', () => {
  const base = window.GAS_ENDPOINT;
  if (!base || base.includes('xxxxxxxx')) {
    alert('GASのURLが設定されていません');
    return;
  }

  // サーバ側に渡す最小情報だけクエリに乗せる
  const payload = {
    trainee: window.APP_META?.trainee || '',
    userId: window.APP_META?.userId || ''
  };

  const qs = new URLSearchParams({
    action: 'complete',
    payload: JSON.stringify(payload)
  });

  const url = `${base}?${qs.toString()}`;

  // CORSを避けるため、fetchせずに普通のページ遷移として開く
  window.open(url, '_blank');

  alert('完了通知リクエストを送信しました（新しいタブでGASが開きます）');
});
