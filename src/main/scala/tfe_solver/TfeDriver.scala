package tfe_solver

import org.openqa.selenium._
import scala.collection.JavaConversions._

import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.interactions.Actions
import scala.sys.SystemProperties
import scala.Some

class TfeDriver(var driver: WebDriver = null) extends GameDriver[Symbol, Null, TfeState] {

  //TODO: config these, obviously
  val ChromeDriverLoc = "/Users/AMains/Downloads/chromedriver_mac32/chromedriver"
  val TfeUrl = "http://gabrielecirulli.github.io/2048/"

  val PosPattern = """tile-position-(\d+)-(\d+)""".r
  val ValuePattern = """tile-(\d+)""".r
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
          println("Failed to get state; retrying")
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
    val tiles = driver.findElements(By.className("tile")).map({
      ele => (getPosition(ele), getValue(ele))})



    val rtn = Util.emptyGrid(GameHeight, GameWidth)
    for (((i, j), value) <- tiles) {
      rtn(i)(j) = value
    }

    return new TfeState(rtn)
  }

  def getValue(tile: WebElement): Int = {
    val classAttr = tile.getAttribute("class")
    ValuePattern.findFirstIn(classAttr) match {
      case Some(ValuePattern(value)) => value.toInt
      case None => throw new IllegalArgumentException(s"No value class in element. Class attributes are: $classAttr")
    }
  }

  def getPosition(tile: WebElement): (Int, Int) = {
    val classAttr = tile.getAttribute("class")
    PosPattern.findFirstIn(classAttr) match {
      case Some(PosPattern(x, y)) => (x.toInt, y.toInt)
      case None =>
        throw new IllegalArgumentException(
        s"No position class ($PosPattern) in element. " +
        s"Class attributes are: $classAttr ")
    }
  }
  override def moveSecondPlayer(move: Null, curState: TfeState): TfeState = {
    val newTile = driver.findElement(By.className("tile-new"))
    curState.moveSecondPlayer((getValue(newTile), getPosition(newTile)))
  }

  override def moveFirstPlayer(move: Symbol, curState: TfeState): TfeState = {

    new Actions(driver).
      sendKeys(keyFor(move)).perform()
//    new TfeState(Util.emptyGrid())
    currentGameState()
  }

  override def quit(): Unit = driver.quit()
}