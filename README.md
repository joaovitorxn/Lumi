<div align="center">

# Lumi

**Controle suas lâmpadas inteligentes direto da bandeja do Windows.**

Um clique no ícone, a luz muda. Sem pegar o celular.

![Windows](https://img.shields.io/badge/Windows-11-0078D4?logo=windows&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-núcleo-000000?logo=rust&logoColor=white)

<img src="docs/screenshots/light-warm.png" width="300" alt="Lumi controlando uma lâmpada em branco quente" />

</div>

## O que é

Lumi é um app de bandeja para Windows que controla dispositivos **Positivo Casa Inteligente** (Tuya) pela nuvem. O popup abre ao lado do relógio, mostra um aparelho por vez e sempre exibe o estado real da lâmpada.

## Recursos

- **Brilho, temperatura e cor** com sliders táteis. A cor da luz tinge a janela inteira.
- **A ilustração da lâmpada acompanha o brilho** e a cor escolhidos, com transições suaves.
- **Vários aparelhos**: troque entre eles pelas pílulas no topo; liga/desliga em um botão.
- **Estado sempre verdadeiro**: atualização automática a cada 10 s e indicação clara de sincronizado, atualizando ou erro.
- **Três idiomas**: Português, English e Español, inclusive no menu da bandeja.
- **Iniciar com o Windows** com um interruptor.
- **Credenciais seguras**: ficam no Gerenciador de Credenciais do Windows, nunca em arquivo.

## Capturas de tela

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/light-warm.png" width="240" /><br/><sub>Branco quente</sub></td>
    <td align="center"><img src="docs/screenshots/light-cool.png" width="240" /><br/><sub>Branco frio</sub></td>
    <td align="center"><img src="docs/screenshots/light-colour.png" width="240" /><br/><sub>Cor</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/light-off.png" width="240" /><br/><sub>Desligada</sub></td>
    <td align="center"><img src="docs/screenshots/settings.png" width="240" /><br/><sub>Configurações</sub></td>
    <td align="center"><img src="docs/screenshots/credentials.png" width="240" /><br/><sub>Credenciais Tuya</sub></td>
  </tr>
</table>

## Como funciona

O Lumi fala com a **API em nuvem da Tuya**. Não há protocolo local nem `local_key`.

1. Pareie os aparelhos no app **Smart Life** (o app da Positivo não permite vincular a conta a um projeto Tuya IoT).
2. Em [iot.tuya.com](https://iot.tuya.com), crie um projeto e vincule a conta do Smart Life (*Devices → Link App Account*).
3. Ative os serviços **IoT Core**, **Authorization Token Management** e **Smart Home Basic Service**.
4. Abra o Lumi e informe **Access ID**, **Access Secret** e a região do projeto.

## Desenvolvimento

Pré-requisitos: [Rust](https://rustup.rs), [Node.js](https://nodejs.org) e o WebView2 do Windows.

```bash
cd app
npm install
npm run tauri dev
```

Testes:

```bash
npm test                      # interface (Vitest)
cd src-tauri && cargo test    # núcleo Rust
```

Para gerar o instalador:

```bash
npm run tauri build
```

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `app/src` | Interface em SvelteKit + Svelte 5 |
| `app/src-tauri` | Núcleo em Rust: cliente Tuya, bandeja, credenciais |
| `docs` | Especificação, plano e capturas de tela |
| `spike` | Scripts Python usados para explorar a API Tuya |

## Aviso

Projeto independente, sem vínculo com a Positivo nem com a Tuya.
