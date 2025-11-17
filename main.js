$('#complete-task')?.addEventListener('click', async () => {
  try {
    const r = await callGAS_JSONP({
      action: 'complete',
      trainee: window.APP_META?.trainee,
      userId: window.APP_META?.userId
      // finishedAt / appUrl / specUrl は送らない（サーバで補完）
    });
    if (!r?.ok) throw new Error(r?.error || 'unknown error');
    alert('完了通知を送信しました');
  } catch (e) {
    alert('完了通知に失敗: ' + e.message);
  }
});
