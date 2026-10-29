/* Fios de luz do hero: feixes finos em rosa, violeta e dourado contornando um círculo escuro no centro,
   como na capa do catálogo da Fernanda (e como fios de cílios vistos de perto).
   Ao vivo no desktop; no celular o mesmo shader vira MP4 (tools/gerar_fios.py).
   `a` é a fase do loop (0 a 2π): todas as ondas usam múltiplos inteiros de `a`, então o loop fecha sem emenda.
   `cel` = 1 no retrato do celular (anel mais fechado e mais alto). */
window.FIOS_FS = `precision highp float;
uniform vec2 r;uniform float a;uniform float cel;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,b=.5;for(int i=0;i<4;i++){v+=b*n(p);p=p*2.03+vec2(1.7,9.2);b*=.5;}return v;}
vec3 tom(float t){
  vec3 rosa=vec3(.92,.24,.55),violeta=vec3(.52,.3,.9),ouro=vec3(.93,.7,.47);
  t=fract(t)*3.;
  return t<1.?mix(rosa,violeta,t):t<2.?mix(violeta,ouro,t-1.):mix(ouro,rosa,t-2.);
}
void main(){
  float asp=r.x/r.y;
  vec2 p=(gl_FragCoord.xy-.5*r)/r.y;
  p.y-=cel*.06;
  p.x/=mix(max(asp*.7,1.),.92,cel);               // no desktop o anel se alarga para ocupar a tela
  p*=mix(.86,1.,cel);
  float th=atan(p.y,p.x), rr=length(p);
  vec3 col=vec3(0.);
  // dois feixes: embaixo à esquerda e em cima à direita
  float w1=pow(max(0.,cos(th-3.75)),1.6), w2=pow(max(0.,cos(th-.55)),2.2);
  float peso=w1+w2*.85;
  for(int i=0;i<12;i++){
    float fi=float(i), o=fi*1.37;
    float R=.36+fi*.017
      +.035*sin(3.*th+a+o)
      +.018*sin(5.*th-2.*a+o*1.9)
      +.010*sin(2.*th+3.*a-o);
    float d=abs(rr-R);
    float brilho=.0016/(d+.0035);                  // halo
    float fio=smoothstep(.0028,0.,d);              // núcleo fino
    float vida=.55+.45*sin(th*2.+a+o*2.3);         // cada fio acende e apaga ao longo do arco
    col+=tom(fi*.11+.12*cos(th)+.15*sin(a))*(brilho*.55+fio*.9)*vida*peso;
  }
  // névoa de cor junto dos feixes
  float nv=fbm(vec2(cos(th),sin(th))*2.2*(1.+rr)+vec2(cos(a),sin(a))*.6);
  col+=tom(.1+nv*.5)*smoothstep(.55,.95,nv)*.35*peso*smoothstep(.75,.4,abs(rr-.5));
  // pó brilhante
  vec2 g=floor(gl_FragCoord.xy/2.);
  float s=h(g);
  if(s>.9965){
    float pisca=.5+.5*sin(a*(1.+mod(floor(s*1e4),3.))+s*90.);
    col+=tom(s*7.)*pisca*1.4*peso*smoothstep(.3,.0,abs(rr-.48));
  }
  col*=smoothstep(.2,.42,rr);                      // centro escuro para o logo
  col=col/(1.+col*.55);                            // segura os brancos estourados
  gl_FragColor=vec4(col,1.);
}`;

/* Liga o shader num canvas. Devolve {desenhar(fase, celular)} ou null sem WebGL. */
window.fiosGL = function (tela, opcoes) {
  const gl = tela.getContext('webgl', Object.assign({ antialias: false, alpha: false, powerPreference: 'low-power' }, opcoes || {}));
  if (!gl) return null;
  const sh = (tipo, src) => { const o = gl.createShader(tipo); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const v = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
  const f = sh(gl.FRAGMENT_SHADER, window.FIOS_FS);
  if (!v || !f) return null;
  const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(pr, 'r'), uA = gl.getUniformLocation(pr, 'a'), uC = gl.getUniformLocation(pr, 'cel');
  return {
    desenhar(fase, celular) {
      gl.viewport(0, 0, tela.width, tela.height);
      gl.uniform2f(uR, tela.width, tela.height);
      gl.uniform1f(uA, fase); gl.uniform1f(uC, celular || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };
};
