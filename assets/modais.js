/* Modal de orçamento: junta os campos numa mensagem e abre o WhatsApp.
   Sem back-end — só monta o link wa.me. Se o JS não rodar, o botão
   continua sendo um link normal pro WhatsApp. */
(function(){
  var ZAP = '5519984428872';
  var modal = document.getElementById('orcModal');
  var abrirBtn = document.getElementById('abrirOrcamento');
  var form = document.getElementById('orcForm');
  if(!modal || !abrirBtn || !form) return;

  var ultimoFoco = null;
  var FOCAVEIS = 'a[href], button:not([disabled]), input, select, textarea';

  function abrir(e){
    if(e) e.preventDefault();
    ultimoFoco = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    var primeiro = form.querySelector('input, textarea, select');
    if(primeiro) setTimeout(function(){ primeiro.focus(); }, 60);
  }
  function fechar(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    if(ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  abrirBtn.addEventListener('click', abrir);
  modal.addEventListener('click', function(e){
    if(e.target.hasAttribute && e.target.hasAttribute('data-fechar')) fechar();
  });
  document.addEventListener('keydown', function(e){
    if(!modal.classList.contains('is-open')) return;
    if(e.key === 'Escape'){ fechar(); return; }
    if(e.key !== 'Tab') return;
    var itens = Array.prototype.slice.call(modal.querySelectorAll(FOCAVEIS))
      .filter(function(el){ return el.offsetParent !== null; });
    if(!itens.length) return;
    var primeiro = itens[0], ultimo = itens[itens.length - 1];
    if(e.shiftKey && document.activeElement === primeiro){ e.preventDefault(); ultimo.focus(); }
    else if(!e.shiftKey && document.activeElement === ultimo){ e.preventDefault(); primeiro.focus(); }
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var d = new FormData(form);
    function v(k){ return (d.get(k) || '').toString().trim(); }
    /* a mensagem sai no idioma em que a pessoa esta vendo o site */
    var en = (document.documentElement.lang || 'pt').slice(0, 2) === 'en';
    var T = en
      ? { ola:'Hi! I came from the L R G Z site.', nome:'Name: ',
          neg:'Business: ', reg:'Region: ', precisa:'The site needs to: ',
          tenho:'I already have: ', prazo:'Timing: ', oque:'More details:' }
      : { ola:'Oi! Vim pelo site do L R G Z.', nome:'Nome: ',
          neg:'Neg\u00f3cio: ', reg:'Regi\u00e3o: ', precisa:'O site precisa: ',
          tenho:'J\u00e1 tenho: ', prazo:'Pra quando: ', oque:'Mais detalhes:' };
    function marcados(k){
      return Array.prototype.map.call(form.querySelectorAll('input[name="' + k + '"]:checked'),
        function(i){ return i.nextElementSibling.textContent.trim(); }).join(', ');
    }
    var linhas = [T.ola, ''];
    if(v('nome'))    linhas.push(T.nome + v('nome'));
    if(v('negocio')) linhas.push(T.neg + v('negocio'));
    var selReg = form.querySelector('#orcRegiao');
    var regiao = selReg ? selReg.options[selReg.selectedIndex].textContent.trim() : '';
    if(regiao)       linhas.push(T.reg + regiao);
    var extra = ['precisa', 'tenho', 'prazo'].filter(function(k){ return marcados(k); });
    if(extra.length) linhas.push('');
    extra.forEach(function(k){ linhas.push(T[k] + marcados(k)); });
    if(v('oque'))    linhas.push('', T.oque, v('oque'));
    var url = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(linhas.join('\n'));
    window.open(url, '_blank', 'noopener');
    fechar();
  });
})();

/* "Testar aqui": abre o site do card na janela #demoModal. */
(function(){
  var modal = document.getElementById('demoModal');
  var frame = document.getElementById('demoFrame');
  var stage = document.getElementById('demoStage');
  if(!modal || !frame) return;
  var nome = document.getElementById('demoNome');
  var host = document.getElementById('demoHost');
  var abrirAba = document.getElementById('demoAbrir');
  var devs = modal.querySelectorAll('[data-dev]');
  var ultimoFoco = null, pausados = [];
  var FOCAVEIS = 'a[href], button:not([disabled])';

  function dispositivo(d){
    stage.classList.toggle('is-phone', d === 'cel');
    Array.prototype.forEach.call(devs, function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-dev') === d ? 'true' : 'false'); });
  }
  function abrir(btn){
    var url = btn.getAttribute('data-demo');
    var card = btn.closest('.case-card');
    var h3 = card && card.querySelector('h3');
    ultimoFoco = btn;
    nome.textContent = h3 ? h3.textContent : '';
    host.textContent = '· ' + url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    abrirAba.href = url;
    stage.classList.remove('is-ready');
    dispositivo('pc');
    frame.src = url;
    /* os mockups em video param enquanto a janela esta aberta */
    pausados = Array.prototype.filter.call(document.querySelectorAll('.site-video'), function(v){ return !v.paused; });
    pausados.forEach(function(v){ v.pause(); });
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open', 'demo-aberta');
    setTimeout(function(){ modal.querySelector('.demo-x').focus(); }, 60);
  }
  function fechar(){
    if(!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open', 'demo-aberta');
    frame.src = 'about:blank';
    pausados.forEach(function(v){ var p = v.play(); if(p && p.catch) p.catch(function(){}); });
    pausados = [];
    if(ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  frame.addEventListener('load', function(){
    if(frame.getAttribute('src') !== 'about:blank') stage.classList.add('is-ready');
  });
  Array.prototype.forEach.call(document.querySelectorAll('.case-try'), function(b){
    b.addEventListener('click', function(){ abrir(b); });
  });
  Array.prototype.forEach.call(devs, function(b){
    b.addEventListener('click', function(){ dispositivo(b.getAttribute('data-dev')); });
  });
  modal.addEventListener('click', function(e){
    if(e.target.hasAttribute && e.target.hasAttribute('data-fechar')) fechar();
  });
  document.addEventListener('keydown', function(e){
    if(!modal.classList.contains('is-open')) return;
    if(e.key === 'Escape'){ fechar(); return; }
    if(e.key !== 'Tab') return;
    var itens = Array.prototype.slice.call(modal.querySelectorAll(FOCAVEIS))
      .filter(function(el){ return el.offsetParent !== null; });
    if(!itens.length) return;
    var primeiro = itens[0], ultimo = itens[itens.length - 1];
    if(e.shiftKey && document.activeElement === primeiro){ e.preventDefault(); ultimo.focus(); }
    else if(!e.shiftKey && document.activeElement === ultimo){ e.preventDefault(); primeiro.focus(); }
  });
})();

/* Botao flutuante do WhatsApp: aparece depois do hero e some quando a
   secao de contato entra na tela (pra nao repetir o mesmo CTA duas vezes). */
(function(){
  var el = document.getElementById("waFloat");
  var hero = document.getElementById("home");
  var contato = document.getElementById("contato");
  if(!el) return;
  function medir(){
    var vh = window.innerHeight || document.documentElement.clientHeight || 800;
    /* no portfolio.html nao tem hero: aparece depois de rolar um pouco */
    var passouHero = hero ? hero.getBoundingClientRect().bottom <= 40 : window.scrollY > 300;
    var noContato = false;
    if(contato){
      var r = contato.getBoundingClientRect();
      noContato = r.top < vh * 0.75 && r.bottom > 0;
    }
    el.classList.toggle("is-on", passouHero && !noContato);
  }
  window.addEventListener("scroll", medir, { passive:true });
  window.addEventListener("resize", medir, { passive:true });
  medir();
})();
