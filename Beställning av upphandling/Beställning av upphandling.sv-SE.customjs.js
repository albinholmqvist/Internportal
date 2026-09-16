(function () {
  // Debounce
  function debounce(func, wait) {
    var timeout;
    return function () {
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () { func.apply(null, args); }, wait);
    };
  }

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function addParam(params, key, value) { if (value !== '') params.push(key + '=' + encodeURIComponent(value)); }

  function buildUrl() {
    var params = [];
    addParam(params, 'qName', val('qName'));
    var sortByEl = document.getElementById('sortBy');
    var sortDirEl = document.getElementById('sortDir');
    addParam(params, 'sortBy', sortByEl ? sortByEl.value : '');
    addParam(params, 'sortDir', sortDirEl ? sortDirEl.value : '');
    var currentStatus = new URLSearchParams(window.location.search).get('status');
    if (currentStatus) addParam(params, 'status', currentStatus);
    var base = window.location.pathname;
    return params.length > 0 ? (base + '?' + params.join('&')) : base;
  }

  function navigate() {
    var table = document.querySelector('.upphandling-table');
    if (table) { table.style.opacity = '0.5'; table.style.pointerEvents = 'none'; }
    setTimeout(function () { window.location.assign(buildUrl()); }, 100);
  }

  // ===== SÖK =====
  var btnSearch = document.getElementById('btnSearch');
  if (btnSearch) btnSearch.addEventListener('click', navigate);

  var debouncedSearch = debounce(navigate, 400);
  var qNameInput = document.getElementById('qName');
  if (qNameInput) {
    qNameInput.addEventListener('input', debouncedSearch);
    qNameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); navigate(); }
    });
  }

  // ===== SORTERING =====
  var sortBySelect = document.getElementById('sortBySelect');
  var sortByHidden = document.getElementById('sortBy');
  if (sortBySelect && sortByHidden) {
    sortBySelect.addEventListener('change', function () {
      sortByHidden.value = sortBySelect.value;
      navigate();
    });
  }

  var dirBtns = document.querySelectorAll('.dir-btn[data-dir]');
  Array.prototype.forEach.call(dirBtns, function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      dirBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var sel = document.getElementById('sortDir');
      if (sel) sel.value = btn.getAttribute('data-dir');
      navigate();
    });
  });

  // ===== BELOPP =====
  // Totalvärdet är en Money-kolumn. FetchXML ger sällan ett färdigformaterat värde, så Liquid
  // skickar med det råa värdet i data-value ("1500000.0000") och det formateras här i stället.
  function parseMoney(raw) {
    if (raw === null || raw === undefined) return null;
    var cleaned = String(raw).replace(/ /g, ' ').replace(/\s/g, '').replace(/kr$/i, '');
    if (cleaned === '') return null;
    // Svenskt format ("1 500 000,50") och punktformat ("1500000.5000") ska båda fungera
    if (/,\d{1,2}$/.test(cleaned)) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    else cleaned = cleaned.replace(/,/g, '');
    var n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }

  function formatMoney(n) {
    try {
      return new Intl.NumberFormat('sv-SE', {
        style: 'currency', currency: 'SEK', minimumFractionDigits: 0, maximumFractionDigits: 0
      }).format(n);
    } catch (e) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr';
    }
  }

  function formatMoneyCells() {
    var sum = 0;
    var any = false;
    Array.prototype.forEach.call(document.querySelectorAll('.upphandling-table td.js-money'), function (td) {
      var n = parseMoney(td.getAttribute('data-value'));
      if (n === null) { td.textContent = '-'; return; }
      td.textContent = formatMoney(n);
      sum += n;
      any = true;
    });

    var sumEl = document.getElementById('upphandlingTotalSum');
    if (sumEl) sumEl.textContent = any ? formatMoney(sum) : '-';

    // Popupen läser data-totalvarde, så det formateras på samma sätt
    Array.prototype.forEach.call(document.querySelectorAll('.upphandling-popup-trigger[data-totalvarde-raw]'), function (btn) {
      var n = parseMoney(btn.getAttribute('data-totalvarde-raw'));
      btn.setAttribute('data-totalvarde', n === null ? '' : formatMoney(n));
    });
  }

  // ===== VISA MER (paginering) =====
  var pageSize = 10;
  var shownCount = pageSize;

  function getDataRows() {
    var tbody = document.querySelector('.upphandling-table tbody');
    if (!tbody) return [];
    return Array.prototype.filter.call(tbody.querySelectorAll('tr'), function (row) {
      return !row.querySelector('.empty-state');
    });
  }

  function applyPaging() {
    var rows = getDataRows();
    rows.forEach(function (row, index) {
      row.style.display = index >= shownCount ? 'none' : '';
    });
    var btnShowMore = document.getElementById('btnShowMore');
    if (!btnShowMore) return;
    var remaining = rows.length - shownCount;
    if (remaining <= 0) {
      btnShowMore.style.display = 'none';
    } else {
      btnShowMore.style.display = '';
      btnShowMore.textContent = 'Visa mer (' + remaining + ' till)';
    }
  }

  window.addEventListener('load', applyPaging);

  var btnShowMore = document.getElementById('btnShowMore');
  if (btnShowMore) {
    btnShowMore.addEventListener('click', function () {
      shownCount += pageSize;
      applyPaging();
    });
  }

  // ===== DISMISS SUCCESS MESSAGE =====
  window.dismissSuccessMessage = function () {
    var successMsg = document.getElementById('successMessage');
    if (successMsg) successMsg.style.display = 'none';
    if (window.history.replaceState) {
      var url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, document.title, url.toString());
    }
  };

  // ===== DETALJPOPUP =====
  var popupOverlay = document.getElementById('upphandlingPopupOverlay');
  var popupCloseBtn = document.getElementById('popupCloseBtn');
  var popupCloseFooterBtn = document.getElementById('popupCloseFooterBtn');

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = (value && value !== '') ? value : '-';
  }

  function openUpphandlingPopup(data) {
    document.getElementById('popupTitle').textContent = data.name || 'Beställning';

    var badgeEl = document.getElementById('popupStatusBadge');
    if (data.status) {
      badgeEl.innerHTML = '<span class="status-badge ' + (data.statusclass || 'default') + '">' + data.status + '</span>';
    } else {
      badgeEl.innerHTML = '';
    }

    setText('popupBeskrivning', data.beskrivning);
    setText('popupCreated', data.created);
    setText('popupVerksamhet', data.verksamhet);
    setText('popupTotalvarde', data.totalvarde);
    setText('popupUpphandlingsstart', data.upphandlingsstart);
    setText('popupKontraktstart', data.kontraktstart);
    setText('popupKontaktperson', data.kontaktperson);
    setText('popupAvtalsagare', data.avtalsagare);
    setText('popupAvtalsansvarig', data.avtalsansvarig);
    setText('popupChef', data.chef);
    setText('popupEpost', data.epost);
    setText('popupTelefon', data.telefon);
    setText('popupMiljo', data.miljo);
    setText('popupPersonuppgifter', data.personuppgifter);
    setText('popupReferensgrupp', data.referensgrupp);

    // Miljökommentaren är bara relevant när miljökrav är valt
    var kommentarField = document.getElementById('popupMiljokommentarField');
    if (kommentarField) {
      setText('popupMiljokommentar', data.miljokommentar);
      kommentarField.style.display = (data.miljokommentar && data.miljokommentar !== '') ? '' : 'none';
    }

    // Bilagor (annotation-poster) - markupen kom med som en <template> bredvid raden
    var attSection = document.getElementById('popupAttachmentsSection');
    var attContainer = document.getElementById('popupAttachments');
    if (attSection && attContainer) {
      if (data.attachmentsHtml) {
        attContainer.innerHTML = data.attachmentsHtml;
        attSection.style.display = '';
      } else {
        attContainer.innerHTML = '';
        attSection.style.display = 'none';
      }
    }

    popupOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeUpphandlingPopup() {
    popupOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (popupCloseBtn) popupCloseBtn.addEventListener('click', closeUpphandlingPopup);
  if (popupCloseFooterBtn) popupCloseFooterBtn.addEventListener('click', closeUpphandlingPopup);
  if (popupOverlay) {
    popupOverlay.addEventListener('click', function (e) {
      if (e.target === popupOverlay) closeUpphandlingPopup();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popupOverlay && popupOverlay.classList.contains('active')) {
      closeUpphandlingPopup();
    }
  });

  function initPopupTriggers() {
    var triggers = document.querySelectorAll('.upphandling-popup-trigger');
    triggers.forEach(function (trigger) {
      var newTrigger = trigger.cloneNode(true);
      trigger.parentNode.replaceChild(newTrigger, trigger);
      newTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        var attTpl = this.parentElement ? this.parentElement.querySelector('template.row-attachments-tpl') : null;
        var data = {
          id: this.getAttribute('data-id') || '',
          name: this.getAttribute('data-name') || '',
          created: this.getAttribute('data-created') || '',
          beskrivning: this.getAttribute('data-beskrivning') || '',
          status: this.getAttribute('data-status') || '',
          statusclass: this.getAttribute('data-statusclass') || 'default',
          verksamhet: this.getAttribute('data-verksamhet') || '',
          totalvarde: this.getAttribute('data-totalvarde') || '',
          upphandlingsstart: this.getAttribute('data-upphandlingsstart') || '',
          kontraktstart: this.getAttribute('data-kontraktstart') || '',
          miljo: this.getAttribute('data-miljo') || '',
          miljokommentar: this.getAttribute('data-miljokommentar') || '',
          personuppgifter: this.getAttribute('data-personuppgifter') || '',
          referensgrupp: this.getAttribute('data-referensgrupp') || '',
          kontaktperson: this.getAttribute('data-kontaktperson') || '',
          avtalsagare: this.getAttribute('data-avtalsagare') || '',
          avtalsansvarig: this.getAttribute('data-avtalsansvarig') || '',
          chef: this.getAttribute('data-chef') || '',
          epost: this.getAttribute('data-epost') || '',
          telefon: this.getAttribute('data-telefon') || '',
          attachmentsHtml: attTpl ? attTpl.innerHTML : ''
        };
        openUpphandlingPopup(data);
      });
    });
  }

  // Belopp formateras efter att knapparna klonats om, annars skrivs värdet till element som byts ut
  window.addEventListener('load', function () {
    initPopupTriggers();
    formatMoneyCells();
  });
  if (btnShowMore) {
    btnShowMore.addEventListener('click', function () {
      setTimeout(function () { initPopupTriggers(); formatMoneyCells(); }, 100);
    });
  }

  // Gör hela raden klickbar
  function initRowClickNavigation() {
    var rows = document.querySelectorAll('.upphandling-table tbody tr');
    rows.forEach(function (row) {
      row.addEventListener('click', function (e) {
        if (e.target.closest('button') || e.target.closest('a')) return;
        var btn = row.querySelector('button.upphandling-popup-trigger');
        if (btn) btn.click();
      });
    });
  }
  window.addEventListener('load', initRowClickNavigation);

  // ===== MILJÖKOMMENTAR VISAS BARA VID JA =====
  // Fältet cr5ee_miljo kan renderas som radioknappar, kryssruta eller lista beroende på
  // hur kolumnen är satt upp, så alla tre läses av. Döljs fältet töms det också, så att
  // en kommentar från ett ändrat svar inte följer med in i posten.
  (function () {
    function miljoInputs() {
      return document.querySelectorAll('[id^="cr5ee_miljo"]:not([id^="cr5ee_miljokommentar"]), [name="cr5ee_miljo"]');
    }

    function isYes() {
      var yes = false;
      Array.prototype.forEach.call(miljoInputs(), function (el) {
        var type = (el.type || '').toLowerCase();
        if (type === 'radio') {
          if (el.checked && /^(1|true|ja|yes)$/i.test(el.value)) yes = true;
        } else if (type === 'checkbox') {
          if (el.checked) yes = true;
        } else if (el.tagName === 'SELECT' || type === 'hidden' || type === 'text') {
          if (/^(1|true|ja|yes)$/i.test(el.value || '')) yes = true;
        }
      });
      return yes;
    }

    function container(el) {
      return el.closest('tr') || el.closest('.form-group') || el.closest('.control-group') || el.parentNode;
    }

    function apply() {
      var kommentar = document.getElementById('cr5ee_miljokommentar');
      if (!kommentar) return;
      var box = container(kommentar);
      if (!box) return;
      var show = isYes();
      box.style.display = show ? '' : 'none';
      if (!show && kommentar.value) kommentar.value = '';
    }

    // Formuläret flyttas in i popupen och laddas om vid postback, så allt körs delegerat
    document.addEventListener('change', function (e) {
      if (!e.target) return;
      var id = e.target.id || '';
      var name = e.target.getAttribute ? (e.target.getAttribute('name') || '') : '';
      if (id.indexOf('cr5ee_miljo') === 0 || name === 'cr5ee_miljo') apply();
    });
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'openFormModalBtn') setTimeout(apply, 50);
    });
    window.addEventListener('load', function () { setTimeout(apply, 100); });
  })();

  // ===== BIFOGA FILER (annotation) =====
  // Entityformen är ett klassiskt WebForms-formulär med helsidespostback, så filen kan inte
  // följa med i samma anrop. Den mellanlagras i webbläsaren (IndexedDB, klarar stora filer) när
  // den väljs, och laddas upp som annotation (Note) när vi landar tillbaka med ?success=1 och
  // Liquid slagit upp den nyss skapade beställningen (#justCreatedUpphandlingMarker).
  // Samma beprövade mönster som Ärende-sidan använder.
  (function () {
    var DB_NAME = 'upphandlingPendingAttachments';
    var STORE_NAME = 'files';

    function openPendingDb(callback) {
      if (!window.indexedDB) { callback(null); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = function () { callback(req.result); };
      req.onerror = function () { callback(null); };
    }

    function clearPendingFiles(callback) {
      openPendingDb(function (db) {
        if (!db) { if (callback) callback(); return; }
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = function () { if (callback) callback(); };
        tx.onerror = function () { if (callback) callback(); };
      });
    }

    function stashPendingFiles(files, callback) {
      clearPendingFiles(function () {
        if (files.length === 0) { if (callback) callback(); return; }
        openPendingDb(function (db) {
          if (!db) { if (callback) callback(); return; }
          var tx = db.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          files.forEach(function (file) {
            store.add({ name: file.name, type: file.type, blob: file });
          });
          tx.oncomplete = function () { if (callback) callback(); };
          tx.onerror = function () { if (callback) callback(); };
        });
      });
    }

    function readPendingFiles(callback) {
      openPendingDb(function (db) {
        if (!db) { callback([]); return; }
        var tx = db.transaction(STORE_NAME, 'readonly');
        var req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = function () { callback(req.result || []); };
        req.onerror = function () { callback([]); };
      });
    }

    function extractErrorMessage(xhr) {
      try {
        var err = JSON.parse(xhr.responseText).error;
        if (err.innererror && err.innererror.message) return err.innererror.message;
        return err.message;
      } catch (e) {
        return 'Okänt fel';
      }
    }

    function showAttachStatus(msg, type) {
      var nodes = document.querySelectorAll('.create-attach-status');
      Array.prototype.forEach.call(nodes, function (el) {
        el.textContent = msg;
        el.className = 'create-attach-status' + (type ? ' status-' + type : '');
      });
    }

    function uploadStoredFile(upphandlingId, storedFile, callback) {
      var reader = new FileReader();

      reader.onerror = function () {
        console.error('Kunde inte läsa filen:', storedFile.name, reader.error);
        callback('filen kunde inte läsas');
      };

      reader.onload = function () {
        var base64 = reader.result.split(',')[1];
        webapi.safeAjax({
          type: 'POST',
          url: '/_api/annotations',
          contentType: 'application/json',
          data: JSON.stringify({
            'objectid_cr5ee_upphandling@odata.bind': '/cr5ee_upphandlings(' + upphandlingId + ')',
            'subject': 'Bifogad fil',
            'filename': storedFile.name,
            'mimetype': storedFile.type || 'application/octet-stream',
            'documentbody': base64,
            'isdocument': true
          }),
          success: function () { callback(null); },
          error: function (xhr) {
            console.error('Kunde inte bifoga fil till beställningen:', xhr.responseText);
            callback(extractErrorMessage(xhr));
          }
        });
      };

      reader.readAsDataURL(storedFile.blob);
    }

    var marker = document.getElementById('justCreatedUpphandlingMarker');
    var justCreatedId = marker ? marker.getAttribute('data-upphandlingid') : '';
    var onSuccessPage = !!document.getElementById('successMessage');

    if (justCreatedId) {
      readPendingFiles(function (files) {
        if (files.length === 0) return;

        showAttachStatus('Bifogar ' + files.length + (files.length === 1 ? ' fil...' : ' filer...'), 'info');

        var remaining = files.length;
        var failed = [];

        files.forEach(function (f) {
          uploadStoredFile(justCreatedId, f, function (err) {
            if (err) failed.push(f.name + ' (' + err + ')');
            remaining--;
            if (remaining > 0) return;

            clearPendingFiles();

            if (failed.length === 0) {
              showAttachStatus(
                files.length === 1 ? 'Filen bifogades till beställningen.' : files.length + ' filer bifogades till beställningen.',
                'success'
              );
              // Bilagorna renderas av Liquid, så listan måste laddas om för att visa dem
              setTimeout(function () {
                var url = new URL(window.location.href);
                url.searchParams.delete('success');
                window.location.replace(url.toString());
              }, 1500);
            } else if (failed.length === files.length) {
              showAttachStatus('Beställningen skapades, men filen kunde inte bifogas: ' + failed.join(', '), 'error');
            } else {
              showAttachStatus('Beställningen skapades, men vissa filer kunde inte bifogas: ' + failed.join(', '), 'error');
            }
          });
        });
      });
    } else {
      // Färskt besök: rensa kvarglömda filer från ett avbrutet försök, så de inte bifogas fel post
      readPendingFiles(function (files) {
        if (onSuccessPage && files.length > 0) {
          showAttachStatus('Beställningen skapades, men filen kunde inte bifogas (hittade inte den nyskapade beställningen). Kontakta support om filen behövs.', 'error');
        }
        clearPendingFiles();
      });
    }

    document.addEventListener('change', function (e) {
      if (!e.target || e.target.id !== 'upphandlingFileInput') return;
      var files = Array.prototype.slice.call(e.target.files || []);
      var hint = document.getElementById('upphandlingAttachHint');
      stashPendingFiles(files, function () {
        if (!hint) return;
        if (files.length === 0) {
          hint.textContent = '';
        } else if (files.length === 1) {
          hint.textContent = '1 fil vald: ' + files[0].name;
        } else {
          hint.textContent = files.length + ' filer valda';
        }
      });
    });
  })();

  // ===== FORM POPUP (Ny beställning) =====
  var formPopupOverlay = document.getElementById('formPopupOverlay');
  var formPopupCloseBtn = document.getElementById('formPopupCloseBtn');
  var formPopupBody = document.getElementById('formPopupBody');

  function openFormPopup() {
    if (!formPopupOverlay || !formPopupBody) return;
    var realFormContainer = document.getElementById('active-form-container');
    if (realFormContainer) formPopupBody.appendChild(realFormContainer);
    formPopupOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('formPopupOpen', 'true');
  }

  function closeFormPopup() {
    if (!formPopupOverlay) return;
    var realFormContainer = document.getElementById('active-form-container');
    var sidebarWrapper = document.querySelector('#createFormCard .form-container-wrapper');
    if (realFormContainer && sidebarWrapper && realFormContainer.parentNode !== sidebarWrapper) {
      sidebarWrapper.appendChild(realFormContainer);
    }
    formPopupOverlay.classList.remove('active');
    document.body.style.overflow = '';
    sessionStorage.removeItem('formPopupOpen');
  }

  if (formPopupCloseBtn) formPopupCloseBtn.addEventListener('click', closeFormPopup);
  if (formPopupOverlay) {
    formPopupOverlay.addEventListener('click', function (e) {
      if (e.target === formPopupOverlay) closeFormPopup();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && formPopupOverlay && formPopupOverlay.classList.contains('active')) {
      closeFormPopup();
    }
  });

  var openFormModalBtn = document.getElementById('openFormModalBtn');
  if (openFormModalBtn) {
    openFormModalBtn.addEventListener('click', function (e) {
      e.preventDefault();
      openFormPopup();
    });
  }

  // Om popupen var öppen vid en postback (t.ex. valideringsfel), återöppna den
  window.addEventListener('load', function () {
    if (sessionStorage.getItem('formPopupOpen') === 'true') {
      sessionStorage.removeItem('formPopupOpen');
      openFormPopup();
    }
  });
})();

/* ===== BEKRÄFTELSE OCH SORTERING PÅ KOLUMNRUBRIK =====
   Ligger i en egen funktion och återanvänder sidans egen sökknapp för att navigera,
   så sorteringen hamnar i adressen på exakt samma sätt som listan redan gör. */
(function () {
  // Bekräftelsen tonas ut av sig själv, men bara om användaren inte hunnit stänga den
  window.addEventListener('load', function () {
    var flash = document.getElementById('successMessage');
    if (!flash) return;
    setTimeout(function () {
      if (!document.body.contains(flash)) return;
      flash.classList.add('is-leaving');
      setTimeout(function () {
        if (typeof window.dismissSuccessMessage === 'function') window.dismissSuccessMessage();
      }, 400);
    }, 10000);
  });

  // Klick på kolumnrubrik sorterar. Rubriken visar riktningen via aria-sort,
  // som också är det attribut skärmläsare läser upp.
  window.addEventListener('load', function () {
    var params = new URLSearchParams(window.location.search);
    var currentField = params.get('sortBy') || 'createdon';
    var currentDir = (params.get('sortDir') || 'desc').toLowerCase();

    var headers = document.querySelectorAll('.upphandling-table th[data-sort-field]');
    Array.prototype.forEach.call(headers, function (th) {
      var field = th.getAttribute('data-sort-field');
      if (field === currentField) {
        th.setAttribute('aria-sort', currentDir === 'asc' ? 'ascending' : 'descending');
      } else {
        th.removeAttribute('aria-sort');
      }
      th.setAttribute('title', 'Sortera på ' + (th.textContent || '').trim());

      th.addEventListener('click', function () {
        var nextDir = (field === currentField && currentDir === 'desc') ? 'asc' : 'desc';
        // Datum och belopp är mest användbara med det största värdet först
        if (field !== currentField && (field === 'cr5ee_name' || field === 'cr5ee_status')) nextDir = 'asc';

        var sortBy = document.getElementById('sortBy');
        var sortDir = document.getElementById('sortDir');
        var sortBySelect = document.getElementById('sortBySelect');
        if (sortBy) sortBy.value = field;
        if (sortDir) sortDir.value = nextDir;
        if (sortBySelect) sortBySelect.value = field;

        var btnSearch = document.getElementById('btnSearch');
        if (btnSearch) btnSearch.click();
      });
    });
  });
})();
