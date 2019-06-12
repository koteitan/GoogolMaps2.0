// fields--------------------
// maps
var maps;
//var spreadsheetId = "1-Mo_pc4HOavJucJfyIo-vkKKESnWEfjkkJJ4zTyfzjQ"; //for staging 
var spreadsheetId = "11WH6PrhFAcdMEWSTjxSjZ7_rWHg-b8shAvSFn99bdyQ"; // for live
var gW; /* world coordinate */
//entry point--------------------
window.onload = function(){
  initHtml(); //get locale option
  initMaps(); //use local option
  initDraw();
  initEvent();
  window.onresize(); //after loading maps
  setInterval(procAll, 1000/frameRate); //enter gameloop
}
//maps-------------------
var initMaps=function(){
  var url = "https://spreadsheets.google.com/feeds/list/" +
          spreadsheetId +
          "/od6/public/basic?alt=json";
  $.get({
    url: url,
    success: function(response) {
      initMaps2(response); /* set callback and continue to initMaps2*/
    }
  });
  var m = 0.1; //default margin
  gW = new Geom(2,[[0-m,0-m],[1+m,1+m]]);
};
/* continued from main(). */
var initMaps2=function(res){
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
  /* draw */
  isSheetLoaded = true;
  isRequestedDraw = true;
}
//game loop ------------------
var procAll=function(){
  procEvent();
  if(isRequestedDraw && isSheetLoaded){
    procDraw();
    isRequestedDraw = false;
  }
}
var initHtml=function(){
  if(navigator.language=='ja'){
    document.getElementsByName('locale')[1].checked = true;
  }
}

/* Entry object 
 * Entry is the object of each large number. 
 * line = response.feed.entry[n] */
var Entry=function(line){
  var col = line.content.$t.split(",");
  this.order   = parseInt(col[0].split(": ")[1]);
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
// Event listeners ----------------------------
window.onresize = function(){ //browser resize
  var wx,wy;
  var agent = navigator.userAgent;
  var wx= [(document.documentElement.clientWidth-10)*0.99, 320].max();
  var wy= [(document.documentElement.clientHeight-195), 20].max();
  document.getElementById("outcanvas").width = wx;
  document.getElementById("outcanvas").height= wy;
  isRequestedDraw = true;
};
var changelocale=function(){ // form option button
  isRequestedDraw = true;
}
// graphics ------------------------
var ctx;
var can;
var gS;
var fontsize = 15;
var radius = 15;
var isRequestedDraw = true;
var isSheetLoaded = false;
var frameRate = 60; //[fps]
//init
var initDraw=function(){
  can = document.getElementById("outcanvas");
  ctx = can.getContext('2d'); 
  ww = [can.width, can.height];
  gS = new Geom(2,[[0,ww[1]],[ww[0],0]]);
}
//proc
var procDraw = function(){
  //dra wbackground
  ctx.fillStyle="white";
  ctx.fillRect(0,0,can.width, can.height);
  //draw text
  ctx.strokeStyle='black';
  ctx.fillStyle='black';
  ctx.font = String(fontsize)+'px Segoe UI';
  for(var e=0;e<maps.entrylist.length;e++){
    var entry  = maps.entrylist[e];
    var sq = transPos([entry.x, entry.y],gW,gS); //center of entry
    //text
    var text=document.getElementsByName('locale')[1].checked
      ?entry.lname
      :entry.name;
    var tx = ctx.measureText(text).width;
    var ty = fontsize;
    ctx.fillText(text, Math.floor(sq[0]-tx/2),
                       Math.floor(sq[1]-ty/2));
    //circle
    ctx.beginPath();
    ctx.arc(Math.floor(sq[0]), 
            Math.floor(sq[1]), radius, 0, 2*Math.PI,false);
    ctx.stroke();
  }
}
//event---------------------
var isKeyTyping;
//init
var initEvent = function(){
  eventQueue = [];
  can.ontouchstart = addTouchEvent;
  can.ontouchmove  = addTouchEvent;
  can.ontouchend   = addTouchEvent;
  can.onmousedown  = addEvent;
  can.onmousemove  = addEvent;
  can.onmouseup    = addEvent;
  can.onmouseout   = addEvent;
  can.onmousewheel = addEvent;
//  window.onkeydown       = addEvent;
};
var downpos=[-1,-1];// start of drag
var movpos =[-1,-1];// while drag
var handleMouseDown = function(){
  downpos = transPos(mouseDownPos,gS,gW);
  movpos[0] = downpos[0];
  movpos[1] = downpos[1];
}
var handleMouseDragging = function(){
  movpos = transPos(mousePos,gS,gW);
  for(var i=0;i<2;i++){
    for(var d=0;d<2;d++){
      gW.w[i][d] -= movpos[d]-downpos[d];
    }
  }
  isRequestedDraw = true;
}
var handleMouseUp = function(){
  isRequestedDraw = true;
}
var handleMouseWheel = function(){
  var pos=transPos(mousePos,gS,gW);
  var oldw=gW.w.clone();
  for(var i=0;i<2;i++){
    for(var d=0;d<2;d++){
      gW.w[i][d] = (oldw[i][d]-pos[d])*Math.pow(1.1, -mouseWheel[1]/1000)+pos[d];
    }
  }
  for(var d=0;d<gW.dims;d++){
    gW.ww[d] = gW.w[1][d] - gW.w[0][d];
    gW.iww[d] = 1/gW.ww[d];
  }
  isRequestedDraw = true;
}

