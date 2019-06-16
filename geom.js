//=========================================
// geom.js
//=========================================
/* require tag below:
  <script type="text/javascript" src="./matrix.js"></script>
  <script type="text/javascript" src="./geom.js"></script>
*/
/*---------------------------------------
Geom(_dims, _w[][])
_dims  = 次元数
_w[][] = 座標境界 w[0][d] to w[1][d], d=次元
-----------------------------------------*/
var Geom = function(_dims, _w){
  this.w = _w;
  this.dims = _dims;
  this.ww = new Array(this.dims);
  this.iww = new Array(this.dims);
  for(var d=0;d<this.dims;d++){
    this.ww[d] = this.w[1][d] - this.w[0][d];
    this.iww[d] = 1/this.ww[d];
  }
};
/* recalc */
Geom.prototype.recalc = function(){
  for(var d=0;d<this.dims;d++){
    this.ww[d] = this.w[1][d] - this.w[0][d];
    this.iww[d] = 1/this.ww[d];
  }
};
/*---------------------------------------
Camera(_dims, _w[][])
_dims  = 次元数
_w[][] = 座標境界 w[0][d] to w[1][d], d=次元
-----------------------------------------*/
var Camera = function(_pos, _dirmz, _dirx, _screenDistance){
  if(_pos != undefined){
    this.pos   = _pos;
    this.dirmz = _dirmz;
    this.dirx  = _dirx;
    this.screenDistance  = _screenDistance;
  }else{
    this.pos   = [0,0, 7];
    this.dirmz = [0,0,-1];
    this.dirx  = [1,0, 0];
    this.screenDistance  = -1;
  }
};
Camera.prototype.clone=function(){ 
  return new Camera(this.pos, this.dirmz, this.dirx, this.screenDistance);
};

//g0 座標系の位置ベクトル x を g1 座標系の値に変換 
var transPos=function(x, g0, g1){
  var y = new Array(g0.dims);
  for(var d=0;d<g0.dims;d++){
    y[d] = (x[d]-g0.w[0][d])*g0.iww[d]*g1.ww[d]+g1.w[0][d];
  }
  return y;
};
var transPosInt=function(x, g0, g1){
  var y = new Array(g0.dims);
  for(var d=0;d<g0.dims;d++){
    y[d] = Math.floor((x[d]-g0.w[0][d])*g0.iww[d]*g1.ww[d]+g1.w[0][d]);
  }
  return y;
};
//g0 座標系の方向ベクトル x を g1 座標系の値に変換 
var transScale=function(x, g0, g1){
  var y = new Array(g0.dims);
  for(var d=0;d<g0.dims;d++){
    y[d] = x[d]*g0.iww[d]*g1.ww[d];
  }
  return y;
};
//g0 座標系での次元インデクス d の位置ベクトル成分 x を g1 座標系の値に変換 
var transPosElem = function(x, d, g0, g1){
  return (x-g0.w[0][d])*g0.iww[d]*g1.ww[d]+g1.w[0][d];
};
//g0 座標系での次元インデクス d の方向ベクトル成分 x を g1 座標系の値に変換 
var transScaleElem = function(x, d, g0, g1){
  return  x*g0.iww[d]*g1.ww[d];
};
//3D 座標 gW にて target の位置にある点を
//カメラからみたときの 2D 座標 gS での位置 (sx[2] には視直径が入る) (double)
var transCam = function(target, c, c0, gW, gS){
  var camr = getRotate(c.dirmz, c.dirx, c0.dirmz, c0.dirx);
  var cx = mulxv(camr, sub(target, c.pos));
  var psz = c.screenDistance/cx[2];
  var psx = [cx[0] * psz, cx[1] * psz , psz];
  //スクリーン座標系に変換
  var sx = new Array(3);
  sx[0] = transPosElem(psx[0], 0, gW, gS);
  sx[1] = transPosElem(psx[1], 1, gW, gS);
  sx[2] = transScaleElem(psx[2], 2, gW, gS);
  return sx;
};

/* a0 を a1 に移動するための原点中心の回転 r */
var getRotatePos = function(ina0, ina1){
  // a0・a1 =  cosθ  (θ=回転角)
  // a0×a1 = e sinθ (θ=回転角, e = 軸方向単位ベクトル)
  // e sinθ =  a0×a1
  //  |sinθ| = |a0×a1|
  // e       = (a0×a1)/|a0×a1| = normalize(a0×a1)
  var a0 = normalize(ina0);
  var a1 = normalize(ina1); 
  var cos  = dot(a0,a1);
  var c = cross(a0,a1);
  var sin  = abs(c);
  var e = normalize(c);
  if(sin > 10e-80){
    //通常の角度
    return ang2rot(e, cos, sin);
  }else{
    if(cos > 0){
      // 0 deg
      return [[1,0,0],[0,1,0],[0,0,1]];
    }else{
      //180 deg
      c = cross(a0, [1,0,0]);
      if(abs(c)>10e-80){
        return [[1,0,0],[0,-1,0],[0,0,-1]];
      }else{
        return [[-1,0,0],[0,1,0],[0,0,-1]];
      }
    }
  }
};
var angTheta2rot = function(a, theta){
 return ang2rot(a, Math.cos(theta), Math.sin(theta));
}

/* 孤 (a0,b0) を (a1,b1) に移動するための原点中心の回転 r */
var getRotate = function(ina0, inb0, ina1, inb1){
  if(ina1 != undefined){
    var a0 = normalize(ina0);
    var b0 = normalize(inb0);
    var a1 = normalize(ina1);
    var b1 = normalize(inb1);
    
    // まずは a0→a1 で合わせる回転 r0
    var r0 = getRotatePos(a0, a1); 
    var b2 = mul(r0, b0); // b2 = r0 後の b0
    
    // b2 を b1 に動かす回転 r1 を求める。軸は a1 にすればよい
    var cos = dot(b1,b2);
    var handedness = dot(a1, cross(b2,b1)); //掌性
    var sin = abs(cross(b1,b2));
    
    if(abs(sub(b1,b2))<1e-96){
      return r0;  //回転なし
    }else if(handedness<0){
      sin = -sin; //負の掌性
    }
    var r1 = ang2rot(a1, cos, sin);
    return mul(r1, r0);// r0→r1
  }else{
    return getRotatePos(ina0, inb0); //点の回転移動に変更
  }
};

var testGeom=function(){
  var str="";
  str += "ww=" + mat2str(g0.iww) + " , ";
  return str;
};
/*  cam.pos =(0,0,0) とスクリーン上の点 (sxi, syi) の直線をカメラ座標系で返す */
var getCamLine=function(cam, sxi, syi){
  var cl = new Array(2);
  c[0]=new Array(3);
  c[1]=new Array(3);
  // cl[0]={0,0,0};
  //スクリーン座標系 → カメラ座標系に変換
  cl[1][0] = gS.transPos(sxi, 0, gP);
  cl[1][1] = gS.transPos(syi, 1, gP);
  cl[1][2] = cam.screenDistance;
  return cl;
}
