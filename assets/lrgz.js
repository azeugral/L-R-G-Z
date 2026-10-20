(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero title: "revelação" interativa ---------- *
   * Troque a frase de impacto aqui — cada item do array vira uma linha.
   * A última linha recebe destaque (font-weight extra) automaticamente. */
  var HERO_LINES = (window.LRGZ_JS_LINES ? window.LRGZ_JS_LINES.hero[window.LRGZ_LANG || 'pt'] : ['PRESENÇA','DIGITAL','PREMIUM.']);

  (function initHeroTitle(){
    var wrap = document.getElementById('heroTitle');
    if(!wrap) return;
    var veil = document.getElementById('htxVeil');
    var clear = document.getElementById('htxClear');
    var red = document.getElementById('htxRed');
    var cyan = document.getElementById('htxCyan');

    var html = HERO_LINES.map(function(line, i){
      var isLast = i === HERO_LINES.length - 1;
      return '<span class="htx-line' + (isLast ? ' htx-strong' : '') + '">' + line + '</span>';
    }).join('');
    [veil, clear, red, cyan].forEach(function(el){ el.innerHTML = html; });

    if(reduceMotion) return; // fallback CSS já mostra o texto nítido e estático

    var hint = document.getElementById('heroHint');
    var targetX = 50, targetY = 42, curX = 50, curY = 42;
    var interacted = false;
    var lastMove = 0;
    var IDLE_MS = 1100;
    var t = 0;

    function markInteracted(){
      if(interacted) return;
      interacted = true;
      if(hint){ hint.classList.remove('is-visible'); hint.classList.add('is-hidden'); }
    }
    function setTarget(clientX, clientY){
      lastMove = performance.now();
      var r = wrap.getBoundingClientRect();
      targetX = ((clientX - r.left) / r.width) * 100;
      targetY = ((clientY - r.top) / r.height) * 100;
    }

    setTimeout(function(){ if(!interacted && hint){ hint.classList.add('is-visible'); } }, 1000);

    wrap.addEventListener('mousemove', function(e){
      markInteracted();
      setTarget(e.clientX, e.clientY);
    });
    wrap.addEventListener('touchmove', function(e){
      markInteracted();
      var touch = e.touches[0];
      if(touch) setTarget(touch.clientX, touch.clientY);
    }, { passive:true });

    (function loop(){
      var idle = (performance.now() - lastMove) > IDLE_MS;
      if(idle){
        t += 0.011;
        targetX = 50 + Math.sin(t) * 34;
        targetY = 42 + Math.cos(t * 0.7) * 22;
      }
      curX += (targetX - curX) * .09;
      curY += (targetY - curY) * .09;
      wrap.style.setProperty('--rx', curX.toFixed(2) + '%');
      wrap.style.setProperty('--ry', curY.toFixed(2) + '%');
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function(){
    if(window.scrollY > 40){ nav.classList.add('is-scrolled'); }
    else{ nav.classList.remove('is-scrolled'); }
  };
  document.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  /* ---------- Vídeos dos projetos: só carregam quando aparecem ----------
     Os <video> nascem com preload="none" e poster. O vídeo em si só é
     baixado quando o card entra na tela, e pausa quando sai. Se o
     usuário pediu menos animação no sistema, o vídeo não toca sozinho
     e ganha controles para tocar no clique. */
  (function(){
    var vids = Array.prototype.slice.call(document.querySelectorAll('[data-lazy-video]'));
    if(!vids.length) return;

    var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(quieto){
      vids.forEach(function(v){ v.setAttribute('controls',''); v.preload = 'metadata'; });
      return;
    }

    function carregar(v){
      if(v.preload === 'none'){ v.preload = 'auto'; v.load(); }
    }
    function ligar(v){
      carregar(v);
      var t = v.play();
      if(t && t.catch) t.catch(function(){});
    }

    if(!('IntersectionObserver' in window)){
      vids.forEach(ligar);
      return;
    }

    /* Carregar e tocar sao coisas separadas: o arquivo comeca a baixar
       300px antes do card aparecer (pra nao ter espera), mas o play so
       acontece com metade do video realmente na tela. Os mockups abrem
       parados no topo do site, e essa parada so faz sentido se a pessoa
       estiver olhando quando o video comeca. */
    var pre = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ carregar(e.target); pre.unobserve(e.target); }
      });
    }, { rootMargin: '300px 0px' });

    var vio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var v = e.target;
        if(e.isIntersecting){ ligar(v); }
        else if(!v.paused){ v.pause(); }
      });
    }, { threshold: 0.5 });

    vids.forEach(function(v){ pre.observe(v); vio.observe(v); });

    /* aba em segundo plano não precisa gastar bateria */
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ vids.forEach(function(v){ if(!v.paused) v.pause(); }); }
    });
  })();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open){
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function(){
    setMenu(!menu.classList.contains('is-open'));
  });
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ setMenu(false); });
  });
  /* Esc fecha o menu */
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.16, rootMargin:'0px 0px -8% 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  /* ---------- Custom cursor ---------- */
  var isFine = window.matchMedia('(pointer:fine)').matches;
  if(isFine){
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    var mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });
    (function loop(){
      rx += (mx - rx) * .16; ry += (my - ry) * .16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .tilt-card').forEach(function(el){
      el.addEventListener('mouseenter', function(){ ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function(){ ring.classList.remove('is-hover'); });
    });
  }

  /* ---------- Hero grid parallax + spotlight ---------- */
  var heroGrid = document.getElementById('heroGrid');
  var hero = document.getElementById('home');
  document.addEventListener('mousemove', function(e){
    if(reduceMotion || !hero) return;
    var r = hero.getBoundingClientRect();
    var mx = (e.clientX - r.left) / r.width;
    var my = (e.clientY - r.top) / r.height;
    document.documentElement.style.setProperty('--mx', mx.toFixed(3));
    document.documentElement.style.setProperty('--my', my.toFixed(3));
  });
  if(!reduceMotion && heroGrid){
    document.addEventListener('scroll', function(){
      heroGrid.style.setProperty('--sy', (window.scrollY * 0.12).toFixed(1));
    }, { passive:true });
  }

  /* ---------- About watermark parallax ---------- */
  var wm = document.getElementById('aboutWm');
  var aboutSection = document.getElementById('sobre');
  if(!reduceMotion && wm){
    document.addEventListener('scroll', function(){
      var r = aboutSection.getBoundingClientRect();
      var progress = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      var shift = (progress - .5) * 60;
      wm.style.transform = 'translate(-50%, calc(-50% + ' + shift.toFixed(1) + 'px))';
    }, { passive:true });
  }

  /* ---------- Case card tilt ---------- */
  if(isFine && !reduceMotion){
    document.querySelectorAll('.tilt-card').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        card.style.transform = 'perspective(900px) rotateX(' + (py * -6).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function(){
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  /* ---------- Terminal typing loop ---------- */
  var TERM_PT = ['$ lrgz --novo-projeto','> analisando identidade da marca...','> definindo paleta e tipografia...','> construindo estrutura responsiva...','> revisando cada detalhe...','✓ site publicado'];
  function termLines(){
    var src = (window.LRGZ_JS_LINES && window.LRGZ_JS_LINES.term[window.LRGZ_LANG]) || TERM_PT;
    return src.map(function(txt, ix, arr){ return { t:txt, cls: ix === arr.length - 1 ? 'ok' : '' }; });
  }
  var lines = termLines();
  var body = document.getElementById('terminalBody');

  /* termGen invalida a animação em curso quando o idioma muda, para não
     misturar linhas já digitadas em português com linhas novas em inglês */
  var termGen = 0;

  function typeLoop(){
    if(!body) return;
    var gen = ++termGen;
    body.innerHTML = '';
    var i = 0;
    function next(){
      if(gen !== termGen) return;
      if(i >= lines.length){
        setTimeout(function(){ if(gen === termGen) typeLoop(); }, 1400);
        return;
      }
      var row = document.createElement('div');
      row.className = 'terminal-line ' + lines[i].cls;
      body.appendChild(row);
      var text = lines[i].t, c = 0;
      var speed = reduceMotion ? 0 : 18;
      function typeChar(){
        if(gen !== termGen) return;
        row.textContent = text.slice(0, c);
        if(c < text.length){
          c++;
          if(speed){ setTimeout(typeChar, speed); } else { typeChar(); }
        } else {
          row.innerHTML = text + '<span class="cursor"></span>';
          i++;
          setTimeout(function(){
            if(gen !== termGen) return;
            row.innerHTML = text;
            next();
          }, reduceMotion ? 0 : 260);
        }
      }
      typeChar();
    }
    next();
  }
  typeLoop();

  /* ao trocar de idioma, o hero e o terminal são reconstruídos na fonte */
  document.addEventListener('lrgz:lang', function(){
    lines = termLines();
    typeLoop();
    var wrap = document.getElementById('heroTitle');
    if(wrap && window.LRGZ_JS_LINES){
      var HL = window.LRGZ_JS_LINES.hero[window.LRGZ_LANG] || window.LRGZ_JS_LINES.hero.pt;
      var h = HL.map(function(line, i){
        return '<span class="htx-line' + (i === HL.length - 1 ? ' htx-strong' : '') + '">' + line + '</span>';
      }).join('');
      ['htxVeil','htxClear','htxRed','htxCyan'].forEach(function(id){
        var el = document.getElementById(id); if(el) el.innerHTML = h;
      });
    }
  });

  /* ---------- Back to top ---------- */
  var toTop = document.getElementById('toTop');
  if(toTop) toTop.addEventListener('click', function(){
    window.scrollTo({ top:0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();
