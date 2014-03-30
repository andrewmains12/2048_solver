package tfe_solver

import org.apache.commons.lang3.StringUtils

object Util {

  /**
   * Apply fn n times, passing the output from the first application to the second and so on.
   * @param n
   * @param initial
   * @param fn
   * @tparam RetT
   */
  def applyN[RetT](n: Int, initial: RetT, fn: (RetT) => RetT): RetT = {

    var curArg = initial

    for (i <- 0.until(n)) {
      curArg = fn(curArg)
    }

    return curArg
  }



  def rotateRight(grid: Array[Array[Int]]):Array[Array[Int]] =  {
    val rtn = Array.ofDim[Int](grid.length, grid(0).length)

    //transpose
    for((row, i) <- grid.iterator.zipWithIndex;
        (value, j) <- row.zipWithIndex
    ) {
      rtn(j)(i) = value
    }

    //reverse rows in place
    for (row <- rtn.iterator)
      reverseInPlace(row)

    rtn
  }

  /**
   * Reverse an array in place. Useful to prevent allocating rows all over the place for no reason.
   * @param array
   * @tparam T
   */
  def reverseInPlace[T](array: Array[T]) {
    for (j <- 0.until(array.length / 2)) {
      val tmp = array(j)
      array(j) = array(array.length - j - 1)
      array(array.length - j - 1) = tmp
    }
  }

  /**
   * Not efficient; goes by way of rotateRight 3 times. Doesn't matter for now
   * @param grid
   * @return
   */
  def rotateLeft(grid: Array[Array[Int]]) = applyN(3, grid, rotateRight)

  /**
   * Not efficient; goes by way of rotateRight twice. Doesn't matter for now
   * @param grid
   */
  def flip(grid: Array[Array[Int]]) = applyN(2, grid, rotateRight)


  def emptyGrid(height: Int = 3, width: Int = 3): Array[Array[Int]] = {
    Array.fill(3, 3)(TfeState.EmptyTile)
  }

  def pprint(grid: Array[Array[_]]) = {

    //Length of each cell is content length + padding
    val cellLengths = grid.map({row => row.map(_.toString.length).max + 2})

    val separator = s"+${cellLengths.map("-" * _).mkString("+")}+"
    println(separator)
    grid.foreach({row =>
      val paddedCells = row.zip(cellLengths).map({case (value, length) =>
        StringUtils.center(value.toString, length)
      })
      println(s"|${paddedCells.mkString("|")}|")
      println(separator)
    }
    )
  }
}
