'use strict';

(function(exports) {
  var AnalyzeImage = function() {
    this.dominantColor;
    this.patellet;
  };

  AnalyzeImage.prototype.calculateColor = function(imageSrc) {
    var img = new Image();
    img.crossOrigin = '';
    img.src = imageSrc;
    var colorThief = ColorThief();
    return colorThief.getColor(img);
  };

  exports.calculateColor = calculateColor;

})(this);
