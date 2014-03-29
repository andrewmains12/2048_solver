package solver

trait GameState {

  /**
   *
   * @return a list of all moves possible from this state
   */
    def possibleMoves(): List[Symbol]

  /**
   * Create the GameState which would result from performing move
   * @param move
   */
    def transition(move: Symbol): GameState


}
