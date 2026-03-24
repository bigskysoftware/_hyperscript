import {test, expect} from '../fixtures.js'

test.describe("_hyperscript runtime errors", () => {

	test("reports basic function invocation null errors properly", async ({error}) => {
		expect(await error("x()")).toBe("'x' is null");
		expect(await error("x.y()")).toBe("'x' is null");
		expect(await error("x.y.z()")).toBe("'x.y' is null");
	});

	test("reports basic function invocation null errors properly w/ possessives", async ({error}) => {
		expect(await error("x's y()")).toBe("'x' is null");
		expect(await error("x's y's z()")).toBe("'x's y' is null");
	});

	test("reports basic function invocation null errors properly w/ of", async ({error}) => {
		expect(await error("z() of y of x")).toBe("'z' is null");
	});

	test("reports null errors on sets properly", async ({error}) => {
		expect(await error("set x's y to true")).toBe("'x' is null");
		expect(await error("set x's @y to true")).toBe("'x' is null");
	});

	test("reports null errors on settle command properly", async ({error}) => {
		expect(await error("settle #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on add command properly", async ({error}) => {
		expect(await error("add .foo to #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("add @foo to #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("add {display:none} to #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on remove command properly", async ({error}) => {
		expect(await error("remove .foo from #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("remove @foo from #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("remove #doesntExist from #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on toggle command properly", async ({error}) => {
		expect(await error("toggle .foo on #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("toggle between .foo and .bar on #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("toggle @foo on #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on show command properly", async ({error}) => {
		expect(await error("show #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on hide command properly", async ({error}) => {
		expect(await error("hide #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on put command properly", async ({error}) => {
		expect(await error("put 'foo' into #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("put 'foo' into #doesntExist's innerHTML")).toBe("'#doesntExist' is null");
		expect(await error("put 'foo' into #doesntExist.innerHTML")).toBe("'#doesntExist' is null");
		expect(await error("put 'foo' before #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("put 'foo' after #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("put 'foo' at the start of #doesntExist")).toBe("'#doesntExist' is null");
		expect(await error("put 'foo' at the end of #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on transition command properly", async ({error}) => {
		expect(await error("transition #doesntExist's visibility to 0")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on send command properly", async ({error}) => {
		expect(await error("send 'foo' to #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on trigger command properly", async ({error}) => {
		expect(await error("trigger 'foo' on #doesntExist")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on increment command properly", async ({error}) => {
		expect(await error("increment #doesntExist's innerHTML")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on decrement command properly", async ({error}) => {
		expect(await error("decrement #doesntExist's innerHTML")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on default command properly", async ({error}) => {
		expect(await error("default #doesntExist's innerHTML to 'foo'")).toBe("'#doesntExist' is null");
	});

	test("reports null errors on measure command properly", async ({error}) => {
		expect(await error("measure #doesntExist")).toBe("'#doesntExist' is null");
	});

});
