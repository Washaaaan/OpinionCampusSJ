(function () {
  'use strict';

  /*
   * Contadores anónimos (Tallywire).
   * No se envía ni se guarda ningún dato del formulario: solo se incrementa
   * un contador con una petición GET sin cuerpo.
   */
  var API = 'https://tallywire.cronpulse.workers.dev';
  var NAMESPACE = 'seguridadcomp-sj';
  var KEY_SCANS = 'escaneos';
  var KEY_DATA = 'datos';
  var SESSION_KEY = 'sj_scan_count';
  var REQUEST_TIMEOUT = 6000;
  var MAX_ATTEMPTS = 3;

  var form = document.getElementById('formulario');
  var result = document.getElementById('resultado');
  var scansOut = document.getElementById('contador-escaneos');
  var dataOut = document.getElementById('contador-datos');
  var submitButton = form.querySelector('button[type="submit"]');

  var scanValue = null;
  var dataValue = null;

  function sessionGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function sessionSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      /* sessionStorage puede no estar disponible en modo privado. */
    }
  }

  function sleep(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function fetchJSON(url) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT);

    return fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    }).then(function (data) {
      var value = Number(data && data.value);
      if (!isFinite(value)) {
        throw new Error('Respuesta inválida');
      }
      return value;
    }).finally(function () {
      window.clearTimeout(timer);
    });
  }

  function counterURL(action, key) {
    return API + '/' + action + '/' + encodeURIComponent(NAMESPACE) + '/' + encodeURIComponent(key);
  }

  function hit(key) {
    return fetchJSON(counterURL('hit', key));
  }

  function getCount(key) {
    return fetchJSON(counterURL('get', key));
  }

  /*
   * Incrementa con reintentos. Si una petición falla pero el contador ya subió,
   * se usa ese valor en lugar de volver a incrementar (evita doble conteo).
   */
  function increment(key, getPrevious) {
    var attempt = 1;

    function tryOnce() {
      return hit(key).catch(function (error) {
        var check = sleep(1500).then(function () {
          return getCount(key).then(function (current) {
            var previous = getPrevious();

            if (previous !== null && current > previous) {
              return current;
            }

            throw error;
          });
        });

        return check.catch(function () {
          if (attempt >= MAX_ATTEMPTS) {
            throw error;
          }

          var wait = attempt * 1000;
          attempt += 1;

          return sleep(wait).then(tryOnce);
        });
      });
    }

    return tryOnce();
  }

  function showCount(element, value) {
    element.textContent = (value === null || !isFinite(value)) ? '\u2014' : String(value);
  }

  function showPending(element) {
    element.textContent = '\u2026';
  }

  var scanPromise = (function () {
    var cached = sessionGet(SESSION_KEY);

    if (cached !== null && cached !== '' && isFinite(Number(cached))) {
      scanValue = Number(cached);
      return Promise.resolve(scanValue);
    }

    return increment(KEY_SCANS, function () {
      return scanValue;
    }).then(function (value) {
      scanValue = value;
      sessionSet(SESSION_KEY, String(value));
      return value;
    }).catch(function () {
      return null;
    });
  })();

  /* Valor de referencia para mostrar un número de inmediato al enviar. */
  var dataBaselinePromise = getCount(KEY_DATA).then(function (value) {
    dataValue = value;
    return value;
  }).catch(function () {
    return null;
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    submitButton.disabled = true;

    form.hidden = true;
    result.hidden = false;
    showPending(scansOut);
    showPending(dataOut);
    window.scrollTo(0, 0);

    scanPromise.then(function (value) {
      showCount(scansOut, value);
    });

    var dataSettled = false;

    dataBaselinePromise.then(function (value) {
      if (value === null) {
        return;
      }

      dataValue = Math.max(dataValue === null ? 0 : dataValue, value);

      if (!dataSettled) {
        dataOut.textContent = String(dataValue + 1);
      }
    });

    increment(KEY_DATA, function () {
      return dataValue;
    }).then(function (value) {
      dataSettled = true;
      dataValue = Math.max(dataValue === null ? 0 : dataValue, value);
      showCount(dataOut, value);
    }).catch(function () {
      dataSettled = true;
      showCount(dataOut, null);
    });
  });
})();
