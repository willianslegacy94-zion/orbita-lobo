interface FiltroCategoriasProps {
  categorias: string[];
  categoriaAtiva: string;
  onSelecionar: (categoria: string) => void;
}

export function FiltroCategorias({ categorias, categoriaAtiva, onSelecionar }: FiltroCategoriasProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {categorias.map((categoria) => (
        <button
          key={categoria}
          type="button"
          onClick={() => onSelecionar(categoria)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            categoriaAtiva === categoria
              ? 'bg-lobo-gold text-black'
              : 'bg-onix-surface text-slate-300 hover:bg-onix-surfaceHover'
          }`}
        >
          {categoria}
        </button>
      ))}
    </div>
  );
}
