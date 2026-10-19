// App do aluno: identificação, menu e rotas.
import { h, limpar, rotas, toast } from "../ui/dom.js";
import { obterAluno, telaIdentificacao, sair } from "./identificacao.js";
import { telaMenu } from "./menu.js";
import { telaCasaLista, telaCasaBloco, telaGrupoLista, telaGrupoEstacao } from "./exercicios.js";
import { conectar, salvarAluno, registrarAcesso } from "./dados.js";

const el = document.getElementById("app");
let aluno = obterAluno();
const conexao = conectar().then((ok) => {
  if (!ok) toast("Sem conexão com o servidor: suas respostas não serão registradas.", "erro");
  return ok;
});

const protegido = (fn) => async (params, nome) => {
  if (!aluno) return telaIdentificacao(el, async (a) => {
    aluno = a;
    await conexao; salvarAluno(aluno);
    location.hash = location.hash && location.hash !== "#" ? location.hash : "#menu";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await conexao;
  registrarAcesso({ turma: aluno.turma, matricula: aluno.matricula, pagina: `#${[nome, ...params].join("/")}` });
  try { await fn(params); } catch (e) {
    console.error(e);
    limpar(el, h("div", { class: "cartao" }, h("p", {}, "Algo deu errado ao abrir esta tela."), h("a", { class: "btn", href: "#menu" }, "Voltar ao menu")));
  }
};

const sim = async ([qual]) => (await import("../sim/index.js")).telaSimuladores(el, aluno, qual);
const competicao = async ([codigo]) => (await import("./competicao.js")).telaCompeticao(el, aluno, codigo);

if (aluno) conexao.then((ok) => ok && salvarAluno(aluno));

rotas({
  "": protegido(() => telaMenu(el, aluno, () => { sair(); aluno = null; location.hash = "#"; window.dispatchEvent(new HashChangeEvent("hashchange")); })),
  menu: protegido(() => telaMenu(el, aluno, () => { sair(); aluno = null; location.hash = "#"; window.dispatchEvent(new HashChangeEvent("hashchange")); })),
  casa: protegido(([n]) => (n ? telaCasaBloco(el, aluno, n) : telaCasaLista(el, aluno))),
  grupo: protegido(([id]) => (id ? telaGrupoEstacao(el, aluno, id) : telaGrupoLista(el, aluno))),
  sim: protegido(sim),
  quiz: protegido(competicao),
  competicao: protegido(competicao), // endereço antigo
});
