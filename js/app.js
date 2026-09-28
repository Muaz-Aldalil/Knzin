function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.remove('hidden'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 2200) }
function fmt(s) { s = Math.max(0, s); const h = String(Math.floor(s / 3600)).padStart(2, '0'), m = String(Math.floor(s % 3600 / 60)).padStart(2, '0'), x = String(s % 60).padStart(2, '0'); return `${h}:${m}:${x}` }
let hero = 3 * 3600 + 14 * 60 + 52;
setInterval(() => { hero++; const el = document.getElementById('heroTimer'); if (el) el.textContent = fmt(hero) }, 1000);
document.querySelectorAll('[data-count]').forEach(el => { let s = parseInt(el.dataset.count || '0', 10); setInterval(() => { s = Math.max(0, s - 1); el.textContent = fmt(s) }, 1000) });
function openSheet(id) { const w = document.getElementById(id); if (!w) return; w.classList.remove('hidden'); w.classList.add('flex'); requestAnimationFrame(() => { const c = w.querySelector('.bottom-sheet'); if (c) c.style.transform = 'translateY(0)' }) }
function closeSheet(id) { const w = document.getElementById(id); if (!w) return; const c = w.querySelector('.bottom-sheet'); if (c) c.style.transform = 'translateY(100%)'; setTimeout(() => { w.classList.add('hidden'); w.classList.remove('flex') }, 200) }
document.addEventListener('click', e => {
    const b = e.target.closest('[data-buy]'); if (b) { const [t, m] = b.dataset.buy.split('|'); document.getElementById('buyTitle').textContent = t; document.getElementById('buyMeta').textContent = m || ''; document.getElementById('legalBox').checked = false; openSheet('checkout'); return }
    const o = e.target.closest('[data-open]'); if (o) { const id = o.dataset.open; const d = document.getElementById(id); if (d && d.showModal) d.showModal(); return }
    const c = e.target.closest('[data-close]'); if (c) { closeSheet(c.dataset.close); return }
    const cd = e.target.closest('[data-close-dialog]'); if (cd) { document.getElementById(cd.dataset.closeDialog).close(); return }
});
document.getElementById('payBtn').addEventListener('click', () => { if (!document.getElementById('legalBox').checked) { toast('فعّل الموافقة القانونية أولاً'); return } closeSheet('checkout'); const tc = document.getElementById('ticketCount'); tc.textContent = parseInt(tc.textContent, 10) + 1; document.getElementById('hud-tickets').textContent = 'تذاكري: ' + tc.textContent; toast('تم الدفع (ديمو) + تذكرة جديدة!') });
let pending = 0; document.querySelectorAll('.topup').forEach(b => b.addEventListener('click', () => { pending = parseInt(b.dataset.amt, 10); toast('اخترت شحن $' + pending) }));
document.getElementById('confirmTopup').addEventListener('click', () => { if (!pending) { toast('اختر مبلغاً أولاً'); return } const bal = document.getElementById('walletBal'); const cur = parseInt(bal.textContent.replace(/[^0-9]/g, ''), 10) || 0; bal.textContent = '$' + (cur + pending); document.getElementById('hud-wallet').textContent = 'محفظتي: $' + (cur + pending); toast('تم شحن $' + pending + ' (ديمو)'); pending = 0 });
document.getElementById('copyRef').addEventListener('click', async () => { const v = document.getElementById('refLink').value; try { await navigator.clipboard.writeText(v) } catch (e) { } toast('تم نسخ الرابط: ' + v) });
document.getElementById('quizGo').addEventListener('click', () => { document.getElementById('quizModal').close(); toast('بناءً على معطياتك، تم تخصيص الكورس لك') });
document.getElementById('paidConfirm').addEventListener('click', () => { document.getElementById('paidModal').close(); const d = document.getElementById('due1'); if (d) d.textContent = '$0'; toast('تم التسديد والتصفير (ديمو)') });
let ar = true; document.getElementById('langBtn').addEventListener('click', () => { ar = !ar; document.documentElement.lang = ar ? 'ar' : 'en'; document.documentElement.dir = ar ? 'rtl' : 'ltr'; toast(ar ? 'العربية RTL' : 'English LTR (demo)') });
