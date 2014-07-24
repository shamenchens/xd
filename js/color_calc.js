$().ready(function(){
  var src = 'https://fbexternal-a.akamaihd.net/safe_image.php?d=AQADybFjx0Mvbvol&w=470&h=246&url=http%3A%2F%2Fs2.gigacircle.com%2Fmedia%2Fs2_53c2119e512ef.jpg&cfs=1&upscale';
  var container = document.createElement('div');
  var image = new Image();
  image.src = src;
  image.crossOrigin = '';
  $(container).append(image);
  $('body').append(container);
  image.onload = function() {
    var container = $(this).parent()[0];
    var colorThief = new ColorThief();
    var color = colorThief.getColor(image);
    container.style.backgroundColor = 'rgb(' + color + ')';
    container.style.padding = '10px';
    container.dataset.color = color;
  };
});