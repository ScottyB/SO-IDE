/**
 * Fetches content from StackOverflow and renders it to the screen also sets up the
 * CodeMirror plugin.
 *
 * author: ScottB
 */

var soide = {};

soide.Setup = function() {
  "use strict";
  var myCodeMirror = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    matchBrackets: true,
    mode: "text/x-java"
  }),

      query = soide.QueryCaller(), parser = soide.ResultParser(query, "#popup", "#back_fader", myCodeMirror),

      downloadFile = function() {
        myCodeMirror.save();
        query.fetchDownloadURL(function(data){
          window.location.href='/static/files.zip';
          console.log("Completed");});
        return false;
      },

      onSend = function() {
        var questionString = jQuery("#query").val();
        if (questionString) {
          query.sendQuery(parser.parseResult, questionString);
        }
        else {
          jQuery("#query").attr("placeholder","Please enter query first");
        }
        return false;
      };

  myCodeMirror.setSize(650, 600);

  jQuery("#queryForm").submit(onSend);
  jQuery("#squaresWaveG").hide();
  jQuery("#back_fader").scroll(parser.loadNext);
  jQuery("#download").click(downloadFile);
};

soide.QueryCaller = function(){
  "use strict";
  var soAPIServer = "https://api.stackexchange.com/2.1/",

      server = "http://localhost:8888/",

      urls = {FETCH : server + "fetch", DOWNLOAD : server + "download"},

      errorCallback = function(data) {
        console.log(JSON.stringify(data));
      },

      request = function(requestType, dataCallback, urlAddress, data) {

        console.log("Data: " + JSON.stringify(data));
        console.log(soAPIServer + urlAddress);
        jQuery.ajax({url : soAPIServer + urlAddress,
                     type : requestType,
                     dataType : "json",
                     data : data,
                     success : dataCallback,
                     error : errorCallback
                    }
                   );
      },

      soHtmlHandlers = [],

      that = {

        sendQuery: function(callback, query) {

          jQuery("#squaresWaveG").show();
          var serviceSuffix = "search/advanced",
              params = {"order": "desc",
                        "sort" : "relevance",
                        "site" : "stackoverflow",
                        "answers" : 1,
                        "tagged" : "java",
                        "q" : query};
          request("GET", callback, serviceSuffix, params);
        },

        fetchHtml: function(urlToFetch, callback) {
          var result = jQuery.ajax({url: urls.FETCH,
                                    data: {url : urlToFetch},
                                    type: "post",
                                    success: callback,
                                    error: errorCallback
                                   });
          soHtmlHandlers.push(result);
        },

        fetchDownloadURL: function(callback) {
          var data = {"code" : jQuery("#code").val()};
          var result = jQuery.ajax({url: urls.DOWNLOAD,
                                    data: data,
                                    type: "post",
                                    success: callback,
                                    error: errorCallback
                                   });

        },

        abortAllFetches : function() {
          for(var i = 0; i < soHtmlHandlers.length; i++) {
            soHtmlHandlers[i].abort();
          }
        },

        abortAll : function() {
          // todo implement this method
        }
      };

  return that;
};

soide.ResultParser = function(aQueryCaller, selector, bkgselector, wrapper) {
  "use strict";
  var caller = aQueryCaller,

      itemArray = [],

      itemIndex = 0,

      popupSelector = selector,

      myCodeMirror = wrapper,

      inProgress = false,

      handleResult = function(data) {
        jQuery(".answercell .post-text", data).each(
          function(i, value) {
            jQuery(bkgselector).show();
            if(jQuery("code", this).length > 0) {

              jQuery("p:not(:has(>code))", value).remove();
              jQuery(popupSelector).append(value);
              jQuery(popupSelector).append("<hr />");

              jQuery("#squaresWaveG").hide();

              jQuery("code", this).click(function() {
                var pos = myCodeMirror.getCursor();
                myCodeMirror.replaceRange(jQuery(this).text(), pos);
              });
            }
          });
      },

      fetchNextAnswers = function(numberToFetch) {
        if (!inProgress) {
          inProgress = true;
          var endIndex = itemIndex + numberToFetch;
          if (endIndex <= itemArray.length) {
            for (var i = itemIndex; i < endIndex; i++) {
              var url = itemArray[i]["link"];
              caller.fetchHtml(url, handleResult);
              itemIndex += 1;
            }
            itemIndex += 1;
          }
          inProgress = false;
        }
      },

      that = {
        parseResult : function(result) {
          itemArray = result.items;
          jQuery(popupSelector).empty();
          aQueryCaller.abortAllFetches();
          fetchNextAnswers(4);
        },

        loadNext : function() {
          console.log("Scrolling");
          fetchNextAnswers(4);
        }
      };
  return that;
};

jQuery(document).ready(soide.Setup);
