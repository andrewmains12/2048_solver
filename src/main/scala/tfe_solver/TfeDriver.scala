package tfe_solver

import org.openqa.selenium.{WebElement, By, Keys, WebDriver}
import scala.collection.JavaConversions._

import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.interactions.Actions
import scala.sys.SystemProperties
import solver.GameState

class TfeDriver(var driver: WebDriver = null) extends GameDriver {

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

  def move(direction: Symbol) = {
    new Actions(driver).sendKeys(keyFor(direction)).perform()
  }

  /**
   * Extract the current game state from the game
   * @return
   */
  def currentGameState(): GameState = {
    val tiles = driver.findElements(By.className("tile"))

    return new TfeState(Array.ofDim[Int](2,2))
    //tiles.map({tile =>
//      tile.
//    }))

  }
}
