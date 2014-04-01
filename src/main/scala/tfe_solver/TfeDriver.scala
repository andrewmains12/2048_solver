package tfe_solver

import org.openqa.selenium._
import scala.collection.JavaConversions._

import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.interactions.Actions
import scala.sys.SystemProperties
import solver.GameState
import scala.Some

class TfeDriver(var driver: WebDriver = null) extends GameDriver[Symbol, Null] {

  //TODO: config these, obviously
  val ChromeDriverLoc = "/Users/AMains/Downloads/chromedriver_mac32/chromedriver"
  val TfeUrl = "http://gabrielecirulli.github.io/2048/"

  val GameWidth = 4
  val GameHeight = 4

  driver = {
    if (driver == null) {
      var sysProps = new SystemProperties()
      sysProps += "webdriver.chrome.driver" -> ChromeDriverLoc
      new ChromeDriver()
    } else {
      driver
    }
  }

  driver.get(TfeUrl)

  val keyFor = Map(
    'up -> Keys.ARROW_UP,
    'down -> Keys.ARROW_DOWN,
    'left -> Keys.ARROW_LEFT,
    'right -> Keys.ARROW_RIGHT
  )


//  def mov(direction: Symbol, player: Symbol) = {
//
//
//  }


  override def currentGameState(): TfeState = {
    var success = false
    while (true) {
      try {
        return getCurrentGameState()
      } catch {
        case e:Exception => {

        }
      }
    }

    return new TfeState(Array.ofDim[Int](3, 3))
  }

  /**
   * Extract the current game state from the game
   * @return
   */
  def getCurrentGameState(): TfeState = {
    val tiles = driver.findElements(By.className("tile")).map({ele =>
      val classAttr = ele.getAttribute("class")

      val PosPattern = """tile-position-(\d+)-(\d+)""".r

      val MaxTries = 100
      PosPattern.findFirstIn(classAttr) match {
        case Some(PosPattern(i, j)) => {
          //We do the opposite
          var success = false
          var tries = 0
          var result = ((-1, -1), 1)
          val innerEle = ele.findElement(By.className("tile-inner"))

              //This guy 1-indexes his arrays, and marks his tiles with (col, row)
          ((j.toInt - 1, i.toInt - 1), innerEle.getText.toInt)

          }
      }

    })

    val rtn = Util.emptyGrid(GameHeight, GameWidth)
    for (((i, j), value) <- tiles) {
      rtn(i)(j) = value
    }

    return new TfeState(rtn)
  }

  override def moveSecondPlayer(move: Null): TfeState = {
    currentGameState()
  }

  override def moveFirstPlayer(move: Symbol): TfeState = {

    new Actions(driver).
      sendKeys(keyFor(move)).perform()
//    new TfeState(Util.emptyGrid())
    currentGameState()
  }
}