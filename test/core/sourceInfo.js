import {test, expect} from '../fixtures.js'

test.describe("the line info parser", () => {

	test("debug", async ({evaluate}) => {
		const src = await evaluate(() => _hyperscript.parse("<button.foo/>").sourceFor());
		expect(src).toBe("<button.foo/>");
	});

	test("get source works for expressions", async ({evaluate}) => {
		let result = await evaluate(() => {
			let elt = _hyperscript.parse("1");
			return elt.sourceFor();
		});
		expect(result).toBe("1");

		result = await evaluate(() => {
			let elt = _hyperscript.parse("a.b");
			return { src: elt.sourceFor(), rootSrc: elt.root.sourceFor() };
		});
		expect(result.src).toBe("a.b");
		expect(result.rootSrc).toBe("a");

		result = await evaluate(() => {
			let elt = _hyperscript.parse("a.b()");
			return {
				src: elt.sourceFor(),
				rootSrc: elt.root.sourceFor(),
				rootRootSrc: elt.root.root.sourceFor()
			};
		});
		expect(result.src).toBe("a.b()");
		expect(result.rootSrc).toBe("a.b");
		expect(result.rootRootSrc).toBe("a");

		result = await evaluate(() => _hyperscript.parse("<button.foo/>").sourceFor());
		expect(result).toBe("<button.foo/>");

		result = await evaluate(() => {
			let elt = _hyperscript.parse("x + y");
			return { src: elt.sourceFor(), lhs: elt.lhs.sourceFor(), rhs: elt.rhs.sourceFor() };
		});
		expect(result.src).toBe("x + y");
		expect(result.lhs).toBe("x");
		expect(result.rhs).toBe("y");

		result = await evaluate(() => _hyperscript.parse("'foo'").sourceFor());
		expect(result).toBe("'foo'");

		result = await evaluate(() => _hyperscript.parse(".foo").sourceFor());
		expect(result).toBe(".foo");

		result = await evaluate(() => _hyperscript.parse("#bar").sourceFor());
		expect(result).toBe("#bar");
	});

	test("get source works for statements", async ({evaluate}) => {
		let result = await evaluate(() => _hyperscript.parse("if true log 'it was true'").sourceFor());
		expect(result).toBe("if true log 'it was true'");

		result = await evaluate(() => _hyperscript.parse("for x in [1, 2, 3] log x then log x end").sourceFor());
		expect(result).toBe("for x in [1, 2, 3] log x then log x end");
	});

	test("get line works for statements", async ({evaluate}) => {
		const result = await evaluate(() => {
			let elt = _hyperscript.parse("if true\n  log 'it was true'\n    log 'it was true'");
			return {
				line: elt.lineFor(),
				trueBranchLine: elt.trueBranch.lineFor(),
				nextLine: elt.trueBranch.next.lineFor()
			};
		});
		expect(result.line).toBe("if true");
		expect(result.trueBranchLine).toBe("  log 'it was true'");
		expect(result.nextLine).toBe("    log 'it was true'");
	});
});
