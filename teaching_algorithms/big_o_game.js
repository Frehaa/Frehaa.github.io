'use strict';
// const l = console.log;

function assert(condition, msg) {
    if (!condition) throw Error(msg)
}

const EXPRESSION_TYPES = [
    "CONSTANT",
    "LOGARITHM",
    "LINEAR",
    "EXPONENTIAL",
    "POTENS"
];

class EXP_O {
    constructor(exp) {
        this.exp = exp;
    }
    toString() {
        return "O(" + this.exp.toString() + ")";
    }
    isLeftMostSymbolAVariable() {
        return false;
    }
    _countVariables(seen) {
        return this.exp._countVariables(seen);
    }
}

class EXP_CONSTANT {
    constructor(value) {
        assert(typeof value === 'number');
        this.value = value;
    }
    toString() {
        return this.value.toString();
    }
    isLeftMostSymbolAVariable() {
        return false;
    }
    _countVariables(seen) {
        return 0
    }
}

class EXP_MULT {
    constructor(leftHandSide, rightHandSide) {
        assert(!(leftHandSide instanceof EXP_VARIABLE && rightHandSide instanceof EXP_CONSTANT), "Ill formatted multiplication: Any constant in a multiplcation expression with a variable, should be the left hand side"); //
        this.lhs = leftHandSide;
        this.rhs = rightHandSide;
    }
    toString() {
        if (this.lhs instanceof EXP_CONSTANT && this.rhs.isLeftMostSymbolAVariable()) {
            return this.lhs.toString() + this.rhs.toString();
        } else {
            return this.lhs.toString() + " * " + this.rhs.toString();
        }
    }
    isLeftMostSymbolAVariable() {
        return this.lhs.isLeftMostSymbolAVariable();
    }
    _countVariables(seen) {
        return this.lhs._countVariables(seen) + 
               this.rhs._countVariables(seen);
    }
}

function isSimpleExpression(exp) {
    return exp instanceof EXP_CONSTANT || exp instanceof EXP_VARIABLE;
}

class EXP_EXPONENTIAL {
    constructor(base, potens) {
        this.base = base;
        this.potens = potens;
    }
    toString() {
        let baseString;
        if (isSimpleExpression(this.base)) {
            baseString = this.base.toString();
        } else {
            baseString = "(" + this.base.toString() + ")";
        }

        let potensString;
        if (isSimpleExpression(this.potens)) {
            potensString = this.potens.toString();
        } else {
            potensString = "(" + this.potens.toString() + ")";
        }

        return baseString + "^" + potensString;
    }
    isLeftMostSymbolAVariable() {
        return this.base.isLeftMostSymbolAVariable()
    }
    _countVariables(seen) {
        return this.base._countVariables(seen) + 
               this.potens._countVariables(seen);
    }
}

class EXP_VARIABLE {
    constructor(name) {
        assert(typeof name === "string" && name.length === 1 && isNaN(name), "A variable name should be a single letter")
        this.name = name;
    }
    toString() {
        return this.name;
    }
    isLeftMostSymbolAVariable() {
        return true;
    }
    _countVariables(seen) {
        if (seen.has(this.name)) return 0;
        seen.add(this.name);
        return 1;
    }
}

// Is it better to have an automated system to create an infinite amount of tests which may have issues related to being well typed? Be written weird? 
// Or requiring a lot of engineering to fix?
// Or would my time be better spent by just manually writing these?

function countVariables(exp) {
    const seen = new Set();
    return exp._countVariables(seen);
}

function isValidBigO(exp) {

}

function generateExpression() {

   const exp1 = new EXP_MULT(
    new EXP_CONSTANT(5),
    new EXP_EXPONENTIAL(
        new EXP_VARIABLE("x"),
        new EXP_CONSTANT(3)
    )
   );

   const exp2 = new EXP_MULT(
    new EXP_CONSTANT(5),
    new EXP_VARIABLE("x"),
   );

   const exp3 = new EXP_MULT(
    new EXP_EXPONENTIAL(
        new EXP_VARIABLE("x"),
        new EXP_CONSTANT(3)
    ),
    new EXP_EXPONENTIAL(
        new EXP_VARIABLE("x"),
        new EXP_CONSTANT(3)
    )
   );


   const exp4 = new EXP_EXPONENTIAL(
   new EXP_EXPONENTIAL(
    new EXP_EXPONENTIAL(
        new EXP_VARIABLE("x"),
        new EXP_CONSTANT(3)
    ),
    new EXP_EXPONENTIAL(
        new EXP_VARIABLE("x"),
        new EXP_CONSTANT(3)
    )
   ),
   new EXP_EXPONENTIAL(
    new EXP_EXPONENTIAL(
        new EXP_VARIABLE("x"),
        new EXP_CONSTANT(3)
    ),
    new EXP_EXPONENTIAL(
        new EXP_VARIABLE("x"),
        new EXP_CONSTANT(3)
    )
   )
)

   l(exp1.toString())
   l(exp2.toString())
   l(exp3.toString())
   l(exp4.toString())
}

function assertEqual(result, expected, msg) {
    if (result !== expected) throw Error(msg + ` - result (${result}) not equal expected (${expected}).`)
}

function run_tests() {
    const tests = [
        test_variable_count_0_variables,
        test_variable_count_1_variable_once,
        test_variable_count_1_variable_twice,
        test_variable_count_2_variables_once
    ];
    for (let i = 0; i < tests.length; i++) {
        try {
            tests[i]();
            console.log(tests[i].name + " success");
        } catch (e) {
            console.log(e);
        }
    }
}

function test_variable_count_0_variables() {
    const exp = new EXP_O(
        new EXP_MULT(
            new EXP_CONSTANT(5),
            new EXP_EXPONENTIAL(
                new EXP_VARIABLE('x'),
                new EXP_CONSTANT(6)
            )
        )
    );

    assertEqual(countVariables(exp), 1, test_variable_count_0_variables.name + " failed")

}

function test_variable_count_1_variable_once() {

}

function test_variable_count_1_variable_twice() {

}

function test_variable_count_2_variables_once() {

}


