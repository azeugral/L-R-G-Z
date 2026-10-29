/* Fernanda Mello Beauty · fios de luz, menu, rolagem suave, revelar ao rolar, filtros, foto ampliada e agendamento pelo WhatsApp */
(() => {
  const doc = document.documentElement;
  const ZAP = "5511916777797";
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // entrada do hero quando o logo carregar (ou em 1 s, o que vier antes)
  const logo = document.querySelector(".hero__logo");
  const pronto = () => doc.classList.add("pronto");
  if (logo && !logo.complete) {
    logo.addEventListener("load", pronto, { once: true });
    setTimeout(pronto, 1000);
  } else requestAnimationFrame(() => requestAnimationFrame(pronto));

  // fios de luz: shader ao vivo no desktop, MP4 no celular; só anima com a seção na tela
  // a largura pode mudar com a página aberta (girar o tablet, redimensionar a janela): cada modo confere na hora
  const telaGrande = matchMedia("(min-width: 901px)");
  const fios = (secao, tela, video, { escala = .8, ciclo = 26000, fps = 60, atraso = 300 } = {}) => {
    if (!secao) return;
    let visivel = false;
    const f = tela && window.fiosGL ? window.fiosGL(tela) : null;
    if (f) {
      let ultimo = 0;
      const t0 = performance.now(), passo = 1000 / fps - 2;
      const medir = () => {
        if (!telaGrande.matches) return;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        tela.width = Math.round(tela.clientWidth * dpr * escala);
        tela.height = Math.round(tela.clientHeight * dpr * escala);
        if (reduz) f.desenhar(1, 0);
      };
      medir();
      addEventListener("resize", medir);
      const laco = agora => {
        if (!reduz && visivel && telaGrande.matches && !document.hidden && agora - ultimo >= passo) {
          ultimo = agora;
          f.desenhar(((agora - t0) % ciclo) / ciclo * Math.PI * 2, 0);
        }
        requestAnimationFrame(laco);
      };
      requestAnimationFrame(laco);
    }
    // o vídeo do celular só baixa quando a seção chega perto e pausa fora da tela
    let carregado = false;
    const atualizar = () => {
      if (f && telaGrande.matches && visivel && !tela.classList.contains("liga")) setTimeout(() => tela.classList.add("liga"), atraso);
      if (!video) return;
      const usar = !telaGrande.matches && visivel;
      if (usar && !carregado) {
        carregado = true;
        if (reduz) { video.classList.add("liga"); return; }
        video.src = video.dataset.src;
        video.addEventListener("loadeddata", () => video.classList.add("liga"), { once: true });
        video.load();
      }
      if (reduz || !carregado) return;
      if (usar) video.play().catch(() => video.classList.add("liga"));
      else video.pause();
    };
    new IntersectionObserver(es => { visivel = es[0].isIntersecting; atualizar(); }, { rootMargin: "200px 0px" }).observe(secao);
    telaGrande.addEventListener("change", () => { dispatchEvent(new Event("resize")); atualizar(); });
  };
  fios(document.querySelector(".hero"), document.getElementById("fios"), document.getElementById("fios-video"));
  fios(document.getElementById("agendar"), document.getElementById("fios-agendar"), null, { escala: .5, ciclo: 34000, fps: 30, atraso: 0 });

  // topo sólido ao rolar; botão do WhatsApp aparece depois do hero
  const topo = document.querySelector(".topo");
  const zap = document.querySelector(".zap");
  const temHero = !!document.querySelector(".hero");
  const aoRolar = () => {
    const y = scrollY;
    topo.classList.toggle("solido", y > 40 || !temHero);
    if (zap) zap.classList.toggle("mostra", y > innerHeight * .7);
  };
  aoRolar();
  addEventListener("scroll", aoRolar, { passive: true });

  // menu do celular
  const abre = document.querySelector(".abre-menu");
  const fecharMenu = () => {
    doc.classList.remove("menu-aberto");
    document.body.classList.remove("travado");
    abre && abre.setAttribute("aria-expanded", "false");
  };
  abre && abre.addEventListener("click", () => {
    const aberto = doc.classList.toggle("menu-aberto");
    document.body.classList.toggle("travado", aberto);
    abre.setAttribute("aria-expanded", String(aberto));
  });
  addEventListener("keydown", e => { if (e.key === "Escape") fecharMenu(); });
  matchMedia("(min-width: 901px)").addEventListener("change", e => e.matches && fecharMenu());

  // links internos rolam suave até o destino; toque, roda ou tecla interrompem
  let rolagem = 0;
  const parar = () => cancelAnimationFrame(rolagem);
  ["wheel", "touchstart", "keydown"].forEach(ev => addEventListener(ev, parar, { passive: true }));
  const rolarAte = destino => {
    parar();
    const inicio = scrollY, dist = destino - inicio;
    if (reduz || Math.abs(dist) < 2) { scrollTo(0, destino); return; }
    const dur = Math.min(1300, Math.max(550, Math.abs(dist) * .35)), t0 = performance.now();
    const curva = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const passo = agora => {
      const t = Math.min((agora - t0) / dur, 1);
      scrollTo(0, inicio + dist * curva(t));
      if (t < 1) rolagem = requestAnimationFrame(passo);
    };
    rolagem = requestAnimationFrame(passo);
  };
  const form = document.getElementById("form-agendar");
  document.querySelectorAll('a[href*="#"]').forEach(a => a.addEventListener("click", e => {
    const url = new URL(a.href, location.href);
    const mesma = url.pathname.replace(/index\.html$/, "") === location.pathname.replace(/index\.html$/, "");
    const alvo = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    fecharMenu();
    if (!mesma || !alvo || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    // "Agendar este estilo" já deixa o serviço escolhido no formulário
    if (a.dataset.estilo && form) { form.servico.value = a.dataset.estilo; form.servico.dispatchEvent(new Event("change")); }
    const folga = parseFloat(getComputedStyle(doc).scrollPaddingTop) || 0;
    rolarAte(alvo.id === "inicio" ? 0 : Math.max(0, alvo.getBoundingClientRect().top + scrollY - folga));
    history.pushState(null, "", alvo.id === "inicio" ? url.pathname : url.hash);
  }));

  // revelar ao rolar
  const revelaveis = document.querySelectorAll(".revela");
  if ("IntersectionObserver" in window && !reduz) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    revelaveis.forEach(el => io.observe(el));
  } else revelaveis.forEach(el => el.classList.add("visto"));

  // estilos no celular: pontos que acompanham o carrossel
  const trilho = document.querySelector(".estilos");
  const pontos = document.querySelector(".estilos__pontos");
  if (trilho && pontos) {
    const cartoes = [...trilho.children];
    pontos.innerHTML = cartoes.map(() => "<i></i>").join("");
    const marcas = [...pontos.children];
    const marcar = () => {
      const meio = trilho.scrollLeft + trilho.clientWidth / 2;
      let atual = 0;
      cartoes.forEach((c, i) => { if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - meio) < Math.abs(cartoes[atual].offsetLeft + cartoes[atual].offsetWidth / 2 - meio)) atual = i; });
      marcas.forEach((m, i) => m.classList.toggle("on", i === atual));
    };
    trilho.addEventListener("scroll", () => requestAnimationFrame(marcar), { passive: true });
    marcar();
  }

  // filtros da página de trabalhos
  const filtros = document.querySelectorAll(".filtros button");
  const trabs = [...document.querySelectorAll(".trab")];
  filtros.forEach(b => b.addEventListener("click", () => {
    filtros.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    const cat = b.dataset.cat;
    trabs.forEach(t => { t.hidden = cat !== "todos" && t.dataset.cat !== cat; t.classList.add("visto"); });
  }));

  // foto ampliada (navega só entre as fotos visíveis)
  const caixa = document.getElementById("foto-grande");
  if (caixa && trabs.length) {
    const img = caixa.querySelector("img"), leg = caixa.querySelector("figcaption");
    let atual = 0, origem = null;
    const visiveis = () => trabs.filter(t => !t.hidden);
    const mostrar = i => {
      const lista = visiveis();
      atual = (i + lista.length) % lista.length;
      const t = lista[atual], f = t.querySelector("img");
      img.src = f.currentSrc.replace("-640.webp", "-1080.webp");
      img.alt = f.alt;
      leg.textContent = t.querySelector("figcaption").firstChild.textContent;
    };
    const fechar = () => { caixa.hidden = true; document.body.classList.remove("travado"); origem && origem.focus(); };
    trabs.forEach(t => t.querySelector(".trab__abre").addEventListener("click", e => {
      origem = e.currentTarget;
      mostrar(visiveis().indexOf(t));
      caixa.hidden = false;
      document.body.classList.add("travado");
      caixa.querySelector(".foto-grande__fecha").focus();
    }));
    caixa.querySelector(".foto-grande__fecha").addEventListener("click", fechar);
    caixa.querySelector(".foto-grande__seta--ant").addEventListener("click", () => mostrar(atual - 1));
    caixa.querySelector(".foto-grande__seta--prox").addEventListener("click", () => mostrar(atual + 1));
    caixa.addEventListener("click", e => { if (e.target === caixa) fechar(); });
    addEventListener("keydown", e => {
      if (caixa.hidden) return;
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowLeft") mostrar(atual - 1);
      if (e.key === "ArrowRight") mostrar(atual + 1);
    });
    let x0 = null;
    caixa.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    caixa.addEventListener("touchend", e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  // agendamento: monta a mensagem e abre o WhatsApp
  if (form) {
    const erro = document.getElementById("form-erro");
    const tipo = document.getElementById("tipo");
    const ajustarTipo = () => {
      const s = form.servico.value;
      tipo.hidden = !s || /sobrancelha|henna|não sei/i.test(s);
    };
    form.servico.addEventListener("change", ajustarTipo);
    form.addEventListener("submit", e => {
      e.preventDefault();
      const nome = form.nome.value.trim(), servico = form.servico.value;
      erro.hidden = !!(nome && servico);
      if (!nome || !servico) { (nome ? form.servico : form.nome).focus(); return; }
      const linhas = [`Olá, Fernanda! Sou ${nome} e quero agendar pelo site.`, "", `Serviço: ${servico}`];
      if (!tipo.hidden) linhas.push(`Tipo: ${form.tipo.value}`);
      if (form.dia.value.trim()) linhas.push(`Dia de preferência: ${form.dia.value.trim()}`);
      linhas.push(`Período: ${form.periodo.value}`);
      if (form.obs.value.trim()) linhas.push(`Observação: ${form.obs.value.trim()}`);
      window.open(`https://wa.me/${ZAP}?text=${encodeURIComponent(linhas.join("\n"))}`, "_blank", "noopener");
    });
  }
})();
