# Plataforma de Espectroscopia — UV-vis

Exercícios dinâmicos de UV-vis para a disciplina de Introdução aos Métodos Instrumentais de Análise. Ela tem quatro partes:

- **Quiz ao vivo** (estilo Kahoot), individual ou em equipes, com QR code, ranking e pódio;
- **Atividades em grupo** (estações A–E do Workshop e o Desafio Woodward-Fieser);
- **Exercícios para casa** (88 questões, organizadas nos 10 blocos da aula);
- **Simuladores**: lei de Beer, conjugação e cor, deslocamentos, curva analítica e Woodward-Fieser.

O **painel do professor** mostra acessos e desempenho e exporta CSV.

Para colocar no ar, veja [docs/CONFIGURAR.md](docs/CONFIGURAR.md). O design está em [docs/2026-10-18-uvvis-plataforma-design.md](docs/2026-10-18-uvvis-plataforma-design.md).

## Onde fica cada coisa

| Pasta ou arquivo | Conteúdo |
|---|---|
| `public/` | o site (HTML + JavaScript, sem etapa de build) |
| `public/conteudo/uvvis/` | perguntas de casa e de grupo, blocos e figuras da aula |
| `privado/uvvis-competicao.json` | perguntas do quiz com gabarito (não vai para o GitHub) |
| `public/js/core/` | cálculos e regras, testados com `npm test` |
| `firestore.rules` | regras de segurança, testadas com `npm run test:regras` |
