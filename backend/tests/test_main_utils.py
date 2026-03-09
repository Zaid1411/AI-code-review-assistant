import tempfile
from pathlib import Path

from backend.main import _is_text_file


def test_is_text_file_with_text(tmp_path: Path):
    p = tmp_path / "sample.txt"
    p.write_text("print('hello')")
    assert _is_text_file(p) is True


def test_is_text_file_with_binary(tmp_path: Path):
    p = tmp_path / "img.bin"
    p.write_bytes(b"\x00\x01\x02\x03")
    assert _is_text_file(p) is False
