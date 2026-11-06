/* Logo oficial do LRGZ em shader: nasce do centro, depois fica em repouso com
   uma luz passando devagar e brilhos pequenos nas pontas.
   Computador: ao vivo. Celular: MP4 de 60 fps gravados deste mesmo shader
   (ferramentas: identidade-v4/gravar.py). */
(function(){
  var FORMA = 2.6, LACO = 12.0, LADO = 1672 / 941;

  var VS = '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
  '#version 300 es',
  'precision highp float;',
  'uniform vec2 uRes;uniform float uT,uForma,uLaco,uVisto;uniform sampler2D uTex;',
  'out vec4 cor;',
  '#define TAU 6.2831853',
  'const float A=' + LADO.toFixed(5) + ';',
  /* brilho de quatro pontas, fino, num ponto da logo */
  'float estrela(vec2 d,float n){vec2 a=abs(d);',
  ' return exp(-a.x*n-a.y*n*9.)+exp(-a.y*n-a.x*n*9.);}',
  'float pisca(float t,float fase,float pot){return pow(max(sin(TAU*(t+fase)),0.),pot);}',
  'void main(){',
  /* q: coordenada em alturas da logo, com o centro em 0 */
  ' vec2 q=(gl_FragCoord.xy-.5*uRes)/uRes.y*uVisto;',
  ' vec2 uv=vec2(.5+q.x/A,.5-q.y);',
  ' vec2 dent=step(vec2(0.),uv)*step(uv,vec2(1.));',
  ' vec3 tx=texture(uTex,uv).rgb*dent.x*dent.y;',
  ' float prog=clamp(uT/uForma,0.,1.);',
  ' float rr=length(q);',
  ' float frente=.95*(1.-pow(1.-prog,2.1));',
  ' float ab=smoothstep(frente,frente-.09,rr);',
  ' float borda=exp(-pow((rr-frente+.03)/.05,2.))*(1.-smoothstep(.8,1.,prog));',
  ' float t=max(uT-uForma,0.)/uLaco;',
  /* a luz cruza a logo uma vez por laco e sai da tela antes de recomecar */
  ' float pos=mix(-1.5,1.5,fract(t));',
  ' float x=(q.x+q.y*.42)/A-pos*.72;',
  ' float luz=exp(-x*x/.0035)+.35*exp(-x*x/.04);',
  ' vec3 col=tx*(ab*(1.+.65*luz*step(uForma,uT))+1.6*borda);',
  /* pontas */
  ' vec2 P[8];P[0]=vec2(-.8515,.0463);P[1]=vec2(.8585,.0463);P[2]=vec2(0.,.4813);P[3]=vec2(0.,-.4733);',
  ' P[4]=vec2(-.2195,.2683);P[5]=vec2(.2235,.2683);P[6]=vec2(-.2595,-.2143);P[7]=vec2(.2635,-.2143);',
  ' float b=0.;',
  ' if(uT>uForma)for(int i=0;i<8;i++){',
  '  float f=float(i)*.381966;',
  '  float e=pisca(t*2.,f,26.);',
  '  b+=e*estrela(q-P[i],150.);',
  ' }',
  ' col+=vec3(.93,.96,1.)*b*.85;',
  ' cor=vec4(col,1.);',
  '}'].join('\n');

  function compila(gl,t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));return s;}

  /* visto: quantas alturas de logo cabem na altura do canvas (1 = logo inteira) */
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
    var U={};['uRes','uT','uForma','uLaco','uVisto','uTex'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n);});
    gl.uniform1f(U.uForma,FORMA);gl.uniform1f(U.uLaco,LACO);gl.uniform1i(U.uTex,0);
    var img=new Image();
    var ctl={forma:FORMA,laco:LACO,visto:1,
      desenhar:function(t){
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.uniform2f(U.uRes,canvas.width,canvas.height);
        gl.uniform1f(U.uT,t);gl.uniform1f(U.uVisto,ctl.visto);
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
    img.src=base+'logo-textura.webp?v=1';
    return true;
  };
})();
