# SMK · Formação Social Media da Koko · LP de vendas (perpétuo)

Landing page de vendas do SMK. É um site estático em HTML, CSS e JS puro, sem build e sem dependências.

## Estrutura

```
index.html           página inteira (todas as seções)
css/style.css        estilos (tokens de cor e fonte no topo)
js/config.js         links de checkout, WhatsApp e termo do FIES  ← editar aqui
js/main.js           motions e interações
assets/logo/         logo, ícone e assinatura (SVG de bolinhas vetorizado da ID)
assets/img/          imagens da ID visual (webp) e og.jpg
```

## Rodar localmente

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Configurar links

Edite `js/config.js`:

- `checkout.basico` / `checkout.premium`: URLs de checkout. Os parâmetros UTM da página (`utm_*`, `src`, `sck`, `fbclid`, `gclid`) são repassados automaticamente.
- `links.whatsapp`: botão "Ainda em dúvida? Fala comigo".
- `links.termoFies`: link "Ler o termo" do FIES Koko.

Enquanto um link estiver vazio, o botão rola até a seção de oferta e nada quebra.

## Teste A/B do hero

A revisão de copy traz duas versões da primeira dobra:

- **Versão A (mercado)**: padrão, `https://.../`
- **Versão B (entrega)**: `https://.../?v=b`

O resto da página é igual nas duas.

## Identidade visual

- Cores: verde `#B4F35E`, roxo `#B04BE8`, creme `#F4F1E8`, preto `#1B1B1B`
- Fontes: **Array** (Fontshare, gratuita) para títulos em bolinhas, **Inter** para texto, **Archivo** condensada no lugar da Acumin (Adobe Fonts)
- Motions: boot do ícone na tela CRT com piscada, campo de bolinhas que reage ao cursor no hero, ticker de números, reveal no scroll, "decodificação" das palavras na seção da categoria e contadores. Tudo respeita `prefers-reduced-motion`.

## Pendências

- [ ] Remover `<meta name="robots" content="noindex, nofollow">` do `index.html` antes de publicar no domínio final

- [ ] Links de checkout, WhatsApp e termo do FIES (`js/config.js`)
- [ ] Pixel / GTM / tracking
- [ ] Selo oficial de extensão ("SELO PADRÃO - EXTENSÃO.png", da Usina Educação) no lugar do selo provisório da seção de certificação
- [ ] Foto do Hector na seção "Quem ensina" (hoje está a imagem do computador com stickers)
- [ ] Mockups das telas da plataforma no bloco "O Programa" (pedido da Jéssica)
- [ ] Confirmar autorização de uso de nome e depoimento dos alunos (Marina Silenciato, Paula Castro, Mariana Cardoso, Rodrigo Buson)
- [ ] Parcelamento do Premium (R$ 1.997) em 12x: valor da parcela
