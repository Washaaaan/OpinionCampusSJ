(function () {
  'use strict';

  /*
   * Contadores anónimos (Abacus).
   * No se envía ni se guarda ningún dato del formulario: solo se incrementa
   * un contador con una petición GET sin cuerpo.
   *
   * Para empezar la medición desde cero antes de lanzar el ejercicio,
   * cambia el valor de NAMESPACE por uno nuevo (por ejemplo, agrega la fecha).
   */
  var API = 'https://abacus.jasoncameron.dev';
  var NAMESPACE = 'seguridadcomp-sj';
  var KEY_SCANS = 'escaneos';
  var KEY_DATA = 'datos';
  var SESSION_KEY = 'sj_scan_count';

  var form = document.getElementById('formulario');
  var result = document.getElementById('resultado');
  var scansOut = document.getElementById('contador-escaneos');
  var dataOut = document.getElementById('contador-datos');
  var submitButton = form.querySelector('button[type="submit"]');

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

  function hit(key) {
    var url = API + '/hit/' + encodeURIComponent(NAMESPACE) + '/' + encodeURIComponent(key);

    return fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit'
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
    });
  }

  var scanPromise = (function () {
    var cached = sessionGet(SESSION_KEY);

    if (cached !== null && cached !== '' && isFinite(Number(cached))) {
      return Promise.resolve(Number(cached));
    }

    return hit(KEY_SCANS).then(function (value) {
      sessionSet(SESSION_KEY, String(value));
      return value;
    }).catch(function () {
      return null;
    });
  })();

  function showCount(element, value) {
    element.textContent = (value === null || !isFinite(value)) ? '\u2014' : String(value);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    submitButton.disabled = true;

    form.hidden = true;
    result.hidden = false;
    window.scrollTo(0, 0);

    scanPromise.then(function (value) {
      showCount(scansOut, value);
    });

    hit(KEY_DATA).then(function (value) {
      showCount(dataOut, value);
    }).catch(function () {
      showCount(dataOut, null);
    });
  });
})();
