describe("the pick command", () => {
  const arr = [10, 11, 12, 13, 14, 15, 16]

  it("can pick items from an array", () => {
    evalHyperScript(`
      pick items 1 to 3 from arr
      set $test to it`, { arr });

    window.$test.should.deep.equal([11, 12]);
    delete window.$test;
  })

  it("can pick a single item from an array", () => {
    evalHyperScript(`
      pick item 2 from arr
      set $test to it`, { arr });

    window.$test.should.deep.equal([12]);
    delete window.$test;
  })

  it("can use 'end' when picking items from an array", () => {
    evalHyperScript(`
      pick item 4 to end from arr
      set $test to it`, { arr });

    window.$test.should.deep.equal([14, 15, 16]);
    delete window.$test;
  })

  it("can use 'start' when picking items from an array", () => {
    evalHyperScript(`
      pick items start to 3 from arr
      set $test to it`, { arr });

    window.$test.should.deep.equal([10, 11, 12]);
    delete window.$test;
  })

  it("can use negative indices when picking items from an array", () => {
    evalHyperScript(`
      pick items 0 to -4 from arr
      set $test to it`, { arr });

    window.$test.should.deep.equal([10, 11, 12]);
    delete window.$test;
  })
})
