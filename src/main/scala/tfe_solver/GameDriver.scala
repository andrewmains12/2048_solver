package tfe_solver

import solver.GameState

trait GameDriver[FirstPlayerMove, SecondPlayerMove, StateClass <: GameState] {

  def moveFirstPlayer(move: FirstPlayerMove, curState: StateClass): StateClass

  def moveSecondPlayer(move: SecondPlayerMove, curState: StateClass): StateClass

  def currentGameState(): StateClass

  def quit() = {

  }

}
