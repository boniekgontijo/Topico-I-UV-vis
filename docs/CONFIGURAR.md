# Como colocar a plataforma no ar

São dois serviços gratuitos: o **Firebase** (do Google), que guarda acessos, respostas e quizzes, e o **GitHub Pages**, que publica o site. Você faz isso uma vez só e leva uns 20 minutos.

## 1. Firebase

1. Abra o [console do Firebase](https://console.firebase.google.com) com a conta **boniek@ufg.br** e clique em **Criar projeto**. Sugestão de nome: `espectroscopia-imia`. O Google Analytics pode ficar desligado.
2. Em **Criação → Authentication → Começar**, ative dois provedores:
   - **Anônimo**, usado pelos alunos (eles entram sem senha);
   - **Google**, usado por você, para entrar na área do professor.
3. Em **Criação → Firestore Database → Criar banco de dados**, escolha a região `southamerica-east1 (São Paulo)` e o **modo de produção**.
4. Em **Configurações do projeto (engrenagem) → Seus apps → Web (`</>`)**, registre um app com o nome `site`, sem marcar o Hosting. O console mostra um bloco `firebaseConfig`. Copie os quatro valores (`apiKey`, `authDomain`, `projectId`, `appId`) para `public/js/config.js`, no lugar de `COLE_AQUI`.
   > Esses valores não são secretos: identificam o projeto. Quem protege os dados são as regras do passo 5.
5. Em **Firestore Database → Regras**, apague o conteúdo, cole todo o arquivo `firestore.rules` e clique em **Publicar**.
6. Em **Authentication → Configurações → Domínios autorizados**, adicione o endereço do site, por exemplo `boniek.github.io`.

## 2. GitHub Pages

1. No GitHub, crie um repositório. Ele pode ser **público**, porque o gabarito do quiz não vai para lá.
2. Envie esta pasta (`plataforma-espectroscopia`) para ele. A pasta `privado/` fica de fora automaticamente.
3. No repositório, abra **Settings → Pages → Source** e escolha **GitHub Actions**.
4. Cada envio para a branch `main` testa o conteúdo e publica a pasta `public/`. O endereço fica assim:
   `https://<seu-usuario>.github.io/<repositorio>/`

## 3. Em aula

- **Alunos:** projete o QR code do endereço do site. Para separar turmas, acrescente `?t=` ao link, por exemplo `…/index.html?t=2026-2`.
- **Professor:** abra `…/professor.html` e entre com o Google.
  1. Na aba **Perguntas**, escolha o arquivo `privado/uvvis-competicao.json`. Isso só precisa ser refeito quando o arquivo mudar.
  2. Na aba **Quiz**, escolha os blocos, o número de perguntas, o tempo e o modo (individual ou em equipes). Depois clique em **Criar sala** e projete a tela.
  3. Quando todos aparecerem no telão, clique em **Começar**. No fim aparece o pódio: hora do chocolate 🍫.
- **Painel:** mostra acessos, o acerto de cada aluno por bloco (primeira tentativa), as estações feitas em grupo e os quizzes. Também exporta CSV para o Excel.

## 4. Testar no próprio computador (opcional)

```bash
npm install
```

```bash
npm run emulador
```

```bash
npm run servir
```

Abra `http://localhost:8080`. Em `localhost` o site usa o emulador, e nada vai para o Firebase real. Os testes rodam com:

```bash
npm test
```

## Limites do plano gratuito

O plano gratuito do Firebase (Spark) permite 50 mil leituras e 20 mil escritas por dia. Uma turma de 60 alunos com um quiz de 15 perguntas usa por volta de 3 mil escritas, com folga.

Depois de publicar uma mudança, o GitHub Pages pode levar até 10 minutos para entregar a versão nova. Se algo parecer estranho logo após uma atualização, peça aos alunos que recarreguem a página.
