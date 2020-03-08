const { getInstruction, getInstructionChildren } = require("./instructionUtils");

const defaultState = {
	done: false,
	path: null,
	exiting: false
};

class GDSInstructionStepper {
	constructor(instructions, state = defaultState) {
		if (!instructions) {
			throw new Error(`"instructions" parameter is required.`);
		}

		this.instructions = instructions;
		this.state = state;
	}

	_getResult(action = null) {
		return {
			value: {
				action,
				instruction: this.instruction,
				path: this.path
			},
			done: this.done
		};
	}

	_stepValidate() {
		if (!this.path) {
			throw new Error("Cannot step further.");
		}
	}

	_getInstruction(path = this.path) {
		return getInstruction(this.instructions, path);
	}

	get state() {
		return {
			done: this.done,
			path: this.path,
			exiting: this.exiting
		};
	}

	set state(newState) {
		const {
			done,
			path,
			exiting
		} = newState;

		this.done = done;
		this.path = path;
		this.exiting = exiting;
		this.instruction = !done && path ? this._getInstruction() : null;
	}

	start() {
		this.done = false;
		this.path = [];
		this.instruction = this._getInstruction();

		return this._getResult("start");
	}

	enter() {
		if (this.done) {
			return this._getResult();
		}
		this._stepValidate();

		const children = getInstructionChildren(this._getInstruction());

		// Can't enter into a child if there is no children
		if (!children) {
			return null;
		}

		this.path = [...this.path, 0];
		this.instruction = this._getInstruction();

		return this._getResult("enter");
	}

	skip() {
		if (this.done) {
			return this._getResult();
		}
		this._stepValidate();

		// If this is the root, skipping takes us to the end
		if (!this.path.length) {
			return this.end();
		}

		const instructionIndex = this.path[this.path.length - 1];
		const parentPath = this.path.slice(0, -1);
		const parent = this._getInstruction(parentPath);
		const siblings = getInstructionChildren(parent);

		// Cannot skip if the current instruction is the last child of its parent
		if (instructionIndex + 1 >= siblings.length) {
			return null;
		}

		this.path = [...parentPath, instructionIndex + 1];
		this.instruction = this._getInstruction();

		return this._getResult("skip");
	}

	exit() {
		if (this.done) {
			return this._getResult();
		}
		this._stepValidate();

		// If this is the root, exiting takes us to the end
		if (!this.path.length) {
			return this.end();
		}

		const parentPath = this.path.slice(0, -1);

		this.path = parentPath;
		this.instruction = this._getInstruction(parentPath);

		return this._getResult("exit");
	}

	end() {
		this.done = true;
		this.path = null;
		this.instruction = null;

		return this._getResult("end");
	}

	next() {
		// If we're done, then just return the done result
		if (this.done) {
			return this._getResult();
		}

		// Start from the beginning if we're not done and there is no path
		if (!this.path) {
			return this.start();
		}

		let nextStep;

		// As long as the stepper is not currently exiting, try to enter
		if (!this.exiting) {
			nextStep = this.enter();
			if (nextStep) {
				return nextStep;
			}
		}

		// Try to skip if can't enter
		nextStep = this.skip();
		if (nextStep) {
			// If we successfully skip, we can stop exiting
			this.exiting = false;

			return nextStep;
		}

		// If we cannot enter or skip, begin exiting
		this.exiting = true;
		return this.exit();
	}

	[Symbol.iterator]() {
		return this;
	}
}

module.exports = GDSInstructionStepper;
