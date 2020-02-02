import pytest

from server.server import (BingoBoard)

testdata = [
    (
        BingoBoard(list(range(1, 26))),
        [1],
        {'rows': {0: 1}, 'cols': {0: 1}, 'diag': {'-': 1}}
    ),
    (
        BingoBoard(list(range(1, 26))),
        [1, 2, 3, 4, 5, 6],
        {'rows': {0: 5, 1: 1, 2: 0}, 'cols': {0: 2, 1: 1, 2: 1}, 'diag': {}}
    ),
    (
        BingoBoard(list(range(1, 26))),
        [1, 2, 3, 4, 5, 6, 7, 13],
        {'rows': {0: 5, 1: 2, 2: 1, 3: 0}, 'cols': {
            0: 2, 1: 2, 2: 2, 3: 1}, 'diag': {'-': 3, '+': 2}}
    )
]


@pytest.mark.parametrize("board, picks, expected_row_cols", testdata)
def test_board_picks(board, picks, expected_row_cols):
    for x in picks:
        board.pick_tile(x)

    for row, count in expected_row_cols['rows'].items():
        assert len(board.rows[row]) == count
    for col, count in expected_row_cols['cols'].items():
        assert len(board.cols[col]) == count
    for label, count in expected_row_cols['diag'].items():
        assert len(board.diagonals[label]) == count


testdata = [
    (
        BingoBoard(list(range(1, 26))),
        [1, 2, 3, 4, 5, 6, 7, 13],
        False
    )
]


@pytest.mark.parametrize("board, picks, expected", testdata)
def test_board_picks(board, picks, expected):
    for x in picks:
        board.pick_tile(x)

    assert board.has_won() == expected


if __name__ == '__main__':
    pytest.main()
