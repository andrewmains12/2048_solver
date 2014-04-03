package tfe_solver

import solver.GameState

object Main {

  def main(args: Array[String]): Unit = {

    var moves = 0
    val driver = new TfeDriver()

    println("Instantiated driver")
    val brain = new UpRightBrain()


    try {
      var curState = driver.currentGameState()

      while (! curState.gameOver() && moves < 100) {
        val move = brain.selectMove(curState)

        println(s"Selected move: $move")
        curState = driver.moveFirstPlayer(move, curState)
        Util.pprint(curState)

        curState = driver.moveSecondPlayer(null, curState)
        moves += 1
      }
    }
    finally {
      driver.quit()
    }
    return
  }
}
