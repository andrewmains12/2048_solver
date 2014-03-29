package solver

trait Brain {

  def selectMove(state:GameState): Symbol

}
