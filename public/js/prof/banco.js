// Carrega o arquivo privado de perguntas da competição para o Firestore (só o professor lê).
import { h, limpar, toast, carregarJSON } from "../ui/dom.js";
import { validarBanco } from "../core/competicao.js";
import { salvarBanco, lerBancoCompleto } from "../fb.js";
import { MODULOS } from "../core/modulo.js";

export async function telaBanco(el, modulo = "uvvis") {
  const mod = modulo in MODULOS ? modulo : "uvvis";
  const blocos = await carregarJSON(MODULOS[mod].base + "blocos.json");
  const atual = await lerBancoCompleto(mod);
  const resumo = h("div");
  const mostrar = (qs, seq) => {
    const { porBloco } = validarBanco({ questoes: qs ?? [] });
    limpar(resumo, qs ? h("table", { class: "tab" },
      h("tr", {}, h("th", {}, "Bloco"), h("th", {}, "Perguntas")),
      blocos.map((b) => h("tr", {}, h("td", {}, `${b.n}. ${b.titulo}`), h("td", {}, porBloco[b.n] ?? 0))),
      h("tr", {}, h("th", {}, "Total"), h("th", {}, qs.length)),
      h("tr", {}, h("th", {}, "Sequência dos slides"), h("th", {}, seq?.length ? `${seq.length} perguntas` : "—"))) : h("p", { class: "aviso" }, "Nenhuma pergunta carregada ainda."));
  };
  const arquivo = h("input", { type: "file", accept: ".json,application/json" });
  arquivo.addEventListener("change", async () => {
    try {
      const json = JSON.parse(await arquivo.files[0].text());
      const v = validarBanco(json);
      if (!v.ok) return toast(`Arquivo com problemas: ${v.erros.slice(0, 3).join("; ")}`, "erro");
      if ((json.modulo ?? "uvvis") !== mod) return toast(`Este arquivo é do módulo ${json.modulo}; escolha o módulo certo acima.`, "erro");
      await salvarBanco(mod, json.questoes, json.sequencia ?? null);
      toast(`${json.questoes.length} perguntas carregadas${v.nSequencia ? ` + sequência dos slides (${v.nSequencia})` : ""}.`);
      mostrar(json.questoes, json.sequencia);
    } catch (e) { console.error(e); toast("Não consegui ler o arquivo (é o JSON do quiz?)", "erro"); }
  });
  limpar(el, h("div", { class: "abas" }, h("b", {}, "Módulo:"), Object.entries(MODULOS).map(([k, v]) =>
      h("a", { href: `#perguntas/${k}`, class: k === mod ? "ativa" : "" }, v.titulo))),
    h("h1", {}, `🗂️ Perguntas do quiz — ${MODULOS[mod].titulo}`),
    h("div", { class: "cartao" },
      h("p", {}, "Escolha o arquivo ", h("code", {}, `privado/${mod}-competicao.json`),
        ". Ele fica guardado no Firebase, visível só para você — o gabarito nunca vai para o site público."),
      arquivo),
    h("div", { class: "cartao" }, h("h2", {}, "Banco atual"), resumo),
    mod === "iv" ? cartaoGrupo() : null);
  mostrar(atual?.questoes, atual?.sequencia);
}

// IV: respostas da atividade em grupo (privado/iv-grupo.json), lidas só pelo professor
function cartaoGrupo() {
  const info = h("p", { class: "ajuda" }, "Carregando…");
  lerBancoCompleto("iv-grupo").then((b) => (info.textContent = b?.questoes?.length ? `${b.questoes.length} respostas carregadas.` : "Nenhuma resposta carregada."));
  const arq = h("input", { type: "file", accept: ".json,application/json" });
  arq.addEventListener("change", async () => {
    try {
      const j = JSON.parse(await arq.files[0].text());
      const ok = j.modulo === "iv-grupo" && Array.isArray(j.problemas) && j.problemas.every((p) => Number.isInteger(p.n) && Number.isInteger(p.correta) && p.resolucao?.trim());
      if (!ok) return toast("Este não é o arquivo privado/iv-grupo.json.", "erro");
      await salvarBanco("iv-grupo", j.problemas);
      info.textContent = `${j.problemas.length} respostas carregadas.`;
      toast("Respostas da atividade em grupo carregadas.");
    } catch (e) { console.error(e); toast("Não consegui ler o arquivo.", "erro"); }
  });
  return h("div", { class: "cartao" }, h("h2", {}, "👥 Respostas da atividade em grupo"),
    h("p", {}, "Escolha ", h("code", {}, "privado/iv-grupo.json"), ". Fica visível só para você; os alunos veem a resposta quando você revelar."), arq, info);
}
