import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/config.js";
import { useTheme } from "../ThemeContext.jsx";
import "./CorrelationMatrix.css";

// ── Colour scale -1 → 0 → +1 (red → neutral → green) ─────────
function corrToColor(value, theme) {
  const v = Math.max(-1, Math.min(1, value));
  const dark = theme === "dark";

  if (v >= 0) {
    // 0 → +1  neutral  → strong green
    const g = Math.round(166 + (1 - v) * (dark ? 40 : 60));
    const r = Math.round(dark ? 30 : 245 - v * 200);
    const b = Math.round(dark ? 30 : 245 - v * 200);
    return `rgba(${r},${g},${b},${0.15 + v * 0.75})`;
  } else {
    // 0 → -1  neutral → strong red
    const abs = Math.abs(v);
    const r = Math.round(239 - (1 - abs) * (dark ? 40 : 60));
    const g = Math.round(dark ? 30 : 245 - abs * 200);
    const b = Math.round(dark ? 30 : 245 - abs * 200);
    return `rgba(${r},${g},${b},${0.15 + abs * 0.75})`;
  }
}

function corrLabel(v) {
  if (v >= 0.8)  return { text: "Very High ↑", cls: "strength-vhigh" };
  if (v >= 0.5)  return { text: "High ↑",      cls: "strength-high"  };
  if (v >= 0.2)  return { text: "Moderate",     cls: "strength-mod"   };
  if (v >= -0.2) return { text: "Weak",         cls: "strength-weak"  };
  if (v >= -0.5) return { text: "Moderate ↓",   cls: "strength-nmod"  };
  if (v >= -0.8) return { text: "High ↓",       cls: "strength-nhigh" };
  return               { text: "Very High ↓",   cls: "strength-nvhigh"};
}

// ── Sector badge colours ────────────────────────────────────────
const SECTOR_COLORS = {
  IT:      "#3b82f6", Banking: "#8b5cf6", Energy: "#f59e0b",
  FMCG:   "#22c55e", Auto:    "#f97316", Infra:  "#14b8a6",
  Finance: "#ec4899", Crypto: "#f59e0b", Index:  "#64748b",
};

// ── Tooltip ───────────────────────────────────────────────────
const CellTooltip = ({ cell, meta }) => {
  if (!cell) return null;
  const { symA, symB, value } = cell;
  const { text, cls } = corrLabel(value);
  const nameA = meta?.[symA]?.name || symA;
  const nameB = meta?.[symB]?.name || symB;
  const secA  = meta?.[symA]?.sector;
  const secB  = meta?.[symB]?.sector;

  return (
    <div className="corr-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-pair">{symA} × {symB}</span>
        <span className={`tooltip-strength ${cls}`}>{text}</span>
      </div>
      <div className="tooltip-names">
        <div style={{ color: SECTOR_COLORS[secA] }}>■ {nameA}</div>
        <div style={{ color: SECTOR_COLORS[secB] }}>■ {nameB}</div>
      </div>
      <div className="tooltip-score">
        Correlation: <strong>{value >= 0 ? "+" : ""}{value.toFixed(4)}</strong>
      </div>
      <div className="tooltip-insight">
        {value >= 0.7
          ? "🔗 These stocks move closely together. Low diversification benefit."
          : value <= -0.3
          ? "⚖️ These stocks offset each other — great for risk hedging."
          : "✅ Low correlation — good diversification pair."}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const CorrelationMatrix = () => {
  const { theme } = useTheme();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedSym, setSelectedSym] = useState(null);
  const [filterSector, setFilterSector] = useState("All");
  const [sortBy, setSortBy]     = useState("alpha"); // alpha | corr-high | corr-low
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const fetchMatrix = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/correlation`)
      .then((res) => { setData(res.data); setError(null); })
      .catch(() => setError("Could not load correlation data. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMatrix();
    // Refresh every 30 seconds as new OHLC data comes in
    const t = setInterval(fetchMatrix, 30000);
    return () => clearInterval(t);
  }, [fetchMatrix]);

  // Derive filtered & sorted symbols
  const { symbols, matrix, meta } = data || {};

  const sectors = useMemo(() => {
    if (!meta) return [];
    const s = new Set(Object.values(meta).map((m) => m.sector));
    return ["All", ...Array.from(s).sort()];
  }, [meta]);

  const visibleSymbols = useMemo(() => {
    if (!symbols) return [];
    let filtered = filterSector === "All"
      ? [...symbols]
      : symbols.filter((s) => meta?.[s]?.sector === filterSector);

    if (sortBy === "alpha") {
      filtered.sort();
    } else if (sortBy === "corr-high" && selectedSym && symbols) {
      const si = symbols.indexOf(selectedSym);
      if (si !== -1) {
        filtered.sort((a, b) => {
          const ai = symbols.indexOf(a), bi = symbols.indexOf(b);
          return Math.abs(matrix[si][bi]) - Math.abs(matrix[si][ai]);
        });
        filtered.sort((a, b) => {
          const ai = symbols.indexOf(a), bi = symbols.indexOf(b);
          return matrix[si][bi] - matrix[si][ai];
        });
      }
    } else if (sortBy === "corr-low" && selectedSym && symbols) {
      const si = symbols.indexOf(selectedSym);
      if (si !== -1) {
        filtered.sort((a, b) => {
          const ai = symbols.indexOf(a), bi = symbols.indexOf(b);
          return matrix[si][ai] - matrix[si][bi];
        });
      }
    }
    return filtered;
  }, [symbols, filterSector, sortBy, selectedSym, meta, matrix]);

  // Top correlated pairs for the summary panel
  const topPairs = useMemo(() => {
    if (!symbols || !matrix) return [];
    const pairs = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        pairs.push({ symA: symbols[i], symB: symbols[j], value: matrix[i][j] });
      }
    }
    pairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    return pairs.slice(0, 10);
  }, [symbols, matrix]);

  const handleMouseEnter = (e, symA, symB, value) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredCell({ symA, symB, value });
  };

  if (loading) return (
    <div className="corr-loading">
      <div className="corr-spinner"></div>
      <p>Computing correlation matrix…</p>
    </div>
  );

  if (error) return (
    <div className="corr-error">
      <span>⚠️ {error}</span>
      <button onClick={fetchMatrix} className="corr-retry-btn">Retry</button>
    </div>
  );

  if (!data) return null;

  return (
    <div className="corr-page">
      {/* ── Header ── */}
      <div className="corr-header">
        <div>
          <h2 className="corr-title">📈 Correlation Matrix</h2>
          <p className="corr-sub">
            Pearson correlation of daily returns across {symbols.length} assets.
            Updated every 30s. Computed at {new Date(data.computedAt).toLocaleTimeString("en-IN")}.
          </p>
        </div>
        <button onClick={fetchMatrix} className="corr-refresh-btn">↻ Refresh</button>
      </div>

      {/* ── Legend ── */}
      <div className="corr-legend">
        <div className="legend-bar"></div>
        <div className="legend-labels">
          <span>−1.0 Strong Negative</span>
          <span>0 No Correlation</span>
          <span>+1.0 Strong Positive</span>
        </div>
        <div className="legend-chips">
          <span className="chip chip-green">≥ 0.7 High +ve</span>
          <span className="chip chip-yellow">0.2–0.7 Moderate</span>
          <span className="chip chip-gray">−0.2–0.2 Weak</span>
          <span className="chip chip-red">≤ −0.3 Negative</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="corr-controls">
        <div className="ctrl-group">
          <label>Sector</label>
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="corr-select"
          >
            {sectors.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="ctrl-group">
          <label>Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="corr-select"
          >
            <option value="alpha">Alphabetical</option>
            <option value="corr-high">Highest corr to selected</option>
            <option value="corr-low">Lowest corr to selected</option>
          </select>
        </div>
        {selectedSym && (
          <div className="selected-sym-badge">
            Anchor: <strong>{selectedSym}</strong>
            <button onClick={() => setSelectedSym(null)} className="clear-btn">✕</button>
          </div>
        )}
      </div>

      <div className="corr-layout">
        {/* ── Matrix ── */}
        <div className="corr-matrix-wrap">
          <div
            className="corr-matrix"
            style={{
              gridTemplateColumns: `80px repeat(${visibleSymbols.length}, 1fr)`,
            }}
          >
            {/* Top-left empty corner */}
            <div className="corr-corner-cell"></div>

            {/* Column headers */}
            {visibleSymbols.map((sym) => (
              <div
                key={`col-${sym}`}
                className={`corr-col-label ${selectedSym === sym ? "label-selected" : ""}`}
                onClick={() => setSelectedSym(sym === selectedSym ? null : sym)}
                style={{ color: SECTOR_COLORS[meta?.[sym]?.sector] || "var(--text-muted)" }}
                title={meta?.[sym]?.name}
              >
                {sym}
              </div>
            ))}

            {/* Rows */}
            {visibleSymbols.map((rowSym) => {
              const ri = symbols.indexOf(rowSym);
              return (
                <React.Fragment key={`row-${rowSym}`}>
                  {/* Row label */}
                  <div
                    className={`corr-row-label ${selectedSym === rowSym ? "label-selected" : ""}`}
                    onClick={() => setSelectedSym(rowSym === selectedSym ? null : rowSym)}
                    style={{ color: SECTOR_COLORS[meta?.[rowSym]?.sector] || "var(--text-muted)" }}
                    title={meta?.[rowSym]?.name}
                  >
                    {rowSym}
                  </div>

                  {/* Cells */}
                  {visibleSymbols.map((colSym) => {
                    const ci = symbols.indexOf(colSym);
                    const val = ri !== -1 && ci !== -1 ? matrix[ri][ci] : 0;
                    const isDiag = rowSym === colSym;
                    const isRowSel = selectedSym === rowSym || selectedSym === colSym;
                    const isHovered = hoveredCell?.symA === rowSym && hoveredCell?.symB === colSym;

                    return (
                      <div
                        key={`${rowSym}-${colSym}`}
                        className={`corr-cell ${isDiag ? "corr-diag" : ""} ${isRowSel ? "corr-highlighted" : ""} ${isHovered ? "corr-hovered" : ""}`}
                        style={{
                          background: isDiag ? "var(--border-color)" : corrToColor(val, theme),
                        }}
                        onMouseEnter={(e) => !isDiag && handleMouseEnter(e, rowSym, colSym, val)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <span className="cell-val">
                          {isDiag ? "—" : (val >= 0 ? "+" : "") + val.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: top pairs + selected breakdown ── */}
        <div className="corr-sidebar">
          <div className="corr-sidebar-card">
            <h4 className="sidebar-card-title">🔗 Strongest Pairs</h4>
            <div className="pairs-list">
              {topPairs.map((p, i) => {
                const { text, cls } = corrLabel(p.value);
                return (
                  <div
                    key={`${p.symA}-${p.symB}`}
                    className="pair-row"
                    onClick={() => setSelectedSym(p.symA)}
                  >
                    <span className="pair-rank">#{i + 1}</span>
                    <span className="pair-syms">
                      <span style={{ color: SECTOR_COLORS[meta?.[p.symA]?.sector] }}>{p.symA}</span>
                      &nbsp;×&nbsp;
                      <span style={{ color: SECTOR_COLORS[meta?.[p.symB]?.sector] }}>{p.symB}</span>
                    </span>
                    <span className={`pair-corr ${p.value >= 0 ? "corr-pos" : "corr-neg"}`}>
                      {p.value >= 0 ? "+" : ""}{p.value.toFixed(3)}
                    </span>
                    <span className={`pair-strength ${cls}`}>{text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diversification Tips */}
          <div className="corr-sidebar-card">
            <h4 className="sidebar-card-title">💡 Diversification Tips</h4>
            <div className="tips-list">
              {topPairs
                .filter((p) => p.value <= -0.2)
                .slice(0, 3)
                .map((p) => (
                  <div className="tip-row tip-hedge" key={`h-${p.symA}-${p.symB}`}>
                    ⚖️ <strong>{p.symA}</strong> hedges against <strong>{p.symB}</strong>
                    &nbsp;({p.value.toFixed(2)})
                  </div>
                ))}
              {topPairs
                .filter((p) => Math.abs(p.value) < 0.2)
                .slice(0, 3)
                .map((p) => (
                  <div className="tip-row tip-diversify" key={`d-${p.symA}-${p.symB}`}>
                    ✅ <strong>{p.symA}</strong> + <strong>{p.symB}</strong> — low correlation,
                    good mix ({p.value.toFixed(2)})
                  </div>
                ))}
              {topPairs
                .filter((p) => p.value >= 0.8)
                .slice(0, 2)
                .map((p) => (
                  <div className="tip-row tip-warn" key={`w-${p.symA}-${p.symB}`}>
                    ⚠️ <strong>{p.symA}</strong> + <strong>{p.symB}</strong> move almost
                    identically — avoid holding both ({p.value.toFixed(2)})
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating tooltip */}
      {hoveredCell && (
        <div
          className="corr-tooltip-floating"
          style={{ top: tooltipPos.y - 8, left: tooltipPos.x }}
        >
          <CellTooltip cell={hoveredCell} meta={meta} />
        </div>
      )}
    </div>
  );
};

export default CorrelationMatrix;
