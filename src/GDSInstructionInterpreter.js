const GDSInstructionStepper = require("./GDSInstructionStepper");

const defaultState = {
  scriptScope: {
    dialog: ""
  },
  stack: []
};

class GDSInstructionInterpreter {
  constructor(instructions, context = null, state = defaultState) {
    this.instructions = instructions;
    this.context = null;
    this.state = state;
    this.stepper = new GDSInstructionStepper(instructions);
  }

  next() {
    if (this.stepper.done) {
      return {
        value: null,
        done: true
      };
    }

    this.state.scriptScope.dialog = "";

    for (const step of this.stepper) {
      if (step.action === "exit" || step.action === "start") {
        continue;
      }

      const { instruction } = step;

      if (instruction.type === "Pause") {
        break;
      }

      if (instruction && typeof instruction.execute === "function") {
        instruction.execute(this.state.scriptScope);
      }
    }

    return {
      value: this.state.scriptScope,
      done: false
    };
  }

  [Symbol.iterator]() {
    return this;
  }
}

module.exports = GDSInstructionInterpreter;
