/* Sigilo LRGZ em cromo liquido.
   Computador: shader ao vivo. Celular: os dois MP4 gravados deste mesmo shader
   (ferramentas: identidade-cromo/gravar.py), que dao a mesma imagem em qualquer
   aparelho e nao gastam bateria com WebGL. */
(function(){
  var FORMA = 3.2, LACO = 9.0;

  var VS = '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
  '#version 300 es',
  'precision highp float;',
  'uniform vec2 uRes;uniform float uT,uForma,uLaco,uEsc;uniform vec2 uCentro;uniform sampler2D uTex;',
  'out vec4 cor;',
  '#define TAU 6.2831853',
  'vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453)*2.-1.;}',
  'float gn(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*f*(f*(f*6.-15.)+10.);',
  ' return mix(mix(dot(h2(i),f),dot(h2(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(h2(i+vec2(0,1)),f-vec2(0,1)),dot(h2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}',
  'float fbm(vec2 p){return gn(p)*.6+gn(p*2.1+7.)*.28+gn(p*4.3+3.)*.12;}',
  /* estudio de fotografia: caixas de luz frias sobre preto, que deslizam com a fase */
  'float caixa(float x,float c,float l,float s){return smoothstep(l+s,l,abs(x-c));}',
  'vec3 estudio(vec3 r,float f){',
  ' float h=r.y*.5+.5;',
  ' vec3 c=mix(vec3(.05,.055,.065),vec3(.46,.5,.56),smoothstep(.05,.9,h));',
  ' float a=atan(r.x,r.z)/TAU*2.+.13*sin(f)+.05*sin(2.*f+1.);',
  ' float y=r.y+.10*cos(f);',
  ' float b=caixa(a,.0,.055,.018)*1.0+caixa(a,.27,.022,.012)*.9+caixa(a,-.31,.034,.016)*.75+caixa(a,.52,.09,.04)*.45+caixa(a,-.62,.05,.03)*.4;',
  ' b*=smoothstep(-.82,-.2,y)*smoothstep(1.0,.35,y)+.16;',
  ' float lin=caixa(y,.44,.022,.014)*1.15+caixa(y,-.34,.012,.012)*.8+caixa(y,.08,.006,.01)*.5;',
  ' c+=vec3(.94,.97,1.)*(b*2.1+lin*1.7);',
  ' c*=mix(.72,1.15,smoothstep(-1.,.5,r.y));',
  ' return c;}',
  'void main(){',
  ' vec2 q=(gl_FragCoord.xy-.5*uRes-uCentro*uRes)/(min(uRes.x,uRes.y*1.0)*uEsc);',
  ' vec2 uv=q+.5;uv.y=1.-uv.y;',
  ' float t=uT;',
  ' float f=TAU*(t-uForma)/uLaco;',
  ' float prog=clamp(t/uForma,0.,1.);',
  ' vec4 tx=texture(uTex,uv);',
  ' float fora=step(.0,uv.x)*step(uv.x,1.)*step(.0,uv.y)*step(uv.y,1.);',
  ' vec2 n=(tx.rg-.5)*2.;',
  ' float m=tx.b*fora;',
  /* formacao: a marca nasce do centro e corre pelas pontas */
  ' float rr=length(q)*2.05;',
  ' float frente=1.28*(1.-pow(1.-prog,2.6));',
  ' float ab=smoothstep(frente,frente-.14,rr);',
  ' float aresta=smoothstep(.17,.0,abs(rr-frente))*(1.-smoothstep(.82,1.,prog));',
  ' float calma=smoothstep(0.,1.,prog);',
  /* metal liquido: ondas que assentam depois da formacao, com caminho circular no laco */
  ' vec2 c1=vec2(cos(f),sin(f))*.42,c2=vec2(cos(f+2.1),sin(f+2.1))*.28;',
  ' float e=.012;vec2 pn=q*3.4;',
  ' float n0=fbm(pn+c1)+.5*fbm(pn*1.7-c2);',
  ' vec2 g=vec2(fbm(pn+vec2(e*3.4,0.)+c1)+.5*fbm((pn+vec2(e*3.4,0.))*1.7-c2)-n0,fbm(pn+vec2(0.,e*3.4)+c1)+.5*fbm((pn+vec2(0.,e*3.4))*1.7-c2)-n0)/e/3.4;',
  ' float amp=mix(.75,.085,calma);',
  ' vec2 nn=n*1.28+g*amp;',
  ' vec3 N=normalize(vec3(nn,sqrt(max(.05,1.-dot(n,n)))));',
  ' vec3 V=vec3(0.,0.,1.);',
  ' vec3 R=reflect(-V,N);',
  ' float d=.05*smoothstep(.18,.85,length(n));',
  ' vec3 c=vec3(estudio(normalize(R+vec3(d,0.,0.)),f).r,estudio(R,f).g,estudio(normalize(R-vec3(d,d*.4,0.)),f).b);',
  ' float fr=pow(1.-max(N.z,0.),3.);',
  ' c+=vec3(.55,.68,.86)*fr*.55;',
  ' c=mix(c,c*vec3(.86,.93,1.08),.6);',
  /* varredura: luz que corre a marca uma vez por laco */
  ' float s=fract((t-uForma)/uLaco);',
  ' float vx=(q.x+q.y*.45)*1.4;',
  ' float var=smoothstep(.13,.0,abs(vx-(s*2.6-1.3)));',
  ' c+=vec3(.9,.96,1.)*var*.34*smoothstep(.0,.3,prog);',
  ' c=c*1.12/(1.+c*.16);',
  ' c=pow(max(c,0.),vec3(.92));',
  ' vec3 col=c*m*ab;',
  ' col+=vec3(.7,.86,1.)*aresta*m*1.3;',
  /* halo baixo, tirado dos mipmaps da propria mascara */
  ' float halo=(textureLod(uTex,uv,5.).b*.6+textureLod(uTex,uv,6.5).b*.8)*fora;',
  ' col+=vec3(.42,.52,.66)*halo*.17*(1.-m)*smoothstep(.15,1.,prog);',
  ' float gr=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);',
  ' col+=(gr-.5)/255.*step(.002,dot(col,vec3(1.)));',
  ' cor=vec4(col,1.);',
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
