$(function() {
  $('#test-form').on('submit', function() {
    console.log('submit');
    if ($('#input1').val() === 'test') {
      window.location.href = 'test-form2.html';
    } else {
      $('#output').text('type "test" into the input and hit submit!');
    }
    return false;
  });
});