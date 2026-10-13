# Positivo Tray: design da v1

Data: 2026-10-12

## Objetivo

Controlar dispositivos de casa inteligente (começando pela lâmpada) a partir de um app de Windows que fica na bandeja do sistema. Ao clicar no ícone, abre uma janela pequena com um card visual por dispositivo.

Quem usa: o próprio dono dos dispositivos, em um único PC. Sucesso na v1: abrir a janela pela bandeja, ver a lâmpada com a cor e o brilho reais, ligar/desligar e ajustar brilho, temperatura e cor.

## Contexto e descobertas do spike

- Os dispositivos Positivo Casa Inteligente rodam sobre a nuvem Tuya. O app Positivo é uma versão de marca própria (white-label): não permite vincular a conta a um projeto Tuya IoT (não há leitor de QR code compatível).
- Contornamos isso migrando o dispositivo para o app **Smart Life** (também Tuya). A conta Smart Life foi vinculada a um projeto em iot.tuya.com (serviços ativos: IoT Core, Authorization Token Management, Smart Home Basic Service, Device Status Notification).
- Validado com a lâmpada `Smart Lâmpada Wi-Fi V4` (categoria `dj`): a API `/v1.0/iot-01/associated-users/devices` lista o dispositivo e comandos `switch_led` pela nuvem funcionam.
- Varredura da LAN não encontrou RTSP/ONVIF (portas 554/8554/8000) em nenhum host. Vídeo da câmera 360 Bot, se possível, virá pela nuvem Tuya.
- Os scripts do spike ficam em `spike/` e são descartáveis. Segredos ficam em `spike/.env` e `spike/devices.json`, ambos no `.gitignore`.

## Escopo da v1

Dentro:
- Ícone de bandeja com janela popup.
- Listar dispositivos da conta Tuya vinculada.
- Card da lâmpada (categoria `dj`): estado, brilho, temperatura, cor, liga/desliga.
- Tela de configuração de credenciais na primeira execução.

Fora (versões futuras):
- Câmera (vídeo ao vivo e PTZ). Depende de migrar a câmera para o Smart Life e de confirmar se a API entrega o stream.
- Controle local por LAN (protocolo local Tuya e `local_key`).
- Planta da casa e outros tipos de dispositivo.

## Stack

Tauri: núcleo em Rust, interface em TypeScript com Svelte e Vite. Rust, Cargo e Node já estão instalados na máquina de desenvolvimento.

## Arquitetura

Núcleo em Rust, com quatro módulos de fronteiras claras:

- `tuya`: cliente da API de nuvem. Obtém e renova o token, assina requisições (HMAC-SHA256), expõe listar dispositivos, ler status e enviar comandos. Depende só de HTTP e das credenciais.
- `devices`: um driver por categoria Tuya. Cada driver traduz o status bruto da Tuya para um modelo simples e traduz ações do usuário para comandos Tuya. Na v1 existe só o driver `dj` (lâmpada). A câmera entra depois como novo driver, sem alterar os demais.
- `secrets`: guarda Access ID, Access Secret e região no Gerenciador de Credenciais do Windows. Nunca grava em arquivo.
- `shell`: ícone de bandeja, janela popup e menu.

A interface (Svelte) conversa com o núcleo por comandos e eventos do Tauri e não conhece códigos da Tuya.

## Comportamento da janela

- Clique esquerdo no ícone abre uma janela sem borda, ancorada acima da bandeja. Ela fecha ao perder o foco.
- Clique direito abre um menu com Configurações e Sair.
- Enquanto a janela está aberta, o status é atualizado a cada ~10 s. Com a janela fechada, o app não consulta a API.
- Na primeira execução (sem credenciais salvas), a janela mostra a tela de configuração com Access ID, Access Secret e região.

## Card da lâmpada

- O ícone acende na cor e no brilho reais. Em modo branco usa a temperatura de cor (quente a fria).
- Clicar no card liga/desliga.
- Expandir o card mostra controles de brilho, temperatura e um seletor de cor (HSV). Escalas da Tuya: `bright_value_v2` e `temp_value_v2` de 10 a 1000, `colour_data_v2` em HSV (`h` 0-360, `s` e `v` 0-1000).
- Dispositivo offline fica acinzentado e sem controles.

## Fluxo de dados

1. A interface chama `list_devices`. O núcleo consulta `/v1.0/iot-01/associated-users/devices` e associa cada dispositivo ao driver da sua categoria.
2. O núcleo busca o status de cada dispositivo. O driver converte para um modelo simples (ligado, brilho, temperatura, cor, online).
3. Uma ação do usuário chama `send_command(id, ação)`. O driver monta o comando Tuya. O card é atualizado de imediato (otimista). Se a API falhar, o card volta ao estado anterior e mostra o erro.
4. O núcleo emite eventos de status para a interface a cada ciclo de atualização, apenas com a janela aberta.

## Tratamento de erros

- Dispositivo offline: card acinzentado, sem controles.
- Token expirado: renovado de forma transparente e a requisição é repetida uma vez.
- Sem internet ou credencial inválida: aviso na própria janela, com atalho para a tela de configuração quando o erro for de credencial.
- Falha em um comando: o card reverte e exibe a mensagem.

## Testes

- Unitários em Rust: assinatura HMAC (com vetor conhecido) e tradução de status e ações do driver `dj`.
- Cliente HTTP testado com servidor falso: sucesso, token expirado e erro de rede.
- Interface: testes leves de componente (o card reflete o estado e desfaz a mudança em caso de erro).
- Verificação manual final com a lâmpada real.

## Riscos e pontos em aberto

- **Dependência do Smart Life.** Dispositivos só aparecem na API se estiverem pareados no Smart Life, não no app Positivo. Cada dispositivo migrado deixa de aparecer no app Positivo.
- **Câmera.** Ainda não migrada. Não está confirmado que a API entregue stream e PTZ para a 360 Bot, nem que o serviço de vídeo esteja disponível no projeto Tuya. Será investigado na etapa da câmera.
- **Plano gratuito da Tuya.** O projeto usa o pacote básico gratuito do IoT Core, que tem limites de chamadas e prazo de validade de serviços. O app deve evitar consultas desnecessárias (já contemplado: sem polling com a janela fechada). Confirmar os limites vigentes no console da Tuya antes de depender do app no dia a dia.
- **Reverse engineering do app Positivo** continua como plano B, caso a migração para o Smart Life deixe de funcionar para algum modelo.
