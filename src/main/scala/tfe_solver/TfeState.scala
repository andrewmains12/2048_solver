package tfe_solver

import solver.GameState
import org.apache.commons.lang3.StringUtils

class TfeState(val tiles: Array[Array[Int]]) extends GameState {

  //top left is 0,0
  val Directions = Map('up -> (-1, 0), 'down -> (1, 0), 'left -> (0, -1), 'right -> (0, 1))
  /**
   * Create the GameState which would result from performing move
   * @param move
   */
  override def transition(move: Symbol): GameState = {
    return new TfeState(Array.ofDim[Int](2, 2))
  }

  /**
   *
   * @return a list of all moves possible from this state
   */
  override def possibleMoves(): List[Symbol] = {

    val moves = collection.mutable.Set[Symbol]()
    tiles.view.zipWithIndex.foreach({rowWithIndex =>
      val row = rowWithIndex._1
      val i = rowWithIndex._2

      row.filter(_ != EmptyTile).view.zipWithIndex.foreach({
        tileWithIndex =>
          val tile = tileWithIndex._1
          val j = tileWithIndex._2

          moves ++= (for ((dirName, move) <- Directions if canMove(tile, (i, j), move))
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

    val outOfBounds = (nextX < 0 || nextX >= tiles.length ||
      nextY < 0 || nextY >= tiles(0).length)

    if (outOfBounds) return false
    val neighborTile = tiles(nextX)(nextY)
    
    //Empty or mergeable
    return neighborTile == EmptyTile || neighborTile == tileVal
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


}
