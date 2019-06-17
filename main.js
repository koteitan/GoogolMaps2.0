// fields--------------------
// maps
var maps;
var spreadsheetId = "11WH6PrhFAcdMEWSTjxSjZ7_rWHg-b8shAvSFn99bdyQ"; // for live
//var spreadsheetId = "1foxx3dOYDwnyqQsxmhmcWV93xvCzOxX73GCg8Bv-kg0";
var gW; /* world coordinate */
//entry point--------------------
window.onload = function(){
  initHtml(); //get locale option
  initMaps(); //use local option
  initDraw();
  initEvent(can);
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
  debug = document.getElementById('debug');
  if(navigator.language=='ja'){
    document.getElementsByName('locale')[1].checked = true;
  }
}

var attributelist=['type','order','discoveryear','name','local','name','author','local','author','locale','expression','fgh','evolvedfrom','related','color','equal','definitionurl','isterminated'];
var monthdays=[31,28,31,30,31,30,31,31,30,31,30,31];
/* Entry object 
 * Entry is the object of each large number. 
 * line = response.feed.entry[n] */
var Entry=function(line){
  var col = line.content.$t.split(",");
  for (var i=0;i<col.length;i++){
    if (col[i].indexOf(": ")==-1){
      col[i-1]+=","+col[i];
      col.splice(i,1);
      i--;
    }
  }
  for(var i=0;i<attributelist.length;i++){
    this[attributelist[i]]="";
  }
  for (var i=0;i<col.length;i++){
    var a = col[i].split(":");
    if(a.length>=2) {
      this[a[0].trim()]=a[1].trim();
    }
  }
  this.order=parseInt(this.order);
  if(typeof(this.discoveryear)==="number"){
    this.discoveryear=this.discoveryear+""; //convert to string
  }
  if(this.discoveryear.length==4){
    this.yeardate=new Date(this.discoveryear+"-12-31");
  }else if(this.discoveryear.length==6){
    this.yeardate=new Date(
           this.discoveryear.substr(0,4)
      +"-"+this.discoveryear.substr(4,2)
      +"-"+(monthdays[parseInt(this.discoveryear.substr(4,2))])
    );
  }else{
    this.yeardate=new Date(
             this.discoveryear.substr(0,4)
        +"-"+this.discoveryear.substr(4,2)
        +"-"+this.discoveryear.substr(6,2)
    );
  }

  this.evolvedfrom=this.evolvedfrom.split("/");
  this.related=this.related.split("/");
}
Entry.prototype.toString = function(){
  return this.discoveryear + ":" + this.name + "(" + this.order + ")";
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
  var prevyear = new Date(-100000);
  while(left.length>0){ //loop until left is empty
    //find minimum
    var mine = 0;
    var minl = 0;
    for(var l=0;l<left.length;l++){
      if(left[l].yeardate<=left[minl].yeardate){
        mine = left[l].i;
        minl = l;
      }
    }
    if(prevyear - left[minl].yeardate == 0){ // if same year
      //add mine into last array
      this.yearsort[this.yearsort.length-1].push(mine);
    }else{ // if different year
      //add new array
      this.yearsort.push([mine]);
    }
    prevyear = left[minl].yeardate;
    left = left.slice(0,minl).concat(left.slice(minl+1));
  }
  var years=this.yearsort.length;
  var timewidth=list[this.yearsort[years-1][0]].yeardate.getTime()
               -list[this.yearsort[    0  ][0]].yeardate.getTime();
  var timeoldest=list[this.yearsort[    0  ][0]].yeardate.getTime();
  for(var y=0;y<years;y++){
    for(var e=0;e<this.yearsort[y].length;e++){
      list[this.yearsort[y][e]].x = y/years;
      //list[this.yearsort[y][e]].x = (list[this.yearsort[y][e]].yeardate-timeoldest)/timewidth; //actual scale
    }
  }
  var orders = list[list.length-1].order +1;
  for(var e=0;e<list.length;e++){
    list[e].y = list[e].order/orders;
  }
  a=1;
}
// html ----------------------------
var debug;
window.onresize = function(){ //browser resize
  var wx,wy;
  var agent = navigator.userAgent;
  var wx= [(document.documentElement.clientWidth-10)*0.99, 320].max();
  var wy= [(document.documentElement.clientHeight-200), 20].max();
  document.getElementById("outcanvas").width = wx;
  document.getElementById("outcanvas").height= wy;
  renewgS();
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
  renewgS();
}
var renewgS=function(){
  var s=[[0,can.height],[can.width,0]];
  gS = new Geom(2,s);
}
//proc
var procDraw = function(){

  //background
  ctx.fillStyle="white";
  ctx.fillRect(0,0,can.width, can.height);

  //grid line -----------------------
  //get screen in world coordinate
  var scr = [transPos([0,can.height], gS, gW), transPos([can.width,0], gS, gW)];
  var base=8;
  var L=Math.log10(scr[1][0]-scr[0][0])/Math.log10(base);
  var intL=Math.floor(L);
  var fracL=L-intL;
  var intL =Math.pow(base,intL);
  var fracL=Math.pow(base,fracL)/base;
  var depths = 3;
  //debug.innerHTML = "intL="+intL+"\n";
  //debug.innerHTML += "fracL="+fracL+"\n";
  for(var depth=depths-1;depth>=0;depth--){
    var qw = intL/Math.pow(base,depth);
    var c = Math.floor(((depth+fracL)/depths)*64+64+127);
    //debug.innerHTML += "c("+depth+") = "+c+"\n";
    ctx.lineWidth=1;
    ctx.strokeStyle='rgb('+c+','+c+','+c+')';
    for(var d=0;d<gW.dims;d++){
      var q0 = Math.floor((scr[0][d])/qw)*qw;
      var q1 = Math.ceil ((scr[1][d])/qw)*qw;

      for(var q=q0;q<q1;q+=qw){
        var wq = scr.clone();
        wq[0][d]=q;
        wq[1][d]=q;
        var sq = [transPosInt(wq[0],gW,gS), transPosInt(wq[1],gW,gS)];
        ctx.beginPath();
        ctx.moveTo(sq[0][0],sq[0][1]);
        ctx.lineTo(sq[1][0],sq[1][1]);
        ctx.stroke();
      }//q
    }//depth
  }//d

  //draw entries
  ctx.strokeStyle='black';
  ctx.fillStyle='black';
  ctx.font = String(fontsize)+'px Segoe UI';
  for(var e=0;e<maps.entrylist.length;e++){
    var entry  = maps.entrylist[e];
    var sq = transPos([entry.x, entry.y],gW,gS); //center of entry
    
    //circle
    ctx.strokeStyle=entry.color;
    ctx.lineWidth=4;
    ctx.beginPath();
    ctx.arc(Math.floor(sq[0]), 
            Math.floor(sq[1]), radius, 0, 2*Math.PI,false);
    ctx.stroke();

    //text
    var text=document.getElementsByName('locale')[1].checked
      ?entry.localname
      :entry.name;
    if(text.length>32){text=text.substring(0,32)+"...";}
    var tx = ctx.measureText(text).width;
    var ty = fontsize+radius;
    ctx.fillText(text, Math.floor(sq[0]-tx/2),
                       Math.floor(sq[1]-ty/2));
  }
}
//event---------------------
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
  gW.recalc();
  isRequestedDraw = true;
}

