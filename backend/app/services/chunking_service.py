import re

DEFAULT_CHUNK_SIZE = 800  # characters
DEFAULT_CHUNK_OVERLAP = 120

_SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?])\s+")


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[str]:
    """Split text into overlapping, sentence-aware chunks for embedding."""
    text = text.strip()
    if not text:
        return []

    sentences = _SENTENCE_BOUNDARY.split(text)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        if len(current) + len(sentence) + 1 <= chunk_size:
            current = f"{current} {sentence}".strip()
            continue

        if current:
            chunks.append(current)
            overlap_tail = current[-chunk_overlap:] if chunk_overlap else ""
            current = ""
        else:
            overlap_tail = ""

        if len(sentence) <= chunk_size:
            current = f"{overlap_tail} {sentence}".strip()
        else:
            # A single sentence longer than chunk_size: hard-split it.
            remainder = f"{overlap_tail} {sentence}".strip()
            for i in range(0, len(remainder), chunk_size):
                chunks.append(remainder[i : i + chunk_size])
            current = ""

    if current:
        chunks.append(current)

    return chunks
