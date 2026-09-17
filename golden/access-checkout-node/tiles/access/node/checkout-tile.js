'use strict';

const form = document.getElementById('checkout-form');
const result = document.getElementById('checkout-result');

if (form && result) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    result.textContent = 'Creating session...';
    const response = await fetch('/api/checkout-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    result.textContent = JSON.stringify(await response.json(), null, 2);
  });
}
