/* Entry object 
 * Entry is the object of each large number. 
 * line = response.feed.entry[n] */
var Entry=function(line){
  var col = line.content.$t.split(",");
  this.name  = col[0].split(": ")[1];
  this.year  = col[1].split(": ")[1];
  this.order = col[2].split(": ")[1];
}
Entry.prototype.toString = function(){
  return this.year + ":" + this.name + "(" + this.order + ")";
}
/* Maps Object
 * Maps of the large nubmers.
 * list = list of large nubmers */
var Maps=function(list){
  this.entrylist = list; /* list of large numbrers */

  /* entrylist -> sort */
  this.yearsort  = []; /* list of index sorted by year */
  this.largesort = []; /* list of index sorted by size */
  entries = this.entrylist.length;
  for(var e=0;e<entries;e++){

  }
}

/* entry point */
var main=function(){
  /* sheet via ajax */
  var spreadsheetId = "11WH6PrhFAcdMEWSTjxSjZ7_rWHg-b8shAvSFn99bdyQ",
    url = "https://spreadsheets.google.com/feeds/list/" +
          spreadsheetId +
          "/od6/public/basic?alt=json";
  $.get({
    url: url,
    success: function(response) {
      main2(response); /* set callback and continue to main2 */
    }
  });
};

/* continued from main(). */
var main2=function(res){

  /* res -> parse -> entrylist[n] */
  var sheet = res.feed.entry;
  var entries = sheet.length;
  entrylist = [];
  for(var e=0;e<entries;e++){
    var entry = new Entry(sheet[e]);
    entrylist.push(entry);
  }
  /* sort and make position */ 
  largesort = [];
  yearsort = [];
  /* for debug */
  var str="";
  for(var e=0;e<entries;e++){
    str = str + entrylist[e].toString();
    str = str + "\n";
  }
  document.getElementById("debug").innerHTML = str;
}


