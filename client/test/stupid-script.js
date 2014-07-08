$(function() {
  $('*').click(function() {
    $(this).toggleClass('selected');
    console.log('toggle');
  });
});