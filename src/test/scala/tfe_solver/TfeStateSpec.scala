package tfe_solver

import org.scalatest.{Matchers, FunSpec}

class TfeStateSpec extends FunSpec with Matchers {


  def emptyGrid(height: Int = 3, width: Int = 3): Array[Array[Int]] = {
    Array.fill(3, 3)(TfeState.EmptyTile)
  }

  describe("possibleMoves") {

    def doTest(grid: Array[Array[Int]], desired: Iterable[Symbol]) {
      new TfeState(
        grid
      ).possibleMoves().toSet should equal(desired.toSet)
    }

    describe("when the grid is empty") {
      it("should return List()") {
        doTest(emptyGrid(), List())
      }
    }

    describe("with a single tile in the middle") {
      it("should return all moves") {
        val grid = emptyGrid()
        grid(1)(1) = 4

        doTest(grid, TfeState.Directions.keys)
      }
    }

    describe("with a tile blocking the left") {
      it("should not return left") {
        val grid = emptyGrid()
        grid(1)(1) = 4
        grid(1)(0) = 2

        doTest(grid, TfeState.Directions.keySet.diff(Set('left)))
      }
    }

    describe("with a mergeable tile to the left") {
      it("should return left") {
        val grid = emptyGrid()
        grid(1)(1) = 4
        grid(1)(0) = 4

        doTest(grid, TfeState.Directions.keys)
      }
    }

  }


  trait TransitionBehaviors { this: FunSpec =>

    def merging(state: TfeState, direction: Symbol) {

      it("should merge equivalent tiles in") {

      }

      it("should not merge more than once") {

      }
    }

  }

  describe("transition") {

    //convenience alias
    val e = TfeState.EmptyTile

    def doTest(direction: Symbol, inputGrid: Array[Array[Int]], desiredGrid: Array[Array[Int]]) = {
      val input = new TfeState(inputGrid)

      input.transition(direction).tiles should equal(desiredGrid)
    }

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

      //rotation
      for((row, i) <- grid.iterator.zipWithIndex;
          (value, j) <- row.reverseIterator.zipWithIndex
      ) {
        rtn(j)(i) = value
      }

      rtn
    }

    /**
     * Not efficient; goes by way of rotateRight 3 times
     * @param grid
     * @return
     */
    def rotateLeft(grid: Array[Array[Int]]) = applyN(3, grid, rotateRight)

    /**
     * Not efficient; goes by way of rotateRight twice. Doesn't matter for now
     * @param grid
     */
    def flip(grid: Array[Array[Int]]) = applyN(3, grid, rotateRight)


    describe("up") {
      def test = doTest(direction = 'up, _: Array[Array[Int]], _: Array[Array[Int]])

      describe("with all empty tiles") {
        it("should do nothing") {
          test(emptyGrid(), emptyGrid())
        }
      }

      describe("with adjacent equal tiles") {
        it("should merge") {
          test(
            Array(
              Array(2, e, e),
              Array(2, e, e),
              Array(e, e, e)
            ),
            Array(
              Array(4, e, e),
              Array(e, e, e),
              Array(e, e, e)
            ))
        }
      }

      describe("with adjacent non equal tiles") {
        it ("should not merge") {
          test(
            Array(
              Array(2, e, e),
              Array(3, e, e),
              Array(e, e, e)
            ),
            Array(
              Array(2, e, e),
              Array(3, e, e),
              Array(e, e, e)
            ))
        }
      }

      describe("with non-adjacent, non-equal tiles") {
        it("should fill in the gaps") {
          test(
            Array(
              Array(2, e, e),
              Array(e, e, e),
              Array(3, e, e)
            ),
            Array(
              Array(2, e, e),
              Array(3, e, e),
              Array(e, e, e)
            ))
        }
      }

      describe("with equal tiles separated by empty tiles") {
        it("should merge the tiles") {

          test(
            Array(
                Array(2, e, e),
                Array(e, e, e),
                Array(2, e, e)
          ),
            Array(
                Array(4, e, e),
                Array(e, e, e),
                Array(e, e, e)
          ))
        }
      }

      describe("with a run of equal tiles") {
        it("should merge starting at the top") {
          test(
            Array(
              Array(2, e, e, e),
              Array(2, e, e, e),
              Array(2, e, e, e),
              Array(2, e, e, e)

            ),
            Array(
              Array(4, e, e, e),
              Array(4, e, e, e),
              Array(e, e, e, e),
              Array(e, e, e, e)

            ))
        }
      }

      describe("when a merge could cause another merge") {
        it("should not cascade") {
          test(
            Array(
              Array(4, e, e),
              Array(2, e, e),
              Array(2, e, e)
            ),
            Array(
              Array(4, e, e),
              Array(4, e, e),
              Array(e, e, e)
            ))
        }
      }
    }
  }


}
