package tfe_solver

import solver.GameState

/**
 * Decorate a GameDriver to move slowly enough that it's moves can be observed.
 * @param wrappedDriver
 * @param delay
 */
class TestingDriver[FirstPlayerMove, SecondPlayerMove](wrappedDriver: GameDriver[FirstPlayerMove, SecondPlayerMove],
                                                       delay: Long) extends GameDriver[FirstPlayerMove, SecondPlayerMove]
{

//  override def move(direction: Symbol): Unit = {
//      wrappedDriver.move(direction)
//      Thread.sleep(delay)
//  }
  override def currentGameState(): GameState = {
    wrappedDriver.currentGameState()
  }

  override def moveSecondPlayer(move: SecondPlayerMove): GameState = {
    wrappedDriver.moveSecondPlayer(move)
  }

  override def moveFirstPlayer(move: FirstPlayerMove): GameState = {
    val ret = wrappedDriver.moveFirstPlayer(move)
    Thread.sleep(delay)
    return ret
  }
}
