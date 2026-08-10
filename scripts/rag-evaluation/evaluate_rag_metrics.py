"""
Analise agregada das metricas de avaliacao do RAG do IABill.

Consome rag-evaluation-results.csv (exportado pelo RagEvaluationTest.java)
e produz:
  - resumo agregado em texto/markdown (para colar no TCC)
  - graficos em PNG (precisao/recall por categoria, distribuicao de MRR,
    taxa de recusa correta nos casos negativos)

Uso:
    python evaluate_rag_metrics.py rag-evaluation-results.csv

Dependencias:
    pip install pandas matplotlib
"""

import sys
import pandas as pd
import matplotlib.pyplot as plt


def carregar_resultados(caminho_csv: str) -> pd.DataFrame:
    df = pd.read_csv(caminho_csv)
    return df


def resumo_casos_positivos(df: pd.DataFrame) -> None:
    positivos = df[df["type"] == "positive"].copy()
    if positivos.empty:
        print("Nenhum caso positivo encontrado no CSV.")
        return

    for col in ["precision_at_k", "recall_at_k", "reciprocal_rank"]:
        positivos[col] = pd.to_numeric(positivos[col], errors="coerce")

    # Precision@1: quantos casos tiveram o chunk certo exatamente na 1a posicao.
    # Metrica mais justa aqui porque cada query tem so 1 chunk relevante esperado -
    # Precision@5 tem teto matematico de 0.2 mesmo com retrieval perfeito.
    positivos["precision_at_1"] = (positivos["reciprocal_rank"] == 1.0).astype(int)

    print("\n=== METRICAS AGREGADAS - CASOS POSITIVOS (retrieval) ===")
    print(f"N de casos avaliados: {len(positivos)}")
    print(f"Precision@K medio: {positivos['precision_at_k'].mean():.3f}")
    print(f"Recall@K medio:    {positivos['recall_at_k'].mean():.3f}")
    print(f"MRR (Mean Reciprocal Rank): {positivos['reciprocal_rank'].mean():.3f}")
    print(f"Precision@1:       {positivos['precision_at_1'].mean():.3f}")

    if "category" in positivos.columns:
        print("\n--- Por categoria de documento ---")
        agrupado = positivos.groupby("category")[
            ["precision_at_k", "recall_at_k", "reciprocal_rank", "precision_at_1"]
        ].mean().round(3)
        print(agrupado.to_string())

        ax = agrupado.plot(kind="bar", figsize=(9, 5))
        ax.set_title("Metricas de Retrieval por Categoria de Documento")
        ax.set_ylabel("Score (0-1)")
        ax.set_xlabel("Categoria")
        ax.set_ylim(0, 1.05)
        plt.xticks(rotation=30, ha="right")
        plt.tight_layout()
        plt.savefig("metricas_por_categoria.png", dpi=150)
        print("\nGrafico salvo: metricas_por_categoria.png")
        plt.close()

    # Markdown pronto para colar no TCC
    print("\n--- Tabela Markdown (colar direto no TCC) ---")
    print("| Metrica | Valor |")
    print("|---|---|")
    print(f"| Precision@K medio | {positivos['precision_at_k'].mean():.3f} |")
    print(f"| Recall@K medio | {positivos['recall_at_k'].mean():.3f} |")
    print(f"| MRR | {positivos['reciprocal_rank'].mean():.3f} |")
    print(f"| Precision@1 | {positivos['precision_at_1'].mean():.3f} |")


def resumo_casos_negativos(df: pd.DataFrame) -> None:
    negativos = df[df["type"] == "negative"].copy()
    if negativos.empty:
        print("\nNenhum caso negativo encontrado no CSV.")
        return

    negativos["recusou_corretamente"] = negativos["recusou_corretamente"].astype(str).str.lower() == "true"
    taxa_recusa_correta = negativos["recusou_corretamente"].mean()

    print("\n=== METRICAS AGREGADAS - CASOS NEGATIVOS (anti-alucinacao) ===")
    print(f"N de casos avaliados: {len(negativos)}")
    print(f"Taxa de recusa correta: {taxa_recusa_correta:.1%}")
    print("(Esta e a metrica que QUANTIFICA o comportamento anti-alucinacao ja "
          "observado manualmente e documentado no log de desenvolvimento.)")

    fig, ax = plt.subplots(figsize=(5, 5))
    valores = negativos["recusou_corretamente"].value_counts()
    labels = ["Recusou corretamente" if v else "Alucinou/errou" for v in valores.index]
    ax.pie(valores, labels=labels, autopct="%1.0f%%", colors=["#0e7490", "#dc2626"])
    ax.set_title("Comportamento em Casos Negativos (Anti-alucinacao)")
    plt.tight_layout()
    plt.savefig("taxa_recusa_correta.png", dpi=150)
    print("Grafico salvo: taxa_recusa_correta.png")
    plt.close()

    print("\n--- Tabela Markdown (colar direto no TCC) ---")
    print("| Metrica | Valor |")
    print("|---|---|")
    print(f"| Taxa de recusa correta (anti-alucinacao) | {taxa_recusa_correta:.1%} |")


def main():
    caminho = sys.argv[1] if len(sys.argv) > 1 else "rag-evaluation-results.csv"
    df = carregar_resultados(caminho)
    resumo_casos_positivos(df)
    resumo_casos_negativos(df)


if __name__ == "__main__":
    main()