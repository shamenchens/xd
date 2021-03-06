'use strict';
var uid = null;
var accessToken = null;
var xdinfo = null;
var feedEntries = [];

$(document).ready(function() {
  // init XDInfo
  xdinfo = new XDinfo(xdRegexes);
  $.ajaxSetup({ cache: true });
  $.getScript('//connect.facebook.net/en_UK/all.js', fb_init);
  $('#fblogin').click(function() {
     FB.login(function(response) {
       // handle the response
       switchElement($('#fblogin'), 'off');
       switchElement($('#getBT'), 'on');
     }, {scope: 'email,user_friends,read_stream,export_stream,friends_photos'});
  });

  $('#getBT').click(function() {
    runWordFreq($('#feeds').text());
  });

  $('#searchBT').click(function(){    
    var searchText = $('#xdSearch').val();
    var xds = xdinfo.getItems(searchText);
    var showEntries = [];
    if (xds.items.length !== 0) {
      showEntries = [];
      xds.items.sort(function(a, b) {
        return b.scroes- a.scroes;
      });
      console.log('HA:' + JSON.stringify(xds.items));
      for(var i in xds.items) {
        var index = parseInt(xds.items[i].id);
        if (feedEntries[index]) {
          showEntries.push(feedEntries[index]);
        }
      }
      console.log('HA:' + JSON.stringify(showEntries));
      $('#result').html(render(showEntries)).css('border', '1px solid #f00');

    }
  });
});

function fb_init() {
  FB.init({
    appId: FACEBOOK_APP_ID,
    status     : true,
    xfbml      : true,
    version    : 'v1.0'
  });

  FB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      // the user is logged in and has authenticated your
      // app, and response.authResponse supplies
      // the user's ID, a valid access token, a signed
      // request, and the time the access token
      // and signed request each expire
      var uid = response.authResponse.userID;
      var accessToken = response.authResponse.accessToken;
      console.log('login!!!' + response.authResponse.userID);
      userInfo();
      getMyFriend()
      switchElement($('#getBT'), 'on');
    } else if (response.status === 'not_authorized') {
      // the user is logged in to Facebook,
      // but has not authenticated your app
      switchElement($('#fblogin'), 'on');
      console.log('has not authenticated your app');
    } else {
      $('#fblogin').removeAttr('disabled');
      // the user isn't logged in to Facebook.
      console.log('the user isn\'t logged in to Facebook.');
      switchElement($('#fblogin'), 'on');
    }
 });
}

function userInfo () {
  FB.api(
    "/me/",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
        var icon = "https://graph.facebook.com/" + response.id +
                                                        "/picture";
        $('#usericon').attr('src', icon).attr('traget', '_blank');
        $('#username').attr('href', response.link).html(response.name);
        $('#usericon').click(function() {
          getUserFeed(response.id);
        });
        switchElement($('#userinfo'), 'on');
      }
    }
  );
}

function switchElement(ele, operate) {
  if (operate === 'off') {
    ele.addClass('hidden');
  } else {
    ele.removeClass('hidden');
  }
}

function render(entries) {
  var ret = '<ul>';
  var index = 0;
  entries.forEach(function(entry) {
    ret += '<li data-index="' + index + '">';
    if (entry.message) {
      ret += entry.message;
    }
    if (entry.type === 'photo') {
      ret += '<img src="https://graph.facebook.com/' +
                                               entry.object_id + '/picture" />';
    }
    ret += '</li>';
    index += 1;
  })
  ret += '</ul>';
  return ret;
}

function calDegrees(entries) {
  console.log(JSON.stringify(entries));
  var index = 0;
  entries.forEach(function(entry) {
    if (entry.message) {
      var xDegrees = null;
      xDegrees = calculateXD(entry.message);

      xDegrees.scores.sort(function(a, b) {
        return b[1]- a[1];
      });

      xDegrees.scores.forEach(function(xd){
        var scroes = parseInt(xd[1], 10);
        if (scroes > 10) {
          var obj = {};
          obj.id = index;
          obj.scroes = scroes;
          xdinfo.updateItem(xd[0], obj, scroes);
          var fontSize = 20 + scroes;
          // ret += '<span class="xdBT" data-xd="' + xd[0] +
          //  '" style="font-size:' + fontSize + 'px; color:red;">' 
          //   + xd[0] + '</span>';
        }
      });
    }
    index += 1;
  });

  console.log('done!!:' + JSON.stringify(xdinfo));
}

function getUserFeed(id) {
  if (id == null) {
    id = 'me';
  }
  FB.api(
      "/" + id + "/feed/", {limit: 500},
      function (response) {
        if (response && !response.error) {
          /* handle the result */
          response.data.forEach(function (entry) {
              if (entry.from.id == id) {
                feedEntries.push(entry);
              }
              if (entry.comments != undefined) {
                entry.comments.data.forEach(function(comment) {
                  feedEntries.push(comment);
                });
              }

          });
          calDegrees(feedEntries);
          $('#feeds').html(render(feedEntries)).css('border', '1px solid #f00');
        }// end of if
      }
    );
}

function getMyFriend() {
  FB.api(
    "/me/friends/", {limit: 500},
    function (response) {
      if (response && !response.error) {
        var ul = document.createElement("ul");
        var docfrag = document.createDocumentFragment();
        response.data.forEach(
          function (entry) {
            var li = document.createElement("li");
            li.textContent = entry.name;
            li.dataset.id = entry.id;
            docfrag.appendChild(li);
          }
        );
        ul.appendChild(docfrag);
        document.getElementById('friendlist').appendChild(ul);
        ul.addEventListener('click', function(e) {
          getUserFeed(e.target.dataset.id);
        });
      }
    }
  );
}

function runWordFreq(text) {
  // var xDegrees = calculateXD(text);
  var xDegrees = xdinfo.getScores();

  var wordfreqOption = { workerUrl: 'js/wordfreq/src/wordfreq.worker.js' };
  WordFreq(wordfreqOption).process(text, function(list) {
    var pizaList = list.concat(xDegrees);
    pizaList.sort(function(a, b) {
      return b[1]- a[1];
    });
    console.log('pizaList:' +pizaList);
    WordCloud(document.getElementById('wc-canvas-canvas'), { list: pizaList } );
  });
}

function XDinfo(dict) {
  this.infoBox = [];
  this.init(dict);
}

XDinfo.prototype = {
  init: function xd_init(dict) {
    for(var key in dict) {
      var obj = {};
      obj.name = key;
      obj.items = [];
      obj.scores = 0; // default scroes
      this.infoBox.push(obj);
    }
  },

  updateItem: function xd_updateItem(key, keyInfo, scores) {
    var xd = this.getItems(key);
    xd.scores = xd.scores + scores;
    xd.items.push(keyInfo);
  },

  getItems: function xd_getItem(key) {
    for(var i in this.infoBox) {
      var xd = this.infoBox[i];
      if (xd.name === key) {
        console.log('test: ' + JSON.stringify(xd));
        return xd;
      }
    }

    return false;
  },

  getScores: function xd_getScores() {
    var xDegrees = [];
    for(var i in this.infoBox) {
      var xd = this.infoBox[i];
      if (xd.scores === 0) {
        xDegrees[xDegrees.length] = [xd.name, 10];
      } else {
        xDegrees[xDegrees.length] = [xd.name, xd.scores];
      }
    }

    return xDegrees;
  },

  close: function xd_close() {
    this.infoBox = [];
  }
};
