import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Search, Package, Truck, FolderKanban, ShoppingCart, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResultItem {
  id: number;
  name: string;
  category?: string;
}

interface SearchResultSupplier {
  id: number;
  name: string;
  contact_email?: string;
}

interface SearchResultProject {
  id: number;
  name: string;
  status?: string;
}

interface SearchResultOrder {
  id: number;
  item_name?: string;
  supplier_name?: string;
  status?: string;
}

interface SearchResults {
  items: SearchResultItem[];
  suppliers: SearchResultSupplier[];
  projects: SearchResultProject[];
  orders: SearchResultOrder[];
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const doSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<SearchResults>(`/search?q=${encodeURIComponent(term)}`);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  function navigateTo(path: string) {
    onClose();
    navigate(path);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!open) return null;

  const hasResults =
    results &&
    (results.items.length > 0 ||
      results.suppliers.length > 0 ||
      results.projects.length > 0 ||
      results.orders.length > 0);

  const hasSearched = query.trim().length >= 2 && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Search panel */}
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-border bg-background shadow-2xl">
        {/* Search input */}
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search items, suppliers, projects, orders..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            onClick={onClose}
            className="shrink-0 rounded-sm p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}

          {hasSearched && !hasResults && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {hasResults && (
            <div className="space-y-3">
              {results.items.length > 0 && (
                <ResultGroup title="Items">
                  {results.items.map((item) => (
                    <ResultRow
                      key={`item-${item.id}`}
                      icon={<Package className="h-4 w-4" />}
                      title={item.name}
                      subtitle={item.category ?? ""}
                      onClick={() => navigateTo("/items")}
                    />
                  ))}
                </ResultGroup>
              )}

              {results.suppliers.length > 0 && (
                <ResultGroup title="Suppliers">
                  {results.suppliers.map((s) => (
                    <ResultRow
                      key={`supplier-${s.id}`}
                      icon={<Truck className="h-4 w-4" />}
                      title={s.name}
                      subtitle={s.contact_email ?? ""}
                      onClick={() => navigateTo("/suppliers")}
                    />
                  ))}
                </ResultGroup>
              )}

              {results.projects.length > 0 && (
                <ResultGroup title="Projects">
                  {results.projects.map((p) => (
                    <ResultRow
                      key={`project-${p.id}`}
                      icon={<FolderKanban className="h-4 w-4" />}
                      title={p.name}
                      subtitle={p.status ?? ""}
                      onClick={() => navigateTo(`/projects/${p.id}`)}
                    />
                  ))}
                </ResultGroup>
              )}

              {results.orders.length > 0 && (
                <ResultGroup title="Orders">
                  {results.orders.map((o) => (
                    <ResultRow
                      key={`order-${o.id}`}
                      icon={<ShoppingCart className="h-4 w-4" />}
                      title={o.item_name ?? `Order #${o.id}`}
                      subtitle={`${o.supplier_name ?? ""} - ${o.status ?? ""}`}
                      onClick={() => navigateTo("/orders")}
                    />
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{title}</div>
        {subtitle && (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </button>
  );
}
