describe("the pick command", () => {
  const arr = [10, 11, 12, 13, 14, 15, 16]

  // Array indexing

  it("can pick items from an array", () => {
    evalHyperScript(`
      pick items 1 to 3 from arr
      set $test to it`, { locals: { arr } });

    window.$test.should.deep.equal([11, 12]);
    delete window.$test;
  })

  it("can pick a single item from an array", () => {
    evalHyperScript(`
      pick item 2 from arr
      set $test to it`, { locals: { arr } });

    window.$test.should.deep.equal([12]);
    delete window.$test;
  })

  it("can use 'end' when picking items from an array", () => {
    evalHyperScript(`
      pick item 4 to end from arr
      set $test to it`, { locals: { arr } });

    window.$test.should.deep.equal([14, 15, 16]);
    delete window.$test;
  })

  it("can use 'start' when picking items from an array", () => {
    evalHyperScript(`
      pick items start to 3 from arr
      set $test to it`, { locals: { arr } });

    window.$test.should.deep.equal([10, 11, 12]);
    delete window.$test;
  })

  it("can use negative indices when picking items from an array", () => {
    evalHyperScript(`
      pick items 0 to -4 from arr
      set $test to it`, { locals: { arr } });

    window.$test.should.deep.equal([10, 11, 12]);
    delete window.$test;
  })

  // String indexing

  const str = "abcdefghijklmnopqrstuvwxyz"

  it("can pick items from a string", () => {
    evalHyperScript(`
      pick items 1 to 3 from str
      set $test to it`, { locals: { str } });

    window.$test.should.equal("bc");
    delete window.$test;
  })

  it("can pick a single item from a string", () => {
    evalHyperScript(`
      pick item 2 from str
      set $test to it`, { locals: { str } });

    window.$test.should.equal("c");
    delete window.$test;
  })

  it("can use 'end' when picking items from a string", () => {
    evalHyperScript(`
      pick item 4 to end from str
      set $test to it`, { locals: { str } });

    window.$test.should.equal("efghijklmnopqrstuvwxyz");
    delete window.$test;
  })

  it("can use 'start' when picking items from a string", () => {
    evalHyperScript(`
      pick items start to 3 from str
      set $test to it`, { locals: { str } });

    window.$test.should.equal("abc");
    delete window.$test;
  })

  it("can use negative indices when picking items from a string", () => {
    evalHyperScript(`
      pick items 0 to -4 from str
      set $test to it`, { locals: { str } });

    window.$test.should.equal("abcdefghijklmnopqrstuv");
    delete window.$test;
  })

  // Regex

  const haystack = "The 32 quick brown foxes jumped 12 times over the 149 lazy dogs";

  it("can pick a single regex match", () => {
    evalHyperScript(String.raw`
      pick match of "\\d+" from haystack
      set window.test to it`, { locals: { haystack } });
    [...window.test].should.deep.equal(["32"]);
    delete window.test;
  })

  it("can pick all regex matches", () => {
    evalHyperScript(String.raw`
      pick matches of "\\d+" from haystack
      set window.test to it`, { locals: { haystack } });
    [...window.test].should.deep.equal([["32"], ["12"], ["149"]]);
    delete window.test;
  })

  it("can pick a single regex match w/ a flag", () => {
    evalHyperScript(String.raw`
      pick match of "t.e" | i from haystack
      set window.test to it`, { locals: { haystack } });
    [...window.test].should.deep.equal(["The"]);
    delete window.test;
  })

})
