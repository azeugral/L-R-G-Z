/* L R G Z Agenda: a demonstração (iframe) avisa a própria altura e pede para rolar até a próxima seção. */
(() => {
  const f = document.getElementById("ag-demo");
  if (!f) return;
  // o WhatsApp flutuante sai de cena enquanto a demonstração está na tela (não cobre os botões dela)
  const wa = document.getElementById("waFloat");
  if (wa && "IntersectionObserver" in window) new IntersectionObserver(([e]) => wa.classList.toggle("ag-oculto", e.isIntersecting), { rootMargin: "-20% 0px -20% 0px" }).observe(f);
  const suave = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  const topoLivre = () => { const n = document.querySelector(".nav"); return (n ? n.getBoundingClientRect().bottom : 0) + 14; };
  addEventListener("message", (e) => {
    if (e.source !== f.contentWindow || !e.data || !e.data.manequim) return;
    const d = e.data;
    if (d.altura) f.style.height = Math.max(480, Math.min(4000, d.altura)) + "px";
    if (d.rolar) {
      const base = f.getBoundingClientRect().top + scrollY, t = base + d.rolar.t, b = base + d.rolar.b;
      const cima = scrollY + topoLivre(), baixo = scrollY + innerHeight - 16;
      let y = null;
      if (d.rolar.modo === "fim") { if (b > baixo) y = b - innerHeight + 24; }
      else if (t < cima || b > baixo) y = t - topoLivre();
      if (y !== null) scrollTo({ top: Math.max(0, y), behavior: suave() });
    }
  });
})();
