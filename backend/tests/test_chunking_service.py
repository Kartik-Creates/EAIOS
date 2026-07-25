from app.services.chunking_service import chunk_text


def test_empty_text_returns_no_chunks():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_short_text_returns_single_chunk():
    text = "This is a short sentence."
    chunks = chunk_text(text, chunk_size=800, chunk_overlap=120)
    assert chunks == [text]


def test_long_text_splits_into_multiple_chunks_within_size():
    sentence = "The quick brown fox jumps over the lazy dog. "
    text = sentence * 40  # well beyond chunk_size
    chunks = chunk_text(text, chunk_size=200, chunk_overlap=40)

    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 200 + 40  # allow for overlap prefix


def test_oversized_single_sentence_is_hard_split():
    text = "a" * 500 + "."
    chunks = chunk_text(text, chunk_size=200, chunk_overlap=20)

    assert len(chunks) > 1
    assert "".join(chunks).replace(" ", "").count("a") == 500


def test_consecutive_chunks_share_overlap():
    sentence = "Sentence number %d provides filler content for chunking. "
    text = "".join(sentence % i for i in range(20))
    chunks = chunk_text(text, chunk_size=150, chunk_overlap=30)

    assert len(chunks) > 1
    # Overlap: the tail of one chunk should reappear at the start of the next.
    first_tail = chunks[0][-30:].strip()
    assert first_tail.split(" ", 1)[-1] in chunks[1]
