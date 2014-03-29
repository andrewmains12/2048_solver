package tfe_solver.util

object MultiDimIterators {

  /**
   * Base class for iterators over a two dimensional array
   * @param dims
   * @param updateOrder Order to update the loop indices in. First value is the innermost loop
   */
  class MultiDimIndex(dims: Array[Int],
                      updateOrder: Array[Int]) {

    //i, j
    val indices = Array.ofDim[Int](dims.length)

    def hasNext(): Boolean = {
      return indices.zip(dims).forall({p => p._1 < p._2})
    }

    def updateIndices() {

      //Increment the innermost loop
      indices(updateOrder(0)) += 1
      for ((toUpdate, i) <- updateOrder.slice(0, updateOrder.length - 1).zipWithIndex) {
        //We're starting from index 1 in the list; update the index accordingly
        val curIndex = indices(toUpdate)

        //This loop is finished; reset and increment the next outermost
        if (curIndex == dims(toUpdate)) {
          indices(toUpdate) = 0
          indices(updateOrder(i + 1)) += 1
        }
      }
    }

    /**
     * Return the value of the nth index. Short for multiDimIndex.indices(n)
     * @param n
     * @return
     */
    def apply(n: Int): Int = {
      return indices(n)
    }
  }

  abstract class TwoDimIteratorBase[ArrayT, RetT](array: Array[Array[ArrayT]], transpose: Boolean = false)
    extends Iterator[RetT] {

    val indices = new MultiDimIndex(
      dims = Array(array.length, if (array.length > 0) array(0).length else 0),
      updateOrder = if (transpose) Array(0, 1) else Array(1, 0)
    )

    override def hasNext(): Boolean = indices.hasNext

    def updateIndices() = indices.updateIndices()

    def currentVal(): ArrayT = array(indices(0))(indices(1))
  }

  class TwoDimIteratorWithIndex[T](array: Array[Array[T]], transpose: Boolean = false)
    extends TwoDimIteratorBase[T, (T, (Int, Int))](array, transpose) {

    override def next(): (T, (Int, Int)) = {
      val rtn = (currentVal(), (indices(0), indices(1)))
      updateIndices()
      return rtn
    }
  }

  class TwoDimIterator[T](array: Array[Array[T]], transpose: Boolean = false)
    extends TwoDimIteratorBase[T, T](array, transpose) {

    override def next(): T = {
      val rtn = currentVal()
      updateIndices()
      return rtn
    }
  }


}
