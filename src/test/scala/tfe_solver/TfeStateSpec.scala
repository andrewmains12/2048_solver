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


}
