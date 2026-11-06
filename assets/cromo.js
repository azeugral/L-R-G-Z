/* Sigilo LRGZ em metal acetinado.
   Computador: shader ao vivo. Celular: os dois MP4 gravados deste mesmo shader
   (ferramentas: identidade-cromo/gravar.py), que dao a mesma imagem em qualquer
   aparelho e nao gastam bateria com WebGL. */
(function(){
  var FORMA = 2.6, LACO = 12.0;

  var VS = '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
  '#version 300 es',
  'precision highp float;',
  'uniform vec2 uRes;uniform float uT,uForma,uLaco,uEsc;uniform vec2 uCentro;uniform sampler2D uTex;',
  'out vec4 cor;',
  '#define TAU 6.2831853',
  'void main(){',
  ' vec2 q=(gl_FragCoord.xy-.5*uRes-uCentro*uRes)/(min(uRes.x,uRes.y)*uEsc);',
  ' vec2 uv=q+.5;uv.y=1.-uv.y;',
  ' float t=uT,f=TAU*(t-uForma)/uLaco;',
  ' float prog=clamp(t/uForma,0.,1.);',
  ' vec4 tx=texture(uTex,uv);',
  ' float m=tx.b*step(.0,uv.x)*step(uv.x,1.)*step(.0,uv.y)*step(uv.y,1.);',
  /* a marca nasce do centro e corre ate as pontas, sem brilho na frente */
  ' float rr=length(q)*2.05;',
  ' float frente=1.24*(1.-pow(1.-prog,1.9));',
  ' float ab=smoothstep(frente,frente-.05,rr);',
  /* metal acetinado: relevo discreto e uma luz larga que quase nao anda */
  ' vec3 N=normalize(vec3((tx.rg-.5)*.95,1.));',
  ' vec3 L=normalize(vec3(.34*sin(f),.62+.10*cos(f),.72));',
  ' float d=max(dot(N,L),0.);',
  ' float alt=smoothstep(-.52,.52,q.y+.05*sin(f+1.));',
  ' float x=q.x-.42*sin(f*.5+.6);',
  ' float faixa=exp(-x*x/.09);',
  ' float v=.30*d+.34*alt+.20*faixa+.10;',
  ' vec3 col=mix(vec3(.50,.525,.56),vec3(.965,.97,.975),smoothstep(.22,.92,v));',
  ' cor=vec4(col*m*ab,1.);',
  '}'].join('\n');

  function compila(gl,t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));return s;}

  /* monta o shader num canvas; devolve desenhar(t) depois que o relevo carrega */
  window.LRGZ_cromo = function(canvas, base, pronto){
    var gl = canvas.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:!!window.__captura,powerPreference:'high-performance'});
    if(!gl) return false;
    var pr = gl.createProgram();
    gl.attachShader(pr,compila(gl,gl.VERTEX_SHADER,VS));
    gl.attachShader(pr,compila(gl,gl.FRAGMENT_SHADER,FS));
    gl.linkProgram(pr);gl.useProgram(pr);
    var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var lp=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
    var U={};['uRes','uT','uForma','uLaco','uEsc','uCentro','uTex'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n);});
    gl.uniform1f(U.uForma,FORMA);gl.uniform1f(U.uLaco,LACO);gl.uniform1i(U.uTex,0);gl.uniform2f(U.uCentro,0,0);
    var img=new Image();
    var ctl={forma:FORMA,laco:LACO,esc:1,
      desenhar:function(t){
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.uniform2f(U.uRes,canvas.width,canvas.height);
        gl.uniform1f(U.uT,t);gl.uniform1f(U.uEsc,ctl.esc);
        gl.drawArrays(gl.TRIANGLES,0,3);
      }};
    img.onload=function(){
      var tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      pronto(ctl);
    };
    img.src=base+'relevo.webp';
    return true;
  };
})();
