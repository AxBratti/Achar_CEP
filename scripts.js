// Cadastro com ViaCEP + Web Storage
const FORM_ID = "form-cadastro";
const STORAGE_KEY = "cadastroUsuario";

const form = document.getElementById(FORM_ID);
const mensagem = document.getElementById("mensagem");

// Remove tudo que não é número
const onlyDigits = (s = "") => String(s).replace(/\D/g, "");

// Exibir mensagens
function showMensagem(texto, tipo = "") {
  mensagem.className = `mensagem ${tipo}`.trim();
  mensagem.textContent = texto;
}

// Preenche valor de um campo
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? "";
}

// Pega dados do form em objeto
function getFormData() {
  const data = {};
  const fd = new FormData(form);
  fd.forEach((v, k) => (data[k] = v));
  return data;
}

// Salvar no localStorage
function salvarNoStorage() {
  const data = getFormData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Restaurar do localStorage
function restaurarDoStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.keys(data).forEach((k) => setValue(k, data[k]));
    showMensagem("Dados restaurados do navegador.", "ok");
  } catch (e) {
    console.error("Falha ao ler storage:", e);
  }
}

// Mostra loading nos campos de endereço
function setEnderecoLoading(loading) {
  const ids = ["cep", "logradouro", "bairro", "cidade", "uf"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      if (loading) el.classList.add("loading");
      else el.classList.remove("loading");
      el.disabled = loading && id !== "cep";
    }
  });
}

// Buscar CEP no ViaCEP
async function buscarCEP(cep) {
  const limpo = onlyDigits(cep);
  if (limpo.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos.");
  }
  const url = `https://viacep.com.br/ws/${limpo}/json/`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Falha na consulta do CEP.");
  const data = await resp.json();
  if (data.erro) throw new Error("CEP não encontrado.");
  return data;
}

// Preenche endereço
function preencherEndereco(data) {
  setValue("logradouro", data.logradouro || "");
  setValue("bairro", data.bairro || "");
  setValue("cidade", data.localidade || "");
  setValue("uf", (data.uf || "").toUpperCase());
}

// Limpar tudo
function limparFormulario() {
  form.reset();
  localStorage.removeItem(STORAGE_KEY);
  showMensagem("Formulário limpo.", "warn");
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  restaurarDoStorage();

  // Auto-save ao digitar
  form.addEventListener("input", () => {
    salvarNoStorage();
  });

  // Botão limpar
  document.getElementById("limpar").addEventListener("click", () => {
    limparFormulario();
  });

  // Blur no CEP
  const cepEl = document.getElementById("cep");
  cepEl.addEventListener("input", () => {
    cepEl.value = onlyDigits(cepEl.value); // Só números no CEP
  });

  cepEl.addEventListener("blur", async () => {
    const cep = onlyDigits(cepEl.value);
    if (cep.length !== 8) {
      showMensagem("CEP deve ter 8 dígitos.", "warn");
      return;
    }
    setEnderecoLoading(true);
    showMensagem("Consultando CEP...", "warn");
    try {
      const dados = await buscarCEP(cep);
      preencherEndereco(dados);
      showMensagem("Endereço preenchido com sucesso.", "ok");
    } catch (err) {
      console.error(err);
      showMensagem("CEP inválido ou não encontrado.", "err");
    } finally {
      setEnderecoLoading(false);
      salvarNoStorage();
    }
  });

  // Apenas números no campo Número
  const numeroEl = document.getElementById("numero");
  numeroEl.addEventListener("input", () => {
    numeroEl.value = onlyDigits(numeroEl.value);
  });

  // Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    salvarNoStorage();
    showMensagem("Dados salvos no navegador (localStorage).", "ok");
  });
});