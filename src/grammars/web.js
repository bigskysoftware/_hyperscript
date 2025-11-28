// Web/DOM grammar for _hyperscript
import { Tokenizer } from '../core/tokenizer.js';
import { RegExpIterable, ElementCollection } from '../core/runtime.js';
import { parseJSON } from '../core/runtime.js';
import { config, initWebConversions } from '../core/config.js';
import { StyleLiteral } from '../parsetree/expressions/webliterals.js';
import { ClosestExpr } from '../parsetree/expressions/positional.js';
import { PutCommand } from '../parsetree/commands/setters.js';
import { AddCommand, RemoveCommand, ToggleCommand, HideCommand, ShowCommand, TakeCommand, MeasureCommand } from '../parsetree/commands/dom.js';
import { SettleCommand, TransitionCommand } from '../parsetree/commands/animations.js';
import { GoCommand } from '../parsetree/commands/basic.js';

/**
 * @param {LanguageKernel} kernel
 */
export default function hyperscriptWebGrammar(kernel) {
        kernel.addCommand("settle", SettleCommand.parse);

        kernel.addCommand("add", AddCommand.parse);

        kernel.addGrammarElement("styleLiteral", StyleLiteral.parse);

        kernel.addCommand("remove", RemoveCommand.parse);

        kernel.addCommand("toggle", function (parser) {
            return ToggleCommand.parse(parser, kernel, config);
        });

        kernel.addCommand("hide", function (parser) {
            return HideCommand.parse(parser, kernel, config);
        });

        kernel.addCommand("show", function (parser) {
            return ShowCommand.parse(parser, kernel, config);
        });

        kernel.addCommand("take", TakeCommand.parse);

        kernel.addCommand("put", function (parser) {
            return PutCommand.parse(parser, kernel);
        });

        kernel.addCommand("transition", function (parser) {
            return TransitionCommand.parse(parser, config);
        });

        kernel.addCommand("measure", MeasureCommand.parse);

        kernel.addLeafExpression("closestExpr", ClosestExpr.parse);

        kernel.addCommand("go", GoCommand.parse);

        // Initialize web-specific conversions
        initWebConversions(kernel.runtime);
}
