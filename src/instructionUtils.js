const COMMAND_CHILDREN_GETTER_MAP = {
	IfBlock: (instruction) => instruction.chain,
	IfChainLink: (instruction) => instruction.block,
	EachBlock: (instruction) => instruction.block
};

const CHILDREN_GETTER_MAP = {
	Script: (instruction) => instruction.instructions,

	// Command type instructions have another getter map for their sub types
	Command: (instruction) => {
		const cmdChildrenGetter = COMMAND_CHILDREN_GETTER_MAP[instruction.cmdType];

		if (typeof cmdChildrenGetter === "function") {
			return cmdChildrenGetter(instruction);
		}
	},

	// Null getters are used for instructions that don't have children
	Dialog: null,
	JSExpression: null,
};

function getInstructionChildren(instruction) {
	if (instruction && instruction.type) {
		const childrenGetter = CHILDREN_GETTER_MAP[instruction.type];

		if (typeof childrenGetter === "function") {
			const children = childrenGetter(instruction);

			if (children && children.length > 0) {
				return children;
			}
		}
	}
}

function getInstruction(instruction, remainingPath = []) {
	if (remainingPath.length === 0) {
		return instruction;
	}

	const [childIndex, ...newRemainingPath] = remainingPath;

	const children = getInstructionChildren(instruction);

	if (children && children.length > childIndex) {
		return getInstruction(
			children[childIndex],
			newRemainingPath
		);
	}
}

module.exports = {
	getInstructionChildren,
	getInstruction
};
