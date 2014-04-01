package tfe_solver

import solver.GameState

trait GameDriver[FirstPlayerMove, SecondPlayerMove] {

  def moveFirstPlayer(move: FirstPlayerMove): GameState

  def moveSecondPlayer(move: SecondPlayerMove): GameState

  def currentGameState(): GameState

}
