// Core grammar for _hyperscript
import { Runtime } from '../core/runtime.js';

// Expression imports
import { IdRef, ClassRef, QueryRef, AttributeRef, StyleRef } from '../parsetree/expressions/webliterals.js';
import {
    ParenthesizedExpression, BlockLiteral, NegativeNumber, LogicalNot, SymbolRef, BeepExpression,
    PropertyAccess, OfExpression, PossessiveExpression, InExpression, AsExpression, FunctionCall,
    AttributeRefAccess, ArrayIndex, MathOperator, MathExpression, ComparisonOperator,
    ComparisonExpression, LogicalOperator, LogicalExpression, AsyncExpression, DotOrColonPath
} from '../parsetree/expressions/expressions.js';
import {
    NakedString, StringLiteral, NumberLiteral, BooleanLiteral, NullLiteral,
    ArrayLiteral, ObjectKey, ObjectLiteral, NamedArgumentList
} from '../parsetree/expressions/literals.js';
import { ImplicitMeTarget } from '../parsetree/expressions/targets.js';
import { NoExpression, SomeExpression } from '../parsetree/expressions/existentials.js';
import { RelativePositionalExpression, PositionalExpression } from '../parsetree/expressions/positional.js';
import { StringPostfixExpression, TimeExpression, TypeCheckExpression } from '../parsetree/expressions/postfix.js';

// Command imports
import {
    LogCommand, BeepCommand, ThrowCommand, ReturnCommand, ExitCommand, HaltCommand,
    MakeCommand, AppendCommand, PickCommand, FetchCommand, GoCommand
} from '../parsetree/commands/basic.js';
import { SetCommand, DefaultCommand, IncrementCommand, DecrementCommand } from '../parsetree/commands/setters.js';
import { WaitCommand, TriggerCommand, SendCommand, EventName } from '../parsetree/commands/events.js';
import { IfCommand, RepeatCommand, ForCommand, ContinueCommand, BreakCommand, TellCommand } from '../parsetree/commands/controlflow.js';
import { JsBody, JsCommand, AsyncCommand, CallCommand, GetCommand } from '../parsetree/commands/execution.js';
import { PseudoCommand } from '../parsetree/commands/pseudoCommand.js';

// Feature imports
import { SetFeature } from '../parsetree/features/set.js';
import { InitFeature } from '../parsetree/features/init.js';
import { WorkerFeature } from '../parsetree/features/worker.js';
import { BehaviorFeature } from '../parsetree/features/behavior.js';
import { InstallFeature } from '../parsetree/features/install.js';
import { JsFeature } from '../parsetree/features/js.js';
import { DefFeature } from '../parsetree/features/def.js';
import { OnFeature } from '../parsetree/features/on.js';

/**
 * @param {LanguageKernel} kernel
 */
export default function hyperscriptCoreGrammar(kernel) {
        kernel.addLeafExpression("parenthesized", ParenthesizedExpression.parse);

        kernel.addLeafExpression("string", StringLiteral.parse);

        kernel.addGrammarElement("nakedString", NakedString.parse);

        kernel.addLeafExpression("number", NumberLiteral.parse);

        kernel.addLeafExpression("idRef", IdRef.parse);

        kernel.addLeafExpression("classRef", ClassRef.parse);

        // TemplatedQueryElementCollection is now imported from ./core/runtime.js

        kernel.addLeafExpression("queryRef", QueryRef.parse);

        kernel.addLeafExpression("attributeRef", AttributeRef.parse);

        kernel.addLeafExpression("styleRef", StyleRef.parse);

        kernel.addGrammarElement("objectKey", ObjectKey.parse);

        kernel.addLeafExpression("objectLiteral", ObjectLiteral.parse);

        kernel.addGrammarElement("nakedNamedArgumentList", NamedArgumentList.parseNaked);

        kernel.addGrammarElement("namedArgumentList", NamedArgumentList.parse);

        kernel.addGrammarElement("symbol", SymbolRef.parse);

        kernel.addGrammarElement("implicitMeTarget", ImplicitMeTarget.parse);

        kernel.addLeafExpression("boolean", BooleanLiteral.parse);

        kernel.addLeafExpression("null", NullLiteral.parse);

        kernel.addLeafExpression("arrayLiteral", ArrayLiteral.parse);

        kernel.addLeafExpression("blockLiteral", BlockLiteral.parse);

        kernel.addIndirectExpression("propertyAccess", PropertyAccess.parse);

        kernel.addIndirectExpression("of", OfExpression.parse);

        kernel.addIndirectExpression("possessive", PossessiveExpression.parse);

        kernel.addIndirectExpression("inExpression", InExpression.parse);

        kernel.addIndirectExpression("asExpression", AsExpression.parse);

        kernel.addIndirectExpression("functionCall", FunctionCall.parse);

        kernel.addIndirectExpression("attributeRefAccess", AttributeRefAccess.parse);

        kernel.addIndirectExpression("arrayIndex", ArrayIndex.parse);

        kernel.addGrammarElement("logicalNot", LogicalNot.parse);

        kernel.addGrammarElement("noExpression", NoExpression.parse);

        kernel.addLeafExpression("some", SomeExpression.parse);

        kernel.addGrammarElement("negativeNumber", NegativeNumber.parse);

        kernel.addGrammarElement("beepExpression", BeepExpression.parse);

        kernel.addGrammarElement("relativePositionalExpression", RelativePositionalExpression.parse);

        kernel.addGrammarElement("positionalExpression", PositionalExpression.parse);

        kernel.addGrammarElement("mathOperator", MathOperator.parse);

        kernel.addGrammarElement("mathExpression", MathExpression.parse);

        kernel.addGrammarElement("comparisonOperator", ComparisonOperator.parse);

        kernel.addGrammarElement("comparisonExpression", ComparisonExpression.parse);

        kernel.addGrammarElement("logicalOperator", LogicalOperator.parse);

        kernel.addGrammarElement("logicalExpression", LogicalExpression.parse);

        kernel.addGrammarElement("asyncExpression", AsyncExpression.parse);

        kernel.addFeature("on", function (parser) {
            return OnFeature.parse(parser, kernel);
        });

        kernel.addFeature("def", function (parser) {
            return DefFeature.parse(parser, kernel);
        });

        kernel.addFeature("set", function (parser) {
            return SetFeature.parse(parser, kernel);
        });

        kernel.addFeature("init", function (parser) {
            return InitFeature.parse(parser, kernel);
        });

        kernel.addFeature("worker", WorkerFeature.parse);

        kernel.addFeature("behavior", BehaviorFeature.parse);

        kernel.addFeature("install", InstallFeature.parse);

        kernel.addGrammarElement("jsBody", JsBody.parse);

        kernel.addFeature("js", JsFeature.parse);

        kernel.addCommand("js", JsCommand.parse);

        kernel.addCommand("async", AsyncCommand.parse);

        kernel.addCommand("tell", TellCommand.parse);

        kernel.addCommand("wait", WaitCommand.parse);

        // TODO  - colon path needs to eventually become part of ruby-style symbols
        kernel.addGrammarElement("dotOrColonPath", DotOrColonPath.parse);

        kernel.addGrammarElement("eventName", EventName.parse);

        kernel.addCommand("trigger", TriggerCommand.parse);

        kernel.addCommand("send", SendCommand.parse);

        kernel.addCommand("return", ReturnCommand.parse);

        kernel.addCommand("exit", ExitCommand.parse);

        kernel.addCommand("halt", HaltCommand.parse);

        kernel.addCommand("log", LogCommand.parse);

        kernel.addCommand("beep!", BeepCommand.parse);

        kernel.addCommand("throw", ThrowCommand.parse);

        kernel.addCommand("call", CallCommand.parse);

        kernel.addCommand("get", GetCommand.parse);

        kernel.addCommand("make", MakeCommand.parse);

        kernel.addGrammarElement("pseudoCommand", PseudoCommand.parse);

        kernel.addCommand("default", DefaultCommand.parse);

        kernel.addCommand("set", SetCommand.parse);

        kernel.addCommand("if", IfCommand.parse);

        kernel.addCommand("repeat", RepeatCommand.parse);

        kernel.addCommand("for", ForCommand.parse);

        kernel.addCommand("continue", ContinueCommand.parse);

        kernel.addCommand("break", BreakCommand.parse);

        kernel.addCommand("append", AppendCommand.parse);

        kernel.addCommand("pick", PickCommand.parse);

        kernel.addCommand("increment", IncrementCommand.parse);

        kernel.addCommand("decrement", DecrementCommand.parse);

        kernel.addCommand("fetch", FetchCommand.parse);
}
