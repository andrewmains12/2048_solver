package tfe_solver

import org.openqa.selenium.{Keys, WebDriver}
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.interactions.Actions
import scala.sys.SystemProperties

class TfeDriver(var driver: WebDriver = null){

  //TODO: config these, obviously
  val ChromeDriverLoc = "/Users/AMains/Downloads/chromedriver_mac32/chromedriver"
  val TfeUrl = "http://gabrielecirulli.github.io/2048/"

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
}
