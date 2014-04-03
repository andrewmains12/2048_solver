package tfe_solver

import solver.GameState

/**
 * Decorate a GameDriver to move slowly enough that it's moves can be observed.
 * @param wrappedDriver
 * @param delay
 */
class TestingDriver[FirstPlayerMove, SecondPlayerMove, StateClass <: GameState]
  (wrappedDriver: GameDriver[FirstPlayerMove, SecondPlayerMove, StateClass],
   delay: Long) extends GameDriver[FirstPlayerMove, SecondPlayerMove, StateClass]
{

//  override def move(direction: Symbol): Unit = {
//      wrappedDriver.move(direction)
//      Thread.sleep(delay)
//  }
  override def currentGameState(): StateClass = {
    wrappedDriver.currentGameState()
  }

  override def moveSecondPlayer(move: SecondPlayerMove, currentState: StateClass): StateClass = {
    wrappedDriver.moveSecondPlayer(move, currentState)
  }

  override def moveFirstPlayer(move: FirstPlayerMove, currentState: StateClass): StateClass = {
    val ret = wrappedDriver.moveFirstPlayer(move, currentState)
    Thread.sleep(delay)
    return ret
  }
}
