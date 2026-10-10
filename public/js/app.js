document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('[data-order-form]');

  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const resultBox = form.querySelector('[data-order-result]');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Memproses...';
      }

      const payload = new FormData(form);
      const data = Object.fromEntries(payload.entries());

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Gagal membuat pesanan.');
        }

        if (resultBox) {
          resultBox.innerHTML = `
            <div class="glass-panel">
              <h3>Pesanan berhasil dibuat</h3>
              <p>Nomor pesanan: <strong>${result.order.order_number}</strong></p>
              <p>Status: <span class="status-badge status-pending">${result.order.order_status}</span></p>
              <p>Metode pembayaran: ${result.order.payment_method}</p>
              <p>Mode: ${result.payment.mode}</p>
              <p>${result.payment.instructions}</p>
              <a class="btn btn-primary" href="/orders/${result.order.order_number}">Lihat detail pesanan</a>
            </div>
          `;
        }

        form.reset();
      } catch (error) {
        if (resultBox) {
          resultBox.innerHTML = `<div class="glass-panel"><p style="color:#ff9ca1;">${error.message}</p></div>`;
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Buat Pesanan';
        }
      }
    });
  });

  const promoForm = document.querySelector('[data-promo-form]');
  if (promoForm) {
    promoForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(promoForm);
      const code = formData.get('code');
      const amount = formData.get('amount');
      const resultBox = document.querySelector('[data-promo-result]');

      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, amount })
      });

      const result = await response.json();
      if (resultBox) {
        resultBox.innerHTML = result.valid
          ? `<div class="glass-panel"><p>Promo aktif: ${result.message}</p><p>Diskon: Rp ${Number(result.discount_amount || 0).toLocaleString('id-ID')}</p></div>`
          : `<div class="glass-panel"><p style="color:#ff9ca1;">${result.message}</p></div>`;
      }
    });
  }

  const orderCheck = document.querySelector('[data-order-check]');
  if (orderCheck) {
    orderCheck.addEventListener('submit', async (event) => {
      event.preventDefault();
      const orderNumber = document.querySelector('#orderNumber')?.value;
      if (!orderNumber) return;
      window.location.href = `/cek-pesanan?order=${encodeURIComponent(orderNumber)}`;
    });
  }
});
