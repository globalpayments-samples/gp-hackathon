/**
 * layer: tile
 * purpose: Hosted Fields — renders Global Payments' secure card-entry iframes
 *          inside the branded checkout page using the raw form builder
 *          (GlobalPayments.ui.form) so layout and styling follow the GP brand
 *          system exactly, exchanges card data for a single-use token, and
 *          posts that token to the active payment brick.
 * sdk: globalpayments-js (loaded from the GP CDN)
 */
(function () {
  'use strict';

  var settings = window.GP_SAMPLE || {};
  var payEndpoint = settings.payEndpoint || '/api/charge';
  var payLabel = settings.payLabel || 'Pay now';
  var captureEndpoint = settings.captureEndpoint || null;

  var statusEl = document.getElementById('gp-status');
  var resultEl = document.getElementById('gp-result');
  var actionsEl = document.getElementById('gp-actions');

  // Brand tokens (gpbrandguide.com) — injected into the hosted-field iframes.
  var DM_SANS_WOFF2 =
    'https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2';
  var IFRAME_STYLES = {
    '@font-face': [
      {
        'font-family': "'DM Sans'",
        src: "url('" + DM_SANS_WOFF2 + "') format('woff2')",
        'font-weight': '100 1000',
        'font-style': 'normal',
      },
    ],
    'html, body': {
      margin: '0',
      padding: '0',
      height: '100%',
    },
    'input, button': {
      'font-family': "'DM Sans', 'Noto Sans', sans-serif",
      'box-sizing': 'border-box',
      display: 'block',
    },
    input: {
      width: '100%',
      height: '48px',
      padding: '12px 14px',
      border: '1px solid #C4C4C4',
      'border-radius': '8px',
      'font-size': '16px',
      'line-height': '1.5',
      color: '#0C0C0C',
      background: '#FFFFFF',
    },
    'input:focus': {
      border: '1px solid #262AFF',
      'box-shadow': '0 0 0 1px #262AFF',
      outline: 'none',
    },
    'input.invalid, input.error': {
      border: '1px solid #F4364C',
      'box-shadow': 'none',
    },
    '::placeholder': {
      color: '#595959',
      opacity: '0.7',
    },
    button: {
      width: '100%',
      height: '52px',
      background: '#262AFF',
      color: '#FFFFFF',
      border: 'none',
      'border-radius': '8px',
      'font-size': '16px',
      'font-weight': '700',
      cursor: 'pointer',
      transition: 'background 150ms ease',
    },
    'button:hover, button:focus': {
      background: '#1B1EC6',
    },
  };

  // Copy-to-clipboard for the sandbox test card number.
  var copyButton = document.getElementById('gp-copy-card');
  if (copyButton) {
    copyButton.addEventListener('click', function () {
      var number = copyButton.getAttribute('data-card');
      navigator.clipboard.writeText(number).then(
        function () {
          var original = copyButton.textContent;
          copyButton.textContent = 'Copied ✓';
          copyButton.classList.add('gp-button--copied');
          setTimeout(function () {
            copyButton.textContent = original.trim();
            copyButton.classList.remove('gp-button--copied');
          }, 2000);
        },
        function () {
          copyButton.textContent = number.replace(/(\d{4})(?=\d)/g, '$1 ');
        }
      );
    });
  }

  function flowEvent(phase) {
    document.dispatchEvent(new CustomEvent('gp:flow', { detail: { phase: phase } }));
  }

  function setStatus(message, tone) {
    statusEl.textContent = message;
    statusEl.className = 'gp-status' + (tone ? ' gp-status--' + tone : '');
  }

  function renderResult(result) {
    resultEl.hidden = false;
    resultEl.innerHTML = '';
    var rows = [
      ['Transaction id', result.transactionId],
      ['Status', result.status],
      ['Response code', result.responseCode],
      result.authorizationCode ? ['Authorization code', result.authorizationCode] : null,
    ].filter(Boolean);
    rows.forEach(function (row) {
      var dt = document.createElement('dt');
      dt.textContent = row[0];
      var dd = document.createElement('dd');
      dd.textContent = row[1];
      resultEl.appendChild(dt);
      resultEl.appendChild(dd);
    });
  }

  function offerCapture(transactionId) {
    if (!captureEndpoint) {
      return;
    }
    actionsEl.innerHTML = '';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'gp-button';
    button.textContent = 'Capture payment';
    button.addEventListener('click', function () {
      button.disabled = true;
      setStatus('Capturing…');
      flowEvent('capture');
      fetch(captureEndpoint + '/' + transactionId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result.error) {
            throw new Error(result.error.message);
          }
          renderResult(result);
          setStatus('Payment captured. Already on it — done.', 'success');
          actionsEl.innerHTML = '';
          flowEvent('success');
        })
        .catch(function (err) {
          setStatus('Capture failed: ' + err.message, 'error');
          button.disabled = false;
          flowEvent('error');
        });
    });
    actionsEl.appendChild(button);
  }

  function submitToken(token) {
    setStatus('Processing payment…');
    flowEvent('pay');
    var amount = document.getElementById('gp-amount').value || '29.99';
    fetch(payEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, amount: amount, currency: 'USD' }),
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result.error) {
          throw new Error(result.error.message);
        }
        renderResult(result);
        if (result.status === 'PREAUTHORIZED') {
          setStatus('Funds held. Capture when you are ready.', 'success');
          offerCapture(result.transactionId);
        } else {
          setStatus('Payment approved. Already on it — done.', 'success');
        }
        flowEvent('success');
      })
      .catch(function (err) {
        setStatus('Payment failed: ' + err.message, 'error');
        flowEvent('error');
      });
  }

  fetch('/api/access-token')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.error) {
        throw new Error(data.error.message);
      }
      GlobalPayments.configure({
        accessToken: data.accessToken,
        apiVersion: '2021-03-22',
        env: data.environment === 'production' ? 'production' : 'sandbox',
      });

      var cardForm = GlobalPayments.ui.form({
        fields: {
          'card-number': {
            target: '#gp-card-number',
            placeholder: '1234 5678 9012 3456',
          },
          'card-expiration': {
            target: '#gp-card-expiration',
            placeholder: 'MM / YYYY',
          },
          'card-cvv': {
            target: '#gp-card-cvv',
            placeholder: '123',
          },
          'card-holder-name': {
            target: '#gp-card-holder',
            placeholder: 'Name on card',
          },
          submit: {
            target: '#gp-card-submit',
            text: payLabel,
          },
        },
        styles: IFRAME_STYLES,
      });

      cardForm.on('token-success', function (resp) {
        submitToken(resp.paymentReference);
      });
      cardForm.on('token-error', function (resp) {
        var message = (resp && resp.reasons && resp.reasons[0] && resp.reasons[0].message) || 'tokenization error';
        setStatus('Card entry failed: ' + message, 'error');
        flowEvent('error');
      });
      cardForm.ready(function () {
        setStatus('Ready when you are.');
      });
    })
    .catch(function (err) {
      setStatus('Could not initialize secure fields: ' + err.message, 'error');
    });
})();
