import { useEffect, useState, type FormEvent } from 'react';
import { Badge } from '../../components/Badge';
import { Toast } from '../../components/Toast';
import { authFetch } from '../../lib/auth';
import type { Produto } from '../../types';

const UNIDADES = ['UN', 'M3', 'KG', 'MT'] as const;

interface FormState {
  sku: string;
  descricao: string;
  categoria: string;
  unidade_medida: (typeof UNIDADES)[number];
  peso_unitario_kg: string;
  qtd_atual: string;
  estoque_minimo: string;
  preco_custo: string;
  preco_venda: string;
}

const FORM_VAZIO: FormState = {
  sku: '',
  descricao: '',
  categoria: '',
  unidade_medida: 'UN',
  peso_unitario_kg: '0',
  qtd_atual: '0',
  estoque_minimo: '0',
  preco_custo: '0',
  preco_venda: '0',
};

function produtoParaForm(produto: Produto): FormState {
  return {
    sku: produto.sku,
    descricao: produto.descricao,
    categoria: produto.categoria,
    unidade_medida: produto.unidade_medida as FormState['unidade_medida'],
    peso_unitario_kg: produto.peso_unitario_kg,
    qtd_atual: produto.qtd_atual,
    estoque_minimo: produto.estoque_minimo,
    preco_custo: produto.preco_custo,
    preco_venda: produto.preco_venda,
  };
}

function formParaPayload(form: FormState) {
  return {
    sku: form.sku.trim(),
    descricao: form.descricao.trim(),
    categoria: form.categoria.trim(),
    unidade_medida: form.unidade_medida,
    peso_unitario_kg: Number(form.peso_unitario_kg) || 0,
    qtd_atual: Number(form.qtd_atual) || 0,
    estoque_minimo: Number(form.estoque_minimo) || 0,
    preco_custo: Number(form.preco_custo) || 0,
    preco_venda: Number(form.preco_venda) || 0,
  };
}

export function AdminEstoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novoProduto, setNovoProduto] = useState<FormState>(FORM_VAZIO);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [erroNovo, setErroNovo] = useState<string | null>(null);

  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [formEdicao, setFormEdicao] = useState<FormState>(FORM_VAZIO);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  const [mensagem, setMensagem] = useState<string | null>(null);

  function carregarProdutos() {
    setCarregando(true);
    return authFetch('/api/produtos')
      .then((res) => res.json())
      .then((data: Produto[]) => setProdutos(Array.isArray(data) ? data : []))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function cadastrarProduto(evento: FormEvent) {
    evento.preventDefault();
    setErroNovo(null);
    setSalvandoNovo(true);

    try {
      const res = await authFetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formParaPayload(novoProduto)),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Não foi possível cadastrar o produto.');

      setNovoProduto(FORM_VAZIO);
      setMensagem('Produto cadastrado com sucesso.');
      await carregarProdutos();
    } catch (err) {
      setErroNovo(err instanceof Error ? err.message : 'Não foi possível cadastrar o produto.');
    } finally {
      setSalvandoNovo(false);
    }
  }

  function iniciarEdicao(produto: Produto) {
    setIdEditando(produto.id);
    setFormEdicao(produtoParaForm(produto));
    setErroEdicao(null);
  }

  function cancelarEdicao() {
    setIdEditando(null);
    setErroEdicao(null);
  }

  async function salvarEdicao(id: number) {
    setErroEdicao(null);
    setSalvandoEdicao(true);

    try {
      const res = await authFetch(`/api/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formParaPayload(formEdicao)),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Não foi possível salvar as alterações.');

      setIdEditando(null);
      setMensagem('Estoque atualizado com sucesso.');
      await carregarProdutos();
    } catch (err) {
      setErroEdicao(err instanceof Error ? err.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-white">Cadastro de Estoque</h2>

      <form
        onSubmit={cadastrarProduto}
        className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-onix-border bg-onix-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="block text-xs font-semibold text-slate-400">
          SKU
          <input
            type="text"
            required
            value={novoProduto.sku}
            onChange={(e) => setNovoProduto({ ...novoProduto, sku: e.target.value })}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-400 sm:col-span-1 lg:col-span-2">
          Descrição
          <input
            type="text"
            required
            value={novoProduto.descricao}
            onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          Categoria
          <input
            type="text"
            required
            value={novoProduto.categoria}
            onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          Unidade
          <select
            value={novoProduto.unidade_medida}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, unidade_medida: e.target.value as FormState['unidade_medida'] })
            }
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          Estoque inicial
          <input
            type="number"
            step="0.01"
            min="0"
            value={novoProduto.qtd_atual}
            onChange={(e) => setNovoProduto({ ...novoProduto, qtd_atual: e.target.value })}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          Estoque mínimo
          <input
            type="number"
            step="0.01"
            min="0"
            value={novoProduto.estoque_minimo}
            onChange={(e) => setNovoProduto({ ...novoProduto, estoque_minimo: e.target.value })}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          Preço de custo
          <input
            type="number"
            step="0.01"
            min="0"
            value={novoProduto.preco_custo}
            onChange={(e) => setNovoProduto({ ...novoProduto, preco_custo: e.target.value })}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-400">
          Preço de venda
          <input
            type="number"
            step="0.01"
            min="0"
            value={novoProduto.preco_venda}
            onChange={(e) => setNovoProduto({ ...novoProduto, preco_venda: e.target.value })}
            className="mt-1 w-full rounded-md border border-onix-border bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
          />
        </label>

        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={salvandoNovo}
            className="rounded-md bg-lobo-gold px-4 py-2 text-sm font-bold text-black transition hover:bg-lobo-goldDark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {salvandoNovo ? 'Cadastrando...' : 'Cadastrar produto'}
          </button>
          {erroNovo && <p className="text-sm font-medium text-red-400">{erroNovo}</p>}
        </div>
      </form>

      {mensagem && (
        <div className="mb-4">
          <Toast tipo="sucesso" mensagem={mensagem} />
        </div>
      )}

      {carregando && <p className="text-slate-400">Carregando...</p>}

      {!carregando && (
        <div className="overflow-x-auto rounded-lg border border-onix-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-onix-surface text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Un.</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="px-4 py-3 text-right">Custo</th>
                <th className="px-4 py-3 text-right">Venda</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => {
                const emEdicao = idEditando === produto.id;
                const estoqueBaixo = Number(produto.qtd_atual) <= Number(produto.estoque_minimo);

                if (emEdicao) {
                  return (
                    <tr key={produto.id} className="border-t border-onix-border bg-onix-surfaceHover">
                      <td className="px-4 py-2 text-slate-300">{produto.sku}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formEdicao.descricao}
                          onChange={(e) => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                          className="w-full rounded-md border border-onix-border bg-black/30 px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formEdicao.categoria}
                          onChange={(e) => setFormEdicao({ ...formEdicao, categoria: e.target.value })}
                          className="w-full rounded-md border border-onix-border bg-black/30 px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
                        />
                      </td>
                      <td className="px-4 py-2 text-slate-300">{produto.unidade_medida}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formEdicao.qtd_atual}
                          onChange={(e) => setFormEdicao({ ...formEdicao, qtd_atual: e.target.value })}
                          className="w-24 rounded-md border border-onix-border bg-black/30 px-2 py-1 text-right text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formEdicao.preco_custo}
                          onChange={(e) => setFormEdicao({ ...formEdicao, preco_custo: e.target.value })}
                          className="w-24 rounded-md border border-onix-border bg-black/30 px-2 py-1 text-right text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formEdicao.preco_venda}
                          onChange={(e) => setFormEdicao({ ...formEdicao, preco_venda: e.target.value })}
                          className="w-24 rounded-md border border-onix-border bg-black/30 px-2 py-1 text-right text-white focus:outline-none focus:ring-2 focus:ring-lobo-gold"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => salvarEdicao(produto.id)}
                              disabled={salvandoEdicao}
                              className="rounded-md bg-lobo-gold px-3 py-1 text-xs font-bold text-black transition hover:bg-lobo-goldDark disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={cancelarEdicao}
                              className="rounded-md border border-onix-border px-3 py-1 text-xs font-medium text-slate-300 hover:bg-onix-surfaceHover"
                            >
                              Cancelar
                            </button>
                          </div>
                          {erroEdicao && <p className="text-xs font-medium text-red-400">{erroEdicao}</p>}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={produto.id} className="border-t border-onix-border">
                    <td className="px-4 py-3 text-slate-300">{produto.sku}</td>
                    <td className="px-4 py-3 text-white">{produto.descricao}</td>
                    <td className="px-4 py-3 text-slate-300">{produto.categoria}</td>
                    <td className="px-4 py-3 text-slate-300">{produto.unidade_medida}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={estoqueBaixo ? 'font-semibold text-red-400' : 'text-white'}>
                        {Number(produto.qtd_atual).toFixed(2)}
                      </span>
                      {estoqueBaixo && (
                        <span className="ml-2">
                          <Badge tom="error">Estoque baixo</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      R$ {Number(produto.preco_custo).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-lobo-gold">
                      R$ {Number(produto.preco_venda).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(produto)}
                        className="rounded-md border border-onix-border px-3 py-1 text-xs font-medium text-slate-300 hover:bg-onix-surfaceHover"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
