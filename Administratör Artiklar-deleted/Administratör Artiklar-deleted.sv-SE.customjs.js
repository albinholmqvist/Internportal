$(document).ready(function () {
  //Toolbar
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div'
  ).removeClass('float-end');
  $('.toolbar-actions').css({
    display: 'flex',
    'justify-content': 'space-between',
  });

  //Searchbar
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start.view-search.entitylist-search'
  ).addClass('searchContainer');
  //$('#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.pull-left.view-search.entitylist-search').removeClass('input-group float-start view-search entitylist-search');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.searchContainer > input'
  ).attr('id', 'list-search-input');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.searchContainer > input'
  ).attr('placeholder', 'Search Articles');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.searchContainer > input'
  ).attr('aria-label', 'Search Articles');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.searchContainer > input'
  ).removeClass('query form-control');

  // $(
  //   '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.pull-left > a:nth-child(1)'
  // ).attr('class', 'create-button');

  //Create btns
  $('#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start > a').attr('href', '/article-details');
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-toolbar.grid-actions.clearfix > div > div.input-group.float-start > a'
  ).css({
    'background-color': '#0E51CB',
    'border-radius': '8px',
    'height': '50px',
    'display': 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'color': '#FFFFFF',
  });
  //Table
  $(
    '#mainContent > div > div > div > div > div > div > div > div > div.view-grid > table > tbody > tr > td'
  ).css({
    'background-color': '#fff',
  });

  // $('.entitylist').on("loaded", function() {
  //     console.log('list loaded')
  //     $(this).children(".view-grid").find("tr[data-id]").each(function(i, e) {
  //         var id = $(this).attr("data-id");
  //         $(this).append('<td class="td-action"><p class="tr-divider">|</p><a class="edit-details-button" href="/edit-topic?id=' + id + '" >Edit Details</a></td>');
  //     });
  // });

  //toggle visibility of Take Action dropdown
  $('.entitylist').on('loaded', function () {
    $('.dropdown-button').click(function () {
      var dropdownArticles = $(this).closest('td').find('.dropdown-articles');
      dropdownArticles.toggle();
      $('.dropdown-articles').not(dropdownArticles).hide();
    });

    //close dropdown if user clicks outside of it
    $(document).click(function (event) {
      if (
        !$(event.target).closest('.dropdown-button').length &&
        !$(event.target).closest('.dropdown-articles').length
      ) {
        $('.dropdown-articles').hide();
      }
    });
  });

  $('.entitylist').on('loaded', function () {
    $(this)
      .children('.view-grid')
      .find('tr[data-id]')
      .each(function (i, e) {
        var id = $(this).attr('data-id');
        // $(this).find('td > div > ul').attr('class', 'action-ul');
        // $(this).find('td > div > ul > li').attr('class', 'action-li');
        if ($(this)[0].children[1].innerHTML === 'Article') {
          $(this).append(
            '<td class="td-action"><p class="tr-divider">|</p><button class="dropdown-button edit-details-button">Take Action</button><div class="dropdown-articles"><a href="/Admin-Edit-Article/?id=' +
              id +
              '" >Edit Details</a><hr class="take-action-hr"><a href="/Admin-View-Article/?q=' +
              id +
              '" >Preview</a></div></td>'
          );
        } else {
          $(this).append(
            '<td class="td-action"><p class="tr-divider">|</p><button class="dropdown-button edit-details-button btn btn-default btn-xs aria-exp">Take Action <span class="fa fa-chevron-circle-down fa-fw" aria-hidden="true"></span></button><div class="dropdown-articles"><a href="/Admin-Edit-Article/?id=' +
              id +
              '" >Edit Details</a><hr class="take-action-hr"><a href="/Admin-View-Article/?q=' +
              id +
              '" >Preview</a></div></td>'
          );
        }
      });
  });
});
