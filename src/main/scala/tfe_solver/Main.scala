package tfe_solver

import solver.GameState

object Main {

  def main(args: Array[String]): Unit = {
    val driver = new TfeDriver()

    println("Instantiated driver")
    val brain = new UpRightBrain()


    var curState = driver.currentGameState()

    while (! curState.gameOver()) {
      var move = brain.selectMove(curState)

      println(s"Selected move: $move")
      curState = driver.moveFirstPlayer(move)
    }
  }
}
