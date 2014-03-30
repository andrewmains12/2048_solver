package tfe_solver

import org.scalatest.{Matchers, FunSpec}

class TfeStateSpec extends FunSpec with Matchers with TransitionBehaviors {

  describe("possibleMoves") {

    def doTest(grid: Array[Array[Int]], desired: Iterable[Symbol]) {
      new TfeState(
        grid
      ).possibleMoves().toSet should equal(desired.toSet)
    }

    describe("when the grid is empty") {
      it("should return List()") {
        doTest(Util.emptyGrid(), List())
      }
    }

    describe("with a single tile in the middle") {
      it("should return all moves") {
        val grid = Util.emptyGrid()
        grid(1)(1) = 4

        doTest(grid, TfeState.Directions.keys)
      }
    }

    describe("with a tile blocking the left") {
      it("should not return left") {
        val grid = Util.emptyGrid()
        grid(1)(1) = 4
        grid(1)(0) = 2

        doTest(grid, TfeState.Directions.keySet.diff(Set('left)))
      }
    }

    describe("with a mergeable tile to the left") {
      it("should return left") {
        val grid = Util.emptyGrid()
        grid(1)(1) = 4
        grid(1)(0) = 4

        doTest(grid, TfeState.Directions.keys)
      }
    }

  }
 
  describe("transition") {
    describe("left") {
      it should behave like merging('left)
    }

    describe("up") {
      it should behave like merging('up)
    }

    describe("right") {
      it should behave like merging('right)
    }

    describe("down") {
      it should behave like merging('down)
    }
    
  }


}
