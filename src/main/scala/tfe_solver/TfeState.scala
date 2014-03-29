package tfe_solver

import solver.GameState
import org.apache.commons.lang3.StringUtils

object TfeState {
  val Directions = Map('up -> (-1, 0), 'down -> (1, 0), 'left -> (0, -1), 'right -> (0, 1))
  val EmptyTile = -1
}

class TfeState(val tiles: Array[Array[Int]]) extends GameState {

  class GridView {

    def transposed() = for (
      j <- 0.until(tiles(0).length);
      i <- 0.until(tiles.length))
       yield tiles(i)(j)

    def indexed() = for (
      i <- 0.until(tiles.length);
      j <- 0.until(tiles(0).length)
    )
       yield ((i, j), tiles(i)(j))
  }

  val view = new GridView()


  //top left is 0,0
  /**
   * Create the GameState which would result from performing move
   * @param move
   */
  override def transition(move: Symbol): GameState = {
    return new TfeState(Array.ofDim[Int](2,2))
  }

  /**
   *
   * @return a list of all moves possible from this state
   */
  override def possibleMoves(): List[Symbol] = {

    val moves = collection.mutable.Set[Symbol]()
    tiles.view.zipWithIndex.foreach(
      {case (row, i) =>
      row.view.zipWithIndex.filter(_._1 != TfeState.EmptyTile).foreach({
        case(tile, j) =>
          moves ++= (for ((dirName, move) <- TfeState.Directions.iterator if canMove(tile, (i, j), move))
          yield dirName
            )
      })
    })

    return moves.toList
  }



  val EmptyTile = -1

  def canMove(tileVal: Int, curPos: Tuple2[Int, Int], move: Tuple2[Int, Int]): Boolean = {
    val nextX = curPos._1 + move._1
    val nextY = curPos._2 + move._2

    val outOfBounds = nextX < 0 || nextX >= tiles.length ||
      nextY < 0 || nextY >= tiles(0).length

    if (outOfBounds) {
      return false
    }
    val neighborTile = tiles(nextX)(nextY)

    //Empty or mergeable
    val movable = neighborTile == TfeState.EmptyTile || neighborTile == tileVal
    return movable

  }

  def pprint() = {

    //Length of each cell is content length + padding
    val cellLengths = tiles.map({row => row.map(_.toString.length).max + 2})

    val separator = s"+${cellLengths.map("-" * _).mkString("+")}+"
    println(separator)
    tiles.foreach({row =>
      val paddedCells = row.zip(cellLengths).map({case (value, length) =>
        StringUtils.center(value.toString, length)
      })
      println(s"|${paddedCells.mkString("|")}|")
      println(separator)
    }
    )
  }

  override def gameOver(): Boolean = possibleMoves().isEmpty

}
