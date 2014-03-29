package tfe_solver

/**
 * Decorate a GameDriver to move slowly enough that it's moves can be observed.
 * @param wrappedDriver
 * @param delay
 */
class TestingDriver(wrappedDriver: GameDriver, delay: Long) extends GameDriver {

  override def move(direction: Symbol): Unit = {
      wrappedDriver.move(direction)
      Thread.sleep(delay)
  }
}
