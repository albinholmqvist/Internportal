var documentbodyContents;
var topicImageType;
var topicImageName = '';

//File upload function called by the PCF
window.uploadImagePCF = function (name, memetype, body) {
  topicImageType = memetype;
  topicImageName = name;
  documentbodyContents = body.substring(body.indexOf(',') + 1);
};

$(function () {
  $(document).ready(function () {
    $('#faq_publishedstatus').attr('value', 1);

    $('#faq_publishedstatus_0').click(function () {
      $('#faq_publishedstatus').attr('value', 0);
    });

    $('#faq_publishedstatus_1').click(function () {
      $('#faq_publishedstatus').attr('value', 1);
    });

    $('#EditButton').on('click', function (e) {
      // Don't perform the default behaviour for the button i.e. navigation
      e.preventDefault();

      $(this).unbind('click');
      $(this).text('..Loading');

      //validate fields
      if (typeof entityFormClientValidate === 'function') {
        if (entityFormClientValidate()) {
          if (typeof Page_ClientValidate === 'function') {
            if (Page_ClientValidate('')) {
              clearIsDirty();
              disableButtons();
              updateSubtopic();
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
    });

    $('input[type="text"]').addClass('form-text-input');
    $('textarea').addClass('form-textarea-input');
    $('select').addClass('form-select-input');
  });
});
