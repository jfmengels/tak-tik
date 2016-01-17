import _ from 'lodash/fp'
import expect from 'expect'

import reducer from '../'
import putPieceOnBoard from './putPieceOnBoard'
import movePiece from './movePiece'

describe('game - moving a piece', () => {
  let startState

  beforeEach(() => {
    startState = putPieceOnBoard(2, reducer(undefined, { type: '@@INIT' }))
  })

  it('should be able to move a piece forward and set it as non-blocking', () => {
    const state = movePiece(2 * 16, 5, startState)
    expect(state.pieces[0].pos).toEqual(2 * 16 + 5)
    expect(state.pieces[0].isBlocking).toEqual(false)
  })

  it('should not re-set non-blocking piece to blocking', () => {
    const tmpState = movePiece(2 * 16, 5, startState)
    expect(tmpState.pieces[0].isBlocking).toEqual(false)

    const state = movePiece(2 * 16 + 5, 8, tmpState)
    expect(state.pieces[0].pos).toEqual(2 * 16 + 13)
    expect(state.pieces[0].isBlocking).toEqual(false)
  })

  it('should be able to loop over the board', () => {
    const state = movePiece(2 * 16, 41, startState)
    expect(state.pieces[0].pos).toEqual(9)
  })

  it('should not remove a non-blocking piece that is being passed over', () => {
    const tmpState = _.cloneDeep(putPieceOnBoard(0, startState))
    tmpState.pieces[0].pos = 5
    tmpState.pieces[0].isBlocking = false

    const state = movePiece(0, 9, tmpState)
    expect(state.pieces.length).toEqual(2)
    expect(state.pieces.filter((p) => p.player === 0 && p.pos === 9).length).toEqual(1)
    expect(state.pieces.filter((p) => p.player === 2 && p.pos === 5).length).toEqual(1)
  })

  it('should remove a non-blocking piece that is at the destination', () => {
    const tmpState = _.cloneDeep(putPieceOnBoard(0, startState))
    tmpState.pieces[0].pos = 5
    tmpState.pieces[0].isBlocking = false

    const state = movePiece(0, 5, tmpState)
    expect(state.pieces.length).toEqual(1)
    expect(state.pieces[0].pos).toEqual(5)
    expect(state.pieces[0].player).toEqual(0)
  })

  it('should set an error if a blocking piece is at the destination', () => {
    const tmpState = _.cloneDeep(putPieceOnBoard(0, startState))
    const pos = 2 * 16 - 5
    tmpState.pieces[1].pos = pos
    tmpState.pieces[1].isBlocking = false

    const state = movePiece(pos, 5, tmpState)
    expect(state.pieces.filter((p) => p.player === 0 && p.pos === pos).length).toEqual(1)
    expect(state.pieces.filter((p) => p.player === 2 && p.pos === 2 * 16).length).toEqual(1)
    expect(state.pieces.length).toEqual(2)
    expect(state.error).toEqual(`Can't remove a blocking piece from the board`)
  })

  it('should set an error if a blocking piece is on the path (not looping the board)', () => {
    const tmpState = _.cloneDeep(putPieceOnBoard(0, startState))
    const pos = 2 * 16 - 3
    tmpState.pieces[1].pos = pos
    tmpState.pieces[1].isBlocking = false

    const state = movePiece(pos, 5, tmpState)
    expect(state.pieces.filter((p) => p.player === 0 && p.pos === pos).length).toEqual(1)
    expect(state.pieces.filter((p) => p.player === 2 && p.pos === 2 * 16).length).toEqual(1)
    expect(state.pieces.length).toEqual(2)
    expect(state.error).toEqual(`Can't remove a blocking piece from the board`)
  })

  it('should set an error if a blocking piece is at destination (looping the board)', () => {
    const tmpState = _.cloneDeep(putPieceOnBoard(0, startState))
    const pos = 4 * 16 - 5
    tmpState.pieces[0].pos = pos
    tmpState.pieces[0].isBlocking = false

    const state = movePiece(pos, 5, tmpState)
    expect(state.pieces.filter((p) => p.player === 2 && p.pos === pos).length).toEqual(1)
    expect(state.pieces.filter((p) => p.player === 0 && p.pos === 0).length).toEqual(1)
    expect(state.pieces.length).toEqual(2)
    expect(state.error).toEqual(`Can't remove a blocking piece from the board`)
  })

  it('should remove a piece if one is present at the starting position', () => {
    const tmpState = _.cloneDeep(startState)
    tmpState.pieces[0].pos = 0
    tmpState.pieces[0].isBlocking = false

    const state = putPieceOnBoard(0, tmpState)

    expect(state.players[2].piecesInStock).toEqual(4)
    expect(state.players[0].piecesInStock).toEqual(3)
    expect(state.pieces.length).toEqual(1)

    const piece = state.pieces[0]
    expect(piece.player).toEqual(0)
    expect(piece.isBlocking).toEqual(true)
    expect(piece.pos).toEqual(0)
    expect(piece.isAtDestination).toEqual(false)
  })
})
