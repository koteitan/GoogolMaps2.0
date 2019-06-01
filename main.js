var Entry=function(line){
  var col = line.content.$t.split(",");
  this.name  = col[0].split(": ")[1];
  this.year  = col[1].split(": ")[1];
  this.order = col[2].split(": ")[1];
}
Entry.prototype.toString = function(){
  return this.year + ":" + this.name + "(" + this.order + ")";
}
var expand=function(res){
  var sheet = res.feed.entry;
  var entries = sheet.length;
  var entrylist = [];
  for(var e=0;e<entries;e++){
    var entry = new Entry(sheet[e]);
    entrylist.push(entry);
  }

  var str="";
  for(var e=0;e<entries;e++){
    str = str + entrylist[e].toString();
    str = str + "\n";
  }
  document.getElementById("debug").innerHTML = str;
}

var entry=function(){
  var spreadsheetId = "11WH6PrhFAcdMEWSTjxSjZ7_rWHg-b8shAvSFn99bdyQ",
    url = "https://spreadsheets.google.com/feeds/list/" +
          spreadsheetId +
          "/od6/public/basic?alt=json";
  $.get({
    url: url,
    success: function(response) {
      expand(response);
    }
  });
};
