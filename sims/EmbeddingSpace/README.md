# EmbeddingSpace

**Teaches:** `embedding`, `vector-space`, `cosine-similarity`, `semantic-vs-lexical`

Shows a 2D scatter plot of 30 toy word embeddings arranged into 5 semantic clusters:
- **royalty** (top-left): king, queen, prince, crown, throne, royalty
- **animals** (top-right): cat, dog, lion, wolf, bear, fox
- **food** (bottom-left): pizza, burger, pasta, sushi, salad, bread
- **programming** (bottom-right): python, function, array, class, loop, variable
- **music** (center-left): piano, guitar, melody, rhythm, chord, tempo

Each cluster occupies a spatially distinct region of the 2D space. Clicking any word highlights its 5 nearest neighbors (by Euclidean distance) with edges and similarity scores (1 / (1 + distance)).

**Reported state:** `{ clickedWord, nearestNeighbors, clusterPurity }`

where `clusterPurity` is the fraction of the top-5 nearest neighbors that share the same cluster as the clicked word.
