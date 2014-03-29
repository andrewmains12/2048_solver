package tfe_solver

import solver.{GameState, Brain}

class UpRightBrain extends Brain {

  val movePrecedence = List('up, 'right, 'left, 'down)
  
  override def selectMove(state: GameState): Symbol = {
    val moves = state.possibleMoves

    if (moves.isEmpty)
      throw new IllegalArgumentException("Game is over")

    for (move <- movePrecedence) {
      if (moves.contains(move)) {
        return move
      }
    }

    throw new IllegalStateException(
      "No understood moves from state (possible moves: $moves; expected moves: $movePrecedence"
    )
  }
}
