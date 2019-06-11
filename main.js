/* Entry object 
 * Entry is the object of each large number. 
 * line = response.feed.entry[n] */
var Entry=function(line){
  var col = line.content.$t.split(",");
  this.order   = col[0].split(": ")[1];
  this.year    = col[1].split(": ")[1];
  this.name    = col[2].split(": ")[1];
  this.lname   = col[3].split(": ")[1];
  this.author  = col[4].split(": ")[1];
  this.lauthor = col[5].split(": ")[1];
  this.locale  = col[6].split(": ")[1];
  this.exp     = col[7].split(": ")[1];
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
  /* this.yearsort = list of list of index sorted by year.
   * when A<B<C<D=E=F<G<H,
   * this.yearsort = [[A],[B],[C],[D,E,F],[G],[H]] */
  this.yearsort  = []; 

  var left = list.clone();
  for(var e=0;e<left.length;e++){
    left[e].i = e; // add index member
  }
  var prevyear = 0;
  while(left.length>0){ //loop until left is empty
    //find minimum
    var mine = 0;
    var minl = 0;
    for(var l=0;l<left.length;l++){
      if(left[l].year<=left[minl].year){
        mine = left[l].i;
        minl = l;
      }
    }
    if(prevyear == left[minl].year){ // if same year
      //add mine into last array
      this.yearsort[this.yearsort.length-1].push(mine);
    }else{ // if different year
      //add new array
      this.yearsort.push([mine]);
    }
    prevyear = left[minl].year;
    left = left.slice(0,minl).concat(left.slice(minl+1));
  }
  var years=this.yearsort.length;
  for(var y=0;y<years;y++){
    for(var e=0;e<this.yearsort[y].length;e++){
      list[this.yearsort[y][e]].x = y/years;
    }
  }
  var orders = list[list.length-1].order +1;
  for(var e=0;e<list.length;e++){
    list[e].y = list[e].order/orders;
  }
  a=1;
}

/* entry point */
var main=function(){
  /* sheet via ajax */
  var spreadsheetId = "1-Mo_pc4HOavJucJfyIo-vkKKESnWEfjkkJJ4zTyfzjQ",
//  var spreadsheetId = "11WH6PrhFAcdMEWSTjxSjZ7_rWHg-b8shAvSFn99bdyQ",
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
  /* make a maps */
  maps = new Maps(entrylist);

  /* for debug */
  var str="";
  for(var e=0;e<entries;e++){
    str = str + entrylist[e].toString();
    str = str + "\n";
  }
  document.getElementById("debug").innerHTML = str;
}

var maps; //maps

