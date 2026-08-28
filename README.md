# L R G Z — lrgz.com.br

Site do estúdio, hospedado no GitHub Pages com domínio próprio.

## Como publicar

Todo o conteúdo desta pasta vai na **raiz** do repositório — não dentro de
subpasta. Os caminhos dos ícones começam com `/`, então eles precisam estar
na raiz para funcionar.

```bash
git add .
git commit -m "Novo favicon, logo e carregamento sob demanda dos vídeos"
git push
```

Em Settings → Pages, o branch publicado precisa ser o mesmo do push e a pasta
deve ser `/ (root)`. O arquivo `CNAME` já aponta para `lrgz.com.br` — não
apague, senão o domínio se desfaz a cada deploy.

## O que é cada arquivo

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página principal |
| `planos.html` | Página de vendas do curso |
| `CNAME` | Domínio do GitHub Pages (`lrgz.com.br`) |
| `favicon.ico` | Ícone principal — contém 16, 32 e 48px dentro |
| `favicon-96.png`, `favicon-192.png`, `favicon-512.png` | Ícones para o Google e para o navegador |
| `apple-touch-icon.png` | Ícone ao salvar na tela de início do iPhone |
| `site.webmanifest` | Metadados do site como app |
| `og.png` | Imagem que aparece ao compartilhar o link |
| `logo-lrgz.png` | Wordmark branco usado no topo e no rodapé |
| `logo-lrgz-completo.png` | Marca completa com a bússola (uso avulso) |
| `robots.txt`, `sitemap.xml` | Permitem e orientam o rastreamento do Google |
| `posters/poster-N.jpg` | Primeiro quadro de cada vídeo dos projetos |
| `*.mp4` | Vídeos dos 6 projetos do portfólio |

## Como trocar um vídeo do portfólio

1. Coloque o novo `.mp4` na raiz.
2. Em `index.html`, troque o nome dentro do `<source src="...">` do card.
3. Gere o novo poster e substitua o `posters/poster-N.jpg` correspondente:

```bash
ffmpeg -ss 0.5 -i "seu-video.mp4" -frames:v 1 -vf "scale=960:-2" -q:v 6 posters/poster-N.jpg
```

## Carregamento dos vídeos

Os vídeos não carregam junto com a página. Cada um nasce com
`preload="none"` e um `poster`; o arquivo só é baixado quando o card chega
perto da tela, e pausa quando sai. Quem tem "reduzir movimento" ativado no
sistema vê o poster com controles, em vez de autoplay.

Isso derruba o carregamento inicial de ~43 MB para ~170 KB de posters.

## Favicon no Google

O Google exige um arquivo real, quadrado e múltiplo de 48px — o ícone antigo
era um `data:` embutido no HTML, que ele nunca indexa. Depois do deploy, a
atualização não é imediata: costuma levar de dias a algumas semanas. Para
apressar, use a Inspeção de URL no Google Search Console e peça a indexação
da home.
