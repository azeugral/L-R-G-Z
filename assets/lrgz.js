/* L R G Z: menu, video sob demanda, hero e vitrine de projetos.
   Nada aqui reage a rolagem: tudo anima por tempo ou por toque, so com
   transform e opacity, pra manter o mesmo ritmo em celular fraco. */
(function(){
  document.documentElement.classList.add('js');
  var mm = function(q){ return window.matchMedia ? window.matchMedia(q) : { matches:false }; };
  var economia = !!(navigator.connection && navigator.connection.saveData);
  var quieto = mm('(prefers-reduced-motion: reduce)').matches || economia;
  var toque = mm('(hover: none), (pointer: coarse)').matches;
  var vit = document.getElementById('vitrine');
  var vitrineLigada = !!vit && !quieto && mm('(min-width:1000px)').matches;
  function capa(v){ if(v.dataset.poster){ v.poster = v.dataset.poster; delete v.dataset.poster; } }

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
    /* no computador, quem toca os destaques e a vitrine */
    if(vitrineLigada) vids = vids.filter(function(v){ return !vit.contains(v); });
    if(!vids.length) return;
    if(quieto){
      vids.forEach(function(v){ capa(v); v.preload = 'metadata'; });
      return;
    }
    function carregar(v){ capa(v); if(v.preload === 'none'){ v.preload = 'auto'; v.load(); } }
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

  /* ---------- Hero: a logo ---------- */
  var hero = document.getElementById('home');
  var palco = document.getElementById('sigilo');
  if(hero && palco){
    var canvas = document.getElementById('sigiloCanvas');
    var vForma = document.getElementById('sigiloForma');
    var vLaco = document.getElementById('sigiloLaco');
    /* mesmo corte do CSS: tela larga mostra a logo inteira; o resto, o miolo em quadrado */
    var largo = mm('(min-width:1000px) and (min-height:601px)').matches;
    var visivel = true, ctl = null;

    var usaVideo = function(){
      var pasta = 'assets/marca/sigilo-' + (largo ? 'largo' : 'quadro') + '-';
      vForma.src = pasta + 'forma.mp4?v=4';
      vLaco.src = pasta + 'laco.mp4?v=4';
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
      /* conexao lenta ou economia de energia: a logo pronta entra no lugar e,
         se o laco chegar depois, ele assume sem salto (comeca no mesmo quadro) */
      setTimeout(function(){
        if(vForma.currentTime > 0 || !vLaco.paused) return;
        palco.classList.add('so-poster');
        vForma.pause(); vForma.removeAttribute('src');
        vLaco.addEventListener('playing', function(){
          vLaco.classList.add('on'); vForma.classList.remove('on'); palco.classList.remove('so-poster');
        }, { once:true });
        pede(vLaco);
      }, 1600);
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(en){
          if(!vForma.ended && palco.classList.contains('so-poster') === false && !vLaco.classList.contains('on')) return;
          if(en[0].isIntersecting) pede(vLaco);
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
          /* nunca abaixo de 1,5x: reduzir o canvas no navegador tira o serrilhado */
          var d = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2);
          var w = Math.round(palco.offsetWidth * d), h = Math.round(palco.offsetHeight * d);
          if(canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
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
    else if(toque || !largo) usaVideo();
    else usaShader();

    /* o logo do menu e o WhatsApp so aparecem depois do hero */
    document.body.classList.add('no-hero');
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){
        if(palco.classList.contains('modo-shader')) visivel = en[0].isIntersecting;
        document.body.classList.toggle('no-hero', en[0].intersectionRatio > .4);
      }, { threshold:[0,.4,.41] }).observe(hero);
    } else document.body.classList.remove('no-hero');
  }

  /* ---------- Vitrine: um projeto por vez, com a lista ao lado ---------- */
  if(vit){
    var cards = Array.prototype.slice.call(vit.querySelectorAll('.case-card'));
    var lista = document.createElement('ol');
    lista.className = 'vitrine-lista';
    var atual = 0;
    var videos = function(c){ return Array.prototype.slice.call(c.querySelectorAll('video')); };
    var toca = function(v){ capa(v); if(v.preload === 'none'){ v.preload = 'auto'; v.load(); } var t = v.play(); if(t && t.catch) t.catch(function(){}); };
    var mostra = function(i){
      atual = i;
      cards.forEach(function(c, k){
        var on = k === i;
        c.classList.toggle('ativo', on);
        btns[k].classList.toggle('ativo', on);
        btns[k].setAttribute('aria-pressed', on ? 'true' : 'false');
        if(!vitrineLigada) return;
        videos(c).forEach(function(v){
          if(on){ try{ v.currentTime = 0; }catch(e){} toca(v); }
          else if(!v.paused) v.pause();
        });
      });
      /* a capa do proximo ja chega antes dele */
      if(vitrineLigada) videos(cards[(i + 1) % cards.length]).forEach(capa);
    };
    var btns = cards.map(function(c, i){
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span></span><i></i>';
      b.firstChild.textContent = c.querySelector('h3').textContent;
      b.addEventListener('click', function(){ mostra(i); });
      li.appendChild(b); lista.appendChild(li);
      return b;
    });
    vit.appendChild(lista);
    if(vitrineLigada){
      lista.addEventListener('animationend', function(e){
        if(e.target.parentNode === btns[atual]) mostra((atual + 1) % cards.length);
      });
      new IntersectionObserver(function(en){
        var dentro = en[0].isIntersecting;
        vit.classList.toggle('fora', !dentro);
        videos(cards[atual]).forEach(function(v){ if(dentro) toca(v); else if(!v.paused) v.pause(); });
      }, { threshold:.35 }).observe(vit);
    }
    mostra(0);
  }

  /* ---------- Raios: a luz so corre com o raio na tela ---------- */
  if(!quieto && 'IntersectionObserver' in window){
    var raios = new IntersectionObserver(function(en){
      en.forEach(function(e){ e.target.classList.toggle('vivo', e.isIntersecting); });
    }, { rootMargin:'40px' });
    document.querySelectorAll('.raio').forEach(function(r){ raios.observe(r); });
  }

  /* ---------- Voltar ao topo ---------- */
  var toTop = document.getElementById('toTop');
  if(toTop) toTop.addEventListener('click', function(){
    window.scrollTo({ top:0, behavior: quieto ? 'auto' : 'smooth' });
  });
})();
