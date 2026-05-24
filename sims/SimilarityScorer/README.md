# SimilarityScorer

**Teaches:** `cosine-similarity`, `semantic-vs-lexical`

Two text inputs. Each phrase is embedded as the centroid of its recognized words' 2D coordinates (shared with `EmbeddingSpace`'s 30-word vocab). Cosine similarity between the two centroid vectors is shown live as a number and a colored bar.

Makes visible:
- Paraphrases that stay in the same semantic cluster keep similarity high
- Topic jumps push similarity toward zero (or negative)
- Words outside the vocab are silently ignored — so "the king sleeps" and "the king reigns" score identically

**Reported state:** `{ phraseA, phraseB, similarity, recognizedA, recognizedB }`
