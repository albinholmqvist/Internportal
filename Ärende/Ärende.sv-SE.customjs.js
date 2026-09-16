  // Priority value mapping - adjust these values based on your Dataverse optionset values
  var priorityValues = {
    'Kritisk': 1,
    'Hög': 2,
    'Normal': 3,
    'Låg': 4
  };

  (function () {
    // Debounce function for search input
    function debounce(func, wait) {
      var timeout;
      return function executedFunction(...args) {
        var later = function() {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Show loading indicator
    function showLoading() {
      var table = document.querySelector('.arenden-table');
      if (table) {
        table.style.opacity = '0.5';
        table.style.pointerEvents = 'none';
      }
    }

    // Get element value
    function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    
    // Add URL parameter
    function addParam(params, key, value) { if (value !== '') params.push(key + '=' + encodeURIComponent(value)); }
    
    // Build URL from current state
    function buildUrl() {
      var params = [];
      // Sök
      addParam(params, 'qId',   val('qId'));
      addParam(params, 'qName', val('qName'));
      // Sort
      var sortByEl  = document.getElementById('sortBy');
      var sortDirEl = document.getElementById('sortDir');
      addParam(params, 'sortBy',  sortByEl  ? sortByEl.value  : '');
      addParam(params, 'sortDir', sortDirEl ? sortDirEl.value : '');
      // Behåll aktuell statusvy (öppna/avslutade/alla) genom sök & sortering
      var currentStatus = new URLSearchParams(window.location.search).get('status');
      if (currentStatus) addParam(params, 'status', currentStatus);

      var base = window.location.pathname;
      return params.length > 0 ? (base + '?' + params.join('&')) : base;
    }
    
    function navigate() {
      showLoading();
      // Small delay to show loading state
      setTimeout(function() {
        window.location.assign(buildUrl());
      }, 100);
    }

    // ===== IMPROVED SEARCH =====
    
    // Sök-knapp
    var btnSearch = document.getElementById('btnSearch');
    if (btnSearch) btnSearch.addEventListener('click', navigate);

    // Debounced search on input (300ms delay)
    var debouncedSearch = debounce(navigate, 400);
    
    var qIdInput = document.getElementById('qId');
    var qNameInput = document.getElementById('qName');
    
    if (qIdInput) {
      qIdInput.addEventListener('input', debouncedSearch);
    }
    if (qNameInput) {
      qNameInput.addEventListener('input', debouncedSearch);
    }

    // ===== SORTING CONTROLS =====
    
    // Sort by dropdown
    var sortBySelect = document.getElementById('sortBySelect');
    var sortByHidden = document.getElementById('sortBy');
    if (sortBySelect && sortByHidden) {
      sortBySelect.addEventListener('change', function() {
        sortByHidden.value = sortBySelect.value;
        // If priority is selected, use client-side sorting
        if (sortBySelect.value === 'cr5ee_prioritet') {
          sortTableByPriority();
        } else {
          navigate();
        }
      });
    }
    
    // Direction buttons
    var dirBtns = document.querySelectorAll('.dir-btn[data-dir]');
    Array.prototype.forEach.call(dirBtns, function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        dirBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var sel = document.getElementById('sortDir');
        if (sel) sel.value = btn.getAttribute('data-dir');
        
        // If priority is selected, use client-side sorting
        var sortBy = sortBySelect ? sortBySelect.value : '';
        if (sortBy === 'cr5ee_prioritet') {
          sortTableByPriority();
        } else {
          navigate();
        }
      });
    });

    // ===== CLIENT-SIDE PRIORITY SORTING =====
    function sortTableByPriority() {
      var table = document.querySelector('.arenden-table');
      if (!table) return;
      
      var tbody = table.querySelector('tbody');
      if (!tbody) return;
      
      var rows = Array.from(tbody.querySelectorAll('tr'));
      var sortDir = document.getElementById('sortDir');
      var descending = sortDir && sortDir.value === 'desc';
      
      rows.sort(function(a, b) {
        var priorityA = getPriorityValue(a);
        var priorityB = getPriorityValue(b);
        
        if (descending) {
          return priorityB - priorityA; // Highest first
        } else {
          return priorityA - priorityB; // Lowest first
        }
      });
      
      // Re-append rows in new order
      rows.forEach(function(row) {
        tbody.appendChild(row);
      });

      // Visa rätt rader igen efter omsorteringen (visa mer-pagineringen)
      applyPaging();
    }
    
    function getPriorityValue(row) {
      var badge = row.querySelector('.priority-badge');
      if (!badge) return 999;
      
      var text = badge.textContent.trim();
      
      // Map priority labels to numeric values
      var priorityMap = {
        'Kritisk': 1,
        'Hög': 2,
        'Normal': 3,
        'Låg': 4
      };
      
      return priorityMap[text] || 999;
    }
    
    // Apply client-side priority sorting on page load if priority is selected
    window.addEventListener('load', function() {
      var sortBy = document.getElementById('sortBySelect');
      if (sortBy && sortBy.value === 'cr5ee_prioritet') {
        sortTableByPriority();
      }
    });

    // ===== SHOW MORE FUNCTIONALITY =====
    // Custom JavaScript körs inte genom Liquid, så antalet rader läses från tabellen.
    // Raderna hämtas på nytt varje gång, eftersom prioritetssortering och radklick flyttar/ersätter dem.
    var pageSize = 10;
    var shownCount = pageSize;

    function getDataRows() {
      var tbody = document.querySelector('.arenden-table tbody');
      if (!tbody) return [];
      return Array.from(tbody.querySelectorAll('tr')).filter(function(row) {
        return !row.querySelector('.empty-state');
      });
    }

    // Visar de första shownCount raderna och döljer resten
    function applyPaging() {
      var rows = getDataRows();
      rows.forEach(function(row, index) {
        var hide = index >= shownCount;
        row.style.display = hide ? 'none' : '';
        row.classList.toggle('hidden-row', hide);
      });
      updateShowMoreButton(rows.length);
    }

    function updateShowMoreButton(total) {
      var btnShowMore = document.getElementById('btnShowMore');
      if (!btnShowMore) return;

      var remaining = total - shownCount;

      if (remaining <= 0) {
        btnShowMore.style.display = 'none';
      } else {
        btnShowMore.style.display = '';
        btnShowMore.textContent = 'Visa mer (' + remaining + ' till)';
      }
    }

    window.addEventListener('load', applyPaging);

    // Show more button click handler
    var btnShowMore = document.getElementById('btnShowMore');
    if (btnShowMore) {
      btnShowMore.addEventListener('click', function() {
        shownCount += pageSize;
        applyPaging();
      });
    }

    // ===== ENTER KEY IN SEARCH FIELDS =====
    ['qId','qName'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { 
          e.preventDefault(); 
          navigate(); 
        }
      });
    });

    // ===== ROW CLICK NAVIGATION =====
    // Make entire row clickable (except first cell which already has button)
    function initRowClickNavigation() {
      var tableRows = document.querySelectorAll('.arenden-table tbody tr');
      tableRows.forEach(function(row) {
        row.style.cursor = 'pointer';
        // Remove existing listeners to avoid duplicates
        var newRow = row.cloneNode(true);
        row.parentNode.replaceChild(newRow, row);
        
        newRow.addEventListener('click', function(e) {
          // Don't trigger if clicking on the button in first column
          if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
          }
          var button = newRow.querySelector('td:first-child button.arenden-popup-trigger');
          if (button) {
            button.click();
          }
        });
      });
    }
    
    // Initialize row click navigation on page load
    window.addEventListener('load', function() {
      initRowClickNavigation();
    });
    
    // Also initialize when rows are shown via "Show More"
    if (btnShowMore) {
      btnShowMore.addEventListener('click', function() {
        setTimeout(initRowClickNavigation, 100);
      });
    }

    // Ctrl/Cmd + K to focus search
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        var searchInput = document.getElementById('qId');
        if (searchInput) searchInput.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape') {
        var qId = document.getElementById('qId');
        var qName = document.getElementById('qName');
        if (qId) qId.value = '';
        if (qName) qName.value = '';
        navigate();
      }
    });

    // ===== URL PARAM PRE-FILL =====
    // Highlight active sort button on page load
    window.addEventListener('load', function() {
      var urlParams = new URLSearchParams(window.location.search);
      var sortBy = urlParams.get('sortBy');
      var sortDir = urlParams.get('sortDir');
      
      if (sortBy) {
        var sortBtns = document.querySelectorAll('[data-value]');
        sortBtns.forEach(function(btn) {
          if (btn.getAttribute('data-value') === sortBy) {
            btn.classList.add('active');
          }
        });
      }
    });

    // === Form Selector Logic ===
    (function() {
      var formSelectorBtns = document.querySelectorAll('.form-selector-btn');
      
      formSelectorBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var selectedForm = this.getAttribute('data-form');
          
          // Get current URL and add/update the form parameter
          var currentUrl = window.location.href;
          var urlObj = new URL(currentUrl);
          urlObj.searchParams.set('form', selectedForm);
          
          // Navigate to the new URL to reload with selected form
          window.location.href = urlObj.toString();
        });
      });
    })();

    // === Kommunal Sub-Form Toggle Logic ===
    (function() {
      var kommunalSubToggleBtns = document.querySelectorAll('.sub-toggle-btn[data-kommunal-form]');
      
      kommunalSubToggleBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var selectedKommunalForm = this.getAttribute('data-kommunal-form');
          
          // Get current URL and add/update the kommunalForm parameter
          var currentUrl = window.location.href;
          var urlObj = new URL(currentUrl);
          urlObj.searchParams.set('kommunalForm', selectedKommunalForm);
          
          // Navigate to the new URL to reload with selected kommunal form
          window.location.href = urlObj.toString();
        });
      });
    })();

    // ===== BIFOGA FIL VID SKAPANDE AV ÄRENDE =====
    // "Skapa ärende"-formuläret är ett klassiskt entityform (helsidespostback
    // via __doPostBack), så vi rör INTE dess submit-hantering - det är exakt
    // den typen av WebForms-hack som orsakat buggar tidigare i det här
    // projektet. Istället: filen väljs i filväljaren i samma formulär och
    // mellanlagras direkt lokalt i webbläsaren (IndexedDB - klarar stora
    // filer, till skillnad från sessionStorage som har en låg kvot). När
    // postbacken landar tillbaka här med ?success=1 har Liquid redan slagit
    // upp det nyskapade ärendets ID (#justCreatedArendeMarker) och filen/
    // filerna laddas då upp automatiskt som annotation-poster - exakt samma
    // beprövade mönster som kommentarernas "Bifoga fil" (ingen $value-
    // nedladdning behövs för att visa dem igen). Inget synligt extra steg
    // eller knapp för användaren.
    (function() {
      var DB_NAME = 'arendePendingAttachments';
      var STORE_NAME = 'files';

      function openPendingDb(callback) {
        if (!window.indexedDB) { callback(null); return; }
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function() {
          req.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        };
        req.onsuccess = function() { callback(req.result); };
        req.onerror = function() { callback(null); };
      }

      function clearPendingFiles(callback) {
        openPendingDb(function(db) {
          if (!db) { if (callback) callback(); return; }
          var tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).clear();
          tx.oncomplete = function() { if (callback) callback(); };
          tx.onerror = function() { if (callback) callback(); };
        });
      }

      function stashPendingFiles(files, callback) {
        clearPendingFiles(function() {
          if (files.length === 0) { if (callback) callback(); return; }
          openPendingDb(function(db) {
            if (!db) { if (callback) callback(); return; }
            var tx = db.transaction(STORE_NAME, 'readwrite');
            var store = tx.objectStore(STORE_NAME);
            files.forEach(function(file) {
              store.add({ name: file.name, type: file.type, blob: file });
            });
            tx.oncomplete = function() { if (callback) callback(); };
            tx.onerror = function() { if (callback) callback(); };
          });
        });
      }

      function readPendingFiles(callback) {
        openPendingDb(function(db) {
          if (!db) { callback([]); return; }
          var tx = db.transaction(STORE_NAME, 'readonly');
          var req = tx.objectStore(STORE_NAME).getAll();
          req.onsuccess = function() { callback(req.result || []); };
          req.onerror = function() { callback([]); };
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

      // Skriver till alla .create-attach-status - elementet finns i två
      // exemplar när formulärpopupen är öppen (den klonar sitt innehåll),
      // och bara ett av dem är synligt för användaren.
      function showAttachStatus(msg, type) {
        var nodes = document.querySelectorAll('.create-attach-status');
        Array.prototype.forEach.call(nodes, function(el) {
          el.textContent = msg;
          el.className = 'create-attach-status' + (type ? ' status-' + type : '');
        });
      }

      function uploadStoredFile(arendeId, storedFile, callback) {
        var reader = new FileReader();

        reader.onerror = function() {
          console.error('Kunde inte läsa filen:', storedFile.name, reader.error);
          callback('filen kunde inte läsas');
        };

        reader.onload = function() {
          var base64 = reader.result.split(',')[1];
          webapi.safeAjax({
            type: 'POST',
            url: '/_api/annotations',
            contentType: 'application/json',
            data: JSON.stringify({
              'objectid_cr5ee_arenden@odata.bind': '/cr5ee_arendens(' + arendeId + ')',
              'subject': 'Bifogad fil',
              'filename': storedFile.name,
              'mimetype': storedFile.type || 'application/octet-stream',
              'documentbody': base64,
              'isdocument': true
            }),
            success: function() { callback(null); },
            error: function(xhr) {
              console.error('Kunde inte bifoga fil till nytt ärende:', xhr.responseText);
              callback(extractErrorMessage(xhr));
            }
          });
        };

        reader.readAsDataURL(storedFile.blob);
      }

      var marker = document.getElementById('justCreatedArendeMarker');
      var justCreatedId = marker ? marker.getAttribute('data-arendenid') : '';
      var onSuccessPage = !!document.getElementById('successMessage');

      if (justCreatedId) {
        // Vi landade precis här efter en lyckad "Skapa ärende"-postback.
        readPendingFiles(function(files) {
          if (files.length === 0) return;

          showAttachStatus('Bifogar ' + files.length + (files.length === 1 ? ' fil...' : ' filer...'), 'info');

          var remaining = files.length;
          var failed = [];

          files.forEach(function(f) {
            uploadStoredFile(justCreatedId, f, function(err) {
              if (err) failed.push(f.name + ' (' + err + ')');
              remaining--;
              if (remaining > 0) return;

              clearPendingFiles();

              if (failed.length === 0) {
                showAttachStatus(
                  files.length === 1 ? 'Filen bifogades till ärendet.' : files.length + ' filer bifogades till ärendet.',
                  'success'
                );
              } else if (failed.length === files.length) {
                showAttachStatus('Ärendet skapades, men filen kunde inte bifogas: ' + failed.join(', '), 'error');
              } else {
                showAttachStatus('Ärendet skapades, men vissa filer kunde inte bifogas: ' + failed.join(', '), 'error');
              }
            });
          });
        });
      } else {
        // Färskt besök på formuläret - rensa bort ev. kvarglömda filer från
        // ett tidigare avbrutet försök så de inte råkar bifogas fel ärende.
        // Undantag: om vi ÄR på success-sidan men saknar ärende-ID gick
        // uppslaget fel, och då får filen inte försvinna under tystnad.
        readPendingFiles(function(files) {
          if (onSuccessPage && files.length > 0) {
            showAttachStatus('Ärendet skapades, men filen kunde inte bifogas (hittade inte det nyskapade ärendet). Kontakta support om filen behövs.', 'error');
          }
          clearPendingFiles();
        });
      }

      document.addEventListener('change', function(e) {
        if (!e.target || e.target.id !== 'createArendeFileInput') return;
        var files = Array.prototype.slice.call(e.target.files || []);
        var hint = document.getElementById('createArendeAttachHint');
        stashPendingFiles(files, function() {
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

    // ===== DISMISS SUCCESS MESSAGE AND CLEAR URL =====
    window.dismissSuccessMessage = function() {
      var successMsg = document.getElementById('successMessage');
      if (successMsg) {
        successMsg.style.display = 'none';
      }
      
      // Remove ?success=1 from URL without reloading
      if (window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.delete('success');
        window.history.replaceState({}, document.title, url.toString());
      }
    };

    // ===== ÄRENDE DETALJ POPUP =====
    var popupOverlay = document.getElementById('arendenPopupOverlay');
    var popupCloseBtn = document.getElementById('popupCloseBtn');
    var popupCloseFooterBtn = document.getElementById('popupCloseFooterBtn');
    var popupOpenFullBtn = document.getElementById('popupOpenFullBtn');

    // Popup data storage
    var currentPopupData = null;

    // ===== BILAGOR: BILDFÖRSTORING (LIGHTBOX) =====
    var arendeLightboxOverlay = document.getElementById('imageLightbox');
    var arendeLightboxImg = document.getElementById('imageLightboxImg');

    function initArendeLightboxImages(container) {
      if (!arendeLightboxOverlay || !arendeLightboxImg || !container) return;
      container.querySelectorAll('.case-attachment-thumb[data-lightbox]').forEach(function(img) {
        img.addEventListener('click', function() {
          arendeLightboxImg.src = img.src;
          arendeLightboxImg.alt = img.alt;
          arendeLightboxOverlay.classList.add('active');
        });
      });
    }

    function closeArendeLightbox() {
      if (!arendeLightboxOverlay) return;
      arendeLightboxOverlay.classList.remove('active');
      arendeLightboxImg.src = '';
    }

    if (arendeLightboxOverlay) {
      arendeLightboxOverlay.addEventListener('click', closeArendeLightbox);
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeArendeLightbox();
      });
    }
    
    // Open popup function
    function openArendePopup(data) {
      currentPopupData = data;
      
      // Populate popup fields
      document.getElementById('popupTitle').textContent = data.name || 'Ärendedetalj';
      document.getElementById('popupId').textContent = data.arendeId || '-';
      document.getElementById('popupStatus').textContent = data.status || '-';
      document.getElementById('popupArendeId').textContent = data.arendeId || '-';
      document.getElementById('popupName').textContent = data.name || '-';
      document.getElementById('popupCreated').textContent = data.created || '-';
      document.getElementById('popupBestallare').textContent = data.bestallare || '-';
      document.getElementById('popupTyp').textContent = data.typ || '-';
      document.getElementById('popupKlassificering').textContent = data.klassificering || '-';
      document.getElementById('popupApplikation').textContent = data.applikation || '-';
      
      // Handle priority with badge
      var priorityEl = document.getElementById('popupPriority');
      if (data.priority) {
        var badgeClass = 'default';
        var priorityLower = data.priority.toLowerCase();
        if (priorityLower === 'kritisk') badgeClass = 'critical';
        else if (priorityLower === 'hög') badgeClass = 'high';
        else if (priorityLower === 'normal') badgeClass = 'normal';
        else if (priorityLower === 'låg') badgeClass = 'low';
        
        priorityEl.innerHTML = '<span class="arenden-popup-badge ' + badgeClass + '">' + data.priority + '</span>';
      } else {
        priorityEl.textContent = '-';
      }
      
      // Set full view link
      if (data.id) {
        popupOpenFullBtn.href = '/Ärende/Ärendedetalj?id=' + encodeURIComponent(data.id);
        popupOpenFullBtn.style.display = '';
      } else {
        popupOpenFullBtn.style.display = 'none';
      }

      // Bilagor (bifogade filer/bilder, lagrade som annotation-poster) -
      // markupen kom med som en <template> bredvid raden och kopieras in här.
      var attSection = document.getElementById('popupAttachmentsSection');
      var attContainer = document.getElementById('popupAttachments');
      if (attSection && attContainer) {
        if (data.attachmentsHtml) {
          attContainer.innerHTML = data.attachmentsHtml;
          attSection.style.display = '';
          initArendeLightboxImages(attContainer);
        } else {
          attContainer.innerHTML = '';
          attSection.style.display = 'none';
        }
      }

      // Show popup
      popupOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    
    // Close popup function
    function closeArendePopup() {
      popupOverlay.classList.remove('active');
      document.body.style.overflow = '';
      currentPopupData = null;
      closeArendeLightbox();
    }
    
    // Close button handlers
    if (popupCloseBtn) {
      popupCloseBtn.addEventListener('click', closeArendePopup);
    }
    if (popupCloseFooterBtn) {
      popupCloseFooterBtn.addEventListener('click', closeArendePopup);
    }
    
    // Close on overlay click (outside popup)
    if (popupOverlay) {
      popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
          closeArendePopup();
        }
      });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && popupOverlay && popupOverlay.classList.contains('active')) {
        closeArendePopup();
      }
    });
    
    // Initialize popup triggers
    function initPopupTriggers() {
      var triggers = document.querySelectorAll('.arenden-popup-trigger');
      triggers.forEach(function(trigger) {
        // Remove existing listeners to avoid duplicates
        var newTrigger = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrigger, trigger);
        
        newTrigger.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          var attTpl = this.parentElement ? this.parentElement.querySelector('template.row-attachments-tpl') : null;

          var data = {
            id: this.getAttribute('data-id') || '',
            arendeId: this.getAttribute('data-arendeid') || '-',
            name: this.getAttribute('data-name') || '-',
            created: this.getAttribute('data-created') || '-',
            priority: this.getAttribute('data-priority') || '-',
            status: this.getAttribute('data-status') || '-',
            bestallare: this.getAttribute('data-bestallare') || '-',
            typ: this.getAttribute('data-typ') || '-',
            klassificering: this.getAttribute('data-klassificering') || '-',
            applikation: this.getAttribute('data-applikation') || '-',
            attachmentsHtml: attTpl ? attTpl.innerHTML : ''
          };

          openArendePopup(data);
        });
      });
    }
    
    // Initialize popup triggers on page load
    window.addEventListener('load', function() {
      initPopupTriggers();
    });
    
    // Also initialize when rows are shown via "Show More"
    if (btnShowMore) {
      btnShowMore.addEventListener('click', function() {
        // Re-initialize popup triggers after showing more rows
        setTimeout(initPopupTriggers, 100);
      });
    }

    // ===== FORM POPUP =====
    var formPopupOverlay = document.getElementById('formPopupOverlay');
    var formPopupCloseBtn = document.getElementById('formPopupCloseBtn');
    var formPopupBody = document.getElementById('formPopupBody');
    var formPopupTitle = document.getElementById('formPopupTitle');
    
    // Form content templates
    var formTemplates = {
      fast2: {
        title: 'Skapa ärende - Fast2',
        content: document.querySelector('#active-form-container') ? document.querySelector('#active-form-container').innerHTML : ''
      },
      kommunal: {
        title: 'Skapa ärende - Kommunal Felanmälan',
        content: document.querySelector('#active-form-container') ? document.querySelector('#active-form-container').innerHTML : ''
      },
      losenord: {
        title: 'Skapa ärende - Glömt lösenord',
        content: document.querySelector('#active-form-container') ? document.querySelector('#active-form-container').innerHTML : ''
      }
    };
    
    // Open form popup function
    function openFormPopup(formType) {
      if (!formPopupOverlay || !formPopupBody) return;
      
      // Update title based on form type
      var titles = {
        fast2: 'Skapa ärende - Fast2',
        kommunal: 'Skapa ärende - Kommunal Felanmälan',
        losenord: 'Skapa ärende - Glömt lösenord'
      };
      
      if (formPopupTitle) {
        formPopupTitle.textContent = titles[formType] || 'Skapa ärende';
      }
      
      // Get the form selector container (includes buttons and form)
      var formSelectorContainer = document.querySelector('.form-selector-container');
      if (formSelectorContainer) {
        // NOTE: innerHTML is a text clone - it does NOT run <script> tags and
        // creates duplicate-ID elements, which breaks the Power Pages
        // entityform's submit wiring. We clone the chrome (buttons etc.) via
        // innerHTML, but then swap the LIVE #active-form-container node in
        // place of its (non-functional) clone so the real, working form -
        // with its real event bindings - is what the user actually sees.
        formPopupBody.innerHTML = formSelectorContainer.innerHTML;
      }

      var realFormContainer = document.getElementById('active-form-container');
      if (realFormContainer) {
        var clonedFormContainer = formPopupBody.querySelector('#active-form-container');
        if (clonedFormContainer) {
          clonedFormContainer.parentNode.replaceChild(realFormContainer, clonedFormContainer);
        } else {
          formPopupBody.appendChild(realFormContainer);
        }
      }

      // Show popup
      formPopupOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Store popup state in sessionStorage
      sessionStorage.setItem('formPopupOpen', 'true');
      sessionStorage.setItem('formPopupType', formType);

      // Re-initialize any form-specific JavaScript in the popup
      initFormPopupHandlers();
    }

    // Close form popup function
    function closeFormPopup() {
      if (formPopupOverlay) {
        // Move the real form container back to the sidebar so it stays
        // functional (and doesn't get destroyed) the next time the popup opens
        var realFormContainer = document.getElementById('active-form-container');
        var sidebarContainer = document.querySelector('#createFormCard .form-selector-container');
        if (realFormContainer && sidebarContainer && realFormContainer.parentNode !== sidebarContainer) {
          sidebarContainer.appendChild(realFormContainer);
        }

        formPopupOverlay.classList.remove('active');
        document.body.style.overflow = '';

        // Clear stored popup state when manually closed
        sessionStorage.removeItem('formPopupOpen');
        sessionStorage.removeItem('formPopupType');
      }
    }
    
    // Initialize form popup handlers
    function initFormPopupHandlers() {
      // Handle kommunal sub-form toggle within popup
      var popupSubToggleBtns = formPopupBody.querySelectorAll('.sub-toggle-btn[data-kommunal-form]');
      popupSubToggleBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var selectedKommunalForm = this.getAttribute('data-kommunal-form');
          
          // Update active state
          popupSubToggleBtns.forEach(function(b) {
            b.classList.remove('active');
          });
          this.classList.add('active');
          
          // Update URL and reload page with new form
          var currentUrl = window.location.href;
          var urlObj = new URL(currentUrl);
          urlObj.searchParams.set('kommunalForm', selectedKommunalForm);
          urlObj.searchParams.set('form', 'kommunal');
          
          // Navigate to new URL (page will reload with new form)
          window.location.href = urlObj.toString();
        });
      });
      
      // Handle form selector buttons within popup
      var popupFormSelectorBtns = formPopupBody.querySelectorAll('.form-selector-btn[data-form]');
      popupFormSelectorBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var selectedForm = this.getAttribute('data-form');
          
          // Update active state
          popupFormSelectorBtns.forEach(function(b) {
            b.classList.remove('active');
          });
          this.classList.add('active');
          
          // Update URL and reload page with new form
          var currentUrl = window.location.href;
          var urlObj = new URL(currentUrl);
          urlObj.searchParams.set('form', selectedForm);
          
          // Navigate to new URL (page will reload with new form)
          window.location.href = urlObj.toString();
        });
      });
    }
    
    // Close button handler
    if (formPopupCloseBtn) {
      formPopupCloseBtn.addEventListener('click', closeFormPopup);
    }
    
    // Close on overlay click (outside popup)
    if (formPopupOverlay) {
      formPopupOverlay.addEventListener('click', function(e) {
        if (e.target === formPopupOverlay) {
          closeFormPopup();
        }
      });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && formPopupOverlay && formPopupOverlay.classList.contains('active')) {
        closeFormPopup();
      }
    });
    
    // Modify form selector buttons to open popup instead of navigating
    var formSelectorBtns = document.querySelectorAll('.form-selector-btn[data-form]');
    formSelectorBtns.forEach(function(btn) {
      // Remove existing click listeners by cloning
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var selectedForm = this.getAttribute('data-form');
        
        // Update active state
        formSelectorBtns.forEach(function(b) {
          b.classList.remove('active');
        });
        this.classList.add('active');
        
        // Open form popup
        openFormPopup(selectedForm);
      });
    });
    
    // Open form modal trigger button
    var openFormModalBtn = document.getElementById('openFormModalBtn');
    if (openFormModalBtn) {
      openFormModalBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get currently selected form type
        var activeFormBtn = document.querySelector('.form-selector-btn.active');
        var selectedForm = activeFormBtn ? activeFormBtn.getAttribute('data-form') : 'fast2';
        
        // Open form popup
        openFormPopup(selectedForm);
      });
    }
    
    // Restore popup state on page load if it was open before navigation
    window.addEventListener('load', function() {
      var popupWasOpen = sessionStorage.getItem('formPopupOpen');
      var popupType = sessionStorage.getItem('formPopupType');
      
      if (popupWasOpen === 'true' && popupType) {
        // Clear the stored state
        sessionStorage.removeItem('formPopupOpen');
        sessionStorage.removeItem('formPopupType');
        
        // Open the popup with the stored form type
        openFormPopup(popupType);
      }
    });

  })();