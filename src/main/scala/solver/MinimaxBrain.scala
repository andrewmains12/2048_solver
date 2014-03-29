package solver

class MinimaxBrain(eval:(GameState) => Int,
              cutoffTest:(GameState, Int) => Boolean,
              whichPlayer:(GameState) => Symbol,  // 'max or 'min
              nextStates:(GameState) => List[GameState]
              ) extends Brain {

  // alpha
  var bestForMax = Int.MinValue

  //beta
  var bestForMin = Int.MaxValue

  def selectMove(state:GameState): Symbol = {
      return state.possibleMoves().maxBy(
          {move => valueOf(state.transition(move), 0)})
  }

  protected def valueOf(state: GameState, depth: Int): Int = {
    if (cutoffTest(state, depth)) return eval(state)

    val nextValues = nextStates(state).map({valueOf(_, depth + 1)})

    return if (whichPlayer(state) == 'max) nextValues.max
    else nextValues.min
  }

}
