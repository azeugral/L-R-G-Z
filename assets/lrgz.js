/* L R G Z: menu, video sob demanda, revelacoes e rolagem do hero.
   Tudo que anima na rolagem usa so transform e opacity, pra manter o
   mesmo ritmo em celular fraco. */
(function(){
  document.documentElement.classList.add('js');
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toque = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- Nav ---------- */
  var nav = document.getElementById('nav');
  function navScroll(){ if(nav) nav.classList.toggle('is-scrolled', window.scrollY > 24); }
  document.addEventListener('scroll', navScroll, { passive:true });
  navScroll();

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  if(burger && menu){
    var setMenu = function(open){
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', function(){ setMenu(!menu.classList.contains('is-open')); });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------- Videos ---------- */
  (function(){
    var vids = Array.prototype.slice.call(document.querySelectorAll('[data-lazy-video]'));
    if(!vids.length) return;
    if(quieto){
      vids.forEach(function(v){ v.preload = 'metadata'; });
      return;
    }
    function carregar(v){ if(v.preload === 'none'){ v.preload = 'auto'; v.load(); } }
    function ligar(v){ carregar(v); var t = v.play(); if(t && t.catch) t.catch(function(){}); }
    if(!('IntersectionObserver' in window)){ vids.forEach(ligar); return; }
    /* baixar comeca antes de aparecer; tocar, so com metade na tela */
    var pre = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ carregar(e.target); pre.unobserve(e.target); } });
    }, { rootMargin:'320px 320px' });
    var vio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting) ligar(e.target);
        else if(!e.target.paused) e.target.pause();
      });
    }, { threshold:.5 });
    vids.forEach(function(v){ pre.observe(v); vio.observe(v); });
    document.addEventListener('visibilitychange', function(){
      if(document.hidden) vids.forEach(function(v){ if(!v.paused) v.pause(); });
    });
  })();

  /* ---------- Revelacao ---------- */
  var reveals = document.querySelectorAll('.reveal, .raio, .parede');
  if('IntersectionObserver' in window && !quieto){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin:'0px 0px -8% 0px', threshold:.08 });
    reveals.forEach(function(el){ io.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('is-in'); });
  }

  /* ---------- Hero: o sigilo ---------- */
  var hero = document.getElementById('home');
  var palco = document.getElementById('sigilo');
  if(hero && palco){
    var canvas = document.getElementById('sigiloCanvas');
    var vForma = document.getElementById('sigiloForma');
    var vLaco = document.getElementById('sigiloLaco');
    var poster = document.getElementById('sigiloPoster');
    var visivel = true, ctl = null;

    var usaVideo = function(){
      palco.classList.add('modo-video');
      var pede = function(v){ var t = v.play(); return t && t.catch ? t : Promise.resolve(); };
      vLaco.load();
      vForma.load();
      vForma.addEventListener('ended', function(){
        pede(vLaco);
        vLaco.classList.add('on');
        vForma.classList.remove('on');
      });
      vForma.classList.add('on');
      pede(vForma).catch(function(){ palco.classList.add('so-poster'); });
      /* modo economia de energia do iPhone recusa o autoplay em silencio */
      setTimeout(function(){
        if(vForma.currentTime === 0 && vLaco.paused) palco.classList.add('so-poster');
      }, 1600);
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(en){
          if(!vForma.ended && !vForma.paused) return;
          if(en[0].isIntersecting){ if(vForma.ended) pede(vLaco); }
          else vLaco.pause();
        }).observe(hero);
      }
    };

    var usaShader = function(){
      var ok = window.LRGZ_cromo && LRGZ_cromo(canvas, 'assets/marca/', function(c){
        ctl = c;
        palco.classList.add('modo-shader');
        var inicio = performance.now(), quadros = 0, lento = 0, ant = inicio;
        var medir = function(){
          var d = Math.min(window.devicePixelRatio || 1, 2);
          var lado = Math.round(Math.min(palco.offsetWidth, palco.offsetHeight) * d);
          if(canvas.width !== lado){ canvas.width = canvas.height = lado; }
        };
        medir();
        window.addEventListener('resize', medir);
        (function quadro(agora){
          requestAnimationFrame(quadro);
          if(!visivel || document.hidden){ ant = agora; return; }
          var dt = agora - ant; ant = agora;
          if(quadros < 60 && dt > 42) lento++;
          quadros++;
          if(quadros === 60 && lento > 30){ canvas.style.display = 'none'; palco.classList.remove('modo-shader'); usaVideo(); visivel = false; return; }
          ctl.desenhar((agora - inicio) / 1000);
        })(inicio);
      });
      if(!ok) usaVideo();
    };

    if(quieto){ palco.classList.add('so-poster'); }
    else if(toque || window.innerWidth < 900) usaVideo();
    else usaShader();

    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){ if(palco.classList.contains('modo-shader')) visivel = en[0].isIntersecting; }).observe(hero);
    }

    /* rolagem: o sigilo encolhe ate o lugar do logo e vira ele */
    var txt = document.getElementById('heroTxt');
    var logo = document.querySelector('.nav-logo img');
    var cena = palco.parentNode;
    var pedido = false, alvo = null;
    var medirAlvo = function(){
      if(!logo) return;
      var c = cena.getBoundingClientRect(), r = logo.getBoundingClientRect();
      alvo = {
        x: r.left + r.width / 2 - (c.left + c.width / 2),
        y: r.top + r.height / 2 - (c.top + c.height / 2),
        k: r.width / (Math.min(palco.offsetWidth, palco.offsetHeight) * .972)
      };
    };
    var rolar = function(){
      pedido = false;
      var alt = hero.offsetHeight - window.innerHeight;
      var p = alt > 0 ? Math.min(1, Math.max(0, window.scrollY / alt)) : 0;
      var f = Math.min(1, p / .92);
      var e = f * f * (3 - 2 * f);
      document.body.classList.toggle('no-hero', f < 1);
      if(alvo){
        palco.style.transform = 'translate3d(' + (alvo.x * e).toFixed(1) + 'px,' + (alvo.y * e).toFixed(1) + 'px,0) scale(' + Math.pow(alvo.k, e).toFixed(4) + ')';
      }
      palco.style.opacity = f < 1 ? '1' : '0';
      if(txt){
        txt.style.transform = 'translate3d(0,' + (Math.min(1, p * 2.4) * 26).toFixed(1) + 'px,0)';
        txt.style.opacity = Math.max(0, 1 - p * 2.4).toFixed(3);
      }
    };
    document.body.classList.add('no-hero');
    if(quieto) document.body.classList.remove('no-hero');
    if(!quieto){
      document.addEventListener('scroll', function(){
        if(!pedido){ pedido = true; requestAnimationFrame(rolar); }
      }, { passive:true });
      var refazer = function(){ var y = palco.style.transform; palco.style.transform = 'none'; medirAlvo(); palco.style.transform = y; rolar(); };
      window.addEventListener('resize', refazer);
      window.addEventListener('load', refazer);
      refazer();
    }
  }

  /* ---------- Parede: entra do centro para fora, como o sigilo ---------- */
  var parede = document.getElementById('parede-grade');
  if(parede){
    var ladrilhos = parede.children, caixa = parede.getBoundingClientRect(), maior = .01;
    var dist = Array.prototype.map.call(ladrilhos, function(a){
      var r = a.getBoundingClientRect();
      var d = Math.hypot((r.left + r.width / 2 - caixa.left - caixa.width / 2) / caixa.width, (r.top + r.height / 2 - caixa.top - caixa.height / 2) / caixa.height);
      maior = Math.max(maior, d);
      return d;
    });
    Array.prototype.forEach.call(ladrilhos, function(a, i){ a.style.setProperty('--d', (dist[i] / maior * .8).toFixed(2) + 's'); });
  }

  /* ---------- Projetos: o card coberto recua e para o video ---------- */
  var pilha = document.querySelector('.trilho');
  var empilha = window.matchMedia && window.matchMedia('(min-width:1000px) and (min-height:640px)');
  if(pilha && empilha && !quieto){
    var cards = Array.prototype.slice.call(pilha.querySelectorAll('.case-card'));
    var ticket = false;
    var empilhar = function(){
      ticket = false;
      var liga = empilha.matches, topo = nav ? nav.offsetHeight : 76, altura = window.innerHeight - topo;
      cards.forEach(function(c, i){
        var prox = cards[i + 1], cobre = 0;
        if(liga && prox) cobre = Math.min(1, Math.max(0, 1 - (prox.getBoundingClientRect().top - topo) / altura));
        var escala = 1 - cobre * .05;
        var op = (1 - cobre * .75).toFixed(3);
        Array.prototype.forEach.call(c.children, function(f){
          f.style.transform = liga && cobre ? 'scale(' + escala.toFixed(4) + ')' : '';
          f.style.opacity = liga && cobre ? op : '';
        });
        var v = c.querySelector('video');
        if(v && liga){
          if(cobre > .98 && !v.paused) v.pause();
          else if(cobre <= .98 && v.paused && v.readyState > 1 && c.getBoundingClientRect().top < window.innerHeight * .6){ var t = v.play(); if(t && t.catch) t.catch(function(){}); }
        }
      });
    };
    var pedeE = function(){ if(!ticket){ ticket = true; requestAnimationFrame(empilhar); } };
    document.addEventListener('scroll', pedeE, { passive:true });
    window.addEventListener('resize', pedeE);
    empilhar();
  }

  /* ---------- Processo: a estrela anda pelas etapas ---------- */
  var plista = document.getElementById('processo-lista');
  if(plista && !quieto){
    var trilha = plista.querySelector('.process-trilha'), passo = false;
    var andar = function(){
      passo = false;
      if(!trilha.offsetWidth) return;
      var r = plista.getBoundingClientRect(), vh = window.innerHeight;
      var q = Math.min(1, Math.max(0, (vh * .86 - r.top) / (vh * .5)));
      trilha.style.setProperty('--p', q.toFixed(3));
      trilha.style.setProperty('--x', (q * trilha.offsetWidth).toFixed(1) + 'px');
    };
    document.addEventListener('scroll', function(){ if(!passo){ passo = true; requestAnimationFrame(andar); } }, { passive:true });
    window.addEventListener('resize', andar);
    andar();
  }

  /* ---------- Voltar ao topo ---------- */
  var toTop = document.getElementById('toTop');
  if(toTop) toTop.addEventListener('click', function(){
    window.scrollTo({ top:0, behavior: quieto ? 'auto' : 'smooth' });
  });
})();
