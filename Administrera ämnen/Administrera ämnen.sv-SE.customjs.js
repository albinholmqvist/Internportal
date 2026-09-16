/* Kunskapsbank – administration.
   Liquid renderar ämnen och artiklar som tabellrader med data-attribut i sidans HTML
   (Custom JavaScript körs inte genom Liquid). Här sköts flikar, filter, formulär och
   sparande via Web API (webapi.safeAjax från mallen Portal Web API Wrapper). */
(function () {
  'use strict';

  // ===== KONFIGURATION =====
  // Web API-namn och uppslagens navigeringsegenskaper (schemanamn – skiftlägeskänsliga).
  // articleTypes: värdena (siffrorna) för valkolumnen cr5ee_artikeltyp, som de står i Dataverse.
  var CONFIG = {
    articleSet: 'faq_articles',
    topicSet: 'faq_topics',
    articleTopicNav: 'faq_Topic',
    topicParentNav: 'faq_ParentTopic',
    articleTypes: {
      faq: 1,
      lathund: 2,
      video: 3,
      instruktion: 4
    },
    maxFileSizeMb: 5
  };
  var TYPE_LABELS = { faq: 'FAQ', lathund: 'Lathund', video: 'Video', instruktion: 'Instruktion' };

  var ICONS = {
    visible: '<svg class="ip-icon" width="1em" height="1em" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><g><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M13.23 6.2463c0.1658 0.20672 0.2576 0.47529 0.2576 0.75376s-0.0918 0.54704 -0.2576 0.75376c-1.05 1.27127 -3.44003 3.74628 -6.23003 3.74628s-5.18 -2.47501 -6.230002 -3.74628c-0.16584 -0.20672 -0.257639 -0.47529 -0.257639 -0.75376s0.091799 -0.54704 0.257639 -0.75376C1.81997 4.97503 4.20997 2.5 6.99997 2.5S12.18 4.97503 13.23 6.2463Z" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M7 9c1.10457 0 2 -0.89543 2 -2s-0.89543 -2 -2 -2 -2 0.89543 -2 2 0.89543 2 2 2Z" stroke-width="1"></path></g></svg>',
    invisible: '<svg class="ip-icon" width="1em" height="1em" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><g><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3.62914 3.6244C4.62188 2.9793 5.7722 2.5 6.99997 2.5c2.79 0 5.18003 2.47503 6.23003 3.7463 0.1658 0.20672 0.2576 0.47529 0.2576 0.75376s-0.0918 0.54704 -0.2576 0.75376c-0.5788 0.70075 -1.5648 1.76726 -2.8004 2.58338m-1.92963 0.9325c-0.48238 0.1459 -0.98436 0.2304 -1.5 0.2304 -2.79 0 -5.18 -2.47501 -6.230002 -3.74628 -0.16584 -0.20672 -0.257639 -0.47529 -0.257639 -0.75376s0.091799 -0.54704 0.257639 -0.75376c0.332672 -0.40278 0.799852 -0.92639 1.371652 -1.45383" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M8.41421 8.41427c0.78105 -0.78105 0.78105 -2.04738 0 -2.82843 -0.78105 -0.78104 -2.04737 -0.78104 -2.82842 0" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M13.5 13.5 0.5 0.5" stroke-width="1"></path></g></svg>',
    file: '<svg class="ip-icon" width="1em" height="1em" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><g><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M12.5 12.5c0 0.2652 -0.1054 0.5196 -0.2929 0.7071s-0.4419 0.2929 -0.7071 0.2929h-9c-0.26522 0 -0.51957 -0.1054 -0.70711 -0.2929C1.60536 13.0196 1.5 12.7652 1.5 12.5v-11c0 -0.26522 0.10536 -0.51957 0.29289 -0.707107C1.98043 0.605357 2.23478 0.5 2.5 0.5H9L12.5 4v8.5Z" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m9 8 -2 2 -2 -2" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="m7 10 0 -5.5" stroke-width="1"></path></g></svg>',
    trash: '<svg class="ip-icon" width="1em" height="1em" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><g><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M1 3.5h12" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M2.5 3.5h9v9c0 0.2652 -0.1054 0.5196 -0.2929 0.7071s-0.4419 0.2929 -0.7071 0.2929h-7c-0.26522 0 -0.51957 -0.1054 -0.70711 -0.2929C2.60536 13.0196 2.5 12.7652 2.5 12.5v-9Z" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M4.5 3.5V3c0 -0.66304 0.26339 -1.29893 0.73223 -1.76777C5.70107 0.763392 6.33696 0.5 7 0.5c0.66304 0 1.29893 0.263392 1.76777 0.73223C9.23661 1.70107 9.5 2.33696 9.5 3v0.5" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M5.5 6.50146V10.503" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M8.5 6.50146V10.503" stroke-width="1"></path></g></svg>',
    warning: '<svg class="ip-icon" width="1em" height="1em" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false"><g><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M7.89003 1.0499C7.80611 0.886097 7.67861 0.748632 7.52158 0.652642 7.36455 0.556651 7.18407 0.505859 7.00003 0.505859c-0.18405 0 -0.36453 0.050792 -0.52156 0.146783 -0.15703 0.09599 -0.28453 0.233455 -0.36844 0.397258l-5.500004 11c-0.07671 0.1522 -0.113232 0.3215 -0.106098 0.4919 0.007134 0.1703 0.057688 0.3359 0.146861 0.4812 0.089172 0.1453 0.214003 0.2654 0.362641 0.3488 0.14863 0.0835 0.31613 0.1276 0.4866 0.1281H12.5c0.1705 -0.0005 0.338 -0.0446 0.4866 -0.1281 0.1487 -0.0834 0.2735 -0.2035 0.3627 -0.3488 0.0891 -0.1453 0.1397 -0.3109 0.1468 -0.4812 0.0072 -0.1704 -0.0294 -0.3397 -0.1061 -0.4919l-5.49997 -11Z" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M7 5v3.25" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M7 11c-0.13807 0 -0.25 -0.1119 -0.25 -0.25s0.11193 -0.25 0.25 -0.25" stroke-width="1"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M7 11c0.13807 0 0.25 -0.1119 0.25 -0.25s-0.11193 -0.25 -0.25 -0.25" stroke-width="1"></path></g></svg>'
  };

  var root = document.querySelector('.kb-admin');
  if (!root || !document.getElementById('articlesTable')) return;

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function lower(v) { return (v || '').toLowerCase(); }
  function words(q) { return lower(q).split(/\s+/).filter(Boolean); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // ===== WEB API =====
  function errorMessage(xhr) {
    var msg = '';
    try {
      var body = JSON.parse(xhr.responseText);
      msg = (body.error && (body.error.message || (body.error.innererror && body.error.innererror.message))) || '';
    } catch (e) { /* inget JSON-svar */ }
    if (xhr.status === 401 || xhr.status === 403) {
      return 'Saknar behörighet' + (msg ? ': ' + msg : ' – kontrollera tabellbehörigheterna och Webapi-inställningarna.');
    }
    return msg || 'Något gick fel (' + (xhr.status || 'okänt fel') + ').';
  }

  function api(type, url, data) {
    return new Promise(function (resolve, reject) {
      if (!window.webapi || typeof window.webapi.safeAjax !== 'function') {
        reject(new Error('Web API-hjälparen (Portal Web API Wrapper) saknas på sidan.'));
        return;
      }
      var options = {
        type: type,
        url: url,
        contentType: 'application/json',
        success: function (res, status, xhr) { resolve({ data: res, xhr: xhr }); },
        error: function (xhr) { reject(new Error(errorMessage(xhr))); }
      };
      if (data !== undefined) options.data = JSON.stringify(data);
      window.webapi.safeAjax(options);
    });
  }

  // Id:t normaliseras till gemener utan klamrar – det hamnar i texten som kb-image:<id> och måste matcha Liquid
  function entityIdFrom(xhr) {
    var raw = (xhr && (xhr.getResponseHeader('entityid') || xhr.getResponseHeader('OData-EntityId'))) || '';
    var m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return m ? m[0].toLowerCase() : '';
  }

  function readFileBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result).split(',')[1]); };
      reader.onerror = function () { reject(new Error('Filen ' + file.name + ' kunde inte läsas.')); };
      reader.readAsDataURL(file);
    });
  }

  // ===== MEDDELANDEN =====
  var toastTimer;
  function toast(message, type) {
    var el = qs('#kbToast');
    if (!el) return;
    el.textContent = message;
    el.className = 'kb-toast kb-toast-' + (type || 'success');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, type === 'error' ? 10000 : 5000);
  }

  function showStatus(el, message, type) {
    el.textContent = message || '';
    el.className = 'kb-form-status' + (type ? ' is-' + type : '');
  }

  function setBusy(selector, busy) {
    var btn = qs(selector);
    btn.disabled = busy;
    btn.classList.toggle('is-busy', busy);
  }

  function reloadWith(params) {
    var p = new URLSearchParams(window.location.search);
    ['saved', 'failed', 'edit'].forEach(function (k) { p.delete(k); });
    Object.keys(params).forEach(function (k) {
      if (params[k]) p.set(k, params[k]); else p.delete(k);
    });
    window.location.href = window.location.pathname + '?' + p.toString();
  }

  function replaceParams(p) {
    var s = p.toString();
    window.history.replaceState(null, '', window.location.pathname + (s ? '?' + s : ''));
  }

  // ===== STATISTIK, FILTER OCH SORTERING =====
  var articleRows = [];
  var topicRows = [];

  function updateStats() {
    articleRows = qsa('#articlesTable tbody tr[data-id]');
    topicRows = qsa('#topicsTable tbody tr[data-id]');
    var published = articleRows.filter(function (r) { return r.getAttribute('data-published') === 'true'; }).length;
    var values = { articles: articleRows.length, published: published, drafts: articleRows.length - published, topics: topicRows.length };
    qsa('[data-stat]').forEach(function (el) { el.textContent = values[el.getAttribute('data-stat')]; });

    topicRows.forEach(function (row) {
      var id = lower(row.getAttribute('data-id'));
      var n = articleRows.filter(function (r) { return lower(r.getAttribute('data-topic')) === id; }).length;
      row.setAttribute('data-articles', n);
      var cell = qs('.kb-topic-articles', row);
      if (cell) cell.textContent = n;
    });
  }

  function filterArticles() {
    var ws = words(qs('#artSearch').value);
    var topic = lower(qs('#artFilterTopic').value);
    var type = qs('#artFilterType').value;
    var status = qs('#artFilterStatus').value;
    var shown = 0;
    articleRows.forEach(function (row) {
      var ok = (!topic || (' ' + lower(row.getAttribute('data-topics')) + ' ').indexOf(' ' + topic + ' ') !== -1) &&
        (!type || row.getAttribute('data-type') === type) &&
        (!status || (status === 'published') === (row.getAttribute('data-published') === 'true')) &&
        ws.every(function (w) { return (row.getAttribute('data-search') || '').indexOf(w) !== -1; });
      row.hidden = !ok;
      if (ok) shown++;
    });
    qs('#artCount').textContent = shown === articleRows.length ? plural(shown, 'artikel', 'artiklar') : shown + ' av ' + articleRows.length;
    qs('#artEmpty').hidden = shown !== 0;
  }

  function filterTopics() {
    var ws = words(qs('#topicSearch').value);
    var shown = 0;
    topicRows.forEach(function (row) {
      var ok = ws.every(function (w) { return (row.getAttribute('data-search') || '').indexOf(w) !== -1; });
      row.hidden = !ok;
      if (ok) shown++;
    });
    qs('#topicCount').textContent = shown === topicRows.length ? plural(shown, 'ämne', 'ämnen') : shown + ' av ' + topicRows.length;
    qs('#topicEmpty').hidden = shown !== 0;
  }

  var sortState = { key: 'updated', dir: -1 };
  function sortArticles(key) {
    sortState.dir = sortState.key === key ? -sortState.dir : (key === 'updated' ? -1 : 1);
    sortState.key = key;
    var tbody = qs('#articlesTable tbody');
    articleRows.slice().sort(function (a, b) {
      var av = a.getAttribute('data-' + key) || '';
      var bv = b.getAttribute('data-' + key) || '';
      if (key === 'featured') {
        // Ej utvalda (0) hamnar sist, lägst ordning först
        return ((parseInt(av, 10) || 9999) - (parseInt(bv, 10) || 9999)) * sortState.dir;
      }
      return av.localeCompare(bv, 'sv', { numeric: true, sensitivity: 'base' }) * sortState.dir;
    }).forEach(function (row) { tbody.appendChild(row); });
    qsa('#articlesTable th[data-sort]').forEach(function (th) {
      var on = th.getAttribute('data-sort') === key;
      th.setAttribute('aria-sort', on ? (sortState.dir === 1 ? 'ascending' : 'descending') : 'none');
    });
  }

  function showTab(name) {
    var topics = name === 'topics';
    qsa('.kb-tab').forEach(function (tab) {
      var on = tab.getAttribute('data-tab') === (topics ? 'topics' : 'articles');
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    qs('#panelArticles').hidden = topics;
    qs('#panelTopics').hidden = !topics;
    var p = new URLSearchParams(window.location.search);
    if (topics) p.set('tab', 'topics'); else p.delete('tab');
    replaceParams(p);
  }

  // ===== POPUPER =====
  var openModals = [];
  var dirty = {};

  function openModal(id) {
    var modal = document.getElementById(id);
    modal._returnFocus = document.activeElement;
    modal.hidden = false;
    openModals.push(id);
    document.body.classList.add('kb-modal-open');
    var first = qs('input:not([type="file"]):not([type="checkbox"]), select, textarea, [data-confirm="no"]', modal);
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

  function closeModal(id, force) {
    if (!force && dirty[id] && !window.confirm('Du har ändringar som inte är sparade. Stänga ändå?')) return;
    var modal = document.getElementById(id);
    modal.hidden = true;
    dirty[id] = false;
    openModals = openModals.filter(function (x) { return x !== id; });
    if (!openModals.length) document.body.classList.remove('kb-modal-open');
    if (modal._returnFocus && modal._returnFocus.focus) modal._returnFocus.focus();
  }

  qsa('.kb-modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('mousedown', function (e) {
      if (e.target === overlay && overlay.id !== 'confirmModal') closeModal(overlay.id);
    });
    qsa('[data-close]', overlay).forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(overlay.id); });
    });
    overlay.addEventListener('input', function () { dirty[overlay.id] = true; });
    overlay.addEventListener('change', function () { dirty[overlay.id] = true; });
  });

  var confirmResolver = null;
  function confirmDialog(title, text, yesText) {
    qs('#confirmTitle').textContent = title;
    qs('#confirmText').textContent = text;
    qs('#confirmYesText').textContent = yesText || 'Radera';
    openModal('confirmModal');
    return new Promise(function (resolve) { confirmResolver = resolve; });
  }
  function resolveConfirm(value) {
    closeModal('confirmModal', true);
    if (confirmResolver) {
      var resolve = confirmResolver;
      confirmResolver = null;
      resolve(value);
    }
  }
  qsa('[data-confirm]').forEach(function (btn) {
    btn.addEventListener('click', function () { resolveConfirm(btn.getAttribute('data-confirm') === 'yes'); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !openModals.length) return;
    var top = openModals[openModals.length - 1];
    if (top === 'confirmModal') resolveConfirm(false); else closeModal(top);
  });

  // ===== PUBLICERA / AVPUBLICERA =====
  function setPublished(row, on) {
    var isTopic = !!row.closest('#topicsTable');
    var btn = qs('[data-action="toggle-publish"]', row);
    row.setAttribute('data-published', on ? 'true' : 'false');
    btn.classList.toggle('is-published', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.innerHTML = (on ? ICONS.visible : ICONS.invisible) + ' ' +
      (on ? (isTopic ? 'Publicerat' : 'Publicerad') : (isTopic ? 'Dolt' : 'Utkast'));
  }

  function togglePublish(row) {
    var isTopic = !!row.closest('#topicsTable');
    var next = row.getAttribute('data-published') !== 'true';
    var btn = qs('[data-action="toggle-publish"]', row);
    var title = row.getAttribute('data-title');
    btn.disabled = true;
    api('PATCH', '/_api/' + (isTopic ? CONFIG.topicSet : CONFIG.articleSet) + '(' + row.getAttribute('data-id') + ')', { faq_publishedstatus: next })
      .then(function () {
        setPublished(row, next);
        updateStats();
        filterArticles();
        toast('"' + title + '" ' + (next ? 'är publicerad.' : (isTopic ? 'är dolt.' : 'är nu ett utkast.')));
      })
      .catch(function (err) { toast(err.message, 'error'); })
      .then(function () { btn.disabled = false; });
  }

  // ===== TEXTREDIGERARE =====
  var ALLOWED = {
    P: [], BR: [], H2: [], H3: [], H4: [], STRONG: [], EM: [], U: [], S: [], UL: [], OL: [], LI: [],
    BLOCKQUOTE: [], CODE: [], PRE: [], HR: [], A: ['href', 'title'], IMG: ['src', 'alt', 'data-kb-image'],
    TABLE: [], THEAD: [], TBODY: [], TR: [], TH: ['colspan', 'rowspan'], TD: ['colspan', 'rowspan']
  };
  var RENAME = { B: 'STRONG', I: 'EM', H1: 'H2' };
  var DROP = {
    SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, FORM: 1, INPUT: 1, BUTTON: 1, SELECT: 1,
    TEXTAREA: 1, NOSCRIPT: 1, META: 1, LINK: 1, TEMPLATE: 1, SVG: 1, HEAD: 1, TITLE: 1
  };
  var BLOCKS = /^(P|H2|H3|H4|UL|OL|TABLE|DIV|BLOCKQUOTE|PRE)$/;

  function safeHref(href) { return /^(https?:|mailto:|tel:|\/|#)/i.test((href || '').trim()); }

  function renameNode(doc, node, tag) {
    var repl = doc.createElement(tag);
    while (node.firstChild) repl.appendChild(node.firstChild);
    node.parentNode.replaceChild(repl, node);
    return repl;
  }

  function cleanChildren(node, doc) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1) { node.removeChild(child); return; }
      var tag = child.tagName;
      if (DROP[tag]) { node.removeChild(child); return; }
      if (tag === 'DIV') {
        // Radbrytningar som webbläsaren gjort som <div> blir stycken; div:ar med block i packas upp
        var hasBlocks = Array.prototype.some.call(child.children, function (c) { return BLOCKS.test(c.tagName); });
        if (!hasBlocks) child = renameNode(doc, child, 'P');
      } else if (RENAME[tag]) {
        child = renameNode(doc, child, RENAME[tag]);
      }
      tag = child.tagName;
      cleanChildren(child, doc);
      if (!ALLOWED[tag]) {
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        node.removeChild(child);
        return;
      }
      Array.prototype.slice.call(child.attributes).forEach(function (attr) {
        if (ALLOWED[tag].indexOf(attr.name) === -1) child.removeAttribute(attr.name);
      });
      if (tag === 'A') {
        var href = child.getAttribute('href') || '';
        if (!safeHref(href)) {
          child.removeAttribute('href');
        } else if (/^https?:/i.test(href)) {
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener');
        }
      }
      if (tag === 'IMG' && !/^(https:\/\/|data:image\/(png|jpe?g|gif|webp);|kb-image:[0-9a-f-]{36}$)/i.test(child.getAttribute('src') || '')) {
        node.removeChild(child);
      }
    });
  }

  function sanitizeHtml(html) {
    if (!html || !html.trim()) return '';
    var doc = new DOMParser().parseFromString(html, 'text/html');
    cleanChildren(doc.body, doc);
    return doc.body.innerHTML.replace(/(<p>(\s|&nbsp;|<br>)*<\/p>\s*)+$/i, '').trim();
  }

  var editor = qs('#afBody');
  var source = qs('#afBodySource');
  var sourceBtn = qs('.kb-editor-toolbar [data-cmd="source"]');
  var sourceMode = false;

  function showSource(on) {
    sourceMode = on;
    editor.hidden = on;
    source.hidden = !on;
    sourceBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    sourceBtn.classList.toggle('active', on);
    qsa('.kb-editor-toolbar button').forEach(function (b) { if (b !== sourceBtn) b.disabled = on; });
  }

  function getEditorHtml() { return sanitizeHtml(sourceMode ? source.value : editor.innerHTML); }

  function setEditorHtml(html) {
    var clean = sanitizeHtml(html);
    editor.innerHTML = clean;
    source.value = clean;
    showSource(false);
  }

  function runCommand(cmd) {
    if (cmd === 'source') {
      if (sourceMode) editor.innerHTML = sanitizeHtml(source.value);
      else source.value = sanitizeHtml(editor.innerHTML);
      showSource(!sourceMode);
      return;
    }
    if (sourceMode) return;
    if (cmd === 'image') {
      rememberSelection();
      imageInput.click();
      return;
    }
    editor.focus();
    if (cmd === 'h2' || cmd === 'h3' || cmd === 'p') {
      document.execCommand('formatBlock', false, '<' + cmd + '>');
    } else if (cmd === 'link') {
      var url = window.prompt('Adress för länken', 'https://');
      if (!url) return;
      if (!safeHref(url)) {
        window.alert('Länken måste börja med https://, http://, mailto: eller /');
        return;
      }
      document.execCommand('createLink', false, url.trim());
    } else {
      document.execCommand(cmd, false, null);
    }
    dirty.articleModal = true;
  }

  qsa('.kb-editor-toolbar button').forEach(function (btn) {
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); }); // behåll markeringen i texten
    btn.addEventListener('click', function () { runCommand(btn.getAttribute('data-cmd')); });
  });

  // ===== BILDER I TEXTEN =====
  // Bilderna sparas som anteckningar (ämne "Bild i text") på artikeln och står som kb-image:<id> i texten;
  // artikelsidan byter platshållaren mot bilden. I redigeraren visas de som data-URL med data-kb-image="<id>",
  // och nya bilder ligger kvar som data-URL utan id tills artikeln sparas.
  var IMAGE_SUBJECT = 'Bild i text';
  var IMAGE_MAX_WIDTH = 1600;
  var imageInput = qs('#afImageInput');
  var savedRange = null;

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Filväljaren tar fokus från texten – markören sparas så att bilden hamnar där man stod
  function rememberSelection() {
    var sel = window.getSelection();
    savedRange = sel.rangeCount && editor.contains(sel.getRangeAt(0).commonAncestorContainer) ? sel.getRangeAt(0).cloneRange() : null;
  }

  function restoreSelection() {
    editor.focus();
    if (!savedRange) return;
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    savedRange = null;
  }

  function loadImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
        reject(new Error((file.name || 'Filen') + ' är ingen bild (PNG, JPG, GIF eller WebP).'));
        return;
      }
      var limit = CONFIG.maxFileSizeMb * 1024 * 1024;
      var done = function (dataUrl) {
        if (dataUrl.length * 0.75 > limit) reject(new Error((file.name || 'Bilden') + ' är större än ' + CONFIG.maxFileSizeMb + ' MB även efter förminskning.'));
        else resolve(dataUrl);
      };
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Bilden ' + (file.name || '') + ' kunde inte läsas.')); };
      reader.onload = function () {
        var dataUrl = String(reader.result);
        if (/gif/i.test(file.type)) { done(dataUrl); return; } // animerade GIF:ar lämnas orörda
        var img = new Image();
        img.onload = function () {
          if (img.naturalWidth <= IMAGE_MAX_WIDTH) { done(dataUrl); return; }
          var canvas = document.createElement('canvas');
          canvas.width = IMAGE_MAX_WIDTH;
          canvas.height = Math.round(img.naturalHeight * IMAGE_MAX_WIDTH / img.naturalWidth);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          // Skärmdumpar (PNG) behåller formatet så att texten i dem förblir skarp
          done(/png/i.test(file.type) ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = function () { done(dataUrl); };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  function insertImages(files) {
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return;
    if (sourceMode) runCommand('source');
    list.reduce(function (chain, file) {
      return chain.then(function () {
        return loadImageFile(file)
          .then(function (dataUrl) {
            restoreSelection();
            // Inklistrade skärmdumpar heter "image.png" – då blir alt-texten tom i stället
            var alt = /^image\.\w+$/i.test(file.name || '') ? '' : (file.name || '').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
            document.execCommand('insertHTML', false, '<img src="' + dataUrl + '" alt="' + escapeAttr(alt) + '">');
            dirty.articleModal = true;
          })
          .catch(function (err) { toast(err.message, 'error'); });
      });
    }, Promise.resolve());
  }

  // Befintliga bilder står som kb-image:<id> i texten. De hämtas från artikelsidan, som redan byter in dem
  // (data-kb-image="<id>") med samma behörighet som när artikeln visas; Web API används bara som reserv,
  // eftersom Webapi-inställningarna för annotation inte alltid tillåter att documentbody läses.
  function hydrateImages() {
    var imgs = qsa('img[src^="kb-image:"]', editor);
    if (!imgs.length || !articleState.id) return;
    imgs.forEach(function (img) {
      img.setAttribute('data-kb-image', lower(img.getAttribute('src').slice('kb-image:'.length)));
      img.classList.add('is-loading');
    });

    fetch('/Artiklar/?q=' + encodeURIComponent(articleState.id), { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then(function (html) {
        var map = {};
        qsa('img[data-kb-image]', new DOMParser().parseFromString(html, 'text/html')).forEach(function (i) {
          map[lower(i.getAttribute('data-kb-image'))] = i.getAttribute('src');
        });
        return map;
      })
      .catch(function () { return {}; })
      .then(function (map) {
        imgs.forEach(function (img) {
          var id = img.getAttribute('data-kb-image');
          if (map[id]) {
            img.src = map[id];
            img.classList.remove('is-loading');
            return;
          }
          api('GET', '/_api/annotations(' + id + ')?$select=documentbody,mimetype')
            .then(function (res) {
              img.src = 'data:' + (res.data.mimetype || 'image/png') + ';base64,' + res.data.documentbody;
            })
            .catch(function () { img.alt = 'Bilden kunde inte hämtas'; })
            .then(function () { img.classList.remove('is-loading'); });
        });
      });
  }

  // Inför sparandet: sparade bilder blir kb-image:<id> igen, nya bilder får en tillfällig platshållare
  function prepareBody(html) {
    var doc = new DOMParser().parseFromString(html || '', 'text/html');
    var pending = [];
    var used = [];
    qsa('img', doc.body).forEach(function (img) {
      var id = img.getAttribute('data-kb-image');
      var src = img.getAttribute('src') || '';
      if (id) {
        img.setAttribute('src', 'kb-image:' + id);
        used.push(lower(id));
      } else if (/^kb-image:/i.test(src)) {
        used.push(lower(src.slice('kb-image:'.length)));
      } else if (/^data:image\//i.test(src)) {
        var token = 'kb-pending-' + pending.length;
        pending.push({ token: token, dataUrl: src, alt: img.getAttribute('alt') || '' });
        img.setAttribute('src', token);
      }
      img.removeAttribute('data-kb-image');
    });
    return { html: doc.body.innerHTML, pending: pending, used: used };
  }

  function uploadInlineImages(articleId, pending) {
    var ids = {};
    var failed = [];
    return pending.reduce(function (chain, p, i) {
      return chain.then(function () {
        var m = p.dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
        if (!m) { failed.push(p.token); return null; }
        var ext = m[1].split('/')[1].replace('jpeg', 'jpg');
        var name = p.alt.replace(/[^\wåäöÅÄÖ -]+/g, '').trim().slice(0, 60) || 'bild-' + (i + 1);
        return api('POST', '/_api/annotations', {
          'objectid_faq_article@odata.bind': '/' + CONFIG.articleSet + '(' + articleId + ')',
          subject: IMAGE_SUBJECT,
          filename: 'kb-bild-' + name + '.' + ext, // prefixet märker bilden som bild i texten även om ämnet inte sparas
          mimetype: m[1],
          documentbody: m[2],
          isdocument: true
        })
          .then(function (res) {
            var id = entityIdFrom(res.xhr);
            if (id) ids[p.token] = id; else failed.push(p.token);
          })
          .catch(function () { failed.push(p.token); });
      });
    }, Promise.resolve()).then(function () { return { ids: ids, failed: failed }; });
  }

  // Uppladdade bilder får sitt id; bilder som inte gick att ladda upp tas bort ur texten
  function finalizeBody(html, ids) {
    return html.replace(/<img\b[^>]*\bsrc="(kb-pending-\d+)"[^>]*>/g, function (tag, token) {
      return ids[token] ? tag.replace(token, 'kb-image:' + ids[token]) : '';
    });
  }

  // Bilder som tagits bort ur texten raderas också (fel ignoreras – texten är redan sparad)
  function deleteUnusedImages(row, used) {
    var tpl = row && qs('.kb-img-tpl', row);
    if (!tpl) return Promise.resolve();
    var unused = qsa('span[data-img-id]', tpl.content)
      .map(function (s) { return s.getAttribute('data-img-id'); })
      .filter(function (id) { return used.indexOf(lower(id)) === -1; });
    return Promise.all(unused.map(function (id) {
      return api('DELETE', '/_api/annotations(' + id + ')').catch(function () { return null; });
    }));
  }

  imageInput.addEventListener('change', function () {
    insertImages(imageInput.files);
    imageInput.value = '';
  });

  editor.addEventListener('paste', function (e) {
    var data = e.clipboardData;
    if (!data) return;
    e.preventDefault();
    var files = Array.prototype.slice.call(data.files || []).filter(function (f) { return /^image\//i.test(f.type); });
    if (files.length) { insertImages(files); return; }
    var html = data.getData('text/html');
    if (html) document.execCommand('insertHTML', false, sanitizeHtml(html));
    else document.execCommand('insertText', false, data.getData('text/plain'));
  });

  editor.addEventListener('dragover', function (e) {
    var types = e.dataTransfer ? Array.prototype.slice.call(e.dataTransfer.types || []) : [];
    if (types.indexOf('Files') !== -1) e.preventDefault();
  });

  editor.addEventListener('drop', function (e) {
    var files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    e.preventDefault();
    // Bilden hamnar där den släpps
    var range = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (document.caretPositionFromPoint) {
      var pos = document.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
      }
    }
    savedRange = range && editor.contains(range.startContainer) ? range : null;
    insertImages(files);
  });

  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* stöds inte överallt */ }

  // ===== VIDEO (MEDIAFLOW) =====
  var videoHint = qs('#afVideoHint');
  var defaultVideoHint = videoHint.textContent;

  function parseVideo(input) {
    var value = (input || '').trim();
    if (!value) return { url: '' };
    var m = value.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (m) value = m[1];
    value = value.replace(/&amp;/g, '&');
    if (!/^https:\/\//i.test(value)) return { error: 'Länken måste börja med https://' };
    var host;
    try { host = new URL(value).hostname; } catch (e) { return { error: 'Länken kunde inte tolkas.' }; }
    return {
      url: value,
      warning: /mediaflow/i.test(host) ? '' : 'Länken verkar inte komma från Mediaflow – kontrollera att det är spelarens adress.'
    };
  }

  var videoTimer;
  function updateVideoPreview() {
    var box = qs('#afVideoPreview');
    var result = parseVideo(qs('#afVideo').value);
    box.innerHTML = '';
    box.hidden = true;
    videoHint.classList.remove('kb-hint-error', 'kb-hint-warning');
    if (result.error) {
      videoHint.textContent = result.error;
      videoHint.classList.add('kb-hint-error');
      return;
    }
    if (!result.url) {
      videoHint.textContent = defaultVideoHint;
      return;
    }
    videoHint.textContent = result.warning || 'Förhandsvisning:';
    if (result.warning) videoHint.classList.add('kb-hint-warning');
    var frame = document.createElement('iframe');
    frame.src = result.url;
    frame.title = 'Förhandsvisning av video';
    frame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
    frame.setAttribute('allowfullscreen', '');
    box.appendChild(frame);
    box.hidden = false;
  }
  qs('#afVideo').addEventListener('input', function () {
    clearTimeout(videoTimer);
    videoTimer = setTimeout(updateVideoPreview, 400);
  });

  // ===== BILAGOR =====
  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' kB';
    return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }

  function renderAttachments(row) {
    var list = qs('#afAttList');
    list.innerHTML = '';
    var tpl = row && qs('.kb-att-tpl', row);
    var spans = tpl ? qsa('span[data-att-id]', tpl.content) : [];
    if (!spans.length) {
      var empty = document.createElement('li');
      empty.className = 'kb-att-empty';
      empty.textContent = row ? 'Inga bilagor ännu.' : 'Bilagor kan läggas till nu och laddas upp när artikeln sparas.';
      list.appendChild(empty);
      return;
    }
    spans.forEach(function (span) {
      var li = document.createElement('li');
      li.className = 'kb-att-item';
      li.innerHTML = '<span class="kb-att-icon" aria-hidden="true">' + ICONS.file + '</span>' +
        '<span class="kb-att-name"></span><span class="kb-att-size"></span>' +
        '<button type="button" class="kb-icon-btn kb-icon-btn-danger" title="Ta bort bilagan">' + ICONS.trash + '<span class="sr-only">Ta bort</span></button>';
      var name = span.getAttribute('data-name');
      qs('.kb-att-name', li).textContent = name;
      qs('.kb-att-size', li).textContent = formatSize(parseInt(span.getAttribute('data-size'), 10));
      qs('button', li).addEventListener('click', function () {
        confirmDialog('Ta bort bilaga?', '"' + name + '" tas bort från artikeln.', 'Ta bort').then(function (ok) {
          if (!ok) return;
          api('DELETE', '/_api/annotations(' + span.getAttribute('data-att-id') + ')')
            .then(function () {
              span.parentNode.removeChild(span);
              renderAttachments(row);
              toast('Bilagan "' + name + '" togs bort.');
            })
            .catch(function (err) { toast(err.message, 'error'); });
        });
      });
      list.appendChild(li);
    });
  }

  function uploadFiles(articleId, files) {
    var failed = [];
    return Array.prototype.slice.call(files || []).reduce(function (chain, file) {
      return chain.then(function () {
        if (file.size > CONFIG.maxFileSizeMb * 1024 * 1024) {
          failed.push(file.name + ' (större än ' + CONFIG.maxFileSizeMb + ' MB)');
          return null;
        }
        return readFileBase64(file)
          .then(function (base64) {
            return api('POST', '/_api/annotations', {
              'objectid_faq_article@odata.bind': '/' + CONFIG.articleSet + '(' + articleId + ')',
              subject: 'Bilaga',
              filename: file.name,
              mimetype: file.type || 'application/octet-stream',
              documentbody: base64,
              isdocument: true
            });
          })
          .catch(function (err) { failed.push(file.name + ' (' + err.message + ')'); });
      });
    }, Promise.resolve()).then(function () { return failed; });
  }

  // ===== ARTIKLAR =====
  var articleState = { id: null };

  function openArticle(row, presetTopic) {
    articleState.id = row ? row.getAttribute('data-id') : null;
    articleState.row = row;
    qs('#articleModalTitle').textContent = row ? 'Redigera artikel' : 'Ny artikel';
    qs('#afTitle').value = row ? row.getAttribute('data-title') : '';
    var type = row ? row.getAttribute('data-type') : '';
    qs('#afType').value = TYPE_LABELS[type] ? type : '';
    qs('#afTopic').value = row ? lower(row.getAttribute('data-topic')) : lower(presetTopic || qs('#artFilterTopic').value);
    qs('#afSummary').value = row ? row.getAttribute('data-summary') : '';
    qs('#afVideo').value = row ? row.getAttribute('data-video') : '';
    var featured = row ? parseInt(row.getAttribute('data-featured'), 10) : 0;
    qs('#afFeatured').value = featured > 0 ? featured : '';
    qs('#afPublished').checked = row ? row.getAttribute('data-published') === 'true' : false;
    qs('#afFiles').value = '';
    var body = row && qs('.kb-body-tpl', row);
    setEditorHtml(body ? body.innerHTML : '');
    hydrateImages();
    renderAttachments(row);
    updateVideoPreview();
    showStatus(qs('#afStatus'), '');
    setBusy('#afSave', false);
    openModal('articleModal');
    dirty.articleModal = false;
  }

  function saveArticle() {
    var statusEl = qs('#afStatus');
    var title = qs('#afTitle').value.trim();
    var typeKey = qs('#afType').value;
    var topic = lower(qs('#afTopic').value);
    var errors = [];
    if (!title) errors.push('Ange en titel.');
    if (!typeKey) errors.push('Välj en typ.');
    else if (CONFIG.articleTypes[typeKey] === null || CONFIG.articleTypes[typeKey] === undefined) {
      errors.push('Värdet för typen "' + TYPE_LABELS[typeKey] + '" saknas i CONFIG.articleTypes i sidans JavaScript.');
    }
    if (!topic) errors.push('Välj ett ämne.');
    var video = parseVideo(qs('#afVideo').value);
    if (video.error) errors.push('Video: ' + video.error);
    var featuredRaw = qs('#afFeatured').value.trim();
    var featured = featuredRaw === '' ? null : parseInt(featuredRaw, 10);
    if (featuredRaw !== '' && (isNaN(featured) || featured < 0)) errors.push('Utvald-ordningen måste vara ett heltal (0 eller större).');
    if (errors.length) {
      showStatus(statusEl, errors.join(' '), 'error');
      return;
    }
    if (featured === 0) featured = null;

    var summary = qs('#afSummary').value.trim();
    var prepared = prepareBody(getEditorHtml());
    var payload = {
      faq_articletitle: title,
      cr5ee_artikeltyp: CONFIG.articleTypes[typeKey],
      cr5ee_sammanfattning: summary || null,
      cr5ee_videolank: video.url || null,
      faq_articlebody: prepared.html || null,
      faq_featuredarticleorder: featured,
      faq_publishedstatus: qs('#afPublished').checked
    };
    payload[CONFIG.articleTopicNav + '@odata.bind'] = '/' + CONFIG.topicSet + '(' + topic + ')';

    var id = articleState.id;
    var isNew = !id;
    var files = qs('#afFiles').files;
    setBusy('#afSave', true);
    showStatus(statusEl, files.length || prepared.pending.length ? 'Sparar och laddar upp filer...' : 'Sparar...', 'info');

    api(isNew ? 'POST' : 'PATCH', '/_api/' + CONFIG.articleSet + (isNew ? '' : '(' + id + ')'), payload)
      .then(function (res) {
        var savedId = isNew ? entityIdFrom(res.xhr) : id;
        var problems = [];
        var step = Promise.resolve();

        // Nya bilder i texten laddas upp först när artikeln har ett id; texten uppdateras sedan med deras id:n
        if (prepared.pending.length) {
          if (!savedId) {
            problems.push('bilderna i texten (artikelns id kunde inte läsas)');
          } else {
            step = uploadInlineImages(savedId, prepared.pending).then(function (result) {
              if (result.failed.length) problems.push(plural(result.failed.length, 'bild', 'bilder') + ' i texten');
              return api('PATCH', '/_api/' + CONFIG.articleSet + '(' + savedId + ')', { faq_articlebody: finalizeBody(prepared.html, result.ids) || null });
            });
          }
        }

        return step
          .then(function () { return isNew ? null : deleteUnusedImages(articleState.row, prepared.used); })
          .then(function () {
            if (!files.length) return problems;
            if (!savedId) return problems.concat(['bilagorna (artikelns id kunde inte läsas)']);
            return uploadFiles(savedId, files).then(function (failed) { return problems.concat(failed); });
          });
      })
      .then(function (failed) {
        dirty.articleModal = false;
        reloadWith({ saved: isNew ? 'article-created' : 'article-saved', failed: failed.join(', '), tab: '' });
      })
      .catch(function (err) {
        showStatus(statusEl, err.message, 'error');
        setBusy('#afSave', false);
      });
  }

  function deleteArticle(row) {
    var title = row.getAttribute('data-title');
    confirmDialog('Radera artikel?', '"' + title + '" och dess bilagor raderas permanent. Det går inte att ångra.', 'Radera artikel').then(function (ok) {
      if (!ok) return;
      api('DELETE', '/_api/' + CONFIG.articleSet + '(' + row.getAttribute('data-id') + ')')
        .then(function () {
          row.parentNode.removeChild(row);
          updateStats();
          filterArticles();
          toast('"' + title + '" raderades.');
        })
        .catch(function (err) { toast(err.message, 'error'); });
    });
  }

  // ===== ÄMNEN =====
  var topicState = { id: null, parent: '' };

  function openTopic(row) {
    topicState.id = row ? row.getAttribute('data-id') : null;
    topicState.parent = row ? lower(row.getAttribute('data-parent')) : '';
    var ownId = lower(topicState.id);
    qs('#topicModalTitle').textContent = row ? 'Redigera ämne' : 'Nytt ämne';
    qs('#tfTitle').value = row ? row.getAttribute('data-title') : '';
    qs('#tfDesc').value = row ? row.getAttribute('data-desc') : '';
    qs('#tfOrder').value = row ? row.getAttribute('data-order') : '';
    qs('#tfPublished').checked = row ? row.getAttribute('data-published') === 'true' : true;
    qs('#tfIcon').value = '';

    // Två nivåer: ett ämne med egna underämnen kan inte själv bli underämne
    var parentSel = qs('#tfParent');
    var hasChildren = !!ownId && topicRows.some(function (r) { return lower(r.getAttribute('data-parent')) === ownId; });
    qsa('option', parentSel).forEach(function (opt) { opt.disabled = !!opt.value && lower(opt.value) === ownId; });
    parentSel.value = topicState.parent;
    parentSel.disabled = hasChildren;
    qs('#tfParentHint').textContent = hasChildren
      ? 'Ämnet har egna underämnen och kan därför inte bli ett underämne.'
      : 'Välj ett ämne för att göra detta till ett underämne.';

    var icon = row ? row.getAttribute('data-icon') : '';
    var current = qs('#tfIconCurrent');
    current.hidden = !icon;
    if (icon) qs('img', current).src = icon;

    showStatus(qs('#tfStatus'), '');
    setBusy('#tfSave', false);
    openModal('topicModal');
    dirty.topicModal = false;
  }

  function saveTopic() {
    var statusEl = qs('#tfStatus');
    var title = qs('#tfTitle').value.trim();
    var orderRaw = qs('#tfOrder').value.trim();
    var order = orderRaw === '' ? null : parseInt(orderRaw, 10);
    var errors = [];
    if (!title) errors.push('Ange ett namn.');
    if (orderRaw !== '' && (isNaN(order) || order < 0)) errors.push('Ordningen måste vara ett heltal.');
    if (errors.length) {
      showStatus(statusEl, errors.join(' '), 'error');
      return;
    }

    var parent = lower(qs('#tfParent').value);
    var payload = {
      faq_topictitle: title,
      faq_topicdescription: qs('#tfDesc').value.trim() || null,
      faq_topicorder: order,
      faq_publishedstatus: qs('#tfPublished').checked
    };
    if (parent) payload[CONFIG.topicParentNav + '@odata.bind'] = '/' + CONFIG.topicSet + '(' + parent + ')';

    var id = topicState.id;
    var isNew = !id;
    var iconFile = qs('#tfIcon').files[0];
    setBusy('#tfSave', true);
    showStatus(statusEl, 'Sparar...', 'info');

    (iconFile ? readFileBase64(iconFile) : Promise.resolve(null))
      .then(function (base64) {
        if (base64) {
          payload.faq_topicicon = base64;
          payload.faq_topiciconfilename = iconFile.name;
          payload.faq_topiciconfiletype = (iconFile.type || '').split('/').pop();
        }
        return api(isNew ? 'POST' : 'PATCH', '/_api/' + CONFIG.topicSet + (isNew ? '' : '(' + id + ')'), payload);
      })
      .then(function () {
        // Ett uppslag kan inte nollställas med @odata.bind – kopplingen tas bort separat
        if (!isNew && topicState.parent && !parent) {
          return api('DELETE', '/_api/' + CONFIG.topicSet + '(' + id + ')/' + CONFIG.topicParentNav + '/$ref');
        }
        return null;
      })
      .then(function () {
        dirty.topicModal = false;
        reloadWith({ saved: isNew ? 'topic-created' : 'topic-saved', tab: 'topics' });
      })
      .catch(function (err) {
        showStatus(statusEl, err.message, 'error');
        setBusy('#tfSave', false);
      });
  }

  function deleteTopic(row) {
    var id = lower(row.getAttribute('data-id'));
    var title = row.getAttribute('data-title');
    var articles = parseInt(row.getAttribute('data-articles'), 10) || 0;
    var subs = topicRows.filter(function (r) { return lower(r.getAttribute('data-parent')) === id; }).length;
    if (articles || subs) {
      var parts = [];
      if (articles) parts.push(plural(articles, 'artikel', 'artiklar'));
      if (subs) parts.push(plural(subs, 'underämne', 'underämnen'));
      toast('"' + title + '" har ' + parts.join(' och ') + '. Flytta eller radera dem först.', 'error');
      return;
    }
    confirmDialog('Radera ämne?', '"' + title + '" raderas permanent. Det går inte att ångra.', 'Radera ämne').then(function (ok) {
      if (!ok) return;
      api('DELETE', '/_api/' + CONFIG.topicSet + '(' + row.getAttribute('data-id') + ')')
        .then(function () {
          row.parentNode.removeChild(row);
          updateStats();
          filterTopics();
          toast('"' + title + '" raderades.');
        })
        .catch(function (err) { toast(err.message, 'error'); });
    });
  }

  // ===== HÄNDELSER =====
  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var row = el.closest('tr[data-id]');
    switch (el.getAttribute('data-action')) {
      case 'new-article': openArticle(null); break;
      case 'new-article-in-topic': openArticle(null, row && row.getAttribute('data-id')); break;
      case 'edit-article': openArticle(row); break;
      case 'delete-article': deleteArticle(row); break;
      case 'new-topic': openTopic(null); break;
      case 'edit-topic': openTopic(row); break;
      case 'delete-topic': deleteTopic(row); break;
      case 'toggle-publish': togglePublish(row); break;
    }
  });

  qsa('.kb-tab').forEach(function (tab) {
    tab.addEventListener('click', function () { showTab(tab.getAttribute('data-tab')); });
  });
  qsa('#articlesTable th[data-sort] .kb-th-sort').forEach(function (btn) {
    btn.addEventListener('click', function () { sortArticles(btn.parentNode.getAttribute('data-sort')); });
  });
  ['#artSearch', '#artFilterTopic', '#artFilterType', '#artFilterStatus'].forEach(function (sel) {
    qs(sel).addEventListener(sel === '#artSearch' ? 'input' : 'change', filterArticles);
  });
  qs('#topicSearch').addEventListener('input', filterTopics);
  qs('#afSave').addEventListener('click', saveArticle);
  qs('#tfSave').addEventListener('click', saveTopic);
  qs('#articleForm').addEventListener('submit', function (e) { e.preventDefault(); saveArticle(); });
  qs('#topicForm').addEventListener('submit', function (e) { e.preventDefault(); saveTopic(); });

  // ===== START =====
  updateStats();
  filterArticles();
  filterTopics();

  var missingTypes = Object.keys(CONFIG.articleTypes).filter(function (k) { return CONFIG.articleTypes[k] === null; });
  if (missingTypes.length) {
    var notice = document.createElement('div');
    notice.className = 'kb-notice';
    notice.innerHTML = '<span aria-hidden="true">' + ICONS.warning + '</span><span></span>';
    notice.lastChild.textContent = 'Artiklar kan inte sparas förrän värdena för typerna (' +
      missingTypes.map(function (k) { return TYPE_LABELS[k]; }).join(', ') +
      ') är ifyllda i CONFIG.articleTypes i sidans JavaScript.';
    qs('.kb-tabs').parentNode.insertBefore(notice, qs('.kb-tabs'));
  }

  var params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'topics') showTab('topics');

  var messages = {
    'article-created': 'Artikeln skapades.',
    'article-saved': 'Artikeln sparades.',
    'topic-created': 'Ämnet skapades.',
    'topic-saved': 'Ämnet sparades.'
  };
  if (messages[params.get('saved')]) toast(messages[params.get('saved')]);
  if (params.get('failed')) toast('Sparat, men följande kunde inte laddas upp: ' + params.get('failed'), 'error');

  var editId = lower(params.get('edit'));
  if (editId) {
    var editRow = articleRows.filter(function (r) { return lower(r.getAttribute('data-id')) === editId; })[0];
    if (editRow) openArticle(editRow);
  }

  // Engångsparametrarna tas bort ur adressen så att en omladdning inte visar dem igen
  ['saved', 'failed', 'edit'].forEach(function (k) { params.delete(k); });
  replaceParams(params);
})();
