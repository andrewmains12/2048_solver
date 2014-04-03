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
  val gridView = GridView(tiles)


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
    val newGrid = move match {
      case 'left => moveLeft(gridView.iterRows)
      case 'up => moveLeft(gridView.rotatedLeft)
      case 'right => moveLeft(gridView.flippedLeftRight)
      case 'down => moveLeft(gridView.rotatedRight)
    }

    // val newGrid = move match {
    //   case 'up => {up()}
    // }
    return new TfeState(
      (move match {
        case 'left => GridView(newGrid).iterRows
        case 'up => GridView(newGrid).rotatedRight
        case 'right => GridView(newGrid).flippedLeftRight
        case 'down => GridView(newGrid).rotatedLeft
      }).map(_.toArray).toArray
    )
  }

  def moveSecondPlayer(move: (Int, (Int, Int))): TfeState = {
    val (value, (x, y)) = move

    val newTiles = tiles.clone()

    newTiles(x)(y) = value

    return new TfeState(newTiles)
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
         for ((dirName, move) <- TfeState.Directions.iterator if canMove(tile, (i, j), move))
            yield dirName

      }).toSet.toList
  }

  def canMove(tileVal: Int, curPos: (Int, Int), move: (Int, Int)): Boolean = {
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
