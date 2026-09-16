{% comment %}
Ärendedetalj - Detaljerad vy för ärende, för slutanvändare som vill följa upp sina ärenden.
Delar designspråk (färger/kort/badges) med Ärende-listan för visuell konsekvens.
{% endcomment %}

{% assign id = request.params.id | default: '' | strip %}

<div class="detail-page">

{% if id == '' %}
  <div class="detail-header">
    <div class="detail-header-content">
      <a href="/Ärende" class="detail-header-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Tillbaka till Ärenden
      </a>
      <div class="alert alert-warning">
        <span class="alert-icon">⚠️</span>
        <div>
          <div class="alert-title">Parameter saknas</div>
          <p style="margin:8px 0 0 0;">Öppna sidan via <span class="alert-code">/Ärendedetalj?id=&lt;GUID&gt;</span></p>
        </div>
      </div>
    </div>
  </div>

{% else %}

  {% fetchxml detailsSet %}
  <fetch version="1.0" output-format="xml-platform" mapping="logical" top="1">
    <entity name="cr5ee_arenden">
      <attribute name="cr5ee_arendenid" />
      <attribute name="cr5ee_arendeid" />
      <attribute name="cr5ee_name" />
      <attribute name="createdon" />
      <attribute name="cr5ee_gallande" />
      <attribute name="cr5ee_prioritet" />
      <attribute name="cr5ee_status" />
      <attribute name="cr5ee_typ" />
      <attribute name="cr5ee_bestallare" />
      <attribute name="cr5ee_beskrivning" />
      <attribute name="cr5ee_genomforande" />
      <attribute name="cr5ee_accepterades" />
      <attribute name="cr5ee_slutfordes" />
      <filter type="and">
        <condition attribute="cr5ee_arendenid" operator="eq" value="{{ id }}" />
      </filter>
    </entity>
  </fetch>
  {% endfetchxml %}

  {% assign items = detailsSet.results.entities %}

  {% if items and items.size > 0 %}
    {% assign arende = items.first %}

    {%- comment -%} Typ {%- endcomment -%}
    {%- assign typ_label = arende['cr5ee_typ@OData.Community.Display.V1.FormattedValue'] -%}
    {%- if typ_label == nil and arende.cr5ee_typ and arende.cr5ee_typ.Label -%}
      {%- assign typ_label = arende.cr5ee_typ.Label -%}
    {%- endif -%}
    {%- if typ_label == nil and arende.cr5ee_typ.Value != nil -%}
      {%- case arende.cr5ee_typ.Value -%}
        {%- when 10 -%}{%- assign typ_label = 'System' -%}
        {%- when 5 -%}{%- assign typ_label = 'Önskemål' -%}
        {%- when 1 -%}{%- assign typ_label = 'Blå' -%}
        {%- when 100 -%}{%- assign typ_label = 'Ärende' -%}
      {%- endcase -%}
    {%- endif -%}

    {%- comment -%} Prioritet {%- endcomment -%}
    {%- assign prio_label = arende['cr5ee_prioritet@OData.Community.Display.V1.FormattedValue'] -%}
    {%- if prio_label == nil and arende.cr5ee_prioritet and arende.cr5ee_prioritet.Label -%}
      {%- assign prio_label = arende.cr5ee_prioritet.Label -%}
    {%- endif -%}
    {%- if prio_label == nil and arende.cr5ee_prioritet.Value != nil -%}
      {%- case arende.cr5ee_prioritet.Value -%}
        {%- when 10 -%}{%- assign prio_label = 'Kritisk' -%}
        {%- when 7 -%}{%- assign prio_label = 'Hög' -%}
        {%- when 4 -%}{%- assign prio_label = 'Normal' -%}
        {%- when 1 -%}{%- assign prio_label = 'Låg' -%}
      {%- endcase -%}
    {%- endif -%}

    {%- comment -%}
    Status - cr5ee_status är den enda källan till sanning för "var ärendet befinner sig".
    (statuscode användes tidigare som fallback men visade ibland en annan text än denna
    badge, vilket var förvirrande - därför är cr5ee_status nu det enda som styr status-UI.)
    {%- endcomment -%}
    {%- assign status_label = arende['cr5ee_status@OData.Community.Display.V1.FormattedValue'] -%}
    {%- if status_label == nil and arende.cr5ee_status and arende.cr5ee_status.Label -%}
      {%- assign status_label = arende.cr5ee_status.Label -%}
    {%- endif -%}

    {%- assign gallande_label = arende['cr5ee_gallande@OData.Community.Display.V1.FormattedValue'] -%}
    {%- if gallande_label == nil and arende.cr5ee_gallande and arende.cr5ee_gallande.Label -%}
      {%- assign gallande_label = arende.cr5ee_gallande.Label -%}
    {%- endif -%}

    {%- assign bestallare_label = arende['cr5ee_bestallare@OData.Community.Display.V1.FormattedValue'] -%}
    {%- if bestallare_label == nil and arende.cr5ee_bestallare and arende.cr5ee_bestallare.Name -%}
      {%- assign bestallare_label = arende.cr5ee_bestallare.Name -%}
    {%- endif -%}

    {%- comment -%} Badge-klasser {%- endcomment -%}
    {%- assign typ_badge = 'badge badge-default' -%}
    {%- case typ_label -%}
      {%- when 'System' -%}{%- assign typ_badge = 'badge badge-type-system' -%}
      {%- when 'Önskemål' -%}{%- assign typ_badge = 'badge badge-type-onskemal' -%}
      {%- when 'Ärende' -%}{%- assign typ_badge = 'badge badge-type-arge' -%}
    {%- endcase -%}

    {%- assign prio_badge = 'badge badge-default' -%}
    {%- case prio_label -%}
      {%- when 'Kritisk' -%}{%- assign prio_badge = 'badge badge-prio-kritisk' -%}
      {%- when 'Hög' -%}{%- assign prio_badge = 'badge badge-prio-hog' -%}
      {%- when 'Normal' -%}{%- assign prio_badge = 'badge badge-prio-normal' -%}
      {%- when 'Låg' -%}{%- assign prio_badge = 'badge badge-prio-lag' -%}
    {%- endcase -%}

    {%- assign status_badge = 'badge badge-default' -%}
    {%- case status_label -%}
      {%- when 'Registrerad' -%}{%- assign status_badge = 'badge badge-status-aktiv' -%}
      {%- when 'Pågående' -%}{%- assign status_badge = 'badge badge-status-pagande' -%}
      {%- when 'Slutförd' -%}{%- assign status_badge = 'badge badge-status-slutford' -%}
      {%- when 'Makulerad' -%}{%- assign status_badge = 'badge badge-status-makulerad' -%}
    {%- endcase -%}

    {%- comment -%} Var i processen ärendet befinner sig, för stegvisaren {%- endcomment -%}
    {%- assign is_cancelled = false -%}
    {%- assign step_index = 1 -%}
    {%- case status_label -%}
      {%- when 'Registrerad' -%}{%- assign step_index = 1 -%}
      {%- when 'Pågående' -%}{%- assign step_index = 2 -%}
      {%- when 'Slutförd' -%}{%- assign step_index = 3 -%}
      {%- when 'Makulerad' -%}{%- assign is_cancelled = true -%}
    {%- endcase -%}

    <!-- HEADER -->
    <div class="detail-header">
      <div class="detail-header-content">
        <a href="/Ärende" class="detail-header-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Tillbaka till Ärenden
        </a>
        <div class="detail-header-row">
          <div class="detail-header-main">
            <h1>{{ arende.cr5ee_name | default: 'Ärende' }}</h1>
            {% if arende.cr5ee_arendeid %}
            <div class="detail-header-id">
              <span>Ärende-ID:</span>
              <code>{{ arende.cr5ee_arendeid }}</code>
            </div>
            {% endif %}
          </div>
          <div class="detail-header-badges">
            {% if typ_label %}<span class="{{ typ_badge }}">{{ typ_label }}</span>{% endif %}
            {% if prio_label %}<span class="{{ prio_badge }}">{{ prio_label }}</span>{% endif %}
            {% if status_label %}<span class="{{ status_badge }}">{{ status_label }}</span>{% endif %}
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="detail-container">

      <!-- Status - var i processen är ärendet -->
      <div class="detail-card" style="margin-bottom: 20px;">
        <div class="detail-card-header">📊 Status</div>
        <div class="detail-card-body">
          {% if is_cancelled %}
            <div class="alert alert-warning" style="margin:0;">
              <span class="alert-icon">🚫</span>
              <div>
                <div class="alert-title">Ärendet är makulerat</div>
                <p style="margin:4px 0 0 0;">Det här ärendet har avbrutits och behandlas inte vidare.</p>
              </div>
            </div>
          {% else %}
            <div class="status-stepper">
              <div class="stepper-step {% if step_index >= 1 %}is-done{% endif %} {% if step_index == 1 %}is-current{% endif %}">
                <div class="stepper-dot">{% if step_index > 1 %}✓{% else %}1{% endif %}</div>
                <div class="stepper-label">Registrerad</div>
              </div>
              <div class="stepper-line"></div>
              <div class="stepper-step {% if step_index >= 2 %}is-done{% endif %} {% if step_index == 2 %}is-current{% endif %}">
                <div class="stepper-dot">{% if step_index > 2 %}✓{% else %}2{% endif %}</div>
                <div class="stepper-label">Pågående</div>
              </div>
              <div class="stepper-line"></div>
              <div class="stepper-step {% if step_index >= 3 %}is-done{% endif %} {% if step_index == 3 %}is-current{% endif %}">
                <div class="stepper-dot">{% if step_index >= 3 %}✓{% else %}3{% endif %}</div>
                <div class="stepper-label">Slutförd</div>
              </div>
            </div>
          {% endif %}
        </div>
      </div>

      <div class="detail-grid">

        <!-- LEFT COLUMN -->
        <div>
          <!-- Quick Info -->
          <div class="detail-card" style="margin-bottom: 20px;">
            <div class="detail-card-header">📋 Ärendeinformation</div>
            <div class="detail-card-body">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">📅 Skapad</div>
                  <div class="info-value">{{ arende.createdon | default: '-' | date: 'yyyy-MM-dd HH:mm' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">👤 Beställare</div>
                  <div class="info-value">{{ bestallare_label | default: '-' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">⚙️ Gällande</div>
                  <div class="info-value">{{ gallande_label | default: '-' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">📊 Status</div>
                  <div class="info-value">{{ status_label | default: '-' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          {% if arende.cr5ee_beskrivning %}
          <div class="detail-card" style="margin-bottom: 20px;">
            <div class="detail-card-header">📝 Beskrivning</div>
            <div class="detail-card-body">
              <div class="content-body">{{ arende.cr5ee_beskrivning }}</div>
            </div>
          </div>
          {% endif %}

          <!-- Implementation -->
          {% if arende.cr5ee_genomforande %}
          <div class="detail-card" style="margin-bottom: 20px;">
            <div class="detail-card-header">🔧 Genomförande</div>
            <div class="detail-card-body">
              <div class="content-body">{{ arende.cr5ee_genomforande }}</div>
            </div>
          </div>
          {% endif %}

          <!-- Comments Section - detta är där uppföljning/dialog sker -->
          <div class="detail-card" id="commentsSection">
            <div class="detail-card-header">
              💬 Uppföljning <span id="commentCount">(0)</span>
            </div>
            <div class="detail-card-body">
              <!-- Comment Form using Entity Form -->
              {% if user.id %}
              <div class="comment-form">
                <div class="comment-form-header">
                  <span class="comment-user-avatar">{{ user.fullname | slice: 0, 1 | upcase }}</span>
                  <span class="comment-user-name">{{ user.fullname }}</span>
                </div>
                {% entityform name:'Kommentar' %}
              </div>
              {% else %}
              <div class="comment-login-prompt">
                <a href="{{ website.sign_in_url_substitution }}">Logga in</a> för att skriva en uppföljningskommentar
              </div>
              {% endif %}

              <!-- Comments List -->
              <div id="commentsList" class="comments-list">
                <div class="comment-empty" id="commentEmpty">
                  <p>Inga kommentarer ännu. Skriv en kommentar om du vill följa upp eller fråga något om ärendet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDEBAR -->
        <div>
          <!-- Timeline -->
          <div class="detail-card" style="margin-bottom: 20px;">
            <div class="detail-card-header">🕐 Historik</div>
            <div class="detail-card-body">
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-date">{{ arende.createdon | default: '-' | date: 'yyyy-MM-dd HH:mm' }}</div>
                  <div class="timeline-text">Ärendet skapades{% if bestallare_label %} av <strong>{{ bestallare_label }}</strong>{% endif %}</div>
                </div>
                {% if arende.cr5ee_accepterades %}
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-date">{{ arende.cr5ee_accepterades | date: 'yyyy-MM-dd HH:mm' }}</div>
                  <div class="timeline-text">Ärendet accepterades</div>
                </div>
                {% endif %}
                {% if arende.cr5ee_slutfordes %}
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-date">{{ arende.cr5ee_slutfordes | date: 'yyyy-MM-dd HH:mm' }}</div>
                  <div class="timeline-text">Ärendet slutfördes</div>
                </div>
                {% endif %}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="detail-card">
            <div class="detail-card-header">⚡ Åtgärder</div>
            <div class="detail-card-body">
              <div class="btn-group" style="flex-direction: column;">
                <a href="/Ärende" class="btn btn-primary">← Tillbaka till listan</a>
                {% if arende.cr5ee_arendeid %}
                <button type="button" onclick="navigator.clipboard.writeText('{{ arende.cr5ee_arendeid }}'); this.textContent='✓ Kopierat!'; var b=this; setTimeout(function(){ b.textContent='📋 Kopiera ärende-ID'; }, 1500);" class="btn btn-secondary">
                  📋 Kopiera ärende-ID
                </button>
                {% endif %}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  {% else %}
    <!-- No results -->
    <div class="detail-header">
      <div class="detail-header-content">
        <a href="/Ärende" class="detail-header-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Tillbaka till Ärenden
        </a>
        <div class="alert alert-error">
          <span class="alert-icon">❌</span>
          <div>
            <div class="alert-title">Ingen träff</div>
            <p style="margin:8px 0 0 0;">Hittade ingen post med id <span class="alert-code">{{ id }}</span></p>
          </div>
        </div>
      </div>
    </div>
  {% endif %}

{% endif %}

</div>

{%- comment -%} Fetch comments for this arende {%- endcomment -%}
{% fetchxml commentsSet %}
<fetch version="1.0" mapping="logical" distinct="false">
  <entity name="cr5ee_arende_kommentar">
    <attribute name="cr5ee_text" />
    <attribute name="cr5ee_skapad" />
    <attribute name="cr5ee_arende" />
    <attribute name="cr5ee_anvandare" />
    <order attribute="cr5ee_skapad" descending="true" />
    <filter type="and">
      <condition attribute="cr5ee_arende" operator="eq" value="{{ id }}" />
    </filter>
  </entity>
</fetch>
{% endfetchxml %}

{% assign comments = commentsSet.results.entities %}

<script>
  // Comments data from server
  var commentsData = [];
  {% if comments and comments.size > 0 %}
    {% for comment in comments %}
      commentsData.push({
        id: '{{ comment.cr5ee_arende_kommentarid }}',
        text: '{{ comment.cr5ee_text | escape }}',
        created: '{{ comment.cr5ee_skapad }}',
        author: '{% if comment.cr5ee_anvandare %}{{ comment.cr5ee_anvandare.Name | escape }}{% else %}Okänd{% endif %}'
      });
    {% endfor %}
  {% endif %}

  // Render comments
  function renderComments() {
    var commentsList = document.getElementById('commentsList');
    var commentCount = document.getElementById('commentCount');
    var commentEmpty = document.getElementById('commentEmpty');

    if (!commentsList) return;

    commentCount.textContent = '(' + commentsData.length + ')';

    if (commentsData.length === 0) {
      if (commentEmpty) commentEmpty.style.display = 'block';
      return;
    }

    if (commentEmpty) commentEmpty.style.display = 'none';

    var html = '';
    commentsData.forEach(function(comment) {
      var date = comment.created ? new Date(comment.created) : new Date();
      var formattedDate = date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      var initial = comment.author ? comment.author.charAt(0).toUpperCase() : '?';

      html += '<div class="comment-item">' +
        '<div class="comment-avatar">' + initial + '</div>' +
        '<div class="comment-content">' +
          '<div class="comment-header">' +
            '<span class="comment-author">' + comment.author + '</span>' +
            '<span class="comment-date">' + formattedDate + '</span>' +
          '</div>' +
          '<div class="comment-text">' + comment.text + '</div>' +
        '</div>' +
      '</div>';
    });

    commentsList.innerHTML = html;
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
    renderComments();

    // Hide and populate the "Ärende" lookup field (cr5ee_arende) with the ID from URL,
    // so the comment gets linked to this case automatically without the user
    // having to pick it manually via the lookup picker.
    var urlParams = new URLSearchParams(window.location.search);
    var idFromUrl = urlParams.get('id');

    if (idFromUrl) {
      // Exact match on name/id only - cr5ee_arendeguid (a separate, unrelated field)
      // would also match a "contains" selector since it starts with the same text.
      var arendeField = document.querySelector('[name="cr5ee_arende"]') || document.getElementById('cr5ee_arende');
      if (arendeField) {
        arendeField.value = idFromUrl;
        arendeField.dispatchEvent(new Event('change', { bubbles: true }));
        // Hide the field and its label/container (both the hidden id input and
        // the visible lookup-picker text box live in the same wrapper)
        var fieldContainer = arendeField.closest('.form-group, .control-group, .table-cell, td, .field-container');
        if (fieldContainer) {
          fieldContainer.style.display = 'none';
        } else {
          arendeField.style.display = 'none';
        }
      } else {
        console.warn('Kunde inte hitta fältet cr5ee_arende i kommentarformuläret - kommentaren kommer inte kopplas till ärendet.');
      }
    }
  });
</script>
