package tfe_solver

import org.apache.commons.lang3.StringUtils
import scala.reflect.ClassTag

object Util {

  /**
   * Apply fn n times, passing the output from the first application to the second and so on, and return the value of
   * the last application.
   * @param n
   * @param initial
   * @param fn
   * @tparam RetT
   */
  def applyN[RetT](n: Int, initial: RetT, fn: (RetT) => RetT): RetT = {
    Iterator.iterate(initial)(fn).zipWithIndex.
      take(n).
      dropWhile(_._2 < n - 1).
      next()._1
  }

  def emptyGrid(height: Int = 3, width: Int = 3): Array[Array[Int]] = {
    Array.fill(height, width)(TfeState.EmptyTile)
  }

  def pprint(state: TfeState): Unit = {
    pprint(state.tiles)
  }

  def pprint(grid: Array[Array[Int]]): Unit = {

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

  def retryUntilSuccess[R](fn: (() => R), maxTries: Int = 10): R = {
    val (ret: Option[R], exception: Exception) = Iterator.continually(
      try {
        (Option(fn()), null)
      } catch {
        case e: Exception => {
          (None, e)
        }
      }).zipWithIndex.dropWhile({ case((value, _), tries) => value.isEmpty && tries < maxTries}).next()._1

    ret.getOrElse(throw exception)
  }
}
