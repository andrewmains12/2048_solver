package tfe_solver

import solver.GameState

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

    def rotatedRight: Iterator[Iterator[Int]] = {
      for (col <- iterColumns)
        yield col.reverseIterator
    }

    def flipped: Iterator[Iterator[Int]] = {
      for (row <- tiles.reverseIterator)
        yield row.reverseIterator
    }

//    def flippedLeftRight: Iterator[Iterator[Int]] = {
//      for
//    }

    def rotatedLeft: Iterator[Iterator[Int]] = {
      for (j <- (width - 1).until(-1, -1).iterator)
        yield
          for (i <- 0.until(height).iterator)
            yield tiles(i)(j)
    }
  }

  val gridView = new GridView(tiles)


  /**
   * Implicit conversion from Iterator[Seq[Int]] to deal with the fact that container types aren't covariant
   * (meaning Iterator[Iterator[Int]] won't work with Seq[Seq[Int]], for instance
   * @param nestedIter
   * @return
   */

  implicit def toIntIter(nestedIter: Iterator[Seq[Int]]): Iterator[Iterator[Int]] = {
    for (iter <- nestedIter)
      yield for (value <- iter.iterator)
        yield value
  }

  /**
   * Create the GameState which would result from performing move
   * @param move
   */
  override def transition(move: Symbol): TfeState = {
    var newGrid = move match {
      case 'left => moveLeft(gridView.iterRows)
      case 'up => moveLeft(gridView.rotatedLeft)
      case 'right => moveLeft(gridView.flipped)
      case 'down => moveLeft(gridView.rotatedRight)
    }

    //Reverse the flipping from before
    newGrid = move match {
      case 'left => newGrid
      case 'up => Util.rotateRight(newGrid)
      case 'right => Util.flip(newGrid)
      case 'down => Util.rotateLeft(newGrid)
    }

    // val newGrid = move match {
    //   case 'up => {up()}
    // }
    return new TfeState(newGrid)
  }

  /**
   * Create a new grid representing the result of shifting
   * @param view
   * @return
   */
  def moveLeft(view: Iterator[Iterator[Int]]): Array[Array[Int]] = {

    val rtn = Array.fill(height, width)(TfeState.EmptyTile)

    //Space fill and merge
    for ((row, i) <- view.zipWithIndex) {
      var insertPos = 0

      //invariant: insertPos < height
      for (value <- row.filter(_ != TfeState.EmptyTile)) {
        //value is non empty
        if (rtn(i)(insertPos) == TfeState.EmptyTile) {
          rtn(i)(insertPos) = value
        } else if (rtn(i)(insertPos) == value) {
          //merge
          rtn(i)(insertPos) = value * 2
          insertPos += 1
        } else {
          //can't merge and not empty, so place it in the next slot
          insertPos += 1
          rtn(i)(insertPos) = value
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

  override def gameOver(): Boolean = possibleMoves().isEmpty || tiles.contains(TfeState.WinningNumber)

}
