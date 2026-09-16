var documentbodyContents = 0;

$(document).ready(function () {
  $('#faq_publishedstatus_0').click(function () {
    $('#faq_publishedstatus').attr('value', 0);
  });

  $('#faq_publishedstatus_1').click(function () {
    $('#faq_publishedstatus').attr('value', 1);
  });

  $('#SubmitButton').on('click', function (e) {
    // Don't perform the default behaviour for the button i.e. navigation
    e.preventDefault();

    //validate fields
    if (typeof entityFormClientValidate === 'function') {
      if (entityFormClientValidate()) {
        if (typeof Page_ClientValidate === 'function') {
          if (Page_ClientValidate('')) {
            clearIsDirty();
            disableButtons();
            createTopic();
          }
        } else {
          clearIsDirty();
          disableButtons();
          return;
        }
      } else {
        return false;
      }
    } else {
      if (typeof Page_ClientValidate === 'function') {
        if (Page_ClientValidate('')) {
          clearIsDirty();
          disableButtons();
          return;
        }
      } else {
        clearIsDirty();
        disableButtons();
        return;
      }
    }

    $(this).unbind('click');
    $(this).html('..Loading');
  });

  $('input[type="text"]').addClass('form-text-input');
  $('textarea').addClass('form-textarea-input');
  $('select').addClass('form-select-input');
});

function createTopic() {
  // Get the fields
  let topicTitle = $('#faq_topictitle').val();
  let topicOrder = $('#faq_topicorder').val();
  let publishedStatus = $('#faq_publishedstatus').attr('value');
  let topicBody = $('#faq_topicdescription').val();

  if (publishedStatus == '1') {
    publishedStatus = true;
  } else publishedStatus = false;

  if (topicOrder == '') {
    topicOrder = null;
  }

  //Create the Course data object
  let dataObject = {
    faq_topictitle: topicTitle,
    faq_topicorder: topicOrder,
    faq_publishedstatus: publishedStatus,
    faq_topicdescription: topicBody,
  };

  if (documentbodyContents) {
    dataObject['faq_topicicon'] = documentbodyContents;
    dataObject['faq_topiciconfilename'] = topicImageName;
    dataObject['faq_topiciconfiletype'] = topicImageType.substring(topicImageType.indexOf('/') + 1);
  }

  //Call the API
  webapi.safeAjax({
    type: 'POST',
    url: '/_api/faq_topics',
    contentType: 'application/json',
    data: JSON.stringify(dataObject),
    success: function (res, status, xhr) {
      //print id of newly created table record
      const createdCourseId = xhr.getResponseHeader('entityid');
      //Redirect back to home
      window.location.href = '/Admin-Topics';
    },
    error: function (res, status, xhr) {
      console.log(res.responseText);
    },
  });
}
