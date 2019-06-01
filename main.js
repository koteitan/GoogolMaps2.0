var entry=function(){
  var spreadsheetId = "1Aoz_GcPYoEIMMNd1N_meYNOp8TJ0fCXpp1AoUhCpwZo",
    url = "https://spreadsheets.google.com/feeds/list/" +
          spreadsheetId +
          "/od6/public/basic?alt=json";
  $.get({
    url: url,
    success: function(response) {
      console.log(response);
    }
  });
};
