package tfe_solver

import org.scalatest.{Matchers, FunSpec}

trait TransitionBehaviors { this: FunSpec with Matchers =>

  def doTest(direction: Symbol, inputGrid: Array[Array[Int]], desiredGrid: Array[Array[Int]]) = {

    //Examples are all from the perspective of a left-ward move; perform rotations to get examples
    //for the other directions2
    val rotateGrid = {grid: Array[Array[Int]] =>
      val view = GridView(grid)
      (direction match {
        case 'left => view.iterRows
        case 'up => view.rotatedRight
        case 'right => view.flippedLeftRight
        case 'down => view.rotatedLeft
      }).map(_.toArray).toArray
    }
    new TfeState(rotateGrid(inputGrid)).transition(direction).tiles should equal(rotateGrid(desiredGrid))
  }

  def merging(direction: Symbol) {
    val e = TfeState.EmptyTile
    def test = doTest(direction = direction, _: Array[Array[Int]], _: Array[Array[Int]])

    describe("with all empty tiles") {
      it("should do nothing") {
        test(Util.emptyGrid(), Util.emptyGrid())
      }
    }

    describe("with adjacent equal tiles") {
      it("should merge") {
        test(
          Array(
            Array(2, 2, e),
            Array(e, e, e),
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
            Array(2, 3, e),
            Array(e, e, e),
            Array(e, e, e)
          ),
          Array(
            Array(2, 3, e),
            Array(e, e, e),
            Array(e, e, e)
          ))
      }
    }

    describe("with non-adjacent, non-equal tiles") {
      it("should fill in the gaps") {
        test(
          Array(
            Array(2, e, 3),
            Array(e, e, e),
            Array(e, e, e)
          ),
          Array(
            Array(2, 3, e),
            Array(e, e, e),
            Array(e, e, e)
          ))
      }
    }

    describe("with equal tiles separated by empty tiles") {
      it("should merge the tiles") {

        test(
          Array(
            Array(2, e, 2),
            Array(e, e, e),
            Array(e, e, e)
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
            Array(2, 2, 2, 2),
            Array(e, e, e, e),
            Array(e, e, e, e),
            Array(e, e, e, e)

          ),
          Array(
            Array(4, 4, e, e),
            Array(e, e, e, e),
            Array(e, e, e, e),
            Array(e, e, e, e)

          ))
      }
    }

    describe("when a merge could cause another merge") {
      it("should not cascade") {
        test(
          Array(
            Array(4, 2, 2),
            Array(e, e, e),
            Array(e, e, e)
          ),
          Array(
            Array(4, 4, e),
            Array(e, e, e),
            Array(e, e, e)
          ))
      }
    }

  }

}

