/* Kunskapsbank – filtrering på ämne, typ och sökord.
   All data kommer från markupen (data-attribut) som Liquid renderar i sidans HTML,
   eftersom Custom JavaScript inte körs genom Liquid. */
(function () {
  'use strict';

  var page = document.querySelector('.kb-hub');
  if (!page) {
    // Sidans JS körs men innehållet (Liquid) kom inte fram – visa ett meddelande i stället för en tom sida
    var host = document.getElementById('mainContent') || document.querySelector('[role="main"]');
    if (host && !host.querySelector('.kb-missing')) {
      var note = document.createElement('div');
      note.className = 'kb-missing';
      note.setAttribute('role', 'alert');
      note.style.cssText = 'max-width:640px;margin:48px auto;padding:20px 24px;border:1px solid #f8c7a3;border-left:4px solid #f18e47;border-radius:8px;background:#fff;color:#2b2b2b;font:15px/1.5 Arial,Helvetica,sans-serif;';
      note.innerHTML = '<strong style="display:block;margin-bottom:4px;">Kunskapsbanken kunde inte visas</strong>'
        + 'Sidan laddades men innehållet kom inte fram. Ladda om sidan, och kontakta en administratör om felet kvarstår.';
      host.appendChild(note);
    }
    if (window.console) console.warn('Kunskapsbank: .kb-hub saknas – sidans Liquid-innehåll renderades inte');
    return;
  }

  var items = Array.prototype.slice.call(page.querySelectorAll('.kb-item'));

  // FAQ-svarens text finns redan i sidan och läggs till i sökningen här i stället för i Liquid
  items.forEach(function (item) {
    var answer = item.querySelector('.kb-faq-answer');
    if (answer) item.setAttribute('data-search', (item.getAttribute('data-search') || '') + ' ' + answer.textContent.toLowerCase());
  });
  var chips = Array.prototype.slice.call(page.querySelectorAll('.kb-chip'));
  var topicLinks = Array.prototype.slice.call(page.querySelectorAll('.kb-topic-link'));
  var searchInput = document.getElementById('kbSearch');
  var listTitle = document.getElementById('kbListTitle');
  var topicDesc = document.getElementById('kbTopicDesc');
  var countEl = document.getElementById('kbCount');
  var emptyEl = document.getElementById('kbEmpty');
  var featured = document.getElementById('kbFeatured');

  var params = new URLSearchParams(window.location.search);
  var state = {
    topic: (params.get('q') || '').toLowerCase(),
    type: params.get('typ') || 'all',
    query: searchInput ? searchInput.value.trim() : ''
  };

  function words(q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function inTopic(item, topic) {
    if (!topic) return true;
    return (' ' + (item.getAttribute('data-topics') || '').toLowerCase() + ' ').indexOf(' ' + topic + ' ') !== -1;
  }

  function matchesQuery(item, ws) {
    var text = item.getAttribute('data-search') || '';
    return ws.every(function (w) { return text.indexOf(w) !== -1; });
  }

  function apply() {
    var ws = words(state.query);
    var typeCounts = { all: 0 };
    var visible = 0;

    items.forEach(function (item) {
      var type = item.getAttribute('data-type');
      var base = inTopic(item, state.topic) && matchesQuery(item, ws);
      if (base) {
        typeCounts.all++;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
      var show = base && (state.type === 'all' || type === state.type);
      item.hidden = !show;
      if (show) visible++;
    });

    chips.forEach(function (chip) {
      var t = chip.getAttribute('data-type');
      var on = t === state.type;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      var c = chip.querySelector('.kb-chip-count');
      if (c) c.textContent = typeCounts[t] || 0;
    });

    var active = null;
    topicLinks.forEach(function (link) {
      var on = (link.getAttribute('data-topic') || '').toLowerCase() === state.topic;
      link.classList.toggle('active', on);
      if (on) {
        active = link;
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (listTitle) {
      if (state.topic && active) listTitle.textContent = active.getAttribute('data-title');
      else listTitle.textContent = ws.length ? 'Sökresultat' : 'Alla artiklar';
    }
    if (topicDesc) {
      var desc = state.topic && active ? active.getAttribute('data-desc') : '';
      topicDesc.textContent = desc || '';
      topicDesc.hidden = !desc;
    }
    if (countEl) countEl.textContent = visible + (visible === 1 ? ' artikel' : ' artiklar');
    if (emptyEl) emptyEl.hidden = visible !== 0;
    if (featured) featured.hidden = !!(state.topic || ws.length || state.type !== 'all');
  }

  function syncUrl() {
    var p = new URLSearchParams(window.location.search);
    if (state.topic) p.set('q', state.topic); else p.delete('q');
    if (state.query) p.set('search', state.query); else p.delete('search');
    if (state.type !== 'all') p.set('typ', state.type); else p.delete('typ');
    var qs = p.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }

  // Antal artiklar per ämne (inklusive underämnen) – ändras inte av sökningen
  topicLinks.forEach(function (link) {
    var topic = (link.getAttribute('data-topic') || '').toLowerCase();
    var n = items.filter(function (item) { return inTopic(item, topic); }).length;
    var c = link.querySelector('.kb-topic-count');
    if (c) c.textContent = n;
  });

  topicLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      state.topic = (link.getAttribute('data-topic') || '').toLowerCase();
      apply();
      syncUrl();
      if (window.innerWidth < 1100 && listTitle) listTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.type = chip.getAttribute('data-type');
      apply();
      syncUrl();
    });
  });

  if (searchInput) {
    var timer;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.query = searchInput.value.trim();
        apply();
        syncUrl();
      }, 120);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        state.query = '';
        apply();
        syncUrl();
      }
    });
  }

  var reset = page.querySelector('[data-reset]');
  if (reset) {
    reset.addEventListener('click', function (e) {
      e.preventDefault();
      state = { topic: '', type: 'all', query: '' };
      if (searchInput) searchInput.value = '';
      apply();
      syncUrl();
    });
  }

  // Bilder i FAQ-svaren står som kb-image:<id> i texten. De hämtas från artikelsidan (som byter in dem med
  // data-kb-image="<id>") första gången svaret fälls ut, så kunskapsbanken behöver inte läsa in alla bilder.
  var BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  page.querySelectorAll('.kb-faq-answer img[src^="kb-image:"]').forEach(function (img) {
    img.setAttribute('data-kb-image', img.getAttribute('src').slice('kb-image:'.length).toLowerCase());
    img.src = BLANK_IMAGE;
    img.classList.add('is-loading');
  });

  function loadFaqImages(answer) {
    var body = answer && answer.querySelector('.kb-content-body[data-article]');
    var imgs = body ? Array.prototype.slice.call(body.querySelectorAll('img.is-loading[data-kb-image]')) : [];
    if (!imgs.length || body.getAttribute('data-images-requested')) return;
    body.setAttribute('data-images-requested', 'true');
    fetch('/Artiklar/?q=' + encodeURIComponent(body.getAttribute('data-article')), { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then(function (html) {
        var map = {};
        new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img[data-kb-image]').forEach(function (i) {
          map[(i.getAttribute('data-kb-image') || '').toLowerCase()] = i.getAttribute('src');
        });
        return map;
      })
      .catch(function () { return {}; })
      .then(function (map) {
        imgs.forEach(function (img) {
          var src = map[img.getAttribute('data-kb-image')];
          if (src) img.src = src;
          else img.alt = img.alt || 'Bilden kunde inte hämtas – öppna artikeln som egen sida';
          img.classList.remove('is-loading');
        });
      });
  }

  // FAQ: svaret fälls ut direkt i listan
  page.querySelectorAll('.kb-faq-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var answer = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.parentNode.classList.toggle('is-open', open);
      if (answer) {
        answer.hidden = !open;
        if (open) loadFaqImages(answer);
      }
    });
  });

  // Länkar till andra webbplatser i FAQ-svaren öppnas i ny flik
  page.querySelectorAll('.kb-content-body a[href^="http"]').forEach(function (a) {
    if (a.hostname !== window.location.hostname) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
  });

  // #faq-<id> i adressen fäller ut och visar den frågan
  if (window.location.hash.indexOf('#faq-') === 0) {
    var target = page.querySelector('[aria-controls="' + window.location.hash.slice(1) + '"]');
    if (target) {
      target.click();
      target.scrollIntoView({ block: 'center' });
    }
  }

  apply();
})();
