# RAG vectoriel NIHAO (Scope 0.3)

## Architecture

| Composant | Implémentation |
|-----------|----------------|
| `EmbeddingProvider` | `hash` (défaut, déterministe) ou `openai` (`text-embedding-3-small`) |
| Stockage | Table `document_chunks` — vecteur JSON (compatible H2 + Postgres) |
| Recherche | Hybride : similarité cosinus + boost lexical |
| Ingestion | Upload company-data → chunking → embed → persist |
| Agents | `AgentService` injecte un extrait `[Contexte documents indexés]` |

## Config

```bash
RAG_EMBEDDING_PROVIDER=hash   # ou openai
RAG_OPENAI_EMBEDDING_MODEL=text-embedding-3-small
# AI_OPENAI_API_KEY=...       # réutilisé pour embeddings OpenAI
```

## Endpoints

- `GET /api/rag/stats`
- `POST /api/rag/search` `{ "query": "...", "limit": 8 }`

## Honnêteté produit

Provider `hash` = démo / offline — l’UI et les descriptions agent le signalent.
Passer à `openai` (ou autre provider) pour une similarité sémantique réelle.

## Suite (dette)

- Extension **pgvector** sur Postgres prod pour ANN indexée
- Extraction PDF/DOCX (Tika) au-delà du texte/CSV/JSON
- Association explicite agent ↔ corpus (tags)
