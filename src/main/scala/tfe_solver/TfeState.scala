package tfe_solver

import solver.GameState
import org.apache.commons.lang3.StringUtils

object TfeState {
  val WinningNumber = 2048

  val Directions = Map('up -> (-1, 0), 'down -> (1, 0), 'left -> (0, -1), 'right -> (0, 1))
  val EmptyTile = -1
}

class TfeState(val tiles: Array[Array[Int]]) extends GameState {

  val height = tiles.length

  //should check for length here probably
  val width = tiles(0).length

  /**
   * Various ways of traversing the grid
   */
  class GridView(array: Array[Array[Int]]) {
    //TODO: make the WithIndex bit a decorator/transformation
    def transposedWithIndex(): Iterator[(Int, (Int, Int))] = {
      for (
        j <- 0.until(width).iterator;
        i <- 0.until(height).iterator
      ) yield (tiles(i)(j), (i, j))
    }

    def transposed(): Iterator[Int] = {
      for (
        j <- 0.until(width).iterator;
        i <- 0.until(height).iterator
      ) yield tiles(i)(j)
    }

    def iterWithIndex(): Iterator[(Int, (Int, Int))] = {
      return for (
        i <- 0.until(height).iterator;
        j <- 0.until(width).iterator
      )
        yield (tiles(i)(j), (i, j))
    }

    def iter(): Iterator[Int] = {
      for (
        i <- 0.until(height).iterator;
        j <- 0.until(width).iterator
      )
        yield tiles(i)(j)
    }

    def iterRows: Iterator[Seq[Int]] = {
      for (
        i <- 0.until(height).iterator
      ) yield tiles(i)
    }

    def iterColumns: Iterator[Seq[Int]] = {
      transposed().grouped(height)
    }

  }

  val gridView = new GridView(tiles)


  /**
   * Create the GameState which would result from performing move
   * @param move
   */
  override def transition(move: Symbol): TfeState = {
    val newGrid = up()
    // val newGrid = move match {
    //   case 'up => {up()}
    // }
    return new TfeState(newGrid)
  }

  def up(): Array[Array[Int]] = {

    val rtn = Array.fill(height, width)(TfeState.EmptyTile)

    //Space fill and merge
    for ((col, j) <- gridView.iterColumns.zipWithIndex) {
      var insertPos = 0

      //invariant: insertPos < height
      for (value <- col.filter(_ != TfeState.EmptyTile)) {
        //value is non empty
        if (rtn(insertPos)(j) == TfeState.EmptyTile) {
          rtn(insertPos)(j) = value
        } else if (rtn(insertPos)(j) == value) {
          //merge
          rtn(insertPos)(j) = value * 2
          insertPos += 1
        } else {
          //can't merge and not empty, so place it in the next slot
          insertPos += 1
          rtn(insertPos)(j) = value
        }
      }
    }
    rtn
  }


  /**
   *
   * @return a list of all moves possible from this state
   */
  override def possibleMoves(): List[Symbol] = {

    return gridView.iterWithIndex().filter(_._1 != TfeState.EmptyTile).flatMap(
      {case (tile, (i, j)) =>
         (for ((dirName, move) <- TfeState.Directions.iterator if canMove(tile, (i, j), move))
            yield dirName
            )
      }).toList
  }

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

  override def gameOver(): Boolean = possibleMoves().isEmpty || tiles.contains(TfeState.WinningNumber)

}
